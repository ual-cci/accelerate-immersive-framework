import Controller from '@ember/controller';
import { inject } from '@ember/service';
import EmberObject, { computed } from '@ember/object';

export default Controller.extend({
  message:"",
  store:inject(),
  session:inject('session'),
  docName:"",
  isPrivate:true,
  feedbackMessage: null,
  sessionAccount: inject('session-account'),
  hasNoDocuments:computed('model', function() {
    return this.get('model').length == 0;
  }),
  _makeNewDoc(docName, isPrivate, source, forkedFrom) {
    const currentUser = this.get('sessionAccount').currentUserName;
    let doc = this.get('store').createRecord('document', {
      source:source,
      owner:currentUser,
      isPrivate:isPrivate,
      name:docName,
      documentId:null,
      forkedFrom:forkedFrom
    });
    doc.save().then((response)=>{
      this.get('store').query('document', {
        filter: {search: currentUser, page: 0, currentUser:currentUser}
      }).then((documents) => {
        console.log("new doc created",documents);
        this.get('sessionAccount').updateOwnedDocuments();
        this.transitionToRoute('code-editor',documents.firstObject.documentId);
      });
      this.set('feedbackMessage',"Document created successfully");
    }).catch((err)=>{
      doc.deleteRecord();
      this.get('sessionAccount').updateOwnedDocuments();
      this.set('feedbackMessage',err.errors[0]);
    });
  },
  actions: {
    openDocument(documentId) {
      this.transitionToRoute("code-editor", documentId);
    },
    checkboxClicked() {
      this.toggleProperty('isPrivate');
    },
    createNewDocument() {
      let docName = this.get('docName');
      docName = docName.replace(/\s/g, "-");
      const isPrivate = this.get('isPrivate');
      if(docName.length > 1)
      {
        this._makeNewDoc(docName, isPrivate, null, null);
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
