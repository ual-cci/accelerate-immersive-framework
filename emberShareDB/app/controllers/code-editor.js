import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import ReconnectingWebSocket from 'npm:reconnecting-websocket';
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
  autocomplete: inject('autocomplete'),
  opsPlayer: inject('ops-player'),
  cs: inject('console'),

  //Parameters
  con: null,
  children: [],
  parentData: null,
  currentDoc:null,
  editor: null,
  suppress: false,
  codeTimer: null,
  renderedSource:"",
  isNotEdittingDocName:true,
  canEditDoc:false,
  isOwner:false,
  autoRender:false,
  codeTimerRefresh:500,
  collapsed: true,
  showShare:false,
  showAssets:false,
  showPreview:false,
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
  feedbackTimer:null,
  doPlay:true,

  //Computed parameters
  aceStyle: computed('aceW','displayEditor', function() {
    const aceW = this.get('aceW');
    const displayEditor = this.get('displayEditor');
    const display = displayEditor ? "inline" : "none"
    let drag = document.getElementById('drag-button')
    drag.style.right =(aceW - 25) + "px";
    let tab = document.getElementById('project-tabs');
    tab.style.width = aceW + "px"
    return htmlSafe("width: " + aceW + "px; display: " + display + ";");
  }),
  displayEditor: computed('hideEditor', function() {
    return this.get('hideEditor') != "true";
  }),
  titleNoName: computed('titleName', function() {
    return this.get('titleName').split("by")[0];
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
    const embed = this.get('embed') == "true";
    $("#mimic-navbar").css("display", embed ? "none" : "block");
    if(embed)
    {
      this.set('displayEditor', !embed);
      this.set('showName', !embed);
    }
    this.get('cs').observers.push(this);
  },
  initAceEditor: function() {
    const editor = this.get('editor');
    const session = editor.getSession();
    console.log("Adding in commands");
    editor.commands.addCommand({
      name: "executeLines",
      exec: ()=>{
        console.log("executeLines");
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
    console.log("init websockets", socket);
    if(!isEmpty(socket) && socket.state == 1)
    {
      console.log("websocket is empty")
      socket.onclose = ()=> {
        console.log("websocket closed, reopening");
        this.set('socket', null);
        this.initWebSockets();
      }
      socket.close();
    }
    else
    {
      try {
        socket = new ReconnectingWebSocket(config.wsHost)
        this.set('socket', socket);
        socket.onopen = () => {
          this.get('cs').log("web socket open");
          this.set('wsAvailable', true);
          if(!this.get('fetchingDoc'))
          {
            this.selectRootDoc();
          }
        };
        socket.onerror =  () => {
          this.get('cs').log("web socket error");
          this.websocketError();
        }
        socket.onclose =  () =>  {
          this.get('cs').log("websocket closed, calling error");
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
    console.log("websocket error")
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
        const sharedDBDoc = this.get('sharedDBDoc');
        if(this.get('wsAvailable') && !isEmpty(sharedDBDoc))
        {
          this.get('cs').log("destroying connection to old doc");
          sharedDBDoc.destroy();
          this.set('sharedDBDoc', null);
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
      this.updateTabbarLocation();
      this.get('cs').log("loaded root doc, preloading assets");
      this.fetchChildren().then(()=> {
        this.preloadAssets().then(()=> {
          if(this.doPlayOnLoad())
          {
            this.updateIFrame();
          }
          this.set('doPlay',!this.doPlayOnLoad());
          this.updatePlayButton();
        });
      });
    });
  },
  connectToDoc: function(docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('cs').log("connectToDoc doc");
      this.set('fetchingDoc', true);
      // if(this.get('wsAvailable'))
      // {
        const socket = this.get('socket');
        let con = this.get('connection');
        if(isEmpty(con) && !isEmpty(socket))
        {
          this.get('cs').log('connecting to ShareDB');
          con = new ShareDB.Connection(socket);
        }
        if(isEmpty(con) || con.state == "disconnected" || isEmpty(socket))
        {
          this.get('cs').log("failed to connect to ShareDB", con);
          this.set('wsAvailable', false);
          this.fetchDoc(docId).then((doc)=>resolve(doc));
          return;
        }
        this.set('connection', con);
        const sharedDBDoc = con.get(config.contentCollectionName, docId);
        sharedDBDoc.subscribe((err) => {
          if (err) throw err;
          this.get('cs').log("subscribed to doc");
          if(!isEmpty(sharedDBDoc.data))
          {
            this.set('sharedDBDoc', sharedDBDoc);
            this.fetchDoc(docId).then((doc)=>resolve(doc));
          }
        });
        sharedDBDoc.on('op', (ops,source) => {this.didReceiveOp(ops, source)});
      // }
      // else
      // {
      //   this.fetchDoc(docId).then((doc)=>resolve(doc));
      // }
    })
  },
  fetchDoc: function(docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('store').findRecord('document', docId).then((doc) => {
        this.get('cs').log("found record");
        resolve(doc);
      });
    })
  },
  didReceiveDoc: function() {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      this.get('opsPlayer').reset(doc.id);
      const editor = this.get('editor');
      const session = editor.getSession();
      this.get('cs').log("didReceiveDoc", doc.data.type);
      if(doc.data.type == "js")
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
      let stats = doc.data.stats;
      stats.views = parseInt(stats.views) + 1;
      this.get('documentService').updateDoc(this.get('model').id, 'stats', stats)
      .catch((err)=>{
        this.get('cs').log('error updating doc', err);
        reject(err);
        return;
      });
      editor.setReadOnly(!this.get('canEditDoc'));
      if(!isEmpty(this.get('loadingInterval')))
      {
        clearInterval(this.get('loadingInterval'))
        this.set('loadingInterval', null);
      }
      this.set('titleName', doc.data.name + " by " + doc.data.owner);
      this.set('titleNoName', doc.data.name);
      this.get('sessionAccount').set('currentDoc', this.get('model').id);
      this.set('fetchingDoc', false);
      resolve();
    })
  },
  setParentData: function(data) {
    this.set('parentData', {name:data.name,
      id:data.documentId,
      children:data.children,
      source:data.source,
      assets:data.assets
    });
  },
  clearTabs: function() {
    // this.setParentData({
    //     name:"",
    //     id:"",
    //     children:[],
    //     source:"",
    //     assets:""
    // })
    this.set('tabs',[]);
  },
  setTabs: function(data) {
    const currentDoc = this.get('currentDoc');
    const tabs = data.map((child)=> {
      return {name:child.data.name, id:child.id, isSelected:child.id==currentDoc.id};
    });
    console.log(tabs);
    this.set('tabs', tabs);
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
        this.setParentData(model);
        resolve();
        return;
      }
      this.get('documentService').getChildren(model.children).then((data)=> {
        this.get('cs').log("got children", data.children);
        this.set('children', data.children);
        this.setTabs(data.children);
        this.setParentData(data.parent.data);
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
      else if (ops[0].p[0] == "assets")
      {
        this.get('store').findRecord('document',this.get('model').id).then((toChange) => {
          toChange.set('assets',ops[0].oi);
        });
        this.get('cs').log("didReceiveOp", "preloadAssets")
        this.preloadAssets();
      }
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
        }).catch((err)=>{
          this.get('cs').log('error updating doc', err);
        });
      }
    }
  },
  submitOp: function(op, retry = 0) {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      const MAX_RETRIES = 5;
      let droppedOps = this.get('droppedOps');
      if(droppedOps.length > 0) {
        this.set('droppedOps', droppedOps.push(op));
        return reject();
      }

      if(this.get('wsAvailable'))
      {
        const sharedDBDoc = this.get('sharedDBDoc');
        sharedDBDoc.submitOp(op, (err) => {
          if(err)
          {
            if(retry < MAX_RETRIES)
            {
              this.submitOp(op, retry + 1);
            }
            else
            {
              droppedOps.push(op);
            }
            reject(err);
          }
          else
          {
            resolve();
          }
        });
      }
      else
      {
        this.get('documentService').submitOp(op, doc.id).then(() => {
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
            droppedOps.push(op);
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
  doPlayOnLoad: function() {
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
        let text = "preloading assets.";
        let interval = setInterval(()=>{
          if(text=="preloading assets.")
          {
            text = "preloading assets.."
          }
          else if (text=="preloading assets..")
          {
            text = "preloading assets"
          }
          else if (text=="preloading assets")
          {
            text = "preloading assets."
          }
          this.showFeedback(text);
        }, 500);
        this.set('preloadingInterval', interval);
        this.get('assetService').preloadAssets(model.data.assets)
        .then(()=>{
          this.showFeedback("");
          clearInterval(interval);
          resolve();
        }).catch((err)=>{
          this.showFeedback("");
          clearInterval(interval);
          reject(err)
        });
      }
      else
      {
        resolve();
      }
    });
  },
  getSelectionRange: function() {
    const editor = this.get('editor');
    let selectionRange = editor.getSelectionRange();
    if(selectionRange.start.row == selectionRange.end.row &&
      selectionRange.start.column == selectionRange.end.column)
      {
        //editor.selection.selectLine();
        selectionRange.start.column = 0;
        selectionRange.end.column = editor.session.getLine(selectionRange.start.row).length;
      }
      return selectionRange;
  },
  getSelectedText: function()
  {
    const editor = this.get('editor');
    let selectionRange = this.getSelectionRange();
    const content = editor.session.getTextRange(selectionRange);
    return content;
  },
  updateSourceFromSession: function() {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      if(!isEmpty(doc) && this.get('droppedOps').length == 0)
      {
        const session = this.get('editor').getSession();
        //THIS DOESNT UPDATE THE ON THE SERVER, ONLY UPDATES THE EMBERDATA MODEL
        //BECAUSE THE "PATCH" REST CALL IGNORES THE SOURCE FIELD
        this.get('documentService').updateDoc(doc.id, "source", session.getValue())
        .then(()=>resolve())
        .catch((err)=>{
          this.get('cs').log("error updateSourceFromSession - updateDoc", err);
          reject(err);
        });
      }
      else
      {
          resolve();
      }
    });
  },
  updateIFrame: function(selection = false) {
    this.updateSourceFromSession().then(()=> {
      this.fetchChildren().then(()=> {
        this.updateSavedVals();
        const savedVals = this.get('savedVals');
        let model = this.get('model');
        const editor = this.get('editor');
        const mainText = model.data.source;
        let toRender = selection ? this.getSelectedText() : mainText;
        this.get('documentService').getCombinedSource(model.id, true, toRender)
        .then((combined) => {
          this.get('cs').clear();
          if(selection)
          {
            this.flashSelectedText();
            document.getElementById("output-iframe").contentWindow.eval(combined);
            this.get('documentService').updateDoc(model.id, 'newEval', combined)
            .catch((err)=>{
              this.get('cs').log('error updating doc', err);
            });

          }
          else
          {
            this.set('renderedSource', combined);
          }
          this.updateLinting();
        });
      });
    })
  },
  flashAutoRender:function()
  {
    let autoInput = document.getElementsByClassName('ace_content').item(0)
    autoInput.style["border-style"] = "solid"
    autoInput.style["border-width"] = "5px"
    autoInput.style["border-color"] = 'rgba(255, 102, 255, 150)'
    setTimeout(()=> {
        autoInput.style["border-style"] = "none"
    }, 250);
  },
  flashSelectedText: function() {
    let selectionMarkers = document.getElementsByClassName('ace_selection');
    for(let i = 0; i < selectionMarkers.length; i++)
    {
      selectionMarkers.item(i).style.background = 'rgba(255, 102, 255, 150)'
    }
    setTimeout(()=> {
      for(let i = 0; i < selectionMarkers.length; i++)
      {
        selectionMarkers.item(i).style.background = 'rgba(255, 255, 255, 0)'
      }
    }, 500);
    if(selectionMarkers.length < 1)
    {
      let activeMarkers = document.getElementsByClassName('ace_active-line');
      for(let j = 0; j < activeMarkers.length; j++)
      {
        activeMarkers.item(j).style.background = 'rgba(255, 102, 255, 150)'
      }
      setTimeout(()=> {
        for(let j = 0; j < activeMarkers.length; j++)
        {
          activeMarkers.item(j).style.background = 'rgba(255, 255, 255, 0)'
        }
      }, 500);
    }
  },
  updateLinting: function() {
    const doc = this.get('currentDoc');
    const ruleSets = this.get('autocomplete').ruleSets(doc.data.type);
    const editor = this.get('editor');
    const mainText = doc.data.source;
    const messages = HTMLHint.HTMLHint.verify(mainText, ruleSets);
    const errors = this.get('autocomplete').lintingErrors(messages);
    editor.getSession().setAnnotations(errors);
  },
  onCodingFinished: function() {
    if(this.get('autoRender'))
    {
      this.flashAutoRender();
      this.updateIFrame();
    }
    this.updateLinting();
    this.set('codeTimer', null);
  },
  restartCodeTimer: function() {
    if(this.get('codeTimer'))
    {
      clearTimeout(this.get('codeTimer'));
    }
    this.set('codeTimer', setTimeout(() => {
      this.onCodingFinished();
    }, this.get('codeTimerRefresh')));
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
      this.get('opsPlayer').reset(doc.id);

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
  update:function() {
    this.set('consoleOutput', this.get('cs').output);
    var textarea = document.getElementById('console');
    textarea.scrollTop = textarea.scrollHeight;
  },
  setCanEditDoc: function() {
    const currentUser = this.get('sessionAccount').currentUserId;
    let model = this.get('model');
    console.log("setCanEditDoc")
    if(isEmpty(currentUser) || isEmpty(model.data))
    {
      this.set('canEditDoc', false);
      this.set('isOwner', false);
      return;
    }
    if(currentUser != model.data.ownerId)
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
    if (confirm('Are you sure you want to delete?')) {
      this.get('cs').log("deleting root doc");
      this.get('documentService').deleteDoc(model.id).then(() => {
        this.get('cs').log("completed deleting root doc and all children + assets");
        this.transitionToRoute('application');
      }).catch((err) => {
        this.get('cs').log("error deleting doc", err);
      });
    }
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
        return;
      }
      else
      {
        const vals = Object.keys(savedVals).map(key => savedVals[key]);
        const hasVals = vals.length > 0;
        if(hasVals)
        {
          this.get('documentService').updateDoc(this.get('model').id, 'savedVals', savedVals)
          .then(() => resolve()).catch((err) => reject(err))
          .catch((err)=>{
            this.get('cs').log('error updating doc', err);
            reject(err);
            return;
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
        this.get('opsPlayer').reset(doc.id);
        this.set('droppedOps', []);
        this.set('renderedSource',"");
        const sharedDBDoc = this.get('sharedDBDoc');
        if(this.get('wsAvailable') && !isEmpty(sharedDBDoc))
        {
          sharedDBDoc.destroy();
          this.set('sharedDBDoc', null);
        }
        this.set('currentDoc', null);
        if(!isEmpty(this.get('editor')))
        {
          this.selectRootDoc();
        }
      };
      const actions = [this.updateSourceFromSession(), this.updateEditStats(), this.updateSavedVals()];
      Promise.all(actions).then(() => {fn();}).catch(()=>{fn();});
    }
  },
  showFeedback: function(msg) {
    this.set('feedbackMessage', msg);
    if(!isEmpty(this.get('feedbackTimer')))
    {
      clearTimeout(this.get('feedbackTimer'));
      this.set('feedbackTimer', null);
    }
    this.set('feedbackTimer', setTimeout(() => {
      this.set('feedbackMessage', null);
    }, 5000));
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
  updatePlayButton: function() {
    let button = document.getElementById("code-play-btn");
    if(!this.get('doPlay'))
    {
      $(button).find(".glyphicon").removeClass("glyphicon-play").addClass("glyphicon-pause");
    }
    else
    {
      $(button).find(".glyphicon").removeClass("glyphicon-pause").addClass("glyphicon-play");
    }
  },
  updateTabbarLocation: function() {
    const aceW = this.get('aceW');
    let tab = document.getElementById('project-tabs');
    tab.style.width = aceW + "px"
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      editor.setOption("enableBasicAutocompletion", true)
      this.get('cs').log('editor ready', editor)
      let text = "loading code.";
      this.set('titleName', text);
      this.clearTabs();
      this.set('loadingInterval', setInterval(()=>{
        if(text=="loading code.")
        {
          text = "loading code.."
        }
        else if (text=="loading code..")
        {
          text = "loading code"
        }
        else if (text=="loading code")
        {
          text = "loading code."
        }
        this.set('titleName', text);
      }, 500));
      editor.setReadOnly(true);
      this.initShareDB();
    },
    suggestCompletions(editor, session, position, prefix) {
      let suggestions = [];
      const assets = this.get('model').data.assets;
      if(!isEmpty(assets))
      {
        suggestions = suggestions.concat(this.get('autocomplete').assets(assets));
      }
      const children = this.get('children');
      if(!isEmpty(children))
      {
        suggestions = suggestions.concat(this.get('autocomplete').tabs(children));
      }
      return suggestions;
    },

    //DOC PROPERTIES
    tagsChanged(tags) {
      this.get('documentService').updateDoc(this.get('model').id, 'tags', tags)
      .catch((err)=>{
        this.get('cs').log('error updating doc', err);
      });
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
      const newName = this.get('titleNoName');
      this.set('titleName', newName + " by " + this.get('model').data.owner)
      this.get('documentService').updateDoc(this.get('currentDoc').id, 'name', newName)
      .then(()=>this.fetchChildren()
      .then(()=>this.get('sessionAccount').updateOwnedDocuments()));
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
      this.get('documentService').flagDoc().then(()=> {
        let model = this.get('model');
        let flags = parseInt(model.data.flags);
        if(flags < 2)
        {
          flags = flags + 1;
          this.get('documentService').updateDoc(model.id, 'flags', flags)
          .catch((err)=>{
            this.get('cs').log('error updating doc', err);
          });
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
      this.fetchChildren().then(()=> {
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
          }).catch((err)=>{
            this.set('feedbackMessage',err.errors[0]);
          });
          this.showFeedback("Here is your very own new copy!");
        }).catch((err)=>{
          this.set('feedbackMessage',err.errors[0]);
        });
      });
    },

    //ASSETS
    assetError(err) {
      $("#asset-progress").css("display", "none");
      alert("Error"+err);
    },
    assetProgress(e) {
      this.get('cs').log("assetProgress", e.percent);
      if(parseInt(e.percent) < 100)
      {
        $("#asset-progress").css("display", "block");
        $("#asset-progress").css("width", (parseInt(e.percent) * 40/100)+"vw");
      }
      else
      {
        $("#asset-progress").css("display", "none");
      }
    },
    assetUploaded(e) {
      this.get('cs').log("assetComplete", e);
      $("#asset-progress").css("display", "none");
      const doc = this.get('model');
      let newAssets = doc.data.assets;
      newAssets.push(e);
      this.get('documentService').updateDoc(doc.id, "assets", newAssets)
      .then(()=>{
        if(!this.get('wsAvailable'))
        {
          this.refreshDoc();
        }
      }).catch((err)=>{this.get('cs').log('ERROR updating doc with asset', err)});
    },
    deleteAsset(asset)
    {
      if(this.get('canEditDoc'))
      {
        if (confirm('Are you sure you want to delete?')) {
          this.get('assetService').deleteAsset(asset).then(()=> {
            const doc = this.get('model');
            let newAssets = doc.data.assets;
            newAssets = newAssets.filter((oldAsset) => {
                console.log(oldAsset.fileId,asset)
                return oldAsset.fileId !== asset
            });

            this.get('documentService').updateDoc(doc.id, "assets", newAssets)
            .then(()=>{
              if(!this.get('wsAvailable'))
              {
                this.refreshDoc();
              }
            }).catch((err)=>{this.get('cs').log(err)});
          }).catch((err)=>{
            this.get('cs').log('ERROR deleting asset', err, asset);
          });
        }
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
        .catch((err)=>{
          this.get('cs').log('error updating doc', err);
        });
      }
    },
    toggleReadOnly() {
      if(this.get('canEditDoc'))
      {
        let model = this.get('model');
        model.data.readOnly = !model.data.readOnly;
        this.get('documentService').updateDoc(model.id, 'readOnly', model.data.readOnly)
        .catch((err)=>{
          this.get('cs').log('error updating doc', err);
        });
      }
    },
    toggleAutoRender() {
      this.toggleProperty('autoRender');
    },
    toggleShowShare() {
      this.get('modalsManager')
        .alert({title: this.get('model').data.name,
                bodyComponent: 'share-modal',
                editLink:this.get('editLink'),
                embedLink:this.get('embedLink'),
                displayLink:this.get('displayLink')
              });
      this.toggleProperty('showShare');
    },
    toggleShowAssets() {
      this.toggleProperty('showAssets');
      console.log(this.get('showAssets'))
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
      const fn = () => {
        console.log("clean up")
        clearInterval(this.get('preloadingInterval'))
        this.showFeedback("");
        this.set('renderedSource',"");
        this.set('droppedOps', []);
        this.set("consoleOutput", "");
        this.get('cs').clear();
        this.get('cs').clearObservers();
        if(this.get('wsAvailable'))
        {
          this.get('sharedDBDoc').destroy();
          this.set('sharedDBDoc', null);
          this.set('currentDoc', null);
          this.get('socket').removeEventListener('error')
          this.get('socket').removeEventListener('open')
          this.get('socket').removeEventListener('close')
          this.get('socket').removeEventListener('message')
          this.get('socket').onclose = null;
          this.get('socket').onopen = null;
          this.get('socket').onmessage = null;
          this.get('socket').onerror = null;
          this.get('connection').close();
          this.get('socket').close();
          this.set('socket', null);
          this.set('connection', null)
        }
        this.get('cs').log('cleaned up');
        this.removeWindowListener();
      }
      const actions = [this.updateSourceFromSession(), this.updateEditStats(), this.updateSavedVals()];
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
    mouseoverCodeTransport(e)
    {
      const transport = document.getElementById("code-transport-container")
      const trackingArea = document.getElementById("code-transport-tracking-area")
      trackingArea.style["pointer-events"] = "none"
      transport.style.display = "block"
    },
    mouseoutCodeTransport(e)
    {
      const transport = document.getElementById("code-transport-container")
      const trackingArea = document.getElementById("code-transport-tracking-area")
      trackingArea.style["pointer-events"] = "auto"
      transport.style.display = "none"
    },

    //OPERATIONS ON CODE
    playOrPause() {
      if(this.get('doPlay'))
      {
        this.updateIFrame();
      }
      else
      {
        this.set('renderedSource', "");
      }
      this.toggleProperty('doPlay')
      this.updatePlayButton();
    },
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
      this.get('cs').log('new tab', docId);
      this.fetchChildren().then(()=>{
        const children = this.get('model').children;
        const newChild = children[children.length-1]
        //this.newDocSelected(newChild);
      });
    },
    tabSelected(docId) {
      this.get('cs').log('tab selected', docId);
      this.updateSourceFromSession().then(()=> {
        const doc = this.get("currentDoc");
        if(!isEmpty(doc))
        {
          if(docId != doc.data.documentId)
          {
            this.newDocSelected(docId).then(()=> {
              this.fetchChildren()
            });
          }
        }
        else
        {
           this.newDocSelected(docId).then(()=> {
             this.fetchChildren()
           });
        }
      }).catch((err)=>{
        this.get('cs').log('ERROR updateSourceFromSession', err)
      });
    },
    tabDeleted(docId) {
      this.get('cs').log('deleting tab', docId);
      if (confirm('Are you sure you want to delete?')) {
        //SWITCH TO HOME TAB FIRST
        this.newDocSelected(this.get('model').id).then(()=>{
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
        });
      }
    }
  }
});
