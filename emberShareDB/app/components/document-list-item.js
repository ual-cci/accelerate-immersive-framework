import Component from '@ember/component';
import { inject }  from '@ember/service';

export default Component.extend({
  document:null,
  documentService:inject('documents'),
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
