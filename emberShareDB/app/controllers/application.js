import Controller from '@ember/controller';
import { inject } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  actions: {
    store: inject(),
    feedbackMessage: null,
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    createNewDocument(docName, isPrivate, currentUser) {
      console.log('attepmting to create new doc:', docName, isPrivate, currentUser);
      let doc = this.get('store').createRecord('document', {
        source:'<some code>',
        owner:currentUser,
        public:!isPrivate,
        name:docName,
        documentId:"",
      });
      doc.save().then((response)=>{
        console.log("Document created successfully",response);
        this.get('store').query('document', {
          filter: {
            owner: currentUser
          }
        }).then((documents) => {
          console.log(documents.firstObject.documentId);
          this.transitionToRoute('code-editor',documents.firstObject.documentId);
        });
        this.set('feedbackMessage',"Document created successfully");
      }).catch((err)=>{
        console.log("Error creating document");
        doc.deleteRecord();
        this.set('feedbackMessage',err.errors[0]);
      });
    },
  }
});
