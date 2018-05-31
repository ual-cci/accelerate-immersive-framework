import { inject } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  sessionAccount: inject('session-account'),
  session: inject('session'),
  beforeModel() {
    return this._loadCurrentUser().then(this.transitionTo('documents'));
  },
  sessionAuthenticated() {
    this._super(...arguments);
    console.log("session authenticated");
    this._loadCurrentUser().then(this.transitionTo('documents'));
  },
  _loadCurrentUser() {
    console.log("loading current user");
    return this.get('sessionAccount').loadCurrentUser().catch(() => this.get('session').invalidate());
  }
});
