import Route from '@ember/routing/route';
import {inject} from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';

export default Route.extend({
  sessionAccount:inject("session-account"),
  cs:inject('console'),
  setupController: function(controller, model){
    this._super(controller, model);
    if(controller)
    {
      console.log("setupController document", model.query.filter.sortBy)
      controller.send('updateSelectedFilter', model.query.filter.sortBy);
    }
  },
  model(params) {
    let currentUserId = this.get('sessionAccount').currentUserId;
    let currentUserName = this.get('sessionAccount').currentUserName;
    console.log("document model", currentUserId, currentUserName, params.sort);
    //controller.send('updateSelectedFilter');
    const sort = params.sort ? params.sort : "views";
    let filter = {
      filter:{
        search:params.search,
        page:params.page,
        currentUser:currentUserId,
        sortBy:params.sort
      }
    }
    if(isEmpty(currentUserId))
    {
      if(!isEmpty(currentUserName))
      {
        console.log("has name but doesnt have currentUserId",currentUserName)
        return new RSVP.Promise((resolve, reject)=> {
          this.get('sessionAccount').getUserFromName().then(()=>{
            this.get('sessionAccount').updateOwnedDocuments().then(()=>{
              filter.filter.currentUser = this.get('sessionAccount').currentUserId;
              console.log("document model got id",filter.filter.currentUser);
              this.get('store').query('document', filter).then((res)=> {
                resolve(res);
              })
            }).catch((err)=> {
              console.log('updateOwnedDocuments',err);
            })
          }).catch((err)=> {
            console.log('error getUserFromName',err);
            filter.filter.currentUser = "";
            this.get('store').query('document', filter).then((res)=> {
              resolve(res);
            }).catch((err)=>{
              console.log('error query',err);
              reject(err);
            });
          });
        });
      }
      else {
        return new RSVP.Promise((resolve, reject) => {
          this.get('sessionAccount').updateOwnedDocuments().then(()=>{
            this.get('store').query('document', filter).then((res)=> {
              resolve(res);
            }).catch((err)=>reject(err));
          }).catch((err)=>reject(err));
        });
      }
    }
    else if (!isEmpty(currentUserName))
    {
      return this.get('store').query('document', filter);
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
