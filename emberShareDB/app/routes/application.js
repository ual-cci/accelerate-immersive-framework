import { inject } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  activate() {
    this.get('cs').log('entering application route');
  },
  cs:inject('console'),
  sessionAccount: inject('session-account'),
  session: inject('session'),
  beforeModel() {
    this.get('cs').log('beforeModel application route');
     this._loadCurrentUser();
  },
  sessionAuthenticated() {
    this._super(...arguments);
    this._loadCurrentUser();
  },
  _loadCurrentUser() {
    this.get('cs').log('loading current user');
    this.get('sessionAccount').loadCurrentUser()
    .then(() => {
      this.get('sessionAccount').updateOwnedDocuments();
    })
    .catch(() => {
      this.get('session').invalidate();
    });
  }
});
