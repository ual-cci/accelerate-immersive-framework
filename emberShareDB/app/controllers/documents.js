import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { computed } from '@ember/object';

export default Controller.extend({
  store:inject(),
  session:inject('session'),
  message:"",
  docName:"",
  isPrivate:true,
  page:0,
  feedbackMessage: null,
  sessionAccount: inject('session-account'),
  canGoBack:computed('page', function() {
    return this.get('page') > 0;
  }),
  canGoForwards:computed('model', function() {
    return this.get('model').length >= 20;
  }),
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
        console.log("new doc created", documents, response);
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
  updateResults()
  {
    let searchTerm = this.get('searchTerm');
    if(!searchTerm)
    {
      searchTerm = " ";
    }
    this.transitionToRoute('documents', searchTerm, this.get('page'));
    this.set('message',"Results");
  },
  getDefaultSource:function()
  {
    return "<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body></html>"
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
        this._makeNewDoc(docName, isPrivate, this.getDefaultSource(), null);
      }
    },
    search() {
      this.set('page',0);
      this.updateResults();
    },
    nextPage() {
      this.incrementProperty('page');
      this.updateResults();
    },
    prevPage() {
      this.decrementProperty('page');
      this.updateResults();
    },
  }
});
