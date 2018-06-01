import OAuth2PasswordGrant from 'ember-simple-auth/authenticators/oauth2-password-grant';
import config from '../config/environment';
import $ from 'jquery';
import RSVP from 'rsvp';
import { isEmpty } from '@ember/utils';
import { run } from '@ember/runloop';
import { makeArray } from '@ember/array';
import { assign } from '@ember/polyfills';

export default OAuth2PasswordGrant.extend({
  serverTokenEndpoint: `${config.apiHost}/token`,
  serverTokenRevocationEndpoint: `${config.apiHost}/revoke`,
  authenticate(identification, password, scope = [], headers = {}) {
    return new RSVP.Promise((resolve, reject) => {
      const data = { 'grant_type': 'password', username: identification, password };
      const serverTokenEndpoint = this.get('serverTokenEndpoint');
      const useResponse = this.get('rejectWithResponse');
      const scopesString = makeArray(scope).join(' ');
      if (!isEmpty(scopesString)) {
        data.scope = scopesString;
      }
      this.makeRequest(serverTokenEndpoint, data, headers).then((response) => {
        run(() => {
          if (!this._validate(response)) {
            reject('access_token is missing in server response');
          }

          const expiresAt = this._absolutizeExpirationTime(response['expires_in']);
          this._scheduleAccessTokenRefresh(response['expires_in'], expiresAt, response['refresh_token']);
          if (!isEmpty(expiresAt)) {
            response = assign(response, { 'expires_at': expiresAt });
          }
          response = assign(response, { 'user_id': identification });
          console.log("AUTHENTICATION RESPONSE", response);
          resolve(response);
        });
      }, (response) => {
        run(null, reject, useResponse ? response : (response.responseJSON || response.responseText));
      });
    });
  },
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
