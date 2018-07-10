import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';

export default Service.extend({
  sessionAccount:inject('session-account'),
  submitOp(op) {
    const doc = this.get('sessionAccount').currentDoc;
    const token = "Bearer " + this.get('sessionAccount').bearerToken;
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "POST",
          url: config.serverHost + "/submitOp",
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
          data: { op: op , documentId: doc}
        }).then((res) => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
    });
  },
});
