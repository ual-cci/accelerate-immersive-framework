import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';

export default Service.extend({
  sessionAccount:inject('session-account'),
  deleteAsset(fileId) {
    console.log("deleteAsset for " + fileId);
    let doc = this.get('sessionAccount').currentDoc;
    let data = {documentId:doc};
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "DELETE",
          url: config.serverHost + "/asset/"+fileId,
          data: data
        }).then((res) => {
          console.log("success",res);
          resolve();
        }).catch((err) => {
          console.log("error",err);
          reject(err);
        });
    });
  },
});
