import Controller from '@ember/controller';
import { inject } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  actions: {
    store: inject(),
    transitionToLoginRoute() {
      this.transitionToRoute('login');
    },
    createNewDocument(docName, isPrivate) {
      console.log('creating new doc:', docName, isPrivate);
      let doc = this.get('store').createRecord('code-document', {
        source:'<some code>',
        owner:'Louis',
        public:!isPrivate,
        name:docName
      });
      doc.save()
      .then(()=>console.log("doc created"))
      .catch((err)=>console.log(err));
    },
  }
});
