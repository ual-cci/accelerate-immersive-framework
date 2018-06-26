import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { computed } from '@ember/object';
import RSVP from 'rsvp';

export default Controller.extend({
  websockets: inject('websockets'),
  sessionAccount: inject('session-account'),
  assetService: inject('assets'),
  store: inject('store'),
  session:inject('session'),
  codeParser:inject('code-parsing'),
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
  autoRender:false,
  showCode:true,
  isDragging:false,
  startWidth:0,
  startX:0,
  aceW:700,
  aceStyle: Ember.computed('aceW', function() {
    const aceW = this.get('aceW');
    return Ember.String.htmlSafe("width: " + aceW + "px;");
  }),
  preloadAssets(self) {
    const doc = self.get('doc');
    if(!isEmpty(doc.data.assets))
    {
      self.get('assetService').preloadAssets(doc.data.assets).then(()=> {
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
    console.log("updating iframe");
    const doc = self.get('doc');
    let toRender = doc.data.source;
    toRender = self.get('codeParser').replaceAssets(toRender, self.get('model').assets);
    toRender = self.get('codeParser').insertStatefullCallbacks(toRender, doc.data.savedVals);
    //console.log("output", toRender);
    self.set('renderedSource', toRender);
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
      doc.submitOp(op);
      if(this.get('autoRender'))
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
    this.addWindowListener(this);
  },
  addWindowListener(self) {
    var eventMethod = window.addEventListener
			? "addEventListener"
			: "attachEvent";
  	var eventer = window[eventMethod];
  	var messageEvent = eventMethod === "attachEvent"
  		? "onmessage"
  		: "message";
  	eventer(messageEvent, function(e) {
      self.handleWindowEvent(e,self)
    });
  },
  removeWindowListener() {
    var eventMethod = window.removeEventListener
      ? "removeEventListener"
      : "detachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === "detachEvent"
  		? "onmessage"
  		: "message";
      eventer(messageEvent, function(e) {
        self.handleWindowEvent(e,self)
      });
  },
  handleWindowEvent(e, self) {
    if (e.origin === config.localOrigin)
    {
      const doc = self.get('doc');
      let savedVals = doc.data.savedVals;
      savedVals[e.data[0]] = e.data[1];
      self.set('surpress', true);
      doc.submitOp({p:['savedVals'],oi:savedVals},{source:true});
      self.set('surpress', false);
    }
  },
  initDoc() {
    const con = this.get('connection');
    const doc = con.get(config.contentDBName,this.get('model').id);
    console.log("setting doc",this.get('model').id);
    const editor = this.get('editor');
    const session = editor.getSession();
    doc.subscribe((err) => {
      if (err) throw err;
      if(!isEmpty(doc.data))
      {
        this.set('doc', doc);
        this.setCanEditDoc();
        console.log("read only?",!this.get('canEditDoc'));
        console.log(doc.data);
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
        const deltas = this.get('codeParser').opTransform(ops, editor);
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
        let fn = (asset)=>
        {
          return this.get('assetService').deleteAsset(asset.fileId)
        }
        var actions = doc.data.assets.map(fn);
        Promise.all(actions).then(()=> {
          doc.del([],(err)=>{
            console.log("deleted doc");
            this.get('sessionAccount').updateOwnedDocuments();
            this.transitionToRoute('application');
          });
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
      this.set('renderedSource',"");
      this.get('doc').destroy();
      this.removeWindowListener();
    },
    refresh() {
      console.log('refreshing');
      const doc = this.get('doc');
      if(!isEmpty(doc))
      {
        this.set('renderedSource',"");
        this.get('doc').destroy();
        this.initDoc();
      }
    },
    mouseDown(e) {
      this.set('isDragging', true);
      const startWidth = document.querySelector('.ace-container').clientWidth;
      const startX = e.clientX;
      this.set('startWidth', startWidth);
      this.set('startX', startX);
      let overlay = document.querySelector('.output-container');
      overlay.style["pointer-events"] = "auto";
    },
    mouseUp(e) {
      this.set('isDragging', false);
      let overlay = document.querySelector('.output-container');
      overlay.style["pointer-events"] = "none";
    },
    mouseMove(e) {
      if(this.get('isDragging'))
      {
        this.set('aceW',(this.get('startWidth') - e.clientX + this.get('startX')));
      }
    },
    hideCode() {
      var hide = ()=> {
        let aceW = this.get('aceW')
        if(aceW > 0.0)
        {
          setTimeout(()=> {
            this.set('aceW',Math.max(0.0,aceW-10));
            hide();
          },2);
        }
        else
        {
          this.set('showCode',false);
        }
      }
      hide();
    },
    showCode() {
      var show = ()=> {
        let aceW = this.get('aceW')
        if(aceW < 700)
        {
          setTimeout(()=> {
            this.set('aceW',Math.min(700,aceW+10));
            show();
          },2);
        }
        else
        {
          this.set('showCode',true);
        }
      }
      show();
    },
    forkDocument() {
      const currentUser = this.get('sessionAccount').currentUserName;
      const doc = this.get('doc');
      let newDoc = this.get('store').createRecord('document', {
        source:doc.data.source,
        owner:currentUser,
        isPrivate:doc.data.isPrivate,
        name:doc.data.name,
        documentId:null,
        forkedFrom:doc.id,
        assets:doc.data.assets,
        tags:doc.data.tags
      });
      newDoc.save().then((response)=>{
        this.get('store').query('document', {
          filter: {search: currentUser, page: 0, currentUser:currentUser}
        }).then((documents) => {
          console.log("new doc created",documents);
          this.get('sessionAccount').updateOwnedDocuments();
          this.transitionToRoute('code-editor',documents.firstObject.documentId);
        });
        this.set('feedbackMessage',"Document created successfully");
      }).catch((err)=>{
        newDoc.deleteRecord();
        this.get('sessionAccount').updateOwnedDocuments();
        this.set('feedbackMessage',err.errors[0]);
      });
    }
  }
});
