import { inject } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  sessionAccount: inject('session-account'),
  session: inject('session'),
  beforeModel() {
     this._loadCurrentUser();
  },
  sessionAuthenticated() {
    this._super(...arguments);
    console.log("session authenticated", this.get('session'));
    this._loadCurrentUser();
  },
  _loadCurrentUser() {
    console.log("loading current user");
    this.get('sessionAccount').loadCurrentUser()
    .then(() => {
      console.log("loaded user, transitioning to documents");
      console.log("currentUser", this.get('sessionAccount').currentUserName);
      this.transitionTo('documents');
    })
    .catch(() => {
      console.log("load user rejected");
      this.get('session').invalidate();
      //this.transitionTo('login');
    });
  }
});
