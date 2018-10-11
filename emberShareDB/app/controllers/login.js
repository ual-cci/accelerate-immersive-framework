import Controller from '@ember/controller';
import { inject } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  passwordReset: inject('password-reset'),
  cs:inject('console'),
  store: inject(),
  validateRegistration: function() {
    return new RSVP.Promise((resolve, reject) => {
      let { newUsername, newUserPassword, newUserPasswordAgain } =
      this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
      if(!newUsername || !newUserPassword || !newUserPasswordAgain)
      {
        reject("please provide correct info");
      }
      if(newUserPassword != newUserPasswordAgain)
      {
        reject("passwords do not match");
      }
      resolve();
    });
  },
  actions: {
    invalidateSession() {
      this.get('session').invalidate();
    },
    authenticate() {
      let { identification, password } = this.getProperties('identification', 'password');
      this.get('session').authenticate('authenticator:oauth2', identification, password).then((response) => {
        this.get('cs').log("authenticated", response);
        this.set('loginErrorMessage', "authenticated");
      }).catch((err) => {
        console.log(err);
        this.set('loginErrorMessage', err.error_description);
      });
    },
    createNewUser() {
      let { newUsername, newUserEmail, newUserPassword, newUserPasswordAgain } =
      this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
      this.get('cs').log(newUsername, newUserEmail, newUserPassword, newUserPasswordAgain);
      this.validateRegistration().then(() => {
        let user = this.get('store').createRecord('account', {
          username: newUsername,
          password: newUserPassword,
          email: newUserEmail,
          created: new Date()
        });
        user.save().then(() => {
          this.get('cs').log("user created");
          this.set('registerMessage', 'user created');
        }).catch((err) => {
          this.get('cs').log(err);
          this.set('registerMessage', 'Error:' + err);
        });
      }).catch((err) => {
        this.set('registerMessage', 'Error:' + err);
      });
    },
    resetPassword()
    {
      let username = this.get('resetUsername');
      this.get('passwordReset').requestReset(username).then(() => {
        this.get('cs').log("password reset");
        this.set('resetMessage', 'password reset link generated');
      }).catch((err) => {
        this.get('cs').log(err);
        this.set('resetMessage', 'Error:' + err.errors[0].detail);
      });
    }
  }
});
