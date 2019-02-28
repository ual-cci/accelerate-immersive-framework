import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  actions: {
    store: inject(),
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    transitionToDocRoute() {
      this.transitionToRoute('documents'," ",0,"views");
    },
    transitionToDocsRoute() {
      this.transitionToRoute('documents'," ",0,"views");
    },
    transitionToAboutRoute() {
      this.transitionToRoute('about');
    },
    transitionToTermsRoute() {
      this.transitionToRoute('terms');
    },
    transitionToDoc(doc) {
      this.transitionToRoute('code-editor', doc);
    }
  }
});
