import Controller from '@ember/controller';
import { inject } from '@ember/service';

export default Controller.extend({
  actions: {
    store: inject(),
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    createNewDoc(name, isPrivate) {
      console.log('creating new doc:', name, isPrivate);
      let doc = this.get('store').createRecord('code-document', {
        source:'<some code>',
        owner:'Louis',
        public:false,
        name:'LOUIS'
      });
      doc.save()
      .then(()=>console.log("doc created"))
      .catch((err)=>console.log(err));
      return true;
    },
  }
});
