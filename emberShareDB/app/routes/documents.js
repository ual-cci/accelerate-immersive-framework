import Route from '@ember/routing/route';
import {inject} from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';

export default Route.extend({
  sessionAccount:inject("session-account"),
  cs:inject('console'),
  model(params) {
    let currentUserId = this.get('sessionAccount').currentUserId;
    let currentUserName = this.get('sessionAccount').currentUserName;
    const sort = params.sort ? params.sort : "views";
    let filter = {
      filter:{
        search:params.search,
        page:params.page,
        currentUser:currentUserId,
        sortBy:params.sort
      }
    }
    if(isEmpty(currentUserId) && !isEmpty(currentUserName))
    {
      console.log("doesnt have currentUserId")
      return new RSVP.Promise((resolve, reject)=> {
        this.get('sessionAccount').getUserFromName().then(()=>{
          this.get('sessionAccount').updateOwnedDocuments().then(()=>{
            filter.filter.currentUser = this.get('sessionAccount').currentUserId;
            this.get('store').query('document', filter).then((res)=> {
              resolve(res);
            }).catch((err)=>reject(err));
          }).catch((err)=>reject(err));
        }).catch((err)=>reject(err));
      });
    }
    else if (isEmpty(currentUserId) && !isEmpty(currentUserName))
    {
      return RVSP.Promise((resolve, reject) => {
        this.get('sessionAccount').updateOwnedDocuments().then(()=>{
          this.get('store').query('document', filter).then((res)=> {
            resolve(res);
          }).catch((err)=>reject(err));
        }).catch((err)=>reject(err));
      });
    }
    else
    {
      filter.filter.currentUser = "";
      return this.get('store').query('document', filter);
    }
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
