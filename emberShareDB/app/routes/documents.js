import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  sessionAccount:inject("session-account"),
  model(params) {
    let currentUser = this.get('sessionAccount').currentUserName;
    if(!currentUser)
    {
      currentUser = "";
    }
    const filter = {
      filter:{search:params.search,page:params.page,currentUser:currentUser}
    }
    console.log('reloading document model');
    return this.get('store').query('document', filter);
  },
  actions: {
    error(error, transition) {
      console.log("ERROR", error);
      const err = error.errors ? error.errors :error;
      if(error)
      {
        if (err.status === '404') {
            console.log("ERROR 404");
            this.replaceWith('application');
        } else {
          return true;
        }
      }
    }
  }
});
