import RSVP from 'rsvp';
import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import config from  '../config/environment';

export default Service.extend({
  session: inject('session'),
  store: inject(),
  cs:inject('console'),
  currentUserName:"",
  currentUserId:null,
  bearerToken:"",
  currentDoc:"",
  ownedDocuments:null,
  updateOwnedDocuments() {
    return new RSVP.Promise((resolve, reject) => {
      let currentUser = this.get('currentUserName');
      if(!currentUser)
      {
        currentUser = "";
      }
      let userID = this.get('currentUserId');
      const filter = {
        filter:{search:currentUser, page:0, currentUser:userID, sortBy:"date"}
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
      $.ajax({
          type: "GET",
          url: config.serverHost + "/accounts",
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
          data:{username:username}
        }).then((res) => {
          this.set("currentUserId", res.data.attr.accountId);
          resolve(res);
        }).catch((err) => {
          reject(err);
        });
    });
  },
  loadCurrentUser() {
    return new RSVP.Promise((resolve, reject) => {
      //console.log(this.get('session.data'))
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
