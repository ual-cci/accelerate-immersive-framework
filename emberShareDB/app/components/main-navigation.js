import { inject } from '@ember/service';
import Component from '@ember/component';

export default Component.extend({
  session: inject('session'),
  sessionAccount: inject('session-account'),
  docName:"",
  isPrivate:true,
  feedbackMessage: null,
  actions: {
    login() {
      this.sendAction('onLogin');
    },
    logout() {
      this.get('session').invalidate();
    },
    checkboxClicked() {
      this.toggleProperty('isPrivate');
    },
    createNewDoc() {
      let docName = this.get('docName');
      let isPrivate = this.get('isPrivate');
      let currentUser = this.get('sessionAccount').currentUserName;
      if(docName.length > 1)
      {
        docName = docName.replace(/\s/g, "-");
        console.log('sendingAction', 'onNewDoc', docName, isPrivate, currentUser);
        this.get('onNewDoc')(docName, isPrivate, currentUser);
      }
    }
  }
});
