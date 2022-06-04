import Component from '@ember/component';
import FileSaverMixin from 'ember-cli-file-saver/mixins/file-saver';
import JSZip from 'jszip';
import { inject }  from '@ember/service';

export default Component.extend(FileSaverMixin, {
  doc:null,
  classNames: ['inline-view'],
  assetService: inject('assets'),
  store: inject('store'),
  documentService: inject('documents'),
  cs: inject('console'),
  actions: {
    download() {
      const data = this.get('doc');
      this.get('cs').log(data);
      let zip = new JSZip();
      this.get('documentService').getCombinedSource(data.id)
      .then((source) => {
        zip.file('index.html', source, { type: 'string' });
        for(let asset of data.assets)
        {
          const storeAsset = this.get('store').peekRecord('asset',asset.fileId);
          if(storeAsset)
          {
            zip.file(asset.name, storeAsset.b64data, {base64: true});
          }
        }
        zip.generateAsync({type : 'blob'})
        .then((blob) => {
          this.saveFileAs(data.name + '-MIMIC.zip', blob, 'application/zip');
        });
      }).catch((err)=>this.get('cs').log(err));
    }
  }
});
