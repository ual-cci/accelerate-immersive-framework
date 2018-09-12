import Route from '@ember/routing/route';
import {inject} from '@ember/service';

export default Route.extend({
  sessionAccount:inject("session-account"),
  cs:inject('console'),
  model(params) {
    let currentUser = this.get('sessionAccount').currentUserName;
    if(!currentUser)
    {
      currentUser = "";
    }
    const sort = params.sort ? params.sort : "views";
    const filter = {
      filter:{
        search:params.search,
        page:params.page,
        currentUser:currentUser,
        sortBy:params.sort
      }
    }
    this.get('cs').log('reloading document model');
    return this.get('store').query('document', filter);
  },
  actions: {
    error(error, transition) {
      this.get('cs').log("ERROR transitioning document route", error);
      const err = error.errors ? error.errors :error;
      if(error)
      {
        if (err.status === '404') {
            this.get('cs').log("ERROR 404");
            this.replaceWith('application');
        } else {
          return true;
        }
      }
    }
  }
});
