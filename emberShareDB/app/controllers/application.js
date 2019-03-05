import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  actions: {
    store: inject(),
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    transitionToDocsRoute() {
      this.transitionToRoute('documents'," ",0,"views");
    },
    transitionToExamplesRoute() {
      this.transitionToRoute('examples');
    },
    transitionToGSRoute() {
      this.transitionToRoute('getting-started');
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
    transitionToGuide(guide) {
      this.transitionToRoute('guides', guide);
    }
  }
});
