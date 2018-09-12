import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import HTMLHint from 'npm:htmlhint';
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
  cs: inject('console'),

  //Parameters
  con: null,
  children: [],
  parentData: null,
  currentDoc:null,
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
  titleName:"",
  wsAvailable:true,
  editCtr:0,
  fontSize:14,
  fetchingDoc:false,
  droppedOps:[],
  consoleOutput:"",
  tabs:[],

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
    this.get('cs').log('initShareDB')
    this.initWebSockets();
    this.initAceEditor();
    this.addWindowListener();
    this.initUI();
  },
  initUI: function() {
    this.set('collapsed', true);
    this.collapseAllSubMenus();
    const embed = this.get('embed') == "true";
    $("#mimic-navbar").css("display", embed ? "none" : "block");
    if(embed)
    {
      this.set('displayEditor', !embed);
      this.set('showName', !embed);
    }
    this.get('cs').observers.push(this);
  },
  collapseAllSubMenus: function() {
    this.set('allowDocDelete', false);
    this.set('allowAssetDelete', false);
    this.set('showAssets', false);
    this.set('showPreview', false);
    this.set('showShare', false);
    this.set('showTokens', false);
    this.set('showOpPlayer', false);
    this.set('showCodeOptions', false);
  },
  initAceEditor: function() {
    const editor = this.get('editor');
    const session = editor.getSession();

    editor.commands.addCommand({
      name: "executeLines",
      exec: ()=>{
        this.updateIFrame(true)
      },
      bindKey: {mac: "shift-enter", win: "shift-enter"}
    });
    editor.commands.addCommand({
      name: "pause",
      exec: ()=>{
        this.get('cs').logToScreen("pause")
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
    session.setUseWorker(false);
  },
  initWebSockets: function() {
    let socket = this.get('socket');
    this.get('cs').log("init websockets", socket);
    if(!isEmpty(socket) && socket.state == 1)
    {
      socket.onclose = ()=> {
        this.get('cs').log("websocket closed");
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
          this.get('cs').log("web socket open");
          this.set('wsAvailable', true);
          if(!this.get('fetchingDoc'))
          {
            this.selectRootDoc();
          }
        }

        socket.onerror = () => {
          this.get('cs').log("web socket error");
          this.websocketError();
        }

        socket.onclose = () =>  {
          this.get('cs').log("web socket close");
          this.websocketError();
        }

        socket.onmessage = (event) =>  {
          this.get('cs').log("web socket message", event);
        }
      }
      catch (err)
      {
        this.get('cs').log("web sockets not available");
        this.websocketError();
      }
    }
  },
  websocketError: function() {
    this.set('wsAvailable', false);
    if(!this.get('fetchingDoc'))
    {
      this.selectRootDoc();
    }
  },
  newDocSelected: function(docId) {
    return new RSVP.Promise((resolve, reject)=> {
      let doc = this.get('currentDoc');
      this.get('cs').log("newDocSelected", docId);
      if(!isEmpty(doc))
      {
        this.get('cs').log("destroying connection to old doc");
        this.get('opsPlayer').reset();
        if(this.get('wsAvailable'))
        {
          doc.destroy();
        }
        this.set('currentDoc', null);
      }
      this.connectToDoc(docId).then((newDoc)=> {
        this.set('currentDoc', newDoc);
        this.didReceiveDoc().then(()=>resolve()).catch((err)=>reject(err));
      }).catch((err)=>reject(err));
    })
  },
  selectRootDoc: function() {
    this.newDocSelected(this.get('model').id).then(()=> {
      this.get('cs').log("loaded root doc, preloading assets");
      this.preloadAssets().then(()=> {
        if(this.doPlay())
        {
          this.updateIFrame();
        }
        else
        {
          this.fetchChildren();
        }
      });
    });
  },
  connectToDoc: function(docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('cs').log("connectToDoc doc");
      this.set('fetchingDoc', true);
      this.get('opsPlayer').reset();
      if(this.get('wsAvailable'))
      {
        const socket = this.get('socket');
        let con = this.get('connection');
        if(isEmpty(con))
        {
          this.get('cs').log('connecting to ShareDB');
          con = new ShareDB.Connection(socket);
        }
        if(isEmpty(con) || con.state == "disconnected")
        {
          this.get('cs').log("failed to connect to ShareDB", con);
          this.set('wsAvailable', false);
          this.fetchDoc(docId);
        }
        this.set('connection', con);
        const doc = con.get(config.contentCollectionName, docId);
        doc.subscribe((err) => {
          if (err) throw err;
          this.get('cs').log("subscribed to doc");
          if(!isEmpty(doc.data))
          {
            resolve(doc);
          }
        });
        doc.on('op', (ops,source) => {this.didReceiveOp(ops, source)});
      }
      else
      {
        this.fetchDoc(docId).then((doc)=>resolve(doc));
      }
    })
  },
  fetchDoc: function(docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId).then((doc) => {
        this.get('cs').log("found record", doc.data);
        resolve(doc);
      });
    })
  },
  didReceiveDoc: function() {
    return new RSVP.Promise((resolve, reject) => {
      this.get('cs').log("didReceiveDoc");
      const doc = this.get('currentDoc');
      const editor = this.get('editor');
      const session = editor.getSession();
      if(doc.data.type = "js")
      {
        session.setMode("ace/mode/javascript");
      }
      else
      {
        session.setMode("ace/mode/html");
      }
      this.set('surpress', true);
      session.setValue(doc.data.source);
      this.set('surpress', false);
      this.set('savedVals', doc.data.savedVals);
      this.setCanEditDoc();
      let stats = doc.data.stats ? doc.data.stats : {views:0,forks:0,edits:0};
      stats.views = parseInt(stats.views) + 1;
      this.get('documentService').updateDoc(this.get('model').id, 'stats', stats);
      editor.setReadOnly(!this.get('canEditDoc'));
      this.set('titleName', doc.data.name);
      this.get('sessionAccount').set('currentDoc', this.get('model').id);
      this.set('fetchingDoc', false);
      resolve();
    })
  },
  fetchChildren: function() {
    this.get('cs').log("fetchChildren");
    return new RSVP.Promise((resolve, reject)=> {
      let model = this.get('model').data;
      if(model.children.length == 0)
      {
        this.set('tabs', model.children);
        this.set('children', null);
        this.set('children', model.children);
        this.set('parentData', {name:model.name,id:model.documentId,children:model.children});
        resolve();
        return;
      }
      this.get('documentService').getChildren(model.children).then((data)=> {
        this.get('cs').log("got children");
        this.set('children', data.children);
        const tabs = data.children.map((child)=> {
          return {name:child.data.name, id:child.id};
        });
        this.set('tabs', tabs);
        const parent = data.parent.data;
        this.set('parentData', {name:parent.name,id:parent.documentId,children:parent.children});
        resolve();
      }).catch((err)=>{
        this.get('cs').log(err);
        reject(err);
      });
    })
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
      // else if (ops[0].p[0] == "assets")
      // {
      //   this.get('store').findRecord('document',this.get('model').id).then((toChange) => {
      //     toChange.set('assets',ops[0].oi);
      //   });
      //   this.get('cs').log("didReceiveOp", "preloadAssets")
      //   this.preloadAssets();
      // }
      else if (!source && ops[0].p[0] == "newEval")
      {
        document.getElementById("output-iframe").contentWindow.eval(ops[0].oi);
      }
      else if (!source && ops[0].p[0] == "children")
      {
        this.get('cs').log(ops[0].oi)
        this.get('documentService').updateDoc(this.get('model').id, "children", ops[0].oi)
        .then(()=>{
          this.fetchChildren();
        })
      }
    }
  },
  submitOp: function(op, retry = 0) {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
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
            //this.get('cs').log("did sumbit op",op);
            resolve();
          }
        });
      }
      else
      {
        this.get('documentService').submitOp(op).then(() => {
          this.get('cs').log("did sumbit op",op);
          resolve();
        }).catch((err) => {
          this.get('cs').log("ERROR Not submitted");
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
    let model = this.get('model');
    const embed = this.get('embed') == "true";
    const displayEditor = this.get('displayEditor');
    if(embed || !displayEditor) {
      return true;
    }
    return model.data.dontPlay === "false" || !model.data.dontPlay;
  },
  preloadAssets: function() {
    this.get('cs').log('preloadAssets')
    return new RSVP.Promise((resolve, reject)=> {
      let model = this.get('model');
      if(!isEmpty(model.data.assets))
      {
        this.get('assetService').preloadAssets(model.data.assets)
        .then(()=>resolve()).catch((err)=>reject(err));
      }
      else
      {
        resolve();
      }
    });
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
    this.fetchChildren().then(()=> {
      this.updateSavedVals();
      this.get('cs').log("updateIFrame", selection);
      const savedVals = this.get('savedVals');
      let model = this.get('model');
      const editor = this.get('editor');
      const mainText = this.get('wsAvailable') ? model.data.source : editor.session.getValue();
      let toRender = selection ? this.getSelectedText() : mainText;
      toRender = this.get('codeParser').insertChildren(toRender, this.get('children'));
      toRender = this.get('codeParser').replaceAssets(toRender, model.assets);
      toRender = this.get('codeParser').insertStatefullCallbacks(toRender, savedVals);
      this.get('cs').clear();
      if(selection)
      {
        this.get('documentService').updateDoc(model.id, 'newEval', toRender);
        document.getElementById("output-iframe").contentWindow.eval(toRender);
      }
      else
      {
        this.set('renderedSource', toRender);
      }
      this.updateLinting();
    });
  },
  updateLinting: function() {
    const ruleSets = {
      "tagname-lowercase": true,
      "attr-lowercase": true,
      "attr-value-double-quotes": true,
      "tag-pair": true,
      "spec-char-escape": true,
      "id-unique": true,
      "src-not-empty": true,
      "attr-no-duplication": true,
      "csslint": {
        "display-property-grouping": true,
        "known-properties": true
      },
      "jshint": {"esversion": 6, "asi" : true}
    }
    const editor = this.get('editor');
    const doc = this.get('currentDoc');
    const mainText = this.get('wsAvailable') ? doc.data.source : editor.session.getValue();
    const messages = HTMLHint.HTMLHint.verify(mainText, ruleSets);
    let errors = [], message;
    for(let i = 0; i < messages.length; i++)
    {
        message = messages[i];
        errors.push({
            row: message.line-1,
            column: message.col-1,
            text: message.message,
            type: message.type,
            raw: message.raw
        });
    }
    this.get('cs').log(errors);
    editor.getSession().setAnnotations(errors);
  },
  onCodingFinished: function() {
    if(this.get('autoRender'))
    {
      this.updateIFrame();
    }
    this.updateLinting();
    this.set('codeTimer',null);
  },
  restartCodeTimer: function() {
    if(this.get('codeTimer'))
    {
      clearTimeout(this.get('codeTimer'));
    }
    this.set('codeTimer', setTimeout(() => {
      this.onCodingFinished();
    }, 500));
  },
  onSessionChange:function(delta) {
    const surpress = this.get('surpress');
    const doc = this.get('currentDoc');
    if(!surpress)
    {
      const editor = this.editor;
      const session = editor.getSession();

      this.incrementProperty('editCtr');

      if(!this.get('opsPlayer').atHead())
      {
        this.get('cs').log("not at head");
        this.submitOp({p: ["source", 0], sd: doc.data.source});
        this.submitOp({p: ["source", 0], si: session.getValue()});
      }
      this.get('opsPlayer').reset();

      const aceDoc = session.getDocument();
      const op = {};
      const start = aceDoc.positionToIndex(delta.start);
      op.p = ['source', parseInt(start)];
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
      this.get('documentService').updateDoc(doc.id, "source", session.getValue())
      this.restartCodeTimer();
    }
  },
  addWindowListener: function() {
    this.removeWindowListener();
    var eventMethod = window.addEventListener ? "addEventListener":"attachEvent";
  	var eventer = window[eventMethod];
    window.self = this;
  	var messageEvent = eventMethod === "attachEvent" ? "onmessage":"message";
  	eventer(messageEvent, this.handleWindowEvent, false);
  },
  removeWindowListener: function() {
    var eventMethod = window.removeEventListener ? "removeEventListener":"detachEvent";
    var eventer = window[eventMethod];
    window.self = null;
    var messageEvent = eventMethod === "detachEvent" ? "onmessage":"message";
    eventer(messageEvent, this.handleWindowEvent, false);
  },
  handleWindowEvent: (e) => {
    const self = e.target.self;
    const embed = self.get('embed') == "true";
    if (e.origin === config.localOrigin && !embed && !isEmpty(e.data))
    {
      if(e.data[0].substring(0,2)=="p_")
      {
        let savedVals = self.get('savedVals');
        savedVals[e.data[0]] = e.data[1];
        self.set('savedVals', savedVals);
      }
      else if(e.data[0] == "console")
      {
        for(let i = 1; i < e.data.length; i++)
        {
          self.get('cs').logToScreen(JSON.parse(e.data[i]));
        }
      }
    }
  },
  update() {
    this.set('consoleOutput', this.get('cs').output);
  },
  setCanEditDoc: function() {
    const currentUser = this.get('sessionAccount').currentUserName;
    let model = this.get('model');
    if(isEmpty(currentUser) || isEmpty(model.data))
    {
      this.set('canEditDoc', false);
      this.set('isOwner', false);
      return;
    }
    if(currentUser != model.data.owner)
    {
      this.set('isOwner', false);
      if(model.data.readOnly)
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
    let model = this.get('model');
    this.get('cs').log("deleting root doc");
    this.get('documentService').deleteDoc(model.id).then(() => {
      this.get('cs').log("completed deleting root doc and all children + assets");
      this.transitionToRoute('application');
    }).catch((err) => {
      this.get('cs').log("error deleting doc", err);
    });
  },
  skipOp:function(prev, rewind = false) {
    const editor = this.get('editor');
    const doc = this.get('currentDoc').id;
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
  updateSavedVals: function()
  {
    return new RSVP.Promise((resolve, reject) => {
      const savedVals = this.get('savedVals');
      if(isEmpty(savedVals))
      {
        resolve();
      }
      else
      {
        const vals = Object.keys(savedVals).map(key => savedVals[key]);
        const hasVals = vals.length > 0;
        if(hasVals)
        {
          this.get('documentService').updateDoc(this.get('model').id, 'savedVals', savedVals)
          .then(() => resolve()).catch((err) => reject(err));
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
      let model = this.get('model');
      let stats = model.data.stats ? model.data.stats : {views:0,forks:0,edits:0};
      stats.edits = parseInt(stats.edits) + this.get('editCtr');
      const actions = [
        this.get('documentService').updateDoc(model.id, 'stats', stats),
        this.get('documentService').updateDoc(model.id, 'lastEdited', new Date())
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
    const doc = this.get('currentDoc');
    if(!isEmpty(doc))
    {
      const fn = () => {
        this.get('opsPlayer').reset();
        this.set('renderedSource',"");
        if(this.get('wsAvailable'))
        {
          doc.destroy();
        }
        this.set('currentDoc', null);
        if(!isEmpty(this.get('editor')))
        {
          this.selectRootDoc();
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
  hijackConsoleOutput: function() {
    (()=>{
        var oldLog = console.log;
        console.log = (msg) => {
            this.set("consoleOutput", this.get('consoleOutput') + "\n" + msg);
            //oldLog.apply(console, arguments);
        };
    })();
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      editor.setOption("enableBasicAutocompletion", true)
      this.get('cs').log('editor ready', editor)
      this.initShareDB();
    },
    suggestCompletions(editor, session, position, prefix) {
      return [
        {value:"",
          score:100000,
          caption:"Add some MIMIC Code?",
          meta:"MIMIC",
          snippet:"custom-mimic-code-snippet"}
      ]
    },

    //DOC PROPERTIES
    tagsChanged(tags) {
      this.get('documentService').updateDoc(this.get('model').id, 'tags', tags);
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
      const newName = this.get('titleName');
      this.get('documentService').updateDoc(this.get('currentDoc').id, 'name', newName)
      .then(()=>this.fetchChildren());
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
        let model = this.get('model');
        let flags = parseInt(model.data.flags);
        if(flags < 2)
        {
          flags = flags + 1;
          this.get('documentService').updateDoc(model.id, 'flags', flags);
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
      let model = this.get('model');
      let stats = model.data.stats ? model.data.stats : {views:0,forks:0,edits:0};
      stats.forks = parseInt(stats.forks) + 1;
      let actions = [this.get('documentService').updateDoc(model.id, 'stats', stats),
                    this.get('documentService').forkDoc(model.id, this.get('children'))];
      Promise.all(actions).then(()=>{
        this.get('store').query('document', {
          filter: {search: currentUser, page: 0, currentUser:currentUser, sortBy:'date'}
        }).then((documents) => {
          this.get('cs').log("new doc created", documents);
          this.get('sessionAccount').updateOwnedDocuments();
          this.transitionToRoute('code-editor',documents.firstObject.documentId);
        });
        this.showFeedback("Here is your very own new copy!");
      }).catch((err)=>{
        this.set('feedbackMessage',err.errors[0]);
      });
    },

    //ASSETS
    assetError(err) {
      $("#asset-progress").css("display", "none");
      alert("Error"+err);
    },
    assetProgress(e) {
      this.get('cs').log("assetProgress", e);
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
      this.get('cs').log("assetComplete", e);
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
        this.get('assetService').deleteAsset(this.get('assetToDelete')).then(()=> {
          this.get('cs').log('deleted asset', this.get('assetToDelete'));
          this.set('assetToDelete',"");
          this.toggleProperty('allowAssetDelete');
          if(!this.get('wsAvailable'))
          {
            this.refreshDoc();
          }
        }).catch((err)=>{
          this.get('cs').log('ERROR deleting asset', err, this.get('assetToDelete'));
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
      this.toggleProperty('showPreview');
    },

    //SHOW AND HIDE MENUS
    togglePrivacy() {
      if(this.get('canEditDoc'))
      {
        let model = this.get('model');
        model.data.isPrivate = !model.data.isPrivate;
        this.get('documentService').updateDoc(model.id, 'isPrivate', model.data.isPrivate)
      }
    },
    toggleReadOnly() {
      if(this.get('canEditDoc'))
      {
        let model = this.get('model');
        model.data.readOnly = !model.data.readOnly;
        this.get('documentService').updateDoc(model.id, 'readOnly', model.data.readOnly);
      }
    },
    toggleAllowDocDelete() {
      this.collapseAllSubMenus();
      if(this.get('canEditDoc'))
      {
        this.toggleProperty('allowDocDelete');
      }
    },
    toggleAllowAssetDelete(asset) {
      this.collapseAllSubMenus();
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
      this.collapseAllSubMenus();
      this.toggleProperty('showShare');
    },
    toggleShowCodeOptions() {
      this.collapseAllSubMenus();
      this.toggleProperty('showCodeOptions');
    },
    toggleShowTokens() {
      this.collapseAllSubMenus();
      this.toggleProperty('showTokens');
    },
    toggleShowOpPlayer() {
      this.collapseAllSubMenus();
      this.toggleProperty('showOpPlayer');
    },
    toggleShowAssets() {
      this.collapseAllSubMenus();
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
      this.get('cs').log('cleaning up');
      const fn = () => {
        this.set('renderedSource',"");
        this.set('droppedOps', []);
        this.set("consoleOutput", "");
        this.get('cs').clear();
        this.get('cs').clearObservers();
        if(this.get('wsAvailable'))
        {
          this.get('socket').onclose = ()=> {
            this.get('socket').onclose = null;
            this.get('socket').onopen = null;
            this.get('socket').onmessage = null;
            this.get('socket').onerror = null;
            this.set('socket', null);
            this.set('connection', null)
            this.get('cs').log("websocket closed");
          };
          this.get('currentDoc').destroy();
          this.set('currentDoc', null);
          this.get('socket').close();
        }
        this.get('cs').log('cleaned up');
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
      //this.get('cs').log('mouseDown',e.target);
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
      //this.get('cs').log('mouseup',e.target);
      this.set('isDragging', false);
      let overlay = document.querySelector('#output-iframe');
      overlay.style["pointer-events"] = "auto";
      let overlay2 = document.querySelector('.output-container');
      overlay2.style["pointer-events"] = "none";
    },
    mouseMove(e) {
      if(this.get('isDragging'))
      {
        //this.get('cs').log('mouseMove',e.target);
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
    },

    //TABS
    newTab(docId) {
      //this.newDocSelected(this.get("currentDoc").data.documentId);
      this.fetchChildren();
    },
    tabSelected(docId) {
      this.get('cs').log('tab selected', docId);
      if(isEmpty(docId))
      {
        docId = this.get('model').id;
      }
      const doc = this.get("currentDoc");
      if(!isEmpty(doc))
      {
        if(docId != doc.data.documentId)
        {
          this.newDocSelected(docId);
        }
      }
      else
      {
         this.newDocSelected(docId);
      }
    },
    tabDeleted(docId) {
      this.get('cs').log('deleting tab', docId);
      this.get('documentService').deleteDoc(docId).then(()=> {
        const children = this.get('model').data.children;
        var newChildren = children.filter((c) => {return c != docId})
        this.get('documentService').updateDoc(this.get('model').id, "children", newChildren)
        .then(()=> {
          this.get('cs').log("Did delete child from parent model", this.get('model').data.children);
          this.fetchChildren();
        }).catch((err)=> {
          this.get('cs').log(err);
        })
      }).catch((err)=> {
        this.get('cs').log(err);
      })
    }
  }
});
