import Component from '@ember/component';
import { inject } from '@ember/service';

export default Component.extend({
  documentService:inject('documents'),
  tabs:[],
  actions:{
    createNewDocument() {
      const parent = this.get('parent');
      const name = "newTab" + this.get('tabs').length;
      this.get('documentService').makeNewDoc(name, true, "", null, parent.id)
      .then((doc)=> {
        this.get('onCreate')(doc.documentId)
      }).catch((error) => {
        console.log(error);
      });
    }
  }
});
