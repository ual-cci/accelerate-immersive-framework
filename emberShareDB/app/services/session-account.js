import RSVP from 'rsvp';
import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  session: inject('session'),
  store: inject(),
  currentUserName:"",
  bearerToken:"",
  currentDoc:"",
  ownedDocuments:null,
  updateOwnedDocuments() {
    console.log('updateOwnedDocuments');
    let currentUser = this.get('currentUserName');
    if(!currentUser)
    {
      currentUser = "";
    }
    console.log(currentUser);
    const filter = {
      filter:{search:currentUser,page:0,currentUser:currentUser}
    }
    this.get('store').query('document', filter).then((results) => {
      console.log("DOCUMENTS");
      console.log(results.content);
      var myDocs = results.map(function(doc){
           return {id:doc.get('id'), name:doc.get('name')};
       });
      this.set('ownedDocuments',myDocs);
    });
  },
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
