import Service from '@ember/service';
import CodeMirror from 'codemirror';
import { inject } from '@ember/service';

export default Service.extend({
   cs:inject('console'),
   tabs:(children)=> {
     return children.map((child)=>{return child.data.name});
   },
   assets:(assets)=> {
     return assets.map((asset)=>{return asset.name});
   },
   toFind: (cm, targets)=> {
     return new Promise((resolve, reject)=> {
        setTimeout(()=> {
          let cursor = cm.getCursor(), line = cm.getLine(cursor.line)
          let start = cursor.ch, end = cursor.ch
          let from, to;
          let matches = [];
          while (start && /\w/.test(line.charAt(start - 1))) --start;
            while (end < line.length && /\w/.test(line.charAt(end))) ++end
              var word = line.slice(start, end).toLowerCase()
              for (var i = 0; i < targets.length; i++)
              {
                if (targets[i].toLowerCase().indexOf(word) !== -1)
                {
                  matches.push(targets[i]);
                  from = CodeMirror.Pos(cursor.line, start);
                  to = CodeMirror.Pos(cursor.line, end);
                }
              }
          resolve({list:matches, from:from, to:to});
        }, 100)
      })
  },
  ruleSets(docType) {
    this.get('cs').log("getting rule set for" ,docType);
    let ruleSets = {
      "tagname-lowercase": true,
      "attr-lowercase": true,
      "attr-value-double-quotes": false,
      "tag-pair": true,
      "spec-char-escape": true,
      "id-unique": true,
      "src-not-empty": true,
      "attr-no-duplication": true,
      "csslint": {
        "display-property-grouping": true,
        "known-properties": true
      },
      "jshint": {"esversion": 6, "asi" : true}
    }
    if(docType == "javascript")
    {
      ruleSets = {
        "tagname-lowercase": false,
        "attr-lowercase": false,
        "attr-value-double-quotes": false,
        "tag-pair": false,
        "spec-char-escape": false,
        "id-unique": false,
        "src-not-empty": false,
        "attr-no-duplication": false,
        "csslint": {
          "display-property-grouping": false,
          "known-properties": false
        },
        "jshint": {"esversion": 6, "asi" : true}
      }
    }
    return ruleSets;
  }
});
