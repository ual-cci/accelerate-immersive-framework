import Controller from '@ember/controller';
import { inject } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  passwordReset: inject('password-reset'),
  store: inject(),
  validateRegistration: function() {
    return new RSVP.Promise((resolve, reject) => {
      let { newUsername, newUserEmail, newUserPassword, newUserPasswordAgain } =
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
      console.log(identification, password);
      this.get('session').authenticate('authenticator:oauth2', identification, password).then((response) => {
        console.log("authenticated", response);
        this.set('loginErrorMessage', "authenticated");
      }).catch((err) => {
        this.set('loginErrorMessage', err.error_description);
      });
    },
    createNewUser() {
      let { newUsername, newUserEmail, newUserPassword, newUserPasswordAgain } =
      this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
      console.log(newUsername, newUserEmail, newUserPassword, newUserPasswordAgain);
      this.validateRegistration().then(() => {
        let user = this.get('store').createRecord('account', {
          username: newUsername,
          password: newUserPassword,
          email: newUserEmail,
          created: new Date()
        });
        user.save().then(() => {
          console.log("user created");
          this.set('registerMessage', 'user created');
        }).catch((err) => {
          console.log(err);
          this.set('registerMessage', 'Error:' + err.errors[0].detail);
        });
      }).catch((err) => {
        this.set('registerMessage', 'Error:' + err);
      });
    },
    resetPassword()
    {
      let username = this.get('resetUsername');
      this.get('passwordReset').requestReset(username).then(() => {
        console.log("password reset");
        this.set('resetMessage', 'password reset link generated');
      }).catch((err) => {
        console.log(err);
        this.set('resetMessage', 'Error:' + err.errors[0].detail);
      });
    }
  }
});
