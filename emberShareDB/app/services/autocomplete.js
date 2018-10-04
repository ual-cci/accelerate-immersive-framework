import Service from '@ember/service';

export default Service.extend({
  assets(assets) {
    let fn = (asset)=> {
      return {
        value:asset.name.substring(0,2),
        score:10000,
        caption:asset.name,
        meta:"MIMIC",
        snippet:asset.name
      }
    }
    return assets.map(fn);
  },
  tabs(children)
  {
    let fn = (child)=> {
      return {
        value:child.data.name.substring(0,2),
        score:10000,
        caption:child.data.name,
        meta:"MIMIC",
        snippet:child.data.name
      }
    }
    return children.map(fn);
  },
  ruleSets(docType) {
    let ruleSets = {
      "tagname-lowercase": true,
      "attr-lowercase": true,
      "attr-value-double-quotes": true,
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
    if(docType == "js")
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
  },
  lintingErrors(messages) {
    let errors = [];
    for(let i = 0; i < messages.length; i++)
    {
        const message = messages[i];
        errors.push({
            row: message.line-1,
            column: message.col-1,
            text: message.message,
            type: message.type,
            raw: message.raw
        });
    }
    return errors 
  }
});
