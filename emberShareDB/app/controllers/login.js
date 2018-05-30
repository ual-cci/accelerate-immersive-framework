import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  session: inject('session'),
  store: inject(),
  actions: {
    invalidateSession() {
      this.get('session').invalidate();
    },
    authenticate() {
      let { identification, password } = this.getProperties('identification', 'password');
      this.get('session').authenticate('authenticator:oauth2', identification, password).then(function() {
        console.log("authenticated");
      });
    },
    createNewUser() {
      let { newUserIdentification, newUserPassword } = this.getProperties('newUserIdentification', 'newUserPassword');
      console.log('updating record for:',newUserIdentification, newUserPassword)
      let user = this.get('store').createRecord('account', {
        login: "",
        name: newUserIdentification,
        password: newUserPassword
      });
      user.save();
    }
  }
});
