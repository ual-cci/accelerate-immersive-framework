import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  assetService: inject('assets'),
  store: inject('store'),
  sessionAccount:inject('session-account'),
  cs:inject('console'),
  getDefaultSource() {
    return "<!DOCTYPE html>\n<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body>\n</html>"
  },
  makeNewDoc(docName, isPrivate, source, forkedFrom = "", parent = "") {
    return new RSVP.Promise((resolve, reject) => {
      const currentUser = this.get('sessionAccount').currentUserName;
      let doc = this.get('store').createRecord('document', {
        source:source,
        owner:currentUser,
        isPrivate:isPrivate,
        name:docName,
        documentId:null,
        forkedFrom:forkedFrom,
        parent:parent
      });
      doc.save().then((response)=>{
        this.get('cs').log("saved new doc");
        resolve(doc);
      }).catch((err)=>{
        this.get('cs').log("error creating record");
        doc.deleteRecord();
        this.get('sessionAccount').updateOwnedDocuments();
        reject("error creating document, are you signed in?");
      });
    });
  },
  submitOp(op, doc) {
    if(isEmpty(doc))
    {
      doc = this.get('sessionAccount').currentDoc;
    }
    const token = "Bearer " + this.get('sessionAccount').bearerToken;
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "POST",
          url: config.serverHost + "/submitOp",
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
          data: { op: op , documentId: doc}
        }).then((res) => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
    });
  },
  updateDoc(docId, field, value) {
    this.get('cs').log(field, value)
    return new RSVP.Promise((resolve, reject) => {
      //docId = "a4ba8f3b-ec7e-7678-8fd2-c82f3150d8ea";
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        doc.set(field, value);
        doc.save().then(()=> {
          resolve()
        }).catch((err)=>{
          this.get('cs').log(err);
          reject(err)
        });
      }).catch((err)=>{
        this.get('cs').log(err);
        reject(err)
      });
    });
  },
  getPopularTags(limit) {
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "GET",
          url: config.serverHost + "/tags?limit=" + limit,
        }).then((res) => {
          this.get('cs').log("tags", res);
          resolve(res);
        }).catch((err) => {
          reject(err);
        });
    });
  },
  deleteDoc(docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        let fn = (asset)=>
        {
          return this.get('assetService').deleteAsset(asset.fileId)
        }
        var actions = doc.data.assets.map(fn);
        Promise.all(actions).then(()=> {
          const token = "Bearer " + this.get('sessionAccount').bearerToken;
          this.get('cs').log('deleting doc', docId);
          $.ajax({
              type: "DELETE",
              url: config.serverHost + "/documents/" + docId,
              beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
            }).then((res) => {
              this.get('cs').log('deleted', docId);
              const actions = [
                doc.deleteRecord(),
                this.get('sessionAccount').updateOwnedDocuments()
              ];
              Promise.all(actions).then(resolve).catch(reject);
            }).catch((err) => {
              this.get('cs').log('error deleting', docId);
              reject(err);
            });
        });
      });
    });
  },
  flagDoc() {
    const doc = this.get('sessionAccount').currentDoc;
    const user = this.get('sessionAccount').currentUserName;
    const token = "Bearer " + this.get('sessionAccount').bearerToken;
    const params = "?user=" + user + "&documentId=" + doc;
    this.get('cs').log('flagging doc', { user: user , documentId: doc})
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "GET",
          url: config.serverHost + "/canFlag" + params,
          beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
        }).then((res) => {
          resolve();
        }).catch((err) => {
          reject(err);
        });
    });
  },
  getChildren(childrenIds) {
    return new RSVP.Promise((resolve, reject) => {
      let fetch = (docId) => {
        return new RSVP.Promise((resolve, reject) => {
          this.get('store').findRecord('document', docId).then((doc)=>resolve(doc)).catch((err)=>reject(err));
        })
      }
      let actions = childrenIds.map(fetch);
      Promise.all(actions).then((children) =>  {
        fetch(children[0].data.parent).then((parent)=> {
          resolve({children:children, parent:parent});
        }).catch((err)=>resolve(children));
      }).catch((err)=>reject(err));
    });
  }
});
