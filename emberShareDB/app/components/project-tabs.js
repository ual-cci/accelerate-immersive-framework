import Component from '@ember/component';
import { inject } from '@ember/service';

export default Component.extend({
  documentService:inject('documents'),
  tabs:[],
  actions:{
    createNewDocument() {
      const parent = this.get('parent');
      const name = "newTab" + this.get('tabs').length;
      const data = {name:name, isPrivate:true, source:""}
      this.get('documentService').makeNewDoc(data, null, parent.id)
      .then((doc)=> {
        this.get('onCreate')(doc.documentId)
      }).catch((error) => {
        console.log(error);
      });
    }
  }
});
