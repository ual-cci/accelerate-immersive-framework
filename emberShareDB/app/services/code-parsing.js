import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import acorn from 'npm:acorn'
import walk from 'npm:acorn/dist/walk'

export default Service.extend({
  store:inject('store'),
  cs:inject('console'),
  script:"",
  savedVals:null,
  hasPVals:false,
  parser:new DOMParser(),
  insertStyleSheets(source, children) {
    let searchIndex = 0, index = 0, ptr = 0, prevEnd = 0;
    let linkStartIndex = 0, tagStartIndex = 0;
    let searchStrs = ["<link", "/>"];
    let preamble = "", tag = "";
    let newSrc = "";
    let found = false;
    while ((index = source.indexOf(searchStrs[ptr], searchIndex)) > -1) {
        if(ptr == 0)
        {
          this.get('cs').log("found start of <link");
          searchIndex = index;
          tagStartIndex = searchIndex;
          preamble = source.substring(prevEnd, searchIndex);
        }
        else if(ptr == 1)
        {
          searchIndex = index + searchStrs[ptr].length;
          linkStartIndex = searchIndex;
          tag = source.substring(tagStartIndex, searchIndex);
          found = true;
          this.get('cs').log(tag);
          searchIndex = index + searchStrs[ptr].length;
          newSrc = newSrc + preamble;
          let added = false;
          const parsedTag = this.get('parser').parseFromString(tag, "application/xml");
          const attr = parsedTag.documentElement.attributes;
          let styleSheet = false;
          let media;
          for(let i = 0; i < attr.length; i++)
          {
            if(attr[i].nodeName == "rel" && attr[i].nodeValue == "stylesheet")
            {
              styleSheet = true;
            }
            else if(attr[i].nodeName == "media")
            {
              media = attr[i].nodeValue
            }
          }
          if(styleSheet)
          {
            for(let i = 0; i < attr.length; i++)
            {
              if(attr[i].nodeName == "href")
              {
                for(let j = 0; j < children.length; j++)
                {
                  if(children[j].data.name == attr[i].nodeValue)
                  {
                    newSrc = newSrc + "<style type = \"text/css\" ";
                    if(media)
                    {
                      newSrc = newSrc + "media = \"" + media+ "\"";
                    }
                    newSrc = newSrc + ">\n";
                    newSrc = newSrc + children[j].data.source;
                    newSrc = newSrc +"\n</style>";
                    added = true;
                    break;
                  }
                }
                break;
              }
            }
          }
          if(!added)
          {
            newSrc = newSrc + tag;
          }
          prevEnd = searchIndex;
        }
        ptr = (ptr + 1) % searchStrs.length;
    }
    if(found)
    {
      newSrc = newSrc + source.substr(prevEnd);
    }
    else
    {
      newSrc = source;
    }
    return newSrc;
  },
  insertChildren(src, children) {
    let newSrc = "";
    const scripts = this.getScripts(src);
    for(let i = 0; i < scripts.length; i++)
    {
      const script  = scripts[i];
      this.set('script', script);
      newSrc = newSrc + this.insertStyleSheets(script.preamble, children);
      let added = false;
      if(script.src.length == 0)
      {
        const parsedTag = this.get('parser').parseFromString(script.scriptTag+"</script>", "application/xml");
        const attr = parsedTag.documentElement.attributes;
        for(let i = 0; i < attr.length; i++)
        {
          this.get('cs').log(attr[i].nodeName)
          if(attr[i].nodeName == "src")
          {
            for(let j = 0; j < children.length; j++)
            {
              this.get('cs').log(children[j].data.name, attr[i].nodeValue)
              if(children[j].data.name == attr[i].nodeValue)
              {
                newSrc = newSrc + "<script language=\"javascript\" type=\"text/javascript\">\n";
                newSrc = newSrc + children[j].data.source;
                added = true;
                break;
              }
            }
            break;
          }
        }
      }
      if(!added)
      {
        newSrc = newSrc + script.scriptTag;
        newSrc = newSrc + script.src;
      }
      newSrc = newSrc + this.insertStyleSheets(script.post, children);
    }
    this.get('cs').log(newSrc);
    return newSrc;
  },
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
      let added = false;
      try {
        walk.simple(acorn.parse(script.src), {
          VariableDeclaration: (node) => {
            for(let i = 0; i < node.declarations.length; i++)
            {
              const dec = node.declarations[i];
              let name = dec.id.name;
              if(!name)
              {
                name = script.src.substring(dec.id.start, dec.id.end);
              }
              const init = dec.init;
              let savedVal = this.get('savedVals')[name];
              const delim = i >= node.declarations.length - 1 ? ";" : ","
              let exp = script.src.substring(dec.start, dec.end) + delim;
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
                  const end = script.src.substring(index, index + 1);
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
                  name = script.src.substring(node.start, node.end);
                }
              }
            }
            //If an object or a property of it is changed, update with a JSON version of the WHOLE object
            if(name.substring(0,2)=="p_")
            {
              const msg = "\nparent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");"
              let index = node.end;
              const end = script.src.substring(index, index + 1);
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
                  const val = script.src.substring(arg.start, arg.end);
                  let delim = j < node.arguments.length - 1 ? "," : ""
                  output = output + "JSON.stringify(" + val + ")" + delim;
                }
                const msg = "\nparent.postMessage([\"console\"," + output + "], \"*\");"
                let index = node.end;
                const end = script.src.substring(index, index + 1);
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
        this.get('cs').log("acorn couldnt parse script, probably src")
      }
      if(ops.length > 0)
      {
        let offset = 0;
        let newScript = script.src;
        for(let j = 0; j < ops.length; j ++)
        {
          didEdit = true;
          if(ops[j].si)
          {
            const str = ops[j].si;
            const index = ops[j].p + offset;
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
        added = true;
        newSrc = newSrc + script.scriptTag;
        newSrc = newSrc + newScript;
      }
      if(!added)
      {
        newSrc = newSrc + script.scriptTag;
        newSrc = newSrc + script.src;
      }
      newSrc = newSrc + script.post;
    }
    return didEdit ? newSrc : src;
  },
  getScripts(source) {
    let searchIndex = 0, index = 0, ptr = 0, prevEnd = 0;
    let scriptStartIndex = 0, tagStartIndex = 0;
    let searchStrs = ['<script', ">" , "</script>"];
    let scripts = [];
    let preamble = "", scriptTag = "";
    while ((index = source.indexOf(searchStrs[ptr], searchIndex)) > -1) {
        if(ptr == 0)
        {
          searchIndex = index;
          tagStartIndex = searchIndex;
          preamble = source.substring(prevEnd, searchIndex);
        }
        else if(ptr == 1)
        {
          searchIndex = index + searchStrs[ptr].length;
          scriptStartIndex = searchIndex;
          scriptTag = source.substring(tagStartIndex, searchIndex);
        }
        else if (ptr == 2)
        {
          searchIndex = index + searchStrs[ptr].length;
          const src = scriptStartIndex <= (index - 1) ? source.substring(scriptStartIndex, index - 1) : "";
          scripts.push({
            preamble:preamble,
            scriptTag:scriptTag,
              src:src,
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
