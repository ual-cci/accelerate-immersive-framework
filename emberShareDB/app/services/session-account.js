import RSVP from 'rsvp';
import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import config from  '../config/environment';
import { bind } from '@ember/runloop';

export default Service.extend({
  session: inject('session'),
  uuid: inject(),
  store: inject(),
  cs:inject('console'),
  currentUserName:'',
  currentUserId:null,
  bearerToken:'',
  currentDoc:'',
  ownedDocuments:null,
  getSessionID() {
    if(isEmpty(this.get('sessionID')))
    {
      this.set('sessionID', this.get('uuid').guid())
    }
    return this.get('sessionID')
  },
  updateOwnedDocuments() {
    return new RSVP.Promise((resolve, reject) => {
      let currentUser = this.get('currentUserName');
      if(!currentUser)
      {
        currentUser = '';
      }
      let userID = this.get('currentUserId');
      const filter = {
        filter:{search:currentUser, page:0, currentUser:userID, sortBy:'updated'}
      }
      this.get('store').query('document', filter).then((results) => {
        var myDocs = results.map(function(doc){
             return {id:doc.get('id'), name:doc.get('name')};
         });
        this.set('ownedDocuments',myDocs);
        resolve();
      }).catch((err)=> {
        reject(err);
      });
    });
  },
  getUserFromName() {
    return new RSVP.Promise((resolve, reject) => {
      const username = this.get('currentUserName');
      const token = this.get('bearerToken');
      this.get('cs').log('getUserFromName')
      $.ajax({
          type: 'GET',
          url: config.serverHost + '/accounts',
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
          data:{username:username}
        }).then(bind((res) => {
          this.get('cs').log('USERID', res.data.attr.accountId)
          this.set('currentUserId', res.data.attr.accountId);
          resolve(res);
        })).catch(bind((err) => {
          this.get('cs').log(err)
          reject(err);
        }));
    });
  },
  loadCurrentUser() {
    return new RSVP.Promise((resolve, reject) => {
      this.get('cs').log(this.get('session.data'))
      const currentUserName = this.get('session.data.authenticated.user_id');
      this.set('bearerToken', this.get('session.data.authenticated.access_token'));
      if (!isEmpty(currentUserName)) {
        this.set('currentUserName', currentUserName);
        resolve();
      } else {
        this.get('cs').log('currentUserName empty, rejecting');
        reject();
      }
    });
  }
});
