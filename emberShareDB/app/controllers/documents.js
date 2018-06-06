import Controller from '@ember/controller';
import { inject } from '@ember/service';
import RSVP from 'rsvp';

export default Controller.extend({
  message:"",
  actions: {
    search() {
      const searchTerm = this.get('searchTerm');
      if(searchTerm)
      {
        this.transitionToRoute('documents', searchTerm, 0);
        this.set('message',"Results");
      }
      else
      {
          this.set('message',"Type Something!");
      }
    }
  }
});
