import Component from '@ember/component';
import { inject } from '@ember/service';

export default Component.extend({
  documentService:inject('documents'),
  didReceiveAttrs() {
    this._super(...arguments);
    const parent = this.get('parent');
  },
  actions:{
    createNewDocument() {
      const parent = this.get('parent');
      this.get('documentService').makeNewDoc("newTab", true, "", "", parent.id)
      .then((doc)=> {
        this.get('onCreate')(doc.documentId)
      }).catch((error) => {
        console.log(error);
      });
    }
  }
});
