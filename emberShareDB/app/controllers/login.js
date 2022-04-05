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
      this.clearFeedback();
      let { newUsername, newUserPassword, newUserPasswordAgain } =
      this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
      if(!newUsername || !newUserPassword || !newUserPasswordAgain)
      {
        reject('please provide correct info');
      }
      if(newUserPassword != newUserPasswordAgain)
      {
        reject('passwords do not match');
      }
      const badCharacters = ['*','"','\'','(',')',';',':','@','&','=','+','$',',','/','?','#','[',']','"', ' '];
      badCharacters.forEach((char)=> {
        if(newUsername.indexOf(char) !== -1)
        {
          reject('username must be one word (no spaces) and not contain !*\'();:@&=+$,/?#[]')
        }
      });
      resolve();
    });
  },
  clearFeedback() {
    this.set('loginErrorMessage', '');
    this.set('registerMessage', '');
  },
  actions: {
    invalidateSession() {
      this.get('session').invalidate();
    },
    authenticate() {
      this.clearFeedback();
      let { identification, password } = this.getProperties('identification', 'password');
      this.get('session').authenticate('authenticator:oauth2', identification, password).then((response) => {
        this.get('cs').log('authenticated', response);
        this.set('loginErrorMessage', 'authenticated');
      }).catch((err) => {
        console.log('authentication failed', err);
        this.set('loginErrorMessage', 'authentication failed');
      });
    },
    createNewUser() {
      this.clearFeedback();
      let { newUsername, newUserEmail, newUserPassword, newUserPasswordAgain } =
      this.getProperties('newUsername', 'newUserEmail', 'newUserPassword', 'newUserPasswordAgain');
      this.get('cs').log(newUsername, newUserEmail, newUserPassword, newUserPasswordAgain);
      this.validateRegistration().then(() => {
        const lowercaseUser = newUsername.toLowerCase();
        let user = this.get('store').createRecord('account', {
          username: lowercaseUser,
          password: newUserPassword,
          email: newUserEmail,
          created: new Date()
        });
        user.save().then(() => {
          this.get('cs').log('user created');
          alert('Your new user account has been created, please sign in to continue')
          this.set('registerMessage', 'Your new user account has been created, please sign in to continue');
        }).catch((err) => {
          this.get('cs').log(err);
          this.set('registerMessage', 'Error:' + err);
        });
      }).catch((err) => {
        this.set('registerMessage', 'Error:' + err);
      });
    },
    resetPassword() {
      this.clearFeedback();
      let username = this.get('resetUsername');
      this.get('passwordReset').requestReset(username).then(() => {
        this.get('cs').log('password reset');
        this.set('resetMessage', 'Password reset request accepted, please check you email to confirm');
      }).catch((err) => {
        this.get('cs').log(err);
        this.set('resetMessage', 'Error:' + err);
      });
    }
  }
});
