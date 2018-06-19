import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';

export default Controller.extend({
  websockets: inject('websockets'),
  sessionAccount: inject('session-account'),
  assetService: inject('assets'),
  store: inject('store'),
  socketRef: null,
  con: null,
  doc: null,
  editor: null,
  suppress: false,
  codeTimer: new Date(),
  renderedSource:"",
  collapsed: true,
  isNotEdittingDocName:true,
  canEditDoc:false,
  isOwner:false,
  allowDocDelete:false,
  allowAssetDelete:false,
  assetToDelete:"",
  autoRender:true,
  myComputed:computed('model', function() {
    console.log('computed',this.get('model'));
  }),
  preloadAssets(self) {
    const doc = self.get('doc');
    if(!isEmpty(doc.data.assets))
    {
      self.get('assetService').preloadAssets(doc.data.assets).then(()=> {
        console.log("completed preloading assets");
        self.updateIFrame(self);
      });
    }
    else
    {
      console.log("no assets to preload");
      self.updateIFrame(self);
    }
  },
  updateIFrame(self) {
    const doc = self.get('doc');
    let toRender = doc.data.source;
    toRender = self.replaceAssets(toRender, self.get('model').assets);
    self.set('renderedSource', toRender);
  },
  replaceAssets(source, assets) {
    for(let i = 0; i < assets.length; i++)
    {
      console.log("replacing instances of:" + assets[i].name);
      const fileId = assets[i].fileId;
      const toFind = assets[i].name;
      const fileType = assets[i].fileType;
      const asset = this.get('store').peekRecord('asset',fileId);
      const b64 = "data:" + fileType + ";charset=utf-8;base64," + asset.b64data;
      source = source.replace(new RegExp(toFind,"gm"),b64);
    }
    return source;
  },
  autoExecuteCode(self) {
    if(self.get('codeTimer'))
    {
      clearTimeout(self.get('codeTimer'));
    }
    self.set('codeTimer', setTimeout(function() {
      self.updateIFrame(self);
      self.set('codeTimer',null);
    },1500));
  },
  opTransform(ops, editor) {
    function opToDelta(op) {
      const index = op.p[op.p.length - 1];
      const session = editor.getSession();
      const pos = session.doc.indexToPosition(index, 0);
      const start = pos;
      let action;
      let lines;
      let end;
      if ('sd' in op) {
        action = 'remove';
        lines = op.sd.split('\n');
        const count = lines.reduce((total, line) => total + line.length, lines.length - 1);
        end = session.doc.indexToPosition(index + count, 0);
      } else if ('si' in op) {
        action = 'insert';
        lines = op.si.split('\n');
        if (lines.length === 1) {
          end = {
            row: start.row,
            column: start.column + op.si.length,
          };
        } else {
          end = {
            row: start.row + (lines.length - 1),
            column: lines[lines.length - 1].length,
          };
        }
      } else {
        throw new Error(`Invalid Operation: ${JSON.stringify(op)}`);
      }
      const delta = {
        start,
        end,
        action,
        lines,
      };
      return delta;
    }
    const deltas = ops.map(opToDelta);
    return deltas;
  },
  onSessionChange(self, delta) {
    const surpress = self.get('surpress');
    const doc = self.get('doc');
    if(!surpress)
    {
      this.set('surpress', true);
      doc.submitOp({p:['lastEdited'],oi:new Date()},{source:true});
      this.set('surpress', false);

      const editor = self.editor;
      const session = editor.getSession();
      const aceDoc = session.getDocument();
      const op = {};
      const start = aceDoc.positionToIndex(delta.start);
      op.p = ['source',start];
      let action;
      if (delta.action === 'insert') {
        action = 'si';
      } else if (delta.action === 'remove') {
        action = 'sd';
      } else {
        throw new Error(`action ${action} not supported`);
      }
      const str = delta.lines.join('\n');
      op[action] = str;
      if(this.get('autoRender'))
      doc.submitOp(op);
      {
        this.autoExecuteCode(self);
      }
    }
  },
  initShareDB() {
    const socket = new WebSocket(config.wsHost);
    const con = new ShareDB.Connection(socket);
    this.set('socketRef', socket);
    this.set('connection', con);
    const editor = this.get('editor');
    const session = editor.getSession();
    session.on('change',(delta)=>{
      this.onSessionChange(this, delta);
    });
    session.setMode("ace/mode/html");
    this.initDoc();
  },
  initDoc() {
    const con = this.get('connection');
    const doc = con.get(config.contentDBName,this.get('model').id);
    this.set('doc', doc);
    console.log("setting doc",this.get('model').id);
    const editor = this.get('editor');
    const session = editor.getSession();
    doc.subscribe((err) => {
      if (err) throw err;
      const doc = this.get('doc');
      if(!isEmpty(doc.data))
      {
        this.setCanEditDoc();
        console.log("read only?",!this.get('canEditDoc'));
        editor.setReadOnly(!this.get('canEditDoc'));
        this.preloadAssets(this);
        this.get('sessionAccount').set('currentDoc',this.get('model').id);
        this.set('surpress', true);
        session.setValue(doc.data.source);
        this.set('surpress', false);
      }
    });
    doc.on('op',(ops,source) => {
      if(!source && ops[0].p[0] == "source")
      {
        this.set('surpress', true);
        const deltas = this.opTransform(ops, editor);
        session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      }
      else if (ops[0].p[0] == "assets")
      {
        this.get('store').findRecord('document',this.get('model').id).then((toChange) => {
          toChange.set('assets',ops[0].oi);
        });
        this.preloadAssets(this);
      }
    });
  },
  setCanEditDoc() {
    const currentUser = this.get('sessionAccount').currentUserName;
    const doc = this.get('doc');
    if(isEmpty(currentUser) || isEmpty(doc.data))
    {
      this.set('canEditDoc', false);
      this.set('isOwner', false);
      return;
    }
    if(currentUser != doc.data.owner)
    {
      this.set('isOwner', false);
      if(doc.data.readOnly)
      {
        this.set('canEditDoc', false);
        return;
      }
    }
    else
    {
      this.set('isOwner', true);
    }
    this.set('canEditDoc', true);
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      this.initShareDB();
    },
    tagsChanged(tags) {
      console.log("tagsChanged", tags);
      const doc = this.get('doc');
      this.set('surpress', true);
      doc.submitOp({p:['tags'],oi:tags},{source:true});
      this.set('surpress', false);
    },
    doEditDocName() {
      console.log('edit doc name');
      if(this.get('canEditDoc'))
      {
        this.set('isNotEdittingDocName', false);
        Ember.run.scheduleOnce('afterRender', this, function() {
          $('#doc-name-input').focus();
        });
      }
    },
    endEdittingDocName() {
      this.set('isNotEdittingDocName', true);
      const doc = this.get('doc');
      const newName = this.get('model').name;
      console.log('endEdittingDocName',newName);
      this.set('surpress', true);
      doc.submitOp({p:['name'],oi:newName},{source:true});
      this.set('surpress', false);
    },
    privacyToggled() {
      if(this.get('canEditDoc'))
      {
        this.toggleProperty('model.isPrivate');
        const doc = this.get('doc');
        this.set('surpress', true);
        doc.submitOp({p:['isPrivate'],oi:this.get('model.isPrivate')},{source:true});
        this.set('surpress', false);
      }
    },
    readOnlyToggled() {
      if(this.get('canEditDoc'))
      {
        this.toggleProperty('model.readOnly');
        const doc = this.get('doc');
        this.set('surpress', true);
        doc.submitOp({p:['readOnly'],oi:this.get('model.readOnly')},{source:true});
        this.set('surpress', false);
      }
    },
    deleteDoc() {
      if(this.get('canEditDoc'))
      {
        const doc = this.get('doc');
        doc.del([],(err)=>{
          console.log(err);
          this.transitionToRoute('documents'," ",0);
        });
      }
    },
    deleteAsset()
    {
      if(this.get('canEditDoc'))
      {
        this.get('assetService').deleteAsset(this.get('assetToDelete'))
        .then(()=> {
          console.log('deleting asset', this.get('assetToDelete'));
          this.set('assetToDelete',"");
          this.toggleProperty('allowAssetDelete');
        }).catch((err)=>{
          console.log('ERROR deleting asset', this.get('assetToDelete'));
        });
      }
    },
    toggleAllowDocDelete() {
      if(this.get('canEditDoc'))
      {
        this.toggleProperty('allowDocDelete');
      }
    },
    toggleAllowAssetDelete(asset) {
      if(this.get('canEditDoc'))
      {
        this.set('assetToDelete',asset);
        this.toggleProperty('allowAssetDelete');
      }
    },
    toggleCollapsed() {
      this.toggleProperty('collapsed');
    },
    renderCode() {
      this.updateIFrame(this);
    },
    toggleAutoRender() {
      this.toggleProperty('autoRender');
    },
    cleanUp() {
      this.get('doc').destroy();
    },
    refresh() {
      console.log('refreshing');
      const doc = this.get('doc');
      if(!isEmpty(doc))
      {
        this.get('doc').destroy();
        this.initDoc();
      }
    }
  }
});
