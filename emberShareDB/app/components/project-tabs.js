import Component from '@ember/component';
import { inject } from '@ember/service';
import { computed, set } from '@ember/object';

export default Component.extend({
  documentService:inject('documents'),
  cs: inject('console'),
  didReceiveAttrs() {
    this._super(...arguments);
    this.set('tabs', []);
  },
  actions:{
    createNewDocument() {
      this.get('cs').log("creating new tab", this.get('parent').id)
      const parent = this.get('parent');
      const name = "newTab" + this.get('tabs').length;
      const data = {name:name, isPrivate:true, source:""}
      this.get('documentService').makeNewDoc(data, null, parent.id)
      .then((doc)=> {
        this.get('onCreate')(doc.id)
      }).catch((error) => {
        this.get('cs').log(error);
      });
    }
  }
});
