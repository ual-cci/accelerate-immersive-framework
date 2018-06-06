import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  actions: {
    store: inject(),
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    transitionToIndexRoute() {
      this.transitionToRoute('index');
    }
  }
});
