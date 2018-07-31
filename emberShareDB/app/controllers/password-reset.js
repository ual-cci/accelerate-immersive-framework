import Controller from '@ember/controller';
import { inject as service } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  queryParams: ['username','token'],
  passwordReset: service('password-reset'),
  hasValidToken:false,
  resetMessage:"",
  isTokenValid () {
    let username = this.get('username');
    let token = this.get('token');
    console.log('checking valid ',username,token);
    this.get('passwordReset').checkToken(username,token)
    .then(()=>{
      this.set('hasValidToken',true);
    }).catch(()=>{
      this.set('hasValidToken',false);
    });
  },
  validatePasswords: function() {
    return new RSVP.Promise((resolve, reject) => {
      let { password, passwordAgain } = this.getProperties('password', 'passwordAgain');
      if(!password || !passwordAgain)
      {
        reject("please provide correct info");
      }
      if(password != passwordAgain)
      {
        reject("passwords do not match");
      }
      resolve();
    });
  },
  actions: {
    resetPassword() {
      let password = this.get('password');
      this.validatePasswords().then(() => {
        let username = this.get('username');
        let token = this.get('token');
        this.get('passwordReset').updatePassword(username, token, password)
        .then(()=> {
          this.set('resetMessage','Password updated successfuly');
        }).catch((err) => {
          this.set('resetMessage', 'Error:' + err.responseText);
        });
      }).catch((err) => {
        this.set('resetMessage', 'Error:' + err.responseText);
      });
    }
  }
});
