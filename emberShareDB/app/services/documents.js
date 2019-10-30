import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';
import { isEmpty } from '@ember/utils';

export default Service.extend({
  assetService: inject('assets'),
  store: inject('store'),
  sessionAccount:inject('session-account'),
  codeParser:inject('code-parsing'),
  cs:inject('console'),
  getDefaultSource() {
    return "<!DOCTYPE html>\n<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body>\n</html>"
  },
  makeNewDoc(data, forkedFrom = null, parent = null) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('cs').log("making doc");
      const currentUser = this.get('sessionAccount').currentUserName;
      const currentUserId = this.get('sessionAccount').currentUserId;
      let doc = this.get('store').createRecord('document', {
        source:data.source,
        owner:currentUser,
        ownerId:currentUserId,
        isPrivate:data.isPrivate,
        name:data.name,
        documentId:null,
        forkedFrom:forkedFrom,
        parent:parent,
        tags:data.tags,
        assets:data.assets,
        assetQuota:data.assetQuota
      });
      doc.save().then((response)=>{
        this.get('cs').log("saved new doc");
        if(!isEmpty(parent))
        {
          this.get('cs').log("NOT A PARENT, updating parent with myself as a child");
          this.get('store').findRecord('document', parent, { reload: true }).then((parentDoc) => {
            let children = parentDoc.data.children;
            children.push(response.id);
            this.get('cs').log("updating", parent, children)
            this.updateDoc(parent, "children", children).then(()=> {
              resolve(response);
            }).catch((err)=>{this.get('cs').log(err)});
          }).catch((err)=>{this.get('cs').log(err)});
        }
        else
        {
          resolve(response);
        }
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
        this.get('cs').log("found record, making copy of parent", doc.data);
        let newData = doc.data;
        newData.name = "Fork of " + doc.data.name;
        this.makeNewDoc(newData, docId, null).then((newDoc)=> {
          const makeChildren = async (c) => {
            for(const child of c) {
              this.get('cs').log("making copy of child", child.data);
              await this.makeNewDoc(child.data, docId, newDoc.id);
            }
            this.get('cs').log("completed forking root + children");
            resolve(newDoc);
          };

          makeChildren(children);

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
    //this.get('cs').log("updateDoc",docId, field, value)
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        if(!isEmpty(doc) &&  !(doc.get('isDestroyed') || doc.get('isDestroying')))
        {
          //this.get('cs').log("got doc, setting field", field, value)
          doc.set(field, value);
          doc.save().then((newDoc)=> {
            //this.get('cs').log("updated", field, "successfully to", value);
            resolve(newDoc);
          }).catch((err)=>{
            this.get('cs').log("documentservice, updateDoc1", err);
            reject(err)
          });
        }
        else
        {
          this.get('cs').log("failed to find doc")
          reject();
        }
      }).catch((err)=>{
        this.get('cs').log("documentservice, updateDoc2", err);
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
        let actions = doc.data.assets.map((a)=>{return this.get('assetService').deleteAsset(a.name, docId)});
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
          url: config.serverHost + "/flagDoc" + params,
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
        return new RSVP.Promise((res, rej) => {
          this.get('store').findRecord('document', docId).then((doc)=>res(doc)).catch((err)=>rej(err));
        })
      }
      let actions = childrenIds.map(fetch);
      Promise.all(actions).then((children) =>  {
        fetch(children[0].data.parent).then((parent)=> {
          resolve({children:children, parent:parent});
        }).catch((err)=>resolve(children));
      }).catch((err)=>reject(err));
    });
  },
  getCombinedSource(docId, replaceAssets = false, mainText, savedVals)
  {
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId)
      .then((doc) => {
        this.getChildren(doc.data.children).then((childDocs)=> {
          if(isEmpty(mainText))
          {
            mainText = doc.data.source;
          }
          if(isEmpty(savedVals))
          {
            savedVals = doc.data.savedVals;
          }
          let combined = this.get('codeParser').insertChildren(mainText, childDocs.children, doc.data.assets);
          combined = this.get('codeParser').insertStatefullCallbacks(combined, savedVals);
          combined = this.get('codeParser').insertDatasetId(combined, docId);
          if(replaceAssets)
          {
            this.get('cs').log("doc service", docId)
            this.get('codeParser').replaceAssets(combined, doc.data.assets, docId)
            .then((withAssets)=> {
              resolve(withAssets)
            })
          }
          else
          {
            resolve(combined);
          }
        });
      }).catch((err)=>reject(err));
    });
  }
});
