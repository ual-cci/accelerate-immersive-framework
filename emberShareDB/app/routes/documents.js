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
    console.log(filter);
    return this.get('store').query('document', filter);
  }
});
