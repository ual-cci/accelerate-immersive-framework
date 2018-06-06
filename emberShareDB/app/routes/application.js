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
    this._loadCurrentUser();
  },
  _loadCurrentUser() {
    this.get('sessionAccount').loadCurrentUser()
    .then(() => {
      this.transitionTo('documents'," ");
    })
    .catch(() => {
      //this.get('session').invalidate();
    });
  }
});
