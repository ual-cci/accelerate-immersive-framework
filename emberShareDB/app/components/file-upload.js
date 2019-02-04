import EmberUploader from 'ember-uploader';
import config from  '../config/environment';
import { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default EmberUploader.FileField.extend({
  sessionAccount:inject('session-account'),
  cs:inject('console'),
  url:config.serverHost + "/asset",
  uploadFile:  function (file){
    const uploader = EmberUploader.Uploader.create({
      url: this.get('url')
    });
    if (!isEmpty(file))
    {
      let user = this.get('sessionAccount').currentUserName;
      let doc = this.get('sessionAccount').currentDoc;
      let data = {username:user,documentId:doc};
      this.get('cs').log(data);
      uploader.on('progress', e => {
        this.get('cs').log('progress', e);
        this.get('onProgress')(e);
      });
      uploader.on('didUpload', e => {
        this.get('cs').log('didUpload',e);
        this.get('onCompletion')(e);
      });
      uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
        this.get('cs').log('didError',jqXHR, textStatus, errorThrown);
        this.get('onError')(errorThrown);
      });
      uploader.upload(file)
    }
  },
  filesDidChange: async function(files) {
    console.log("files to upload", files)
    for(var i = 0; i < files.length; i++)
    {
      await this.uploadFile(files[i])
    }
  }
});
