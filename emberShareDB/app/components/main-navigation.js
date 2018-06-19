import { inject } from '@ember/service';
import Component from '@ember/component';
import { computed } from '@ember/object';
export default Component.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  store: inject('store'),
  didInsertElement() {
    this.updateOwnedDocs();
  },
  updateOwnedDocs() {
    let currentUser = this.get('sessionAccount').currentUserName;
    if(!currentUser)
    {
      currentUser = "";
    }
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
  actions: {
    login() {
      this.sendAction('onLogin');
      this.updateOwnedDocs();
    },
    logout() {
      this.get('session').invalidate();
      this.updateOwnedDocs();
    },
    home() {
      this.sendAction('onHome')
    },
    openDoc(doc){
      console.log(doc);
      this.get('openDoc')(doc);
    }
  }
});
