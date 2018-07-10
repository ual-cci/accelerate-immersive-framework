import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/template';
import { computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';

export default Controller.extend({
  //Query Params
  queryParams:["hideEditor","embed"],

  //Services
  websockets: inject('websockets'),
  sessionAccount: inject('session-account'),
  assetService: inject('assets'),
  store: inject('store'),
  session:inject('session'),
  codeParser:inject('code-parsing'),
  modalsManager: inject('modalsManager'),
  documentService: inject('documents'),

  //Parameters
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
  showShare:false,
  showAssets:false,
  showPreview:false,
  showTokens:false,
  isShowingCode:true,
  isDragging:false,
  startWidth:0,
  startX:0,
  aceW:700,
  savedVals:null,
  hideEditor:'false',
  embed:'false',
  showName:true,
  wsAvailable:true,

  //Computed parameters
  aceStyle: computed('aceW','displayEditor', function() {
    const aceW = this.get('aceW');
    const displayEditor = this.get('displayEditor');
    const display = displayEditor ? "inline" : "none"
    return htmlSafe("width: " + aceW + "px; display: " + display + ";");
  }),
  displayEditor: computed('hideEditor', function() {
    return this.get('hideEditor') != "true";
  }),
  editLink: computed('model', function() {
    return config.localOrigin + "/code/" + this.get('model').id;
  }),
  embedLink: computed('editLink', function() {
    return this.get('editLink') + "?embed=true";
  }),
  displayLink: computed('editLink', function() {
    return this.get('editLink') + "?hideEditor=true";
  }),

  //Functions
  initShareDB() {
    try {
      const socket = new WebSocket(config.wsHost);
      const con = new ShareDB.Connection(socket);
      this.set('socketRef', socket);
      this.set('connection', con);
    }
    catch (err)
    {
      this.set('wsAvailable', false);
    }

    const editor = this.get('editor');
    const session = editor.getSession();
    editor.commands.addCommand({
      name: "executeLines",
      exec: ()=>{
        this.updateIFrame(this, true)
      },
      bindKey: {mac: "shift-enter", win: "shift-enter"}
    })
    session.on('change',(delta)=>{
      this.onSessionChange(this, delta);
    });
    session.setMode("ace/mode/html");
    this.initDoc();
    this.addWindowListener(this);

    this.set('allowDocDelete', false);
    this.set('allowAssetDelete', false);
    this.set('showAssets', false);
    this.set('showPreview', false);
    this.set('collapsed', false);
    this.set('showShare', false);
    this.set('showTokens', false);
    const embed = this.get('embed') == "true";
    $("#mimic-navbar").css("display", embed ? "none" : "block");
    if(embed)
    {
      this.set('displayEditor', !embed);
      this.set('showName', !embed);
    }
  },
  initDoc() {
    if(this.get('wsAvailable'))
    {
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
          this.didReceiveDoc();
        }
      });
      doc.on('op',(ops,source) => {
        const embed = this.get('embed') == "true";
        if(!embed && ops.length > 0)
        {
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
          else if (!source && ops[0].p[0] == "newEval")
          {
            console.log(ops[0]);
            document.getElementById("output-iframe").contentWindow.eval(ops[0].oi);
          }
        }
      });
    }
    else
    {
      this.get('store').findRecord('document',this.get('model').id).then((doc) => {
        console.log(doc.data);
        this.set('doc',doc);
        this.didReceiveDoc();
      });
    }
  },
  didReceiveDoc() {
    const doc = this.get('doc');
    const editor = this.get('editor');
    const session = editor.getSession();
    this.set('savedVals', doc.data.savedVals);
    this.setCanEditDoc();
    this.set('surpress', true);
    let stats = doc.data.stats ? doc.data.stats : {views:0,forks:0};
    stats.views = parseInt(stats.views) + 1;
    this.submitOp(this,{p:['stats'],oi:stats},{source:true});
    this.set('surpress', false);
    editor.setReadOnly(!this.get('canEditDoc'));
    this.preloadAssets(this);
    this.get('sessionAccount').set('currentDoc',this.get('model').id);
    this.set('surpress', true);
    session.setValue(doc.data.source);
    this.set('surpress', false);
  },
  submitOp(self, op)
  {
    const doc = self.get('doc');
    if(self.get('wsAvailable'))
    {
      doc.submitOp(op);
    }
    else
    {
      this.get('documentService').submitOp(op)
      .then(()=> {
        console.log("submitted");
      }).catch(()=> {
        console.log("ERROR Not submitted");
      });
    }
  },
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
  updateSavedVals(self)
  {
    const doc = self.get('doc');
    const savedVals = self.get('savedVals');
    const vals = Object.keys(savedVals).map(key => savedVals[key]);
    const hasVals = vals.length > 0;
    try {
      if(hasVals)
      {
        self.set('surpress', true);
        self.submitOp(self, {p:['savedVals'],oi:savedVals},{source:true});
        self.set('surpress', false);
      }
    } catch (err)
    {
      console.log(err);
    }

  },
  getSelectedText(self)
  {
    const editor = self.get('editor');
    let selectionRange = editor.getSelectionRange();
    if(selectionRange.start.row == selectionRange.end.row &&
      selectionRange.start.column == selectionRange.end.column)
      {
        selectionRange.start.column = 0;
        selectionRange.end.column = editor.session.getLine(selectionRange.start.row).length;
      }
    const content = editor.session.getTextRange(selectionRange);
    return content;
  },
  updateIFrame(self, selection = false) {
    self.updateSavedVals(self);
    const savedVals = self.get('savedVals');
    const doc = self.get('doc');
    let toRender = selection ? self.getSelectedText(self) : doc.data.source;
    toRender = self.get('codeParser').replaceAssets(toRender, self.get('model').assets);
    toRender = self.get('codeParser').insertStatefullCallbacks(toRender, savedVals);
    if(selection)
    {
      this.set('surpress', true);
      self.submitOp(self, {p:['newEval'],oi:toRender},{source:true});
      this.set('surpress', false);
      document.getElementById("output-iframe").contentWindow.eval(toRender);
    }
    else
    {
      self.set('renderedSource', toRender);
    }
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
      self.submitOp(self, {p:['lastEdited'],oi:new Date()},{source:true});
      this.set('surpress', false);

      const editor = self.editor;
      const session = editor.getSession();
      const aceDoc = session.getDocument();
      const op = {};
      const start = aceDoc.positionToIndex(delta.start);
      op.p = ['source',parseInt(start)];
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
      self.submitOp(self, op);
      if(this.get('autoRender'))
      {
        this.autoExecuteCode(self);
      }
    }
  },
  addWindowListener(self) {
    var eventMethod = window.addEventListener ? "addEventListener":"attachEvent";
  	var eventer = window[eventMethod];
  	var messageEvent = eventMethod === "attachEvent" ? "onmessage":"message";
  	eventer(messageEvent, function(e) {
      self.handleWindowEvent(e,self)
    });
  },
  removeWindowListener() {
    var eventMethod = window.removeEventListener ? "removeEventListener":"detachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === "detachEvent"? "onmessage":"message";
    eventer(messageEvent, function(e) {
      self.handleWindowEvent(e,self)
    });
  },
  handleWindowEvent(e, self) {
    const embed = this.get('embed') == "true";
    if (e.origin === config.localOrigin && !embed)
    {
      const doc = self.get('doc');
      let savedVals = this.get('savedVals');
      savedVals[e.data[0]] = e.data[1];
      this.set('savedVals', savedVals);
    }
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
    this.set('canEditDoc', this.get('displayEditor'));
  },
  deleteCurrentDocument() {
    const doc = this.get('doc');
    let fn = (asset)=>
    {
      return this.get('assetService').deleteAsset(asset.fileId)
    }
    var actions = doc.data.assets.map(fn);
    Promise.all(actions).then(()=> {
      doc.del([],(err)=>{
        console.log("deleted doc",err);
        this.get('sessionAccount').updateOwnedDocuments();
        this.transitionToRoute('application');
      });
    });
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      this.initShareDB();
    },
    tagsChanged(tags) {
      const doc = this.get('doc');
      this.set('surpress', true);
      this.submitOp(this, {p:['tags'],oi:tags},{source:true});
      this.set('surpress', false);
    },
    doEditDocName() {
      if(this.get('canEditDoc'))
      {
        this.set('isNotEdittingDocName', false);
        scheduleOnce('afterRender', this, function() {
          $('#doc-name-input').focus();
        });
      }
    },
    endEdittingDocName() {
      this.set('isNotEdittingDocName', true);
      const doc = this.get('doc');
      const newName = this.get('model').name;
      this.set('surpress', true);
      this.submitOp(this, {p:['name'],oi:newName},{source:true});
      this.set('surpress', false);
    },
    privacyToggled() {
      if(this.get('canEditDoc'))
      {
        this.toggleProperty('model.isPrivate');
        const doc = this.get('doc');
        this.set('surpress', true);
        this.submitOp(this, {p:['isPrivate'],oi:this.get('model.isPrivate')},{source:true});
        this.set('surpress', false);
      }
    },
    readOnlyToggled() {
      if(this.get('canEditDoc'))
      {
        this.toggleProperty('model.readOnly');
        const doc = this.get('doc');
        this.set('surpress', true);
        this.submitOp(this, {p:['readOnly'],oi:this.get('model.readOnly')},{source:true});
        this.set('surpress', false);
      }
    },
    deleteDoc() {
      if(this.get('canEditDoc'))
      {
        this.deleteCurrentDocument();
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
          console.log('ERROR deleting asset', err, this.get('assetToDelete'));
        });
      }
    },
    previewAsset(asset)
    {
      var url = config.serverHost + "/asset/"+asset.fileId;
      console.log(asset.fileType);
      const isImage = asset.fileType.includes("image");
      const isAudio = asset.fileType.includes("audio");
      const isVideo = asset.fileType.includes("video");
      this.get('modalsManager')
        .alert({title: asset.name,
                bodyComponent: 'modal-preview-body',
                assetURL:url,
                assetType:asset.fileType,
                isImage:isImage,
                isAudio:isAudio,
                isVideo:isVideo})
        .then(() => {

        });
      this.toggleProperty('showPreview');
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
    pauseCode() {
      this.set('renderedSource', "");
    },
    toggleAutoRender() {
      this.toggleProperty('autoRender');
    },
    toggleShowShare()
    {
      this.toggleProperty('showShare');
    },
    toggleShowTokens()
    {
      this.toggleProperty('showTokens');
    },
    toggleShowAssets()
    {
      this.toggleProperty('showAssets');
    },
    cleanUp() {
      this.updateSavedVals(this);
      this.set('renderedSource',"");
      if(this.get('wsAvailable'))
      {
        this.get('doc').destroy();
      }
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
      //console.log('mouseDown',e.target);
      this.set('isDragging', true);
      const startWidth = document.querySelector('.ace-container').clientWidth;
      const startX = e.clientX;
      this.set('startWidth', startWidth);
      this.set('startX', startX);
      let overlay = document.querySelector('#output-iframe');
      overlay.style["pointer-events"] = "none";
      let overlay2 = document.querySelector('.output-container');
      overlay2.style["pointer-events"] = "auto";
    },
    mouseUp(e) {
      //console.log('mouseup',e.target);
      this.set('isDragging', false);
      let overlay = document.querySelector('#output-iframe');
      overlay.style["pointer-events"] = "auto";
      let overlay2 = document.querySelector('.output-container');
      overlay2.style["pointer-events"] = "none";
    },
    mouseMove(e) {
      if(this.get('isDragging'))
      {
        //console.log('mouseMove',e.target);
        this.set('aceW',(this.get('startWidth') - e.clientX + this.get('startX')));
      }
    },
    hideCode() {
      var hide = ()=> {
        let aceW = this.get('aceW')
        if(aceW > 0.0)
        {
          setTimeout(()=> {
            this.set('aceW', Math.max(0.0, aceW - 10));
            hide();
          }, 2);
        }
        else
        {
          this.set('isShowingCode', false);
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
            this.set('aceW', Math.min(700, aceW + 10));
            show();
          }, 2);
        }
        else
        {
          this.set('isShowingCode',true);
        }
      }
      show();
    },
    download() {
      this.get('assetService').zip();
    },
    flagDocument() {
      this.get('documentService').flagDoc()
      .then(()=> {
        const doc = this.get('doc');
        let flags = parseInt(doc.data.flags);
        if(flags < 2)
        {
          flags = flags + 1;
          this.set('surpress', true);
          this.submitOp(this, {p:['flags'],oi:flags},{source:true});
          this.set('surpress', false);
        }
        else
        {
          this.deleteCurrentDocument();
        }
      }).catch((err) => {
        alert("Already flagged");
      });
    },
    forkDocument() {
      const currentUser = this.get('sessionAccount').currentUserName;
      const doc = this.get('doc');
      this.set('surpress', true);
      let stats = doc.data.stats ? doc.data.stats : {views:0,forks:0};
      stats.forks = parseInt(stats.forks) + 1;
      this.submitOp(this, {p:['stats'],oi:stats},{source:true});
      this.set('surpress', false);
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
          console.log("new doc created", response, documents);
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
