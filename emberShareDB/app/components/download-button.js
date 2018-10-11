import Component from '@ember/component';
import FileSaverMixin from 'ember-cli-file-saver/mixins/file-saver';
import JSZip from 'npm:jszip';
import config from  '../config/environment';
import { inject }  from '@ember/service';

export default Component.extend(FileSaverMixin, {
  doc:null,
  classNames: ['inline-view'],
  assetService: inject('assets'),
  store: inject('store'),
  actions: {
    download() {
      const data = this.get('doc');
      let zip = new JSZip();
      zip.file("index.html", data.source, { type: 'string' });
      for(let asset of data.assets)
      {
        const storeAsset = this.get('store').peekRecord('asset',asset.fileId);
        if(storeAsset)
        {
          zip.file(asset.name, storeAsset.b64data, {base64: true});
        }
      }
      zip.generateAsync({type : "blob"})
      .then((blob) => {
        this.saveFileAs(data.name + "-MIMIC.zip", blob, 'application/zip');
      });
    }
  }
});
