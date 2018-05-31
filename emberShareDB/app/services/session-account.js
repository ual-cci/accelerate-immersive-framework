import RSVP from 'rsvp';
import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  session: inject('session'),
  store: inject(),
  loadCurrentUser() {
    return new RSVP.Promise((resolve, reject) => {
      const accountId = this.get('session.data.authenticated.account_id');
      console.log('accountID',accountId);
      if (!isEmpty(accountId)) {
        this.get('store').find('account', accountId).then((account) => {
          this.set('account', account);
          console.log('setting account to ', account);
          resolve();
        }, reject);
      } else {
        console.log('accountID empty, resolving');
        resolve();
      }
    });
  }
});
