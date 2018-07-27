import Component from '@ember/component';
import { inject }  from '@ember/service';
import { computed } from '@ember/object';

export default Component.extend({
  document:null,
  documentService:inject('documents'),
  sessionAccount:inject('session-account'),
  canEdit:computed('document', function() {
    console.log(this.get('sessionAccount').currentUserName, this.get('document').owner)
    return this.get('sessionAccount').currentUserName == this.get('document').owner;
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
      this.get('documentService').toggleDontPlay((this.get('document').documentId));
    }
  }
});
