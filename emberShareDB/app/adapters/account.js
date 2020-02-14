import DS from 'ember-data';
import DataAdapterMixin from 'ember-simple-auth/mixins/data-adapter-mixin';
import config from '../config/environment';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';

const { JSONAPIAdapter } = DS;

export default JSONAPIAdapter.extend(DataAdapterMixin, {
  host: config.serverHost,
  session: service('session'),
  headers: computed('session.data.authenticated.access_token', function() {
    const headers = {};
    if (this.session.isAuthenticated) {
      headers['Authorization'] = `Bearer ${this.session.data.authenticated.access_token}`;
    }

    return headers;
  }),
  // authorize(xhr) {
  //   let { access_token } = this.get('session.data.authenticated');
  //   xhr.setRequestHeader('Authorization', `Bearer ${access_token}`);
  // },
});
