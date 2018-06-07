import Controller from '@ember/controller';
import { inject } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  message:"",
  store:inject(),
  session:inject('session'),
  docName:"",
  isPrivate:true,
  feedbackMessage: null,
  sessionAccount: inject('session-account'),
  actions: {
    openDocument(documentId) {
      this.transitionToRoute("code-editor", documentId);
    },
    checkboxClicked() {
      this.toggleProperty('isPrivate');
    },
    createNewDocument() {
      let docName = this.get('docName');
      let isPrivate = this.get('isPrivate');
      let currentUser = this.get('sessionAccount').currentUserName;
      if(docName.length > 1)
      {
        docName = docName.replace(/\s/g, "-");
        let doc = this.get('store').createRecord('document', {
          source:'<some code>',
          owner:currentUser,
          isPrivate:isPrivate,
          name:docName,
          documentId:"123",
        });
        doc.save().then((response)=>{
          this.get('store').query('document', {
            filter: {search: currentUser, page: 0}
          }).then((documents) => {
            this.transitionToRoute('code-editor',documents.firstObject.documentId);
          });
          this.set('feedbackMessage',"Document created successfully");
        }).catch((err)=>{
          doc.deleteRecord();
          this.set('feedbackMessage',err.errors[0]);
        });
      }
    },
    search() {
      const searchTerm = this.get('searchTerm');
      if(searchTerm)
      {
        this.transitionToRoute('documents', searchTerm, 0);
        this.set('message',"Results");
      }
      else
      {
          this.set('message',"Type Something!");
      }
    }
  }
});
