import RSVP from 'rsvp';
import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  session: inject('session'),
  store: inject(),
  loadCurrentUser() {
    return new RSVP.Promise((resolve, reject) => {
      const currentUserName = this.get('session.data.authenticated.user_id');
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
