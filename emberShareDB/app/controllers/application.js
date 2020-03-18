import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  store: inject(),
  sessionAccount: inject('session-account'),
  actions: {
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    transitionToDocsRoute() {
      this.transitionToRoute('documents'," ",0,"views");
    },
    transitionToExamplesRoute() {
      this.transitionToRoute('examples');
    },
    transitionToInputsRoute() {
      this.transitionToRoute('inputs');
    },
    transitionToOutputsRoute() {
      this.transitionToRoute('outputs');
    },
    transitionToGuidesRoute() {
      this.transitionToRoute('guides', "root");
    },
    transitionToGSRoute() {
      this.transitionToRoute('getting-started', 'beginner');
    },
    transitionToAboutRoute() {
      this.transitionToRoute('about');
    },
    transitionToTermsRoute() {
      this.transitionToRoute('terms');
    },
    transitionToDoc(doc) {
      this.transitionToRoute('code-editor', doc);
    },
    transitionToUserDocs(user) {
      console.log("GETTING DOCS FOR USER:",user)
      this.transitionToRoute('documents', user, 0, "date");
    },
    transitionToGuide(guide) {
      this.transitionToRoute('guides', guide);
    },
    transitionToNewestDoc() {
      const currentUserId = this.get('sessionAccount').currentUserId;
      this.get('store').query('document', {
        filter: {search: "",
          page: 0,
          currentUser: currentUserId,
          sortBy: 'date'}
      }).then((documents) => {
        this.get('sessionAccount').updateOwnedDocuments();
        this.transitionToRoute('code-editor', documents.firstObject.documentId);
      });
    }
  }
});
