import Component from '@ember/component';
import EmberUploader from 'ember-uploader';
import config from  '../config/environment';
import { inject } from '@ember/service';

export default EmberUploader.FileField.extend({
  sessionAccount:inject('session-account'),
  url:config.serverHost + "/asset",
  documentId:null,
  filesDidChange(files) {
    const uploader = EmberUploader.Uploader.create({
      url: this.get('url')
    });

    if (!Ember.isEmpty(files)) {
      // this second argument is optional and can to be sent as extra data with the upload
      let user = this.get('sessionAccount').currentUserName;
      let doc = this.get('sessionAccount').currentDoc;
      let data = {username:user,documentId:doc};
      console.log(data);
      uploader.on('progress', e => {
        console.log('progress',e);
      });
      uploader.on('didUpload', e => {
        console.log('didUpload',e);
      });
      uploader.on('didError', (jqXHR, textStatus, errorThrown) => {
        console.log('didError',e);
      });
      uploader.upload(files[0], data).then(data => {
        // Handle success
      }, error => {
        // Handle failure
      });
    }
  }
});
