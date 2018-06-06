import RSVP from 'rsvp';
import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  session: inject('session'),
  store: inject(),
  currentUserName:"",
  bearerToken:"",
  currentDoc:"",
  loadCurrentUser() {
    return new RSVP.Promise((resolve, reject) => {
      const currentUserName = this.get('session.data.authenticated.user_id');
      this.set('bearerToken', this.get('session.data.authenticated.access_token'));
      console.log('currentUserName',currentUserName);
      if (!isEmpty(currentUserName)) {
        this.set('currentUserName', currentUserName);
        resolve();
      } else {
        console.log('currentUserName empty, rejecting');
        reject();
      }
    });
  }
});
