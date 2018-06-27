import Service, { inject } from '@ember/service';
import acorn from 'npm:acorn'

export default Service.extend({
  store:inject('store'),
  script:"",
  savedVals:null,
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
    console.log("inserting",item);
    return source + "\n" + item;
  },
  parseNode(node, fromAlt = false)
  {
    const script = this.get('script');
    let newSource = "";
    let added = false;
    console.log(node);
    if(node.type == "VariableDeclaration"  && node.declarations)
    {
      newSource = this.insert(newSource,node.kind+" ");
      for(var i = 0; i < node.declarations.length; i++)
      {
        const dec = node.declarations[i];
        const name = dec.id.name;
        const init = dec.init;
        const savedVal = this.get('savedVals')[name];
        const delim = i >= node.declarations.length - 1 ? ";" : ","
        let exp = script.script.substring(dec.start, dec.end) + delim;
        if(name.substring(0,2) == "p_" && !init && savedVal)
        {
          exp = name + " = " + savedVal + delim;
        }
        newSource = newSource + exp;
        added = true;
      }
    }
    else if(node.type == "ForStatement")
    {
      let exp = "for(" + script.script.substring(node.init.start, node.init.end) + ";";
      exp = exp + script.script.substring(node.test.start, node.test.end) + ";";
      exp = exp + script.script.substring(node.update.start, node.update.end);
      exp = exp + ")\n{\n";
      newSource = this.insert(newSource,exp);
      newSource = newSource + this.parseNode(node.body);
      newSource = this.insert(newSource,"\n}");
      added = true;
    }
    else if(node.type == "WhileStatement")
    {
      let exp = "while(" + script.script.substring(node.test.start, node.test.end);
      exp = exp + ")\n{\n";
      newSource = this.insert(newSource,exp);
      newSource = newSource + this.parseNode(node.body);
      newSource = this.insert(newSource,"\n}");
      added = true;
    }
    else if (node.expression)
    {
      if(node.expression.type == "AssignmentExpression")
      {
        const exp = script.script.substring(node.start, node.end);
        newSource = this.insert(newSource,exp);
        let left = node.expression.left;
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
          }
        }
        //If an object or a property of it is changed, update with a JSON version of the WHOLE object
        if(name.substring(0,2)=="p_")
        {
          const msg = "parent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");"
          newSource = this.insert(newSource, msg);
        }
        added = true;
      }
    }
    else if(node.params && node.body)
    {
      newSource = this.insert(newSource, "function " + node.id.name + "(");
      if(node.params.length > 0)
      {
        for(var i = 0; i < node.params.length; i++)
        {
          newSource = newSource + node.params[i].name;
          if(i < node.params.length - 1)
          {
            newSource = newSource + ",";
          }
        }
      }
      newSource = newSource + ") {\n";
      for(var i = 0; i < node.body.body.length; i++)
      {
        newSource = newSource + this.parseNode(node.body.body[i]);
      }
      newSource = this.insert(newSource,"}")
      added = true;
    }
    else if(node.body)
    {
      for(var i = 0; i < node.body.length; i++)
      {
        newSource = newSource + this.parseNode(node.body[i]);
      }
      added = true;
    }
    else if (node.consequent)
    {
      const alt = node.alternate;
      let test = "if(" + script.script.substring(node.test.start, node.test.end) + ") {\n";
      if(fromAlt)
      {
        test = "else " + test;
      }
      newSource = this.insert(newSource, test);
      newSource = newSource + this.parseNode(node.consequent);
      newSource = this.insert(newSource,"}")
      if (alt)
      {
        if(!alt.test)
        {
          newSource = this.insert(newSource, "else {\n");
          newSource = newSource + this.parseNode(alt, true);
          newSource = this.insert(newSource,"}")
        }
        else
        {
          newSource = newSource + this.parseNode(alt, true);
        }
      }
      added = true;
    }
    if(!added)
    {
      const exp = script.script.substring(node.start, node.end);
      newSource = this.insert(newSource, exp);
    }
    return newSource;
  },
  insertStatefullCallbacks(source, savedVals) {
    let newSource = "";
    this.set('savedVals', savedVals);
    const scripts = this.getScripts(source);
    for(var i = 0; i < scripts.length; i++)
    {
      const script  = scripts[i];
      this.set('script', script);
      newSource = newSource + script.preamble;
      let parsed;
      try {
        parsed = acorn.parse(script.script);
      } catch (err) {
        console.log("Error parsing script", script);
      }
      if(parsed)
      {
        for(var j = 0; j < parsed.body.length; j++)
        {
          newSource = newSource + this.parseNode(parsed.body[j]);
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
