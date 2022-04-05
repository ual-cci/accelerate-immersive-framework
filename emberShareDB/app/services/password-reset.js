import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';
import { bind } from '@ember/runloop';

export default Service.extend({
  sessionAccount:inject('session-account'),
  cs:inject('console'),
  requestReset(username) {
    this.get('cs').log('reset pword for ' + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: 'POST',
          url: config.serverHost + '/resetPassword',
          data: { username: username, hostURL:config.localOrigin }
        }).then(bind((res) => {
          this.get('cs').log('success',res);
          resolve();
        })).catch(bind((err) => {
          this.get('cs').log('error',err.responseText);
          reject(err.responseText);
        }));
    });
  },
  updatePassword(username, token, newPassword) {
    this.get('cs').log('updatePassword to ' + newPassword + ' with ' + token +' for ' + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: 'POST',
          url: config.serverHost + '/updatePassword',
          data: { username: username, token: token, password: newPassword}
        }).then(bind((res) => {
          this.get('cs').log('success',res);
          resolve();
        })).catch(bind((err) => {
          this.get('cs').log('error',err);
          reject(err);
        }));
    });
  },
  checkToken(username, token) {
    this.get('cs').log('check token ' + token +' for ' + username);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: 'POST',
          url: config.serverHost + '/checkPasswordToken',
          data: { username: username, token: token}
        }).then(bind((res) => {
          this.get('cs').log('success',res);
          resolve();
        })).catch(bind((err) => {
          this.get('cs').log('error',err);
          reject(err);
        }));
    });
  },
});
