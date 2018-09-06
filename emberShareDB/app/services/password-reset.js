import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';

export default Service.extend({
  sessionAccount:inject('session-account'),
  cs:inject('console'),
  requestReset(username) {
    this.get('cs').log("reset pword for " + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "POST",
          url: config.serverHost + "/resetPassword",
          data: { username: username }
        }).then((res) => {
          this.get('cs').log("success",res);
          resolve();
        }).catch((err) => {
          this.get('cs').log("error",err);
          reject(err);
        });
    });
  },
  updatePassword(username, token, newPassword) {
    this.get('cs').log("updatePassword to " + newPassword + " with " + token +" for " + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "POST",
          url: config.serverHost + "/updatePassword",
          data: { username: username, token: token, password: newPassword}
        }).then((res) => {
          this.get('cs').log("success",res);
          resolve();
        }).catch((err) => {
          this.get('cs').log("error",err);
          reject(err);
        });
    });
  },
  checkToken(username, token) {
    this.get('cs').log("check token " + token +" for " + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "POST",
          url: config.serverHost + "/checkPasswordToken",
          data: { username: username, token: token}
        }).then((res) => {
          this.get('cs').log("success",res);
          resolve();
        }).catch((err) => {
          this.get('cs').log("error",err);
          reject(err);
        });
    });
  },
});
