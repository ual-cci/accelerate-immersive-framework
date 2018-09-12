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
  makeNewDoc(data, forkedFrom = null, parent = null) {
    return new RSVP.Promise((resolve, reject) => {
      const currentUser = this.get('sessionAccount').currentUserName;
      let doc = this.get('store').createRecord('document', {
        source:data.source,
        owner:currentUser,
        isPrivate:data.isPrivate,
        name:data.name,
        documentId:null,
        forkedFrom:forkedFrom,
        parent:parent,
        tags:data.tags,
        assets:data.assets
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
  forkDoc(docId, children) {
    this.get('cs').log("forking", docId, children);
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId).then((doc) => {
        this.get('cs').log("found record", doc.data);
        this.makeNewDoc(doc.data, docId, null).then((newDoc)=> {
          let actions = children.map((c)=>{
            return this.makeNewDoc(c.data, docId, newDoc.id);
          });
          Promise.all(actions).then(()=>{
            this.get('cs').log("completed forking root + children");
            resolve(newDoc);
          }).catch((err)=>reject(err));
        }).catch((err)=>reject(err));
      }).catch((err)=>reject(err));
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
    return new RSVP.Promise((resolve, reject) => {
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
        this.get('cs').log('deleting doc : ' + doc.data.parent ? "parent" : "child");
        let actions = doc.data.assets.map((a)=>{return this.get('assetService').deleteAsset(a.fileId)});
        actions.concat(doc.data.children.map((c)=>this.deleteDoc(c)));
        Promise.all(actions).then(()=> {
          const token = "Bearer " + this.get('sessionAccount').bearerToken;
          this.get('cs').log("resolved promise (children, assets), deleting from server");
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
      if(childrenIds.length == 0)
      {
        resolve({children:{}, parent:{}});
        return;
      }
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
