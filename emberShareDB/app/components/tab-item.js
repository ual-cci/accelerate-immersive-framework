import Component from '@ember/component';

export default Component.extend({
  actions: {
    onSelect() {
      console.log("tab item selected", this.get('id'))
      this.get('onSelect')(this.get('id'));
    },
    onDelete() {
      this.get('onDelete')(this.get('id'));
    }
  }
});
