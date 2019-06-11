import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import { acorn } from 'acorn'
import { walk } from 'acorn/dist/walk'
import config from  '../config/environment';
import RSVP from 'rsvp';

export default Service.extend({
  store:inject('store'),
  cs:inject('console'),
  assetService:inject('assets'),
  library:inject(),
  script:"",
  savedVals:null,
  hasPVals:false,
  parser:new DOMParser(),
  insertLibrary(lib, source) {
    let insertAfter = "<head>"
    let index = source.indexOf(insertAfter) + insertAfter.length;
    let insert = "\n <script src = \"" +
    config.localOrigin + "/libs/" + this.get('library').url(lib) +
    "\"></script>"
    const op = {p: ["source", index], si:insert};
    return op;
  },
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
          console.log("found start of <link");
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
          console.log(tag);
          searchIndex = index + searchStrs[ptr].length;
          newSrc = newSrc + preamble;
          let added = false;
          const parsedTag = this.get('parser').parseFromString(tag, "application/xml");
          const attr = parsedTag.documentElement.attributes;
          let styleSheet = false;
          let media;
          console.log("stylesheet", attr);
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
            console.log("stylesheet", children);
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
                    //console.log(newSrc);
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
  insertChildren(src, children, assets) {
    let newSrc = "";
    const scripts = this.getScripts(src);
    for(let i = 0; i < scripts.length; i++)
    {
      const script  = scripts[i];
      newSrc = newSrc + this.insertStyleSheets(script.preamble, children);
      let added = false;
      if(script.src.length == 0)
      {
        const parsedTag = this.get('parser').parseFromString(script.scriptTag+"</script>", "application/xml");
        const attr = parsedTag.documentElement.attributes;
        for(let i = 0; i < attr.length; i++)
        {
          //console.log(attr[i].nodeName)
          if(attr[i].nodeName == "src")
          {
            for(let j = 0; j < children.length; j++)
            {
              //console.log(children[j].data.name, attr[i].nodeValue)
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
    if(scripts.length == 0)
    {
      newSrc = this.insertStyleSheets(src, children);
    }
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
        console.log("acorn couldnt parse script, probably src")
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
    //console.log("SOURCE",newSrc);
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
  replaceAssets(source, assets, docId){
    console.log("ORIGINAL", source)
    return new RSVP.Promise((resolve, reject)=> {
      const replaceAll = async ()=> {
        for(let i = 0; i < assets.length; i++)
        {
          const fileId = assets[i].fileId;
          const toFind = assets[i].name;
          const fileType = assets[i].fileType;
          let asset = this.get('store').peekRecord('asset',fileId);

          console.log("replaceAssets",fileType)

          //If file is media replace with base64
          if(this.get('assetService').isMedia(fileType))
          {
            if(!isEmpty(asset))
            {
              const b64 = "data:" + fileType + ";charset=utf-8;base64," + asset.b64data;
              console.log("replaced base64")
              source = source.replace(new RegExp(toFind,"gm"),b64);
            }
            else
            {
              console.log("need to fetch asset for conversion");
              await this.get('assetService').fetchAsset(assets[i], docId);
              console.log("finding record");
              asset = this.get('store').peekRecord('asset',fileId);
              console.log("found record");
              const b64 = "data:" + fileType + ";charset=utf-8;base64," + asset.b64data;
              source = source.replace(new RegExp(toFind,"gm"),b64);
              console.log("replaced base64")
            }
          }
          else
          {
            //Else just use endpoint
            const url = config.serverHost + "/asset/" + docId + "/" + toFind
            console.log("replaced url", url)
            source = source.replace(new RegExp("\"" + toFind + "\"","gm"), "\"" + url + "\"");
            source = source.replace(new RegExp("\'" + toFind + "\'","gm"), "\"" + url + "\"");
            //console.log(source)
          }
        }
        resolve(source);
      }
      replaceAll();
    })
  },
  /*
  We have rolled our own because the code mirror implementation
  (doc.indexFromPos) return incorrect values for {} when auto indented
  */
  indexFromPos(pos, editor) {
    let index = 0
    for(let i = 0; i < pos.line; i++)
    {
      //+ 1 for \n
      index += editor.getDoc().getLine(i).length + 1;
    }
    return index + pos.ch;
  },
  addOp(delta, editor) {
    const op = {};
    const start = this.indexFromPos(delta.from, editor);
    op.p = ['source', start];
    const str = delta.text.join('\n');
    op['si'] =  str;
    console.log("delta op", op);
    return op
  },
  removeOp(delta, editor) {
    const op = {};
    const start = this.indexFromPos(delta.from, editor);
    op.p = ['source', start];
    const str = delta.removed.join('\n');
    op['sd'] =  str;
    console.log("delta op", op);
    return op
  },
  getOps(delta, editor) {
    console.log('delta',delta);
    let ops = [];
    delta.forEach((change)=> {
      if(change.origin === "playback")
      {
        console.log("ignoring change")
        return ops;
      }
      if((change.removed[0].length > 0 && change.removed.length === 1) || change.removed.length > 1)
      {
        ops.push(this.removeOp(change,editor));
      }
      if((change.text[0].length > 0 && change.text.length === 1) || change.text.length > 1)
      {
        ops.push(this.addOp(change,editor));
      }
    });

    return ops
  },
  applyOps(ops, editor) {
    function opToDelta(op) {
      const start = op.p[op.p.length - 1];
      const from = editor.doc.posFromIndex(start);
      if ('sd' in op) {
        const end = start + op.sd.length;
        const to = editor.doc.posFromIndex(end);
        editor.doc.replaceRange("", from, to, "playback");
      } else if ('si' in op) {
        editor.doc.replaceRange(op.si, from, null, "playback");
      } else {
        throw new Error(`Invalid Operation: ${JSON.stringify(op)}`);
      }
    }
    ops.forEach((op)=> {
      opToDelta(op);
    });
  },
});
