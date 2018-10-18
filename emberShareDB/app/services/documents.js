import Service, { inject } from '@ember/service';
import config from  '../config/environment';
import RSVP from 'rsvp';
import { isEmpty } from '@ember/utils';
import { run } from '@ember/runloop';

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
      run(()=> {
        this.get('cs').log("making doc");
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
          assets:data.assets,
        });
        doc.save().then((newDoc)=>{
          this.get('cs').log("saved new doc");
          if(!isEmpty(parent))
          {
            this.updateParentWithSelf(parent, newDoc)
            .then(()=>resolve(newDoc)).catch((err)=>reject(err));
          }
          else
          {
            resolve(newDoc);
          }
        }).catch((err)=>{
          this.get('cs').log("error creating record");
          doc.deleteRecord();
          this.get('sessionAccount').updateOwnedDocuments();
          reject("error creating document, are you signed in?");
        });
      });
    });
  },
  updateParentWithSelf(parent, newDoc) {
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
        this.get('cs').log("I AM A CHILD, updating parent with myself");
        this.get('store').findRecord('document', parent, { reload: true })
        .then((parentDoc) => {
          this.get('cs').log(parentDoc.data);
          let children = parentDoc.data.children;
          children.push(newDoc.id);
          this.updateDoc(parent, "children", children)
          .then(resolve(newDoc)).catch((err)=>reject(err));
        }).catch((err)=>reject(err));
      });
    });
  },
  forkDoc(docId, children) {
    this.get('cs').log("forking", docId, children);
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
        this.get('store').findRecord('document', docId).then((doc) => {
          this.get('cs').log("found record, making copy of parent", doc.data);
          this.makeNewDoc(doc.data, docId, null).then((newDoc)=> {
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
    });
  },
  submitOp(op, doc) {
    if(isEmpty(doc))
    {
      doc = this.get('sessionAccount').currentDoc;
    }
    const token = "Bearer " + this.get('sessionAccount').bearerToken;
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
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
    });
  },
  updateDoc(docId, field, value) {
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
        this.get('store').findRecord('document', docId)
        .then((doc) => {
          if(!isEmpty(doc) &&  !(doc.get('isDestroyed') || doc.get('isDestroying')))
          {
            doc.set(field, value);
            doc.save().then((newDoc)=> {
              resolve(newDoc);
            }).catch((err)=>{
              this.get('cs').log(err);
              reject(err)
            });
          }
          else
          {
            reject();
          }
        }).catch((err)=>{
          this.get('cs').log(err);
          reject(err)
        });
      });
    });
  },
  getPopularTags(limit) {
    return new RSVP.Promise((resolve, reject) => {
      if(isEmpty(limit))
      {
        limit = 5;
      }
      run(()=> {
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
    });
  },
  deleteDoc(docId) {
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
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
    });
  },
  flagDoc() {
    const doc = this.get('sessionAccount').currentDoc;
    const user = this.get('sessionAccount').currentUserName;
    const token = "Bearer " + this.get('sessionAccount').bearerToken;
    const params = "?user=" + user + "&documentId=" + doc;
    this.get('cs').log('flagging doc', { user: user , documentId: doc})
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
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
    });
  },
  getChildren(childrenIds) {
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
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
    });
  },
  getCombinedSource(docId, replaceAssets = false, mainText)
  {
    return new RSVP.Promise((resolve, reject) => {
      run(()=> {
        this.get('store').findRecord('document', docId)
        .then((doc) => {
          this.getChildren(doc.data.children).then((childDocs)=> {
            if(isEmpty(mainText))
            {
              mainText = doc.data.source;
            }
            let combined = this.get('codeParser').insertChildren(mainText, childDocs.children, doc.data.assets);
            if(replaceAssets)
            {
              combined = this.get('codeParser').replaceAssets(combined, doc.data.assets);
            }
            combined = this.get('codeParser').insertStatefullCallbacks(combined, doc.data.savedVals);
            resolve(combined);
          });
        }).catch((err)=>reject(err));
      });
    });
  }
});
