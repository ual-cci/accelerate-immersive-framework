import Controller from '@ember/controller';
import { inject as service } from '@ember/service';

export default Controller.extend({
  queryParams: ['username','token'],
  passwordReset: service('password-reset'),
  hasValidToken:false,
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
  }
});
