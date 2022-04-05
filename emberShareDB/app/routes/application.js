import { inject } from '@ember/service';
import Route from '@ember/routing/route';
import ApplicationRouteMixin from 'ember-simple-auth/mixins/application-route-mixin';
import RSVP from 'rsvp';

export default Route.extend(ApplicationRouteMixin, {
  activate() {
    this.get('cs').log('entering application route');
  },
  cs:inject('console'),
  sessionAccount: inject('session-account'),
  session: inject('session'),
  async beforeModel() {
    this.get('cs').log('beforeModel application route');
    await this._loadCurrentUser();
    this.get('cs').log('ending beforeModel application route');
  },
  sessionAuthenticated() {
    this._super(...arguments);
    this.get('cs').log('session authenticated');
    this._loadCurrentUser();
  },
  _loadCurrentUser() {
    return new RSVP.Promise((resolve, reject)=> {
      this.get('cs').log('loading current user');
      this.get('sessionAccount').loadCurrentUser()
      .then(()=> {
        this.get('sessionAccount').getUserFromName().then(()=> {
          this.get('sessionAccount').updateOwnedDocuments().then(resolve())
          .catch(() => {
            this.get('cs').log('no current user');
            this.get('session').invalidate();
            resolve();
          });
        }).catch(() => {
          this.get('cs').log('no current user');
          this.get('session').invalidate();
          resolve();
        });;
      })
      .catch(() => {
        this.get('cs').log('no current user');
        this.get('session').invalidate();
        resolve();
      });
    })

  }
});
