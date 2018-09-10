import Component from '@ember/component';
import { inject }  from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  document:null,
  documentService:inject('documents'),
  store:inject('store'),
  sessionAccount:inject('session-account'),
  canEdit:computed('document', function() {
    return this.get('sessionAccount').currentUserName == this.get('document').owner;
  }),
  doPlay:computed('document', function() {
    return !this.get('document').dontPlay;
  }),
  index:0,
  actions: {
    open() {
      this.get('onOpen')(this.get('document').documentId);
    },
    delete() {
      this.get('onDelete')(this.get('document').documentId);
    },
    toggleDontPlay() {
      const docId = this.get('document').documentId;
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        console.log("hehre");
        const toggled = !doc.data.dontPlay;
        const op = {p:["dontPlay"], oi:toggled ? "true":"false"}
        this.get('documentService').submitOp(op, docId);
      }).catch((err) => {
        console.log("ERROR", err);
      });
    }
  }
});
