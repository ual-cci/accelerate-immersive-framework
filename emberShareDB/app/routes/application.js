import { inject } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';

export default Route.extend(ApplicationRouteMixin, {
  activate() {
    console.log('entering application route');
  },
  sessionAccount: inject('session-account'),
  session: inject('session'),
  beforeModel() {
    console.log('beforeModel application route');
     this._loadCurrentUser();
  },
  sessionAuthenticated() {
    this._super(...arguments);
    this._loadCurrentUser();
  },
  _loadCurrentUser() {
    console.log('loading curret user');
    this.get('sessionAccount').loadCurrentUser()
    .then(() => {
      //this.transitionTo('documents'," ","0");
    })
    .catch(() => {
      this.get('session').invalidate();
    });
  }
});
