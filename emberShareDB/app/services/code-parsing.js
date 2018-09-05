import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import acorn from 'npm:acorn'
import walk from 'npm:acorn/dist/walk'

export default Service.extend({
  store:inject('store'),
  script:"",
  savedVals:null,
  hasPVals:false,
  insertStatefullCallbacks(src, savedVals) {
    let newSrc = "";
    this.set('savedVals', savedVals);
    this.set('hasPVals', false);
    let didEdit = false;
    const scripts = this.getScripts(src);
    for(let i = 0; i < scripts.length; i++)
    {
      const script  = scripts[i];
      this.set('script', script);
      newSrc = newSrc + script.preamble;
      let ops = [];
      let parsed = true;
      try {
        walk.simple(acorn.parse(script.script), {
          VariableDeclaration: (node) => {
            for(let i = 0; i < node.declarations.length; i++)
            {
              const dec = node.declarations[i];
              let name = dec.id.name;
              if(!name)
              {
                name = script.script.substring(dec.id.start, dec.id.end);
              }
              const init = dec.init;
              let savedVal = this.get('savedVals')[name];
              const delim = i >= node.declarations.length - 1 ? ";" : ","
              let exp = script.script.substring(dec.start, dec.end) + delim;
              if(name.substring(0,2) == "p_")
              {
                if(!init)
                {
                  savedVal = savedVal ? savedVal:0;
                  exp = " = " + savedVal + delim;
                  ops.push({si:exp, p:dec.end})
                }
                else
                {
                  const msg = "\nparent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");"
                  let index = dec.end;
                  const end = script.script.substring(index, index + 1);
                  if(end == ";")
                  {
                    index++;
                  }
                  ops.push({si:msg, p:index})
                }
                this.set('hasPVals', true);
              }
            }
          },
          AssignmentExpression: (node)=> {
            let left = node.left;
            let name = left.name;
            while(!name)
            {
              if(left.object)
              {
                left = left.object;
              }
              else
              {
                name = left.name
                if(!name)
                {
                  name = script.script.substring(node.start, node.end);
                }
              }
            }
            //If an object or a property of it is changed, update with a JSON version of the WHOLE object
            if(name.substring(0,2)=="p_")
            {
              const msg = "\nparent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");"
              let index = node.end;
              const end = script.script.substring(index, index + 1);
              if(end == ";")
              {
                index++;
              }
              ops.push({si:msg, p:index})
              this.set('hasPVals', true);
            }
          },
          CallExpression: (node) => {
            if(!isEmpty(node.callee.object))
            {
              if(node.callee.object.name === "console")
              {
                let output = ""
                for(let j = 0; j < node.arguments.length; j++)
                {
                  const arg = node.arguments[j];
                  const val = script.script.substring(arg.start, arg.end);
                  let delim = j < node.arguments.length - 1 ? "," : ""
                  output = output + val + delim;
                }
                const msg = "\nparent.postMessage([\"console\"," + output + "], \"*\");"
                let index = node.end;
                const end = script.script.substring(index, index + 1);
                if(end == ";")
                {
                  index++;
                }
                ops.push({si:msg, p:index})
              }
            }
          }
        });
      } catch (err) {
        console.log("didnt parse script, probably src")
        parsed = false;
      }
      if(parsed)
      {
        let offset = 0;
        let newScript = script.script;
        for(let j = 0; j < ops.length; j ++)
        {
          didEdit = true;
          if(ops[j].si)
          {
            const str = ops[j].si;
            const index = ops[j].p + offset;
            //console.log("inserting " + str + " at " + index);
            newScript = newScript.slice(0, index) + str + newScript.slice(index);
            offset += str.length;
          }
          else if (ops[j].sd)
          {
            const len = ops[j].sd.length;
            const index = ops[j].p + offset;
            newScript = newScript.slice(0, index) + newScript.slice(index + len);
            offset -= len;
          }
        }
        newSrc = newSrc + newScript;
      }
      else
      {
        newSrc = newSrc + script.script;
      }
      newSrc = newSrc + script.post;
    }
    //return newSrc;
    console.log(newSrc);
    return didEdit ? newSrc : src;
  },
  getScripts(source) {
    let searchIndex = 0, index = 0, ptr = 0, prevEnd = 0, startIndex = 0;
    let searchStrs = ['<script',">","</script>"];
    let scripts = [];
    let preamble = "";
    while ((index = source.indexOf(searchStrs[ptr], searchIndex)) > -1) {
        searchIndex = index + searchStrs[ptr].length;
        if(ptr == 1)
        {
          startIndex = searchIndex;
          preamble = source.substring(prevEnd,searchIndex);
        }
        else if (ptr == 2)
        {
          scripts.push({
            preamble:preamble,
              script:source.substring(startIndex,index-1),
                post:"\n</script>"
             });
          prevEnd = searchIndex;
        }
        ptr = (ptr + 1) % searchStrs.length;
    }
    if(scripts.length > 0)
    {
      scripts[scripts.length-1].post = scripts[scripts.length-1].post + source.substr(prevEnd);
    }
    return scripts;
  },
  replaceAssets(source, assets) {
    for(let i = 0; i < assets.length; i++)
    {
      const fileId = assets[i].fileId;
      const toFind = assets[i].name;
      const fileType = assets[i].fileType;
      const asset = this.get('store').peekRecord('asset',fileId);
      if(!isEmpty(asset))
      {
        const b64 = "data:" + fileType + ";charset=utf-8;base64," + asset.b64data;
        source = source.replace(new RegExp(toFind,"gm"),b64);
      }
    }
    return source;
  },
  opTransform(ops, editor) {
    function opToDelta(op) {
      const index = op.p[op.p.length - 1];
      const session = editor.getSession();
      const pos = session.doc.indexToPosition(index, 0);
      const start = pos;
      let action;
      let lines;
      let end;
      if ('sd' in op) {
        action = 'remove';
        lines = op.sd.split('\n');
        const count = lines.reduce((total, line) => total + line.length, lines.length - 1);
        end = session.doc.indexToPosition(index + count, 0);
      } else if ('si' in op) {
        action = 'insert';
        lines = op.si.split('\n');
        if (lines.length === 1) {
          end = {
            row: start.row,
            column: start.column + op.si.length,
          };
        } else {
          end = {
            row: start.row + (lines.length - 1),
            column: lines[lines.length - 1].length,
          };
        }
      } else {
        throw new Error(`Invalid Operation: ${JSON.stringify(op)}`);
      }
      const delta = {
        start,
        end,
        action,
        lines,
      };
      return delta;
    }
    const deltas = ops.map(opToDelta);
    return deltas;
  },
});
