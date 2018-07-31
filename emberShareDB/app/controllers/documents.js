import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Controller.extend({
  store:inject(),
  session:inject('session'),
  documentService: inject('documents'),
  message:"",
  docName:"",
  isPrivate:true,
  feedbackMessage: "",
  sort:"views",
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
  tags:computed('model', function() {
    this.get('documentService').getPopularTags(5)
    .then((results) => {
      this.set('tags', results.data);
    });
    return [];
  }),
  updateResults()
  {
    let searchTerm = this.get('searchTerm');
    if(isEmpty(searchTerm))
    {
      searchTerm = " ";
    }
    this.transitionToRoute('documents', searchTerm, this.get('page'), this.get('sort'));
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
    deleteDocument(documentId) {
      this.get('documentService').deleteDoc(documentId)
      .then(() => {
        console.log("deleted, updating results");
        this.set('message',"deleted");
        this.set('searchTerm', "deleted");
        this.updateResults();
      }).catch((err) => {
        this.set('feedbackMessage',err.errors[0]);
      });
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
        this.get('documentService').makeNewDoc(docName,
          isPrivate,
          this.getDefaultSource(),
          null)
          .then(() => {
            console.log("new doc created");
            const currentUser = this.get('sessionAccount').currentUserName;
            this.get('store').query('document', {
              filter: {search: docName,
                page: 0,
                currentUser: currentUser,
                sortBy: 'date'}
            }).then((documents) => {
              console.log("new doc found, transitioning", documents);
              this.get('sessionAccount').updateOwnedDocuments();
              this.transitionToRoute('code-editor', documents.firstObject.documentId);
            });
          }).catch((err) => {
            console.log("error making doc", err);
            this.set('feedbackMessage', err);
          });
      }
      else
      {
        this.set('feedbackMessage', 'Please enter a name');
      }
    },
    search() {
      this.set('page', 0);
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
    recent() {
      this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "date");
      this.updateResults();
    },
    popular() {
      this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "views");
      this.updateResults();
    },
    forked() {
      this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "forks");
      this.updateResults();
    },
    editted() {
      this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "edits");
      this.updateResults();
    },
    updated() {
      this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "updated");
      this.updateResults();
    },
    tag(tag) {
      this.set('searchTerm', tag);
      this.set('page', 0);
      this.set('sort', "views");
      this.updateResults();
    }
  }
});
