import Route from '@ember/routing/route';
import { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';

export default Route.extend({
  sessionAccount:inject('session-account'),
  cs:inject('console'),
  setupController: function(controller, model){
    this._super(controller, model);
    if(controller)
    {
      this.get('cs').log('setupController document', model.docs.query.filter.sortBy)
      controller.send('updateSelectedFilter', model.docs.query.filter.sortBy);
      controller.send('flashResults')
    }
  },
  model(params) {
    return new RSVP.Promise((resolve, reject)=> {
      let currentUserId = this.get('sessionAccount').currentUserId;
      let currentUserName = this.get('sessionAccount').currentUserName;
      this.get('cs').log('document model', currentUserId, currentUserName, params.sort);
      const sort = params.sort ? params.sort : 'views';
      const search = params.search ? params.search : ' ';
      let filter = {
        filter:{
          search:search,
          page:params.page,
          currentUser:currentUserId,
          sortBy:sort
        }
      }
      if(isEmpty(currentUserId))
      {
        if(!isEmpty(currentUserName))
        {
          this.get('cs').log('has name but doesnt have currentUserId',currentUserName)
          this.get('sessionAccount').getUserFromName().then(()=>{
            this.get('sessionAccount').updateOwnedDocuments().then(()=>{
              filter.filter.currentUser = this.get('sessionAccount').currentUserId;
              this.get('cs').log('document model got id',filter.filter.currentUser);
              this.get('store').query('document', filter).then((res)=> {
                resolve({docs:res, filter:filter.filter});
              })
            }).catch((err)=> {
              this.get('cs').log('updateOwnedDocuments',err);
            })
          }).catch((err)=> {
            this.get('cs').log('error getUserFromName',err);
            filter.filter.currentUser = '';
            this.get('store').query('document', filter).then((res)=> {
              resolve({docs:res, filter:filter.filter});
            }).catch((err)=>{
              this.get('cs').log('error query',err);
              reject(err);
            });
          });
        }
        else
        {
          this.get('sessionAccount').updateOwnedDocuments().then(()=>{
            this.get('store').query('document', filter).then((res)=> {
              resolve({docs:res, filter:filter.filter});
            }).catch((err)=>reject(err));
          }).catch((err)=>reject(err));
        }
      }
      else if (!isEmpty(currentUserName))
      {
        this.get('store').query('document', filter).then((res)=> {
          resolve({docs:res, filter:filter.filter});
        }).catch((err)=>reject(err));
      }
      else
      {
        filter.filter.currentUser = '';
        this.get('store').query('document', filter).then((res)=> {
          this.get('cs').log('c')
          resolve({docs:res, filter:filter.filter});
        });
      }
    }).catch((err)=>reject(err));;
  },
  actions: {
    error(error, transition) {
      this.get('cs').log('ERROR transitioning document route', error);
      const err = error.errors ? error.errors :error;
      if(error)
      {
        if (err.status === '404') {
            this.get('cs').log('ERROR 404');
            this.replaceWith('application');
        } else {
          return true;
        }
      }
    }
  }
});
