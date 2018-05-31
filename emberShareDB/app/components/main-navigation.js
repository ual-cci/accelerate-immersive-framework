import { inject } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  docName:"",
  isPrivate:true,
  actions: {
    login() {
      this.sendAction('onLogin');
    },
    logout() {
      this.get('session').invalidate();
    },
    checkboxClicked() {
      this.toggleProperty('isPrivate');
    // do all the other things
    },
    createNewDoc() {
      let docName = this.get('docName');
      let isPrivate = this.get('isPrivate');
      console.log('sendingAction', 'onNewDoc', docName, isPrivate);
      this.sendAction('onNewDoc', "name of a doc", true);
    }
  }
});
