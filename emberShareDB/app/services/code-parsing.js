import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import acorn from 'npm:acorn'

export default Service.extend({
  store:inject('store'),
  script:"",
  savedVals:null,
  hasPVals:false,
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
  insert(source, item)
  {
    return source + "\n" + item;
  },
  getName(node) {
    let name = node.name;
    let exp = "";
    if(!name)
    {
      let object = node;
      while(!name)
      {
        const prop = object.property;
        const propName = prop.name ? prop.name : prop.value;
        if(object.computed)
        {
          exp = "[" + propName + "]" + exp;
        }
        else
        {
          exp = "." + propName + exp;
        }
        object = object.object;
        name = object.name
      }
      exp = object.name + exp;
    }
    else
    {
      exp = name;
    }
    return exp;
  },
  parseDeclaration(node, newSrc)
  {
    const script = this.get('script');
    newSrc = this.insert(newSrc, node.kind + " ");
    for(let i = 0; i < node.declarations.length; i++)
    {
      const dec = node.declarations[i];
      const name = dec.id.name;
      const init = dec.init;
      let savedVal = this.get('savedVals')[name];
      const delim = i >= node.declarations.length - 1 ? ";" : ","
      let exp = script.script.substring(dec.start, dec.end) + delim;
      if(name.substring(0,2) == "p_")
      {
        if(!init)
        {
          savedVal = savedVal ? savedVal:0;
          exp = name + " = " + savedVal + delim;
          newSrc = newSrc + exp;
        }
        else
        {
          newSrc = newSrc + exp;
          const msg = "parent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");"
          newSrc = this.insert(newSrc, msg);
        }
        this.set('hasPVals', true);
      }
      else
      {
        if(init)
        {
          newSrc = newSrc + name + " = ";
          newSrc = newSrc + this.parseNode(init);
        }
        else
        {
          newSrc = newSrc + exp;
        }
      }
    }
    return newSrc;
  },
  parseExpression(node)
  {
    let newSrc = "";
    if(node.type == "FunctionExpression" ||
       node.type == "ArrowFunctionExpression")
    {
      if(name)
      {
        newSrc = newSrc + name + " = ";
      }
      newSrc = newSrc + this.parseNode(node);
    }
    else if(node.type == "ObjectExpression")
    {
      newSrc = newSrc + " {";
      for(let j = 0; j < node.properties.length; j++)
      {
        const prop = node.properties[j]
        newSrc = newSrc + prop.key.name + ":";
        newSrc = newSrc + this.parseNode(prop.value);
        const delim = j < node.properties.length - 1 ? "," : "";
        newSrc = newSrc + delim;
      }
      newSrc = newSrc + "}";
    }
    else if(node.type == "NewExpression")
    {
      const constructorName = this.getName(node.callee);
      let exp = " new " + constructorName;
      exp = exp + this.parseArgs(node.arguments);
      newSrc = newSrc + exp;
    }
    else if(node.type == "ArrayExpression")
    {
      newSrc = newSrc + " ["
      for(let j = 0; j < node.elements.length; j++)
      {
        const element = node.elements[j];
        newSrc = newSrc + this.parseNode(element);
        const delim = j < node.elements.length - 1 ? "," : "";
        newSrc = newSrc + delim;
      }
      newSrc = newSrc + "]"
    }
    else
    {
      const script = this.get('script');
      const exp = script.script.substring(node.start, node.end);
      newSrc = this.insert(newSrc,exp);
    }
    return newSrc;
  },
  parseAssignment(node, newSrc)
  {
    const script = this.get('script');
    const exp = script.script.substring(node.start, node.end);
    newSrc = this.insert(newSrc,exp);
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
      }
    }
    //If an object or a property of it is changed, update with a JSON version of the WHOLE object
    if(name.substring(0,2)=="p_")
    {
      this.set('hasPVals', true);
      const msg = "parent.postMessage([\"" + name + "\",JSON.stringify(" + name + ")], \"*\");"
      newSrc = this.insert(newSrc, msg);
    }
    return newSrc;
  },
  parseArgs(args)
  {
    const script = this.get('script');
    let exp = "(";
    for(let i = 0; i < args.length; i++)
    {
      if(args[i].type == "FunctionExpression" ||
         args[i].type == "ArrowFunctionExpression")
      {
        exp = exp + this.parseNode(args[i]);
      }
      else
      {
        exp = exp + script.script.substring(args[i].start, args[i].end);
      }
      const delim = i < args.length - 1 ? "," : "";
      exp = exp + delim;
    }
    exp = exp + ");";
    return exp;
  },
  parseCallExpression(node, newSrc)
  {
    const script = this.get('script');
    let callee = node.callee;
    let exp = this.getName(callee);
    exp = exp + this.parseArgs(node.arguments);
    newSrc = this.insert(newSrc, exp);
    return newSrc;
  },
  parseFunction(node, newSrc)
  {
    const arrowFn = node.type == "ArrowFunctionExpression" ||
                    node.type == "ArrowFunctionDeclaration";
    let exp = arrowFn ? "":"function ";
    if(node.id)
    {
      exp = exp + node.id.name;
    }
    exp = exp + "(";
    newSrc = this.insert(newSrc, exp);
    if(node.params.length > 0)
    {
      for(let i = 0; i < node.params.length; i++)
      {
        newSrc = newSrc + node.params[i].name;
        if(i < node.params.length - 1)
        {
          newSrc = newSrc + ",";
        }
      }
    }
    newSrc = newSrc + ")";
    if(arrowFn)
    {
      newSrc = newSrc + " => ";
    }
    newSrc = newSrc + " {\n";
    for(let i = 0; i < node.body.body.length; i++)
    {
      newSrc = newSrc + this.parseNode(node.body.body[i]);
    }
    newSrc = this.insert(newSrc,"}")
    return newSrc;
  },
  parseConditional(node, newSrc, fromAlt)
  {
    const script = this.get('script');
    const alt = node.alternate;
    let test = "if(" + script.script.substring(node.test.start, node.test.end) + ") {\n";
    if(fromAlt)
    {
      test = "else " + test;
    }
    newSrc = this.insert(newSrc, test);
    newSrc = newSrc + this.parseNode(node.consequent);
    newSrc = this.insert(newSrc,"}")
    if (alt)
    {
      if(!alt.test)
      {
        newSrc = this.insert(newSrc, "else {\n");
        newSrc = newSrc + this.parseNode(alt, true);
        newSrc = this.insert(newSrc,"}")
      }
      else
      {
        newSrc = newSrc + this.parseNode(alt, true);
      }
    }
    return newSrc;
  },
  parseReturnStatement(node, newSrc)
  {
    newSrc = this.insert(newSrc, "return ");
    if(node.argument)
    {
      newSrc = newSrc + this.parseNode(node.argument);
    }
    return newSrc;
  },
  parseNode(node, fromAlt = false)
  {
    console.log(node)
    const script = this.get('script');
    let newSrc = "";
    let parsed = false;
    if(node.type == "VariableDeclaration"  && node.declarations)
    {
      console.log("VariableDeclaration");
      newSrc = newSrc + this.parseDeclaration(node, newSrc);
      parsed = true;
    }
    else if (node.expression)
    {
      newSrc = newSrc + this.parseNode(node.expression, newSrc);
      parsed = true;
    }
    else if(node.type == "AssignmentExpression")
    {
      console.log("AssignmentExpression");
      newSrc = newSrc + this.parseAssignment(node, newSrc);
      parsed = true;
    }
    else if (node.type == "CallExpression")
    {
      console.log("CallExpression");
      newSrc = newSrc + this.parseCallExpression(node, newSrc);
      parsed = true;
    }
    else if(node.type == "ReturnStatement")
    {
      console.log("ReturnStatement");
      newSrc = newSrc + this.parseReturnStatement(node, newSrc);
      parsed = true;
    }
    else if(node.params && node.body)
    {
      console.log("Function");
      newSrc = newSrc + this.parseFunction(node, newSrc);
      parsed = true;
    }
    else if (node.type.includes("Expression") && !node.expression)
    {
      console.log("Expression");
      newSrc = newSrc + this.parseExpression(node, newSrc);
      parsed = true;
    }
    else if (node.consequent)
    {
      console.log("Conditional");
      newSrc = newSrc + this.parseConditional(node, newSrc, fromAlt);
      parsed = true;
    }
    else if(node.type == "ForStatement")
    {
      console.log("ForStatement");
      let exp = "for(" + script.script.substring(node.init.start, node.init.end) + ";";
      exp = exp + script.script.substring(node.test.start, node.test.end) + ";";
      exp = exp + script.script.substring(node.update.start, node.update.end);
      exp = exp + ")\n{\n";
      newSrc = this.insert(newSrc,exp);
      newSrc = newSrc + this.parseNode(node.body);
      newSrc = this.insert(newSrc,"}");
      parsed = true;
    }
    else if(node.type == "ForInStatement")
    {
      console.log("ForInStatement");
      const right = this.getName(node.right);
      const left = node.left.kind + " " + node.left.declarations[0].id.name;
      let exp = "for(" + left + " in " + right + ")\n{"
      newSrc = this.insert(newSrc,exp);
      newSrc = newSrc + this.parseNode(node.body);
      newSrc = this.insert(newSrc,"}");
      parsed = true;
    }
    else if(node.type == "DoWhileStatement")
    {
      console.log("DoWhileStatement");
      newSrc = this.insert(newSrc,"do {");
      newSrc = newSrc + this.parseNode(node.body);
      newSrc = this.insert(newSrc,"}");
      newSrc = this.insert(newSrc,"while(");
      newSrc = newSrc + script.script.substring(node.test.start, node.test.end);
      newSrc = newSrc + ")";
      parsed = true;
    }
    else if(node.type == "WhileStatement")
    {
      console.log("WhileStatement");
      let exp = "while(" + script.script.substring(node.test.start, node.test.end);
      exp = exp + ")\n{\n";
      newSrc = this.insert(newSrc,exp);
      newSrc = newSrc + this.parseNode(node.body);
      newSrc = this.insert(newSrc,"}");
      parsed = true;
    }
    else if (node.type == "TryStatement")
    {
      console.log("TryStatement");
      newSrc = this.insert(newSrc,"try {\n");
      newSrc = newSrc + this.parseNode(node.block);
      newSrc = this.insert(newSrc,"\n} catch(");
      newSrc = newSrc + node.handler.param.name + ") {\n";
      newSrc = newSrc + this.parseNode(node.handler.body);
      newSrc = this.insert(newSrc,"}");
      if(node.finalizer)
      {
        newSrc = this.insert(newSrc,"finally {\n");
        newSrc = newSrc + this.parseNode(node.finalizer);
        newSrc = this.insert(newSrc,"}");
      }
      parsed = true;
    }
    else if(node.body && node.type == "BlockStatement")
    {
      console.log("BlockStatement");
      for(let i = 0; i < node.body.length; i++)
      {
        newSrc = newSrc + this.parseNode(node.body[i]);
      }
      parsed = true;
    }
    else if (node.type == "Literal")
    {
      console.log("Literal");
      newSrc = newSrc + node.value;
      parsed = true;
    }
    //If not parsed, insert verbatim
    if(!parsed)
    {
      console.log("Not parsed");
      const exp = script.script.substring(node.start, node.end);
      newSrc = newSrc + exp;
    }
    return newSrc;
  },
  insertStatefullCallbacks(src, savedVals) {
    let newSrc = "";
    this.set('savedVals', savedVals);
    this.set('hasPVals', false);
    const scripts = this.getScripts(src);
    for(let i = 0; i < scripts.length; i++)
    {
      const script  = scripts[i];
      this.set('script', script);
      newSrc = newSrc + script.preamble;
      let parsed;
      try {
        parsed = acorn.parse(script.script);
      } catch (err) {
        console.log("Error parsing script", err);
      }
      if(parsed)
      {
        for(let j = 0; j < parsed.body.length; j++)
        {
          newSrc = newSrc + this.parseNode(parsed.body[j]);
        }
      }
      newSrc = newSrc + script.post;
    }
    console.log(newSrc);
    return this.get('hasPVals') ? newSrc : src;
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
