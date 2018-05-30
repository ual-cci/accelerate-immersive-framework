import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  session: inject('session'),
  actions: {
    invalidateSession() {
      this.get('session').invalidate();
    },
    authenticate() {
      let { identification, password } = this.getProperties('identification', 'password');
      this.get('session').authenticate('authenticator:oauth2', identification, password).catch((reason) => {
        this.set('errorMessage', reason.error || reason);
      });
    }
  }
});
