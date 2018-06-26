import Service, { inject } from '@ember/service';
import acorn from 'npm:acorn'

export default Service.extend({
  store:inject('store'),
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
  getScripts(source) {
    let searchIndex = 0;
    let index = 0;
    let searchStrs = ['<script',">","</script>"];
    let ptr = 0;
    let startIndex = 0;
    let scripts = [];
    let prevEnd = 0;
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
    scripts[scripts.length-1].post = scripts[scripts.length-1].post + source.substr(prevEnd);
    return scripts;
  },
  insert(source, item)
  {
    //console.log("inserting", item);
    return source + "\n" + item;
  },
  insertStatefullCallbacks(source, savedVals) {
    let newSource = "";
    const scripts = this.getScripts(source);
    for(var i = 0; i < scripts.length; i++)
    {
      const script  = scripts[i];
      newSource = newSource + script.preamble;
      const parsed = acorn.parse(script.script);
      for(var j = 0; j < parsed.body.length; j++)
      {
        let added = false;
        const item = parsed.body[j];
        //console.log(item);
        if(item.type = "VariableDeclaration"  && item.declarations)
        {
          newSource = this.insert(newSource,item.kind+" ");
          for(var k = 0; k < item.declarations.length; k++)
          {
            const dec = item.declarations[k];
            const name = dec.id.name;
            const init = dec.init;
            const savedVal = savedVals[name];
            let exp = script.script.substring(dec.start, dec.end);
            if(name.substring(0,2) == "p_" && !init && savedVal)
            {
              const delim = k >= item.declarations.length - 1 ? ";" : ","
              exp = name + " = " + savedVal + delim;
            }
            newSource = newSource + exp;
            added = true;
          }
        }
        else if (item.type = "VariableDeclaration" && item.expression)
        {
          if(item.expression.type == "AssignmentExpression")
          {
            const exp = script.script.substring(item.start, item.end);
            newSource = this.insert(newSource,exp);
            const name = item.expression.left.name;
            const msg = "parent.postMessage([\"" + name + "\"," + name + "], \"*\");"
            newSource = this.insert(newSource, msg);
            added = true;
          }
        }
        if(!added)
        {
          const exp = script.script.substring(item.start, item.end);
          newSource = this.insert(newSource, exp);
        }
      }
      newSource = newSource + script.post;
    }
    console.log(newSource);
    return newSource;
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
