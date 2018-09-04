import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/template';
import { computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import RSVP from 'rsvp';

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
  opsPlayer: inject('ops-player'),

  //Parameters
  con: null,
  doc: null,
  editor: null,
  suppress: false,
  codeTimer: new Date(),
  renderedSource:"",
  isNotEdittingDocName:true,
  canEditDoc:false,
  isOwner:false,
  allowDocDelete:false,
  allowAssetDelete:false,
  assetToDelete:"",
  autoRender:false,
  collapsed: true,
  showShare:false,
  showAssets:false,
  showPreview:false,
  showTokens:false,
  showOpPlayer:false,
  showCodeOptions:false,
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
  editCtr:0,
  fontSize:14,
  fetchingDoc:false,
  droppedOps:[],

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
  initShareDB: function() {
    console.log('initShareDB')
    this.initWebSockets();
    this.initAceEditor();
    this.addWindowListener();
    this.initUI();
  },
  initUI: function() {
    this.set('allowDocDelete', false);
    this.set('allowAssetDelete', false);
    this.set('showAssets', false);
    this.set('showPreview', false);
    this.set('collapsed', true);
    this.set('showShare', false);
    this.set('showTokens', false);
    this.set('showOpPlayer', false);
    this.set('showCodeOptions', false);
    const embed = this.get('embed') == "true";
    $("#mimic-navbar").css("display", embed ? "none" : "block");
    if(embed)
    {
      this.set('displayEditor', !embed);
      this.set('showName', !embed);
    }
  },
  initAceEditor: function() {
    const editor = this.get('editor');
    const session = editor.getSession();
    editor.commands.addCommand({
      name: "executeLines",
      exec: ()=>{
        this.updateIFrame( true)
      },
      bindKey: {mac: "shift-enter", win: "shift-enter"}
    });
    editor.commands.addCommand({
      name: "pause",
      exec: ()=>{
        console.log("pause")
        this.set('renderedSource', "");
      },
      bindKey: {mac: "cmd-.", win: "ctrl-."}
    });
    editor.commands.addCommand({
      name: "zoom-in",
      exec: ()=>{
        this.zoomIn();
      },
      bindKey: {mac: "cmd-=", win: "ctrl-="}
    });
    editor.commands.addCommand({
      name: "zoom-out",
      exec: ()=>{
        this.zoomOut();
      },
      bindKey: {mac: "cmd--", win: "ctrl--"}
    });
    session.on('change',(delta)=>{
      this.onSessionChange( delta);
    });
    session.setMode("ace/mode/html");
  },
  initWebSockets: function() {
    let socket = this.get('socket');
    console.log("init websockets", socket);
    if(!isEmpty(socket) && socket.state == 1)
    {
      socket.onclose = ()=> {
        console.log("websocket closed");
        this.set('socket', null);
        this.initWebSockets();
      }
      socket.close();
    }
    else
    {
      try {
        socket = new WebSocket(config.wsHost);
        this.set('socket', socket);
        socket.onopen = () => {
          console.log("web socket open");
          this.set('wsAvailable', true);
          if(!this.get('fetchingDoc'))
          {
            this.initDoc();
          }
        }

        socket.onerror = () => {
          console.log("web socket error");
          this.set('wsAvailable', false);
          if(!this.get('fetchingDoc'))
          {
            this.initDoc();
          }
        }

        socket.onclose = () =>  {
          console.log("web socket close");
          this.set('wsAvailable', false);
          if(!this.get('fetchingDoc'))
          {
            this.initDoc();
          }
        }

        socket.onmessage = (event) =>  {
          console.log("web socket message", event);
        }
      }
      catch (err)
      {
        console.log("web sockets not available");
        this.set('wsAvailable', false);
        if(!this.get('fetchingDoc'))
        {
          this.initDoc();
        }
      }
    }
  },
  initDoc: function() {
    console.log("init doc");
    this.set('fetchingDoc', true);
    this.get('opsPlayer').reset();
    if(this.get('wsAvailable'))
    {
      const socket = this.get('socket');
      let con = this.get('connection');
      if(isEmpty(con))
      {
        console.log('connecting to ShareDB');
        con = new ShareDB.Connection(socket);
      }
      if(isEmpty(con) || con.state == "disconnected")
      {
        console.log("failed to connect to ShareDB", con);
        this.set('wsAvailable', false);
        this.fetchDoc();
      }
      this.set('connection', con);
      const doc = con.get(config.contentCollectionName,this.get('model').id);
      const editor = this.get('editor');
      const session = editor.getSession();

      doc.subscribe((err) => {
        if (err) throw err;
        console.log("subscribed to doc");
        if(!isEmpty(doc.data))
        {
          this.set('doc', doc);
          this.didReceiveDoc();
        }
      });
      doc.on('op', (ops,source) => {this.didReceiveOp(ops, source)});
    }
    else
    {
      this.fetchDoc();
    }
  },
  fetchDoc() {
    this.get('store').findRecord('document',this.get('model').id).then((doc) => {
      console.log("found record", doc.data);
      this.set('doc', doc);
      this.didReceiveDoc();
    });
  },
  didReceiveOp: function (ops,source) {
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
        this.preloadAssets();
      }
      else if (!source && ops[0].p[0] == "newEval")
      {
        document.getElementById("output-iframe").contentWindow.eval(ops[0].oi);
      }
    }
  },
  didReceiveDoc: function() {
    const doc = this.get('doc');
    const editor = this.get('editor');
    const session = editor.getSession();
    this.set('surpress', true);
    session.setValue(doc.data.source);
    this.set('surpress', false);
    this.set('savedVals', doc.data.savedVals);
    console.log("did receive doc");
    this.setCanEditDoc();
    let stats = doc.data.stats ? doc.data.stats : {views:0,forks:0,edits:0};
    stats.views = parseInt(stats.views) + 1;
    this.submitOp({p:['stats'],oi:stats},{source:true});
    editor.setReadOnly(!this.get('canEditDoc'));
    this.preloadAssets();
    this.get('sessionAccount').set('currentDoc',this.get('model').id);
    this.set('fetchingDoc', false);
  },
  submitOp: function(op, retry = 0)
  {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('doc');
      const MAX_RETRIES = 5;
      if(this.get('droppedOps').length > 0) {
        return reject();
      }

      if(this.get('wsAvailable'))
      {
        doc.submitOp(op, (err) => {
          if(err)
          {
            if(retry < MAX_RETRIES)
            {
              this.submitOp(op, retry + 1);
            }
            else
            {
              this.get('droppedOps').push(op);
            }
            reject(err);
          }
          else
          {
            console.log("did sumbit op",op);
            resolve();
          }
        });
      }
      else
      {
        this.get('documentService').submitOp(op)
        .then(() => {
          console.log("did sumbit op",op);
          resolve();
        }).catch((err) => {
          console.log("ERROR Not submitted");
          if(retry < MAX_RETRIES)
          {
            this.submitOp(op, retry + 1);
          }
          else
          {
            this.get('droppedOps').push(op);
          }
          reject(err);
        });
      }
    });
  },
  zoomIn: function() {
    const editor = this.get("editor");
    this.incrementProperty('fontSize');
    editor.setFontSize(this.get('fontSize'));
  },
  zoomOut: function() {
    const editor = this.get("editor");
    this.decrementProperty('fontSize');
    if(this.get('fontSize') < 1)
    {
      this.set('fontSize', 1);
    }
    editor.setFontSize(this.get('fontSize'));
  },
  doPlay: function() {
    const doc = this.get('doc');
    const embed = this.get('embed') == "true";
    const displayEditor = this.get('displayEditor');
    if(embed || !displayEditor) {
      return true;
    }
    return doc.data.dontPlay === "false" || !doc.data.dontPlay;
  },
  preloadAssets: function() {
    const doc = this.get('doc');
    if(!isEmpty(doc.data.assets))
    {
      this.get('assetService').preloadAssets(doc.data.assets).then(()=> {
        if(this.doPlay())
        {
          this.updateIFrame();
        }
      });
    }
    else
    {
      console.log("no assets to preload", this.doPlay());
      if(this.doPlay())
      {
        console.log("DO PLAY");
        this.updateIFrame();
      }
    }
  },
  getSelectedText: function()
  {
    const editor = this.get('editor');
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
  updateIFrame: function(selection = false) {
    //console.log("updating iframe");
    this.updateSavedVals();
    const savedVals = this.get('savedVals');
    const doc = this.get('doc');
    const editor = this.get('editor');
    const mainText = this.get('wsAvailable') ? doc.data.source : editor.session.getValue();
    let toRender = selection ? this.getSelectedText() : mainText;
    toRender = this.get('codeParser').replaceAssets(toRender, this.get('model').assets);
    toRender = this.get('codeParser').insertStatefullCallbacks(toRender, savedVals);
    //console.log(toRender);
    if(selection)
    {
      this.submitOp( {p:['newEval'],oi:toRender},{source:true});
      document.getElementById("output-iframe").contentWindow.eval(toRender);
    }
    else
    {
      this.set('renderedSource', toRender);
    }
  },
  autoExecuteCode: function() {
    if(this.get('codeTimer'))
    {
      clearTimeout(this.get('codeTimer'));
    }
    this.set('codeTimer', setTimeout(() => {
      this.updateIFrame();
      this.set('codeTimer',null);
    },1500));
  },
  onSessionChange:function(delta) {
    const surpress = this.get('surpress');
    const doc = this.get('doc');
    if(!surpress)
    {
      const editor = this.editor;
      const session = editor.getSession();

      this.incrementProperty('editCtr');

      if(!this.get('opsPlayer').atHead())
      {
        console.log("not at head");
        this.submitOp({p: ["source", 0], sd: doc.data.source});
        this.submitOp({p: ["source", 0], si: session.getValue()});
      }
      this.get('opsPlayer').reset();

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
      this.submitOp(op);
      if(this.get('autoRender'))
      {
        this.autoExecuteCode();
      }
    }
  },
  addWindowListener: function() {
    this.removeWindowListener();
    var eventMethod = window.addEventListener ? "addEventListener":"attachEvent";
  	var eventer = window[eventMethod];
  	var messageEvent = eventMethod === "attachEvent" ? "onmessage":"message";
  	eventer(messageEvent, (e) => {
      this.handleWindowEvent(e)
    });
  },
  removeWindowListener: function() {
    var eventMethod = window.removeEventListener ? "removeEventListener":"detachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod === "detachEvent"? "onmessage":"message";
    eventer(messageEvent, (e) => {
      this.handleWindowEvent(e)
    });
  },
  handleWindowEvent: function(e) {
    const embed = this.get('embed') == "true";
    if (e.origin === config.localOrigin && !embed)
    {
      const doc = this.get('doc');
      let savedVals = this.get('savedVals');
      savedVals[e.data[0]] = e.data[1];
      this.set('savedVals', savedVals);
    }
  },
  setCanEditDoc: function() {
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
  deleteCurrentDocument: function() {
    const doc = this.get('doc');
    this.get('documentService').deleteDoc(doc.id)
    .then(() => {
      this.transitionToRoute('application');
    }).catch((err) => {
      console.log("error deleting doc");
    });
  },
  skipOp:function(prev, rewind = false) {
    const editor = this.get('editor');
    const doc = this.get('doc').id;
    const fn = (deltas) => {
      this.set('surpress', true);
      editor.session.getDocument().applyDeltas(deltas);
      this.set('surpress', false);
    }
    if(prev)
    {
      this.get('opsPlayer').prevOp(editor, rewind)
      .then((deltas)=>{fn(deltas)});
    }
    else
    {
      this.get('opsPlayer').nextOp(editor, rewind)
      .then((deltas)=>{fn(deltas)});
    }
  },
  getDefaultSource: function()
  {
    return "<html>\n<head>\n</head>\n<body>\n<script language=\"javascript\" type=\"text/javascript\">\n\n</script>\n</body></html>"
  },
  updateSavedVals: function()
  {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('doc');
      const savedVals = this.get('savedVals');
      console.log('updatingSavedVals, doc',doc,'savedVals', savedVals)
      if(isEmpty(savedVals))
      {
        resolve();
      }
      else
      {
        const vals = Object.keys(savedVals).map(key => savedVals[key]);
        const hasVals = vals.length > 0;
        console.log('vals', vals);
        if(hasVals)
        {
          this.submitOp({p:['savedVals'],oi:savedVals})
          .then(() => {
            resolve();
          }).catch((err) => {
            reject(err)
          });
        }
        else
        {
          resolve();
        }
      }
    });
  },
  updateEditStats: function() {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('doc');
      let stats = doc.data.stats ? doc.data.stats : {views:0,forks:0,edits:0};
      stats.edits = parseInt(stats.edits) + this.get('editCtr');
      const actions = [
        this.submitOp({p:['stats'], oi:stats}, {source:true}),
        this.submitOp({p:['lastEdited'], oi:new Date()}, {source:true})
      ];
      Promise.all(actions).then(()=> {
        this.set('editCtr', 0);
        resolve();
      }).catch((err) => {
        reject(err);
      });
    });
  },
  refreshDoc: function() {
    const doc = this.get('doc');
    console.log('refreshing', doc);
    if(!isEmpty(doc))
    {
      console.log('refreshing doc not empty', doc);
      const fn = () => {
        this.get('opsPlayer').reset();
        this.set('renderedSource',"");
        if(this.get('wsAvailable'))
        {
          doc.destroy();
        }
        this.set('doc', null);
        if(!isEmpty(this.get('editor')))
        {
          this.initDoc();
        }
      };
      const actions = [this.updateEditStats(), this.updateSavedVals()];
      Promise.all(actions).then(() => {fn();}).catch(()=>{fn();});
    }
  },
  showFeedback: function(msg) {
    this.set('feedbackMessage', msg);
    setTimeout(() => {
      this.set('feedbackMessage', null);
    },5000)
  },
  pauseOps: function() {
    if(this.get('opsInterval'))
    {
      clearInterval(this.get('opsInterval'));
    }
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      console.log('editor ready')
      this.initShareDB();
    },

    //Doc properties
    tagsChanged(tags) {
      const doc = this.get('doc');
      this.submitOp({p:['tags'],oi:tags},{source:true});
    },
    doEditDocName() {
      if(this.get('canEditDoc'))
      {
        this.set('isNotEdittingDocName', false);
        scheduleOnce('afterRender',  function() {
          $('#doc-name-input').focus();
        });
      }
    },
    endEdittingDocName() {
      this.set('isNotEdittingDocName', true);
      const doc = this.get('doc');
      const newName = this.get('model').name;
      this.submitOp({p:['name'],oi:newName},{source:true});
    },
    deleteDoc() {
      if(this.get('canEditDoc'))
      {
        this.deleteCurrentDocument();
      }
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
          this.submitOp( {p:['flags'],oi:flags},{source:true});
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
      let stats = doc.data.stats ? doc.data.stats : {views:0,forks:0,edits:0};
      stats.forks = parseInt(stats.forks) + 1;
      this.submitOp( {p:['stats'],oi:stats},{source:true});
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
          filter: {search: currentUser, page: 0, currentUser:currentUser, sortBy:'date'}
        }).then((documents) => {
          console.log("new doc created", response, documents);
          this.get('sessionAccount').updateOwnedDocuments();
          this.transitionToRoute('code-editor',documents.firstObject.documentId);
        });
        this.showFeedback("Here is your very own new copy!");
      }).catch((err)=>{
        newDoc.deleteRecord();
        this.get('sessionAccount').updateOwnedDocuments();
        this.set('feedbackMessage',err.errors[0]);
      });
    },

    //Assets
    assetError(err) {
      $("#asset-progress").css("display", "none");
      alert("Error"+err);
    },
    assetProgress(e) {
      console.log("assetProgress", e);
      if(parseInt(e.percent) < 100)
      {
        $("#asset-progress").css("display", "block");
        $("#asset-progress").css("width", (parseInt(e.percent)/2)+"vw");
      }
      else
      {
        $("#asset-progress").css("display", "none");
      }
    },
    assetUploaded(e) {
      console.log("assetComplete", e);
      $("#asset-progress").css("display", "none");
      if(!this.get('wsAvailable'))
      {
        this.refreshDoc();
      }
    },
    deleteAsset()
    {
      if(this.get('canEditDoc'))
      {
        this.get('assetService').deleteAsset(this.get('assetToDelete'))
        .then(()=> {
          console.log('deleted asset', this.get('assetToDelete'));
          this.set('assetToDelete',"");
          this.toggleProperty('allowAssetDelete');
          if(!this.get('wsAvailable'))
          {
            this.refreshDoc();
          }
        }).catch((err)=>{
          console.log('ERROR deleting asset', err, this.get('assetToDelete'));
        });
      }
    },
    previewAsset(asset)
    {
      var url = config.serverHost + "/asset/"+asset.fileId;
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

    //SHOW AND HIDE MENUS
    togglePrivacy() {
      if(this.get('canEditDoc'))
      {
        let doc = this.get('doc');
        doc.data.isPrivate = !doc.data.isPrivate;
        this.set('doc', doc);
        this.submitOp( {p:['isPrivate'],oi:doc.data.isPrivate},{source:true});
      }
    },
    toggleReadOnly() {
      if(this.get('canEditDoc'))
      {
        let doc = this.get('doc');
        doc.data.readOnly = !doc.data.readOnly;
        this.set('doc', doc);
        this.submitOp( {p:['readOnly'],oi:doc.data.readOnly},{source:true});
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
    toggleAutoRender() {
      this.toggleProperty('autoRender');
    },
    toggleShowShare() {
      this.toggleProperty('showShare');
    },
    toggleShowCodeOptions() {
      this.toggleProperty('showCodeOptions');
    },
    toggleShowTokens() {
      this.toggleProperty('showTokens');
    },
    toggleShowOpPlayer() {
      this.toggleProperty('showOpPlayer');
    },
    toggleShowAssets() {
      this.toggleProperty('showAssets');
    },
    enterFullscreen() {
      var target = document.getElementById("output-iframe");
      if (target.requestFullscreen) {
        target.requestFullscreen();
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen();
      } else if (target.mozRequestFullScreen) {
        target.mozRequestFullScreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
      }
    },

    //TIDYING UP ON EXIT / REFRESH
    cleanUp() {
      console.log('cleaning up');
      const fn = () => {
        this.set('renderedSource',"");
        this.set('droppedOps', []);
        if(this.get('wsAvailable'))
        {
          this.get('socket').onclose = ()=> {
            this.get('socket').onclose = null;
            this.get('socket').onopen = null;
            this.get('socket').onmessage = null;
            this.get('socket').onerror = null;
            this.set('socket', null);
            this.set('connection', null)
            console.log("websocket closed");
          };
          this.get('doc').destroy();
          this.get('socket').close();
        }
        console.log('cleaned up');
        this.set('doc', null);
        this.removeWindowListener();
      }
      const actions = [this.updateEditStats(), this.updateSavedVals()];
      Promise.all(actions).then(() => {fn();}).catch(()=>{fn();});
    },
    refresh() {
      this.refreshDoc();
    },

    //MOUSE LISTENERS
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

    //OPERATIONS ON CODE
    renderCode() {
      this.updateIFrame();
    },
    pauseCode() {
      this.set('renderedSource', "");
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

    //OP PLAYBACK
    skipOp(prev) {
      this.skipOp(prev);
    },
    rewindOps() {
      this.set('surpress', true);
      this.get('editor').session.setValue("");
      this.set('renderedSource', "");
      this.set('surpress', false);
      this.skipOp(false, true);
    },
    playOps() {
      this.pauseOps();
      this.set('opsInterval', setInterval(()=> {
        if(!this.get('opsPlayer').reachedEnd)
        {
          this.skipOp(false);
        }
        else
        {
          clearInterval(this.get('opsInterval'));
        }
      }, 100));
    },
    pauseOps() {
      this.pauseOps();
    },
    zoomOut() {
      this.zoomOut();
    },
    zoomIn() {
      this.zoomIn();
    }
  }
});
