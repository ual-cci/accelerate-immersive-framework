import Component from '@ember/component';

export default Component.extend({
  document:null,
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
      this.get('toggleDontPlay')(this.get('document').documentId);
    }
  }
});
