import Component from '@ember/component';
import EmberUploader from 'ember-uploader';
import config from  '../config/environment';
import { inject } from '@ember/service';

export default EmberUploader.FileField.extend({
  sessionAccount:inject('session-account'),
  url:config.serverHost + "/asset",
  filesDidChange(files) {
    const uploader = EmberUploader.Uploader.create({
      url: this.get('url')
    });
    if (!Ember.isEmpty(files))
    {
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
        console.log('didError',errorThrown);
      });
      uploader.upload(files[0], data);
    }
  }
});
