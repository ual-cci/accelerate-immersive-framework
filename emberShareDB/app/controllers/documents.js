import Controller from '@ember/controller';
import { inject } from '@ember/service';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Controller.extend({
  store:inject(),
  session:inject('session'),
  cs:inject('console'),
  documentService: inject('documents'),
  docName:"",
  isPrivate:true,
  feedbackMessage: "",
  sort:"views",
  page:0,
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
    this.get('documentService').getPopularTags(12)
    .then((results) => {
      this.set('tags', results.data);
    });
    return [];
  }),
  updateResults()
  {
    this.get('sessionAccount').getUserFromName();
    let searchTerm = this.get('searchTerm');
    if(isEmpty(searchTerm))
    {
      searchTerm = " ";
    }
    this.get('cs').log('transitionToRoute', 'documents', searchTerm, this.get('page'), this.get('sort'));
    this.transitionToRoute('documents', searchTerm, this.get('page'), this.get('sort'));
  },
  actions: {
    openDocument(documentId) {
      this.transitionToRoute("code-editor", documentId);
    },
    deleteDocument(documentId) {
      if (confirm('Are you sure you want to delete?')) {
        this.get('documentService').deleteDoc(documentId)
        .then(() => {
          this.get('cs').log("deleted, updating results");
          this.set('searchTerm', this.get('sessionAccount').currentUserName);
          this.updateResults();
        }).catch((err) => {
          this.get('cs').log("error deleting", err);
          this.set('feedbackMessage',err.errors[0]);
        });
      }
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
        const src = this.get('documentService').getDefaultSource();
        const data = {name:docName, isPrivate:isPrivate, source:src}
        this.get('documentService').makeNewDoc(data)
          .then(() => {
            this.get('cs').log("new doc created");
            const currentUserId = this.get('sessionAccount').currentUserId;
            this.get('store').query('document', {
              filter: {search: docName,
                page: 0,
                currentUser: currentUserId,
                sortBy: 'date'}
            }).then((documents) => {
              this.get('cs').log("new doc found, transitioning", documents);
              this.get('sessionAccount').updateOwnedDocuments();
              this.transitionToRoute('code-editor', documents.firstObject.documentId);
            });
          }).catch((err) => {
            this.get('cs').log("error making doc", err);
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
      //this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "date");
      this.updateResults();
    },
    popular() {
      //this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "views");
      this.updateResults();
    },
    forked() {
      //this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "forks");
      this.updateResults();
    },
    editted() {
      //this.set('searchTerm', " ");
      this.set('page', 0);
      this.set('sort', "edits");
      this.updateResults();
    },
    updated() {
      //this.set('searchTerm', " ");
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
