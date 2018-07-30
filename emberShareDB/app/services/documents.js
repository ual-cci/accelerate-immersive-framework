import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  assetService: inject('assets'),
  store: inject('store'),
  sessionAccount:inject('session-account'),
  makeNewDoc(docName, isPrivate, source, forkedFrom) {
    return new RSVP.Promise((resolve, reject) => {
      const currentUser = this.get('sessionAccount').currentUserName;
      console.log("current user", currentUser);
      let doc = this.get('store').createRecord('document', {
        source:source,
        owner:currentUser,
        isPrivate:isPrivate,
        name:docName,
        documentId:null,
        forkedFrom:forkedFrom
      });
      doc.save().then((response)=>{
        console.log("saved new doc");
        resolve();
      }).catch((err)=>{
        console.log("error creating record");
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
  toggleDontPlay(docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        // doc.toggleProperty('dontPlay');
        // doc.save();
        const op = {p:["dontPlay"], oi:doc.data.dontPlay ? "true":"false"}
        this.submitOp(op, docId);
        console.log(doc.data.dontPlay);
        resolve();
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
          console.log('deleting doc', docId);
          $.ajax({
              type: "DELETE",
              url: config.serverHost + "/documents/" + docId,
              beforeSend: function(xhr){xhr.setRequestHeader('Authorization', token);},
            }).then((res) => {
              console.log('deleted', docId);
              doc.deleteRecord();
              this.get('sessionAccount').updateOwnedDocuments();
              resolve();
            }).catch((err) => {
              console.log('error deleting', docId);
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
    console.log('flagging doc', { user: user , documentId: doc})
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
  }
});
