import DS from 'ember-data';
import config from  '../config/environment';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default DS.JSONAPIAdapter.extend({
  host: config.serverHost,
  sessionAccount:inject('session-account'),
  headers: computed('sessionAccount.bearerToken', function() {
    return {
      'Authorization': 'Bearer ' + this.get('sessionAccount.bearerToken')
    }})
});
