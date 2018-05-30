import OAuth2PasswordGrant from 'ember-simple-auth/authenticators/oauth2-password-grant';
import config from '../config/environment';
import $ from 'jquery';

export default OAuth2PasswordGrant.extend({
  serverTokenEndpoint: `${config.apiHost}/token`,
  serverTokenRevocationEndpoint: `${config.apiHost}/revoke`,
  makeRequest: function (url, data) {
      var client_id = 'application';
      var client_secret = 'secret';
      return $.ajax({
          url: this.serverTokenEndpoint,
          type: 'POST',
          data: data,
          contentType: 'application/x-www-form-urlencoded',
          headers: {
              Authorization: "Basic " + btoa(client_id + ":" + client_secret)
          }
      });
  }
});
