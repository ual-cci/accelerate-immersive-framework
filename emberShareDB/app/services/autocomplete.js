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
  }
});
