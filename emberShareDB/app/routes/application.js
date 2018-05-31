import { inject } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  sessionAccount: inject('session-account'),
  session: inject('session'),
  beforeModel() {
    //return this._loadCurrentUser();
  },
  sessionAuthenticated() {
    this._super(...arguments);
    console.log("session authenticated", this.get('session'));
    this.transitionTo('documents');
    //this._loadCurrentUser();
  },
  _loadCurrentUser() {
    console.log("loading current user");
    return this.get('sessionAccount').loadCurrentUser()
    .then(this.transitionTo('documents'))
    .catch(() => {
      this.get('session').invalidate();
      //this.transitionTo('login');
    });
  }
});
