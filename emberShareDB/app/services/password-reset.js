import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';

export default Service.extend({
  requestReset(username) {
    console.log("reset pword for " + username);
    $.ajax({
        type: "POST",
        url: config.serverHost + "/resetPassword",
        data: { username: username }
      });
  },
  checkToken(username, token) {
    console.log("check token " + token +" for " + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "POST",
          url: config.serverHost + "/checkPasswordToken",
          data: { username: username, token: token}
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
