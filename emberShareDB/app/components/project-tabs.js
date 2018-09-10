import Component from '@ember/component';
import { inject } from '@ember/service';

export default Component.extend({
  documentService:inject('documents'),
  actions:{
    createNewDocument() {
      const parent = this.get('parent');
      console.log("parent", parent);
      this.get('documentService').makeNewDoc("newTab", true, "", null, parent)
      .then((doc)=> {
        this.get('onCreate')(doc.documentId)
      }).catch((error) => {
        console.log(error);
      });
    },
    tabSelected(index) {

    }
  }
});
