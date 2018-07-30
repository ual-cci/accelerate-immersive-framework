import Component from '@ember/component';
import { inject }  from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  document:null,
  documentService:inject('documents'),
  store:inject('store'),
  sessionAccount:inject('session-account'),
  canEdit:computed('document', function() {
    console.log(this.get('sessionAccount').currentUserName, this.get('document').owner)
    return this.get('sessionAccount').currentUserName == this.get('document').owner;
  }),
  doPlay:computed('document', function() {
    //console.log("computing dont play", this.get('document').dontPlay);
    return !this.get('document').dontPlay;
  }),
  index:0,
  actions: {
    open() {
      console.log(this.get('document').documentId);
      this.get('onOpen')(this.get('document').documentId);
    },
    delete() {
      this.get('onDelete')(this.get('document').documentId);
    },
    toggleDontPlay() {
      const docId = this.get('document').documentId;
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        doc.toggleProperty('data.dontPlay');
        const op = {p:["dontPlay"], oi:doc.data.dontPlay ? "true":"false"}
        this.get('documentService').submitOp(op, docId);
        console.log(doc.data.dontPlay);
      }).catch((err) => {
        console.log("ERROR", err);
      });
    }
  }
});
