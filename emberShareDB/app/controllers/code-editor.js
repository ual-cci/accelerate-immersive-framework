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
  mediaQueries:inject(),
  resizeService:inject('resize'),
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
  library: inject(),

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
  showReadOnly:false,
  isOwner:false,
  autoRender:false,
  codeTimerRefresh:500,
  collapsed: true,
  showShare:false,
  showAssets:false,
  showPreview:false,
  showSettings:false,
  showCodeControls:true,
  showConnectionWarning:false,
  isShowingCode:true,
  isDragging:false,
  startWidth:0,
  startX:0,
  aceW:"700px",
  savedVals:null,
  hideEditor:'false',
  embed:'false',
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
  isPlayingOps:false,
  scrollPositions:{},
  isRoot:true,

  showHUD:true,
  hudMessage:"Loading...",

  //Computed parameters
  aceStyle: computed('aceW', function() {
    this.updateDragPos();
    const aceW = this.get('aceW');
    const display = this.get('showCodeControls') ? "inline":"none";
    //console.log("updating ace style", aceW, display)
    return htmlSafe("width: " + aceW + "; display: " + display + ";");
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
  libraries: computed('library.libraryMap', function() {
    return this.get("library").libraryMap
  }),

  //Functions
  init: function () {
    this._super();
    this.get('resizeService').on('didResize', event => {
      const display = this.get('showCodeControls') ? "inline":"none"
      if(this.get("mediaQueries.isDesktop"))
      {
        this.updateDragPos()
      }
      $("#ace-container").css("display", display);
    })
    //this.hijackConsoleOutput()
  },
  initShareDB: function() {
    console.log('initShareDB');
    this.set('leftCodeEditor', false);
    this.initWebSockets();
    this.initAceEditor();
    this.addWindowListener();
    this.initUI();
  },
  initUI: function() {
    this.set('collapsed', true);
    const embed = this.get('embed') == "true";
    const embedWithCode = this.get('showCode') == "true";
    this.set('isEmbedded', embed);
    this.set('isEmbeddedWithCode', embedWithCode);
    this.set('showCodeControls', !(embed && !embedWithCode) || ((this.get('mediaQueries').isDesktop) && !embedWithCode));
    var iframe = document.getElementById("output-iframe");
    var iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
    iframeDocument.body.style.padding = "0px";
    iframeDocument.body.style.margin = "0px";
    if(embed)
    {
      document.getElementById("main-code-container").style.height="97vh"
      document.getElementById("main-code-container").style.width="100vw"
      document.getElementById("output-container").style["border-top-width"]=0;
      document.getElementById("output-container").style["border-bottom-width"]=0;
      document.getElementById("output-container").style["border"]="none";
      document.getElementById("main-site-container").style.padding="0px"
      document.getElementById("main-site-container").style.border="none"
    }

    if(embedWithCode)
    {
      this.hideCode(true);
    }

    $("#mimic-navbar").css("display", embed ? "none" : "block");
    $("#main-site-container").css("padding-left", embed ? "0%" : "8%");
    $("#main-site-container").css("padding-right", embed ? "0%" : "8%");
    const display = this.get('showCodeControls') ? "inline":"none"
    $("#ace-container").css("display", display);
    this.updateDragPos();
    this.get('cs').observers.push(this);
  },
  updateDragPos: function() {
    const aceW = parseInt(this.get('aceW').substring(0, this.get('aceW').length-2));
    //const aceW = document.getElementById('ace-container').clientWidth;
    //console.log("drag")
    const drag = document.getElementById('drag-container')
    if(!isEmpty(drag))
    {
      drag.style.right =(aceW - 31) + "px";
    }
    const tab = document.getElementById('project-tabs');
    if(!isEmpty(tab))
    {
      tab.style.width = aceW + "px"
    }
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
          console.log("web socket open");
          if(this.get('leftCodeEditor'))
          {
            console.log("opened connection but had already left code editor")
          }
          else
          {
            this.set('wsAvailable', true);
            if(!this.get('fetchingDoc'))
            {
              this.selectRootDoc();
            }
          }
        };
        socket.onerror =  () => {
          console.log("web socket error");
          this.websocketError();
        }
        socket.onclose =  () =>  {
          console.log("websocket closed, calling error");
          this.websocketError();
        }
        socket.onmessage = (event) =>  {
          console.log("web socket message", event);
          const d = JSON.parse(event.data);
          if(d.a == "init" && d.type == "http://sharejs.org/types/JSONv0")
          {
            this.set('fetchingDoc', false)
            this.websocketError()
          }
        }
      }
      catch (err)
      {
        console.log("web sockets not available");
        this.websocketError();
      }
    }
  },
  cleanUpConnections: function() {
    return new RSVP.Promise((resolve, reject)=> {
      if(!isEmpty(this.get('sharedDBDoc')))
      {
        this.get('sharedDBDoc').destroy();
        this.set('sharedDBDoc', null);
      }
      this.set('currentDoc', null);
      if(!isEmpty(this.get('socket')))
      {
        this.get('socket').removeEventListener('error')
        this.get('socket').removeEventListener('open')
        this.get('socket').removeEventListener('close')
        this.get('socket').removeEventListener('message')
        this.get('socket').onclose = null;
        this.get('socket').onopen = null;
        this.get('socket').onmessage = null;
        this.get('socket').onerror = null;
        this.get('socket').close();
        this.set('socket', null);
      }
      if(!isEmpty(this.get('connection')))
      {
        this.get('connection').close();
        this.set('connection', null);
      }
      resolve();
    })
  },
  websocketError: function() {
    console.log("websocket error")
    this.set('wsAvailable', false);
    this.cleanUpConnections().then(()=>{
      if(!this.get('fetchingDoc') && !this.get('leftCodeEditor'))
      {
        console.log("selecting doc")
        this.selectRootDoc();
      }
    })
  },
  newDocSelected: function(docId) {
    console.log("newDocSelected")
    return new RSVP.Promise((resolve, reject)=> {
      let doc = this.get('currentDoc');
      console.log("newDocSelected", docId);
      this.set('isRoot', docId == this.get('model').id)
      if(!isEmpty(doc))
      {
        const sharedDBDoc = this.get('sharedDBDoc');
        if(this.get('wsAvailable') && !isEmpty(sharedDBDoc))
        {
          //Destroy connection to old doc
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
    console.log("selectRootDoc")
    this.newDocSelected(this.get('model').id).then(()=> {
      this.updateTabbarLocation();
      console.log("loaded root doc, preloading assets");
      this.fetchChildren().then(()=> {
        this.resetScrollPositions();
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
      console.log("connectToDoc doc");
      this.set('fetchingDoc', true);
      if(this.get('wsAvailable'))
      {
        const socket = this.get('socket');
        let con = this.get('connection');
        if(isEmpty(con) && !isEmpty(socket))
        {
          console.log('connecting to ShareDB');
          con = new ShareDB.Connection(socket);
        }
        if(isEmpty(con) || con.state == "disconnected" || isEmpty(socket))
        {
          console.log("failed to connect to ShareDB", con);
          this.set('wsAvailable', false);
          this.fetchDoc(docId).then((doc)=>resolve(doc));
          return;
        }
        this.set('connection', con);
        const sharedDBDoc = con.get(config.contentCollectionName, docId);
        sharedDBDoc.subscribe((err) => {
          if (err) throw err;
          console.log("subscribed to doc");
          if(!isEmpty(sharedDBDoc.data))
          {
            this.set('sharedDBDoc', sharedDBDoc);
            this.fetchDoc(docId).then((doc)=>resolve(doc));
          }
        });
        sharedDBDoc.on('op', (ops,source) => {this.didReceiveOp(ops, source)});
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
        console.log("found record");
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
      console.log("didReceiveDoc", doc.data.type);
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
        console.log('error updating doc', err);
        reject(err);
        return;
      });
      console.log("CAN EDIT?", this.get('canEditDoc'))
      editor.setReadOnly(!this.get('canEditDoc'));
      this.set('showHUD', false);
      this.scrollToSavedPosition();
      this.set('titleName', doc.data.name + " by " + doc.data.owner);
      this.set('titleNoName', doc.data.name);
      this.get('sessionAccount').set('currentDoc', this.get('model').id);
      this.set('fetchingDoc', false);
      resolve();
    })
  },
  setParentData: function(data) {
    const currentDoc = this.get('currentDoc');
    let isSelected = true;
    if (!isEmpty(currentDoc))
    {
      isSelected = data.documentId==currentDoc.id
    }
    this.set('parentData', {name:data.name,
      id:data.documentId,
      children:data.children,
      source:data.source,
      assets:data.assets,
      isSelected:isSelected
    });
  },
  clearTabs: function() {
    this.setParentData({
        name:"",
        id:"",
        children:[],
        source:"",
        assets:""
    })
    this.set('tabs',[]);
  },
  setTabs: function(data) {
    const currentDoc = this.get('currentDoc');
    const tabs = data.map((child)=> {
      const canDelete = this.get('canEditDoc') && child.id==currentDoc.id;
      return {name:child.data.name, id:child.id, isSelected:child.id==currentDoc.id, canDelete:canDelete};
    });
    console.log("tabs", tabs);
    this.set('tabs', tabs);
  },
  fetchChildren: function() {
    console.log("fetchChildren");
    return new RSVP.Promise((resolve, reject)=> {
      let model = this.get('model').data;
      if(model.children.length == 0)
      {
        this.set('tabs', []);
        this.set('children', []);
        this.setParentData(model);
        resolve();
      }
      else
      {
        this.get('documentService').getChildren(model.children).then((data)=> {
          console.log("got children", data.children);
          this.set('children', data.children);
          this.setTabs(data.children);
          this.setParentData(data.parent.data);
          resolve();
        }).catch((err)=>{
          console.log(err);
          reject(err);
        });
      }
    })
  },
  didReceiveOp: function (ops,source) {
    //console.log("did receive op", ops, source)
    const embed = this.get('isEmbedded');
    const editor = this.get('editor');
    if(!embed && ops.length > 0)
    {
      if(!source && ops[0].p[0] == "source")
      {
        this.set('surpress', true);
        console.log("applying remote op")
        const deltas = this.get('codeParser').opTransform(ops, editor);
        editor.session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      }
      else if (ops[0].p[0] == "assets")
      {
        // this.get('store').findRecord('document',this.get('model').id).then((toChange) => {
        //   toChange.set('assets',ops[0].oi);
        // });
        // console.log("didReceiveOp", "preloadAssets")
        // this.preloadAssets();
      }
      else if (!source && ops[0].p[0] == "newEval")
      {
        document.getElementById("output-iframe").contentWindow.eval(ops[0].oi);
      }
      else if (!source && ops[0].p[0] == "children")
      {
        console.log(ops[0].oi)
        this.get('documentService').updateDoc(this.get('model').id, "children", ops[0].oi)
        .then(()=>{
          this.fetchChildren();
        }).catch((err)=>{
          console.log('error updating doc', err);
        });
      }
    }
  },
  submitOp: function(op, retry = 0) {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      let droppedOps = this.get('droppedOps');
      //let droppedOps = [1,2,3]
      //console.log("Submitting op")
      if(droppedOps.length > 0) {
        this.set('droppedOps', droppedOps.push(op));
        reject();
        return;
      }

      if(this.get('wsAvailable'))
      {
        const sharedDBDoc = this.get('sharedDBDoc');
        //console.log("Submitting op on ws")
        try
        {
          sharedDBDoc.submitOp(op, (err) => {
            //console.log("callback", err)
            if(err)
            {
              droppedOps.push(op);
              this.set('connectionWarning', "Warning: connection issues mean that the autosave function has ceased working. We recommend you reload the site to avoid loosing work")
              this.set('showConnectionWarning', true);
              console.log("error submitting op (ws)")
              reject(err);
              return;
            }
            else
            {
              resolve();
              return;
            }
          });
        }
        catch (err)
        {
          droppedOps.push(op);
          this.set('connectionWarning', "Warning: Your document may have become corrupted. Please fork this document to fix issues")
          this.set('showConnectionWarning', true);
          console.log("error submitting op (ws)",err)
          reject(err);
        }
      }
      else
      {
        this.get('documentService').submitOp(op, doc.id).then(() => {
          console.log("did sumbit op",op);
          resolve();
          return;
        }).catch((err) => {
          console.log("ERROR Not submitted");
          droppedOps.push(op);
          this.set('connectionWarning', "Warning: connection issues mean that the autosave function has ceased working. We recommend you reload the site to avoid loosing work");
          this.set('showConnectionWarning', true);
          reject(err);
          return;
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
    const embed = this.get('isEmbedded');
    if(embed) {
      return true;
    }
    return model.data.dontPlay === "false" || !model.data.dontPlay;
  },
  preloadAssets: function() {
    console.log('preloadAssets')
    return new RSVP.Promise((resolve, reject)=> {
      let model = this.get('model');
      if(!isEmpty(model.data.assets))
      {
        this.set("hudMessage", "Preloading Assets");
        this.set("showHUD", true);
        this.get('assetService').preloadAssets(model.data.assets, model.id)
        .then(()=>{
          this.showFeedback("");
          this.set("showHUD", false);
          resolve();
        }).catch((err)=>{
          this.showFeedback("");
          this.set("showHUD", false);
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
          console.log("error updateSourceFromSession - updateDoc", err);
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
        console.log("updateiframe", model.id)
        this.get('documentService').getCombinedSource(model.id, true, toRender)
        .then((combined) => {
          this.get('cs').clear();
          if(selection)
          {
            this.flashSelectedText();
            document.getElementById("output-iframe").contentWindow.eval(combined);
            this.get('documentService').updateDoc(model.id, 'newEval', combined)
            .catch((err)=>{
              console.log('error updating doc', err);
            });

          }
          else
          {
            this.set('renderedSource', combined);
          }
          this.updateLinting();
        });
      }).catch((err)=>{console.log(err)});
    }).catch((err)=>{console.log(err)});
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
    //console.log("session change")
    if(!surpress && this.get('droppedOps').length == 0)
    {
      const editor = this.editor;
      const session = editor.getSession();

      this.incrementProperty('editCtr');

      if(!this.get('opsPlayer').atHead())
      {
        console.log("not at head", doc.data.source, session.getValue());
        this.submitOp({p: ["source", 0], sd: doc.data.source});
        this.submitOp({p: ["source", 0], si: session.getValue()});
      }
      else
      {
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
      }

      this.get('opsPlayer').reset(doc.id);

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
    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    }
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
    const drag = self.get('showCodeControls');
    if (e.origin === config.localOrigin && drag && !isEmpty(e.data))
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
      console.log("NO USER OR MODEL")
      this.set('canEditDoc', false);
      this.set('showReadOnly', true);
      this.set('isOwner', false);
      return;
    }
    if(currentUser != model.data.ownerId)
    {
      console.log("NOT OWNER")
      this.set('isOwner', false);
      if(model.data.readOnly)
      {
        console.log("READ ONLY")
        this.set('canEditDoc', false);
        this.set('showReadOnly', true);
        return;
      }
    }
    else
    {
      this.set('isOwner', true);
      this.set('canEditDoc', true);
      this.set('showReadOnly', false);
      console.log("IS OWNER")
      return;
    }
    console.log("IS DESKTOP?", this.get('mediaQueries.isDesktop'))
    this.set('showReadOnly', false);
    this.set('canEditDoc', this.get('mediaQueries.isDesktop'));
  },
  deleteCurrentDocument: function() {
    let model = this.get('model');
    if (confirm('Are you sure you want to delete?')) {
      console.log("deleting root doc");
      this.get('documentService').deleteDoc(model.id).then(() => {
        console.log("completed deleting root doc and all children + assets");
        this.transitionToRoute('application');
      }).catch((err) => {
        console.log("error deleting doc", err);
      });
    }
  },
  resetScrollPositions: function() {
    var scrollPositions = {}
    scrollPositions[this.get('model').id] = 0;
    this.get('children').forEach((child)=> {
      scrollPositions[child.id] = 0;
    });
    this.set('scrollPositions', scrollPositions);
  },
  updateScrollPosition: function() {
    const range = this.getSelectionRange();
    this.get('scrollPositions')[this.get('currentDoc').id] = range.start.row
    //console.log("SCROLL POS", this.get('scrollPositions'))
  },
  scrollToSavedPosition: function() {
    const pos = this.get('scrollPositions')[this.get('currentDoc').id];
    const editor = this.get('editor');
    //console.log("scrolling to ", pos)
    //editor.renderer.scrollCursorIntoView({row: pos, column: 1}, 0.5)
    editor.resize(true);
    editor.gotoLine(pos);
    editor.scrollToLine(pos, true, true, {})
    Ember.run.scheduleOnce('render', this, () => editor.renderer.updateFull(true));
  },
  skipOp:function(prev, rewind = false) {
    const update = ()=> {
      const editor = this.get('editor');
      const doc = this.get('currentDoc').id;
      const apply = (deltas) => {
        this.set('surpress', true);
        editor.session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      }
      if(prev)
      {
        this.get('opsPlayer').prevOp(editor, rewind)
        .then((deltas)=>{apply(deltas)});
      }
      else
      {
        this.get('opsPlayer').nextOp(editor, rewind)
        .then((deltas)=>{apply(deltas)});
      }
    }
    if(this.get('opsPlayer').atHead())
    {
      this.updateSourceFromSession().then(update).catch((err)=>{console.log(err)})
    }
    else
    {
      update();
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
            console.log('error updating doc', err);
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
        this.set('showConnectionWarning', false);
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
    this.set('isPlayingOps', false);
    if(this.get('opsInterval'))
    {
      clearInterval(this.get('opsInterval'));
    }
  },
  playOps: function() {
    this.pauseOps();
    this.set('isPlayingOps', true);
    this.set('opsInterval', setInterval(()=> {
      this.skipOp(false);
      if(this.get('opsPlayer').reachedEnd)
      {
        this.set('isPlayingOps', false);
        clearInterval(this.get('opsInterval'));
      }
    }, 100));
  },
  hijackConsoleOutput: function() {
    (()=>{
        // var oldLog = console.log;
        // console.log = (msg) => {
        //     this.set("consoleOutput", this.get('consoleOutput') + "\n" + msg);
        //     oldLog.apply(console, arguments);
        // };
        // var oldWarn = console.warn;
        // console.warn = (msg) => {
        //     this.set("consoleOutput", this.get('consoleOutput') + "\n" + msg);
        //     oldWarn.apply(console, arguments);
        // };
        // var oldError = console.error;
        // console.error = (msg) => {
        //     this.set("consoleOutput", this.get('consoleOutput') + "\n" + msg);
        //     oldError.apply(console, arguments);
        // };
    })();
  },
  updatePlayButton: function() {
    let update = (button)=> {
      if(!isEmpty(button))
      {
        if(!this.get('doPlay'))
        {
          $(button).find(".glyphicon").removeClass("glyphicon-play").addClass("glyphicon-pause");
        }
        else
        {
          $(button).find(".glyphicon").removeClass("glyphicon-pause").addClass("glyphicon-play");
        }
      }
    }
    update(document.getElementById("code-play-btn"));
    update(document.getElementById("embedded-run-button"));
  },
  updateTabbarLocation: function() {
    const aceW = this.get('aceW');
    let tab = document.getElementById('project-tabs');
    if(tab)
    {
      tab.style.width = aceW
    }
  },
  hideCode: function(doHide) {
    const container = document.getElementById('ace-container');
    $(container).addClass(doHide ? 'hiding-code' : 'showing-code');
    $(container).removeClass(!doHide ? 'hiding-code' : 'showing-code');
    this.set("isDragging", false);
    const tab = document.getElementById("project-tabs");
    $(tab).addClass(doHide ? 'hiding-code' : 'showing-code');
    $(tab).removeClass(!doHide ? 'hiding-code' : 'showing-code');
    setTimeout(()=> {
      const max = 2 * document.getElementById("main-code-container").clientWidth / 3;
      const w = this.get("isEmbeddedWithCode") ? max + "px" : container.clientWidth + "px";
      this.set('isShowingCode', !doHide);
      this.set('aceW', doHide ? "30px" : w);
    }, 200)
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      editor.setOption("enableBasicAutocompletion", true)
      console.log('editor ready', editor)
      this.set("hudMessage", "Loading Code");
      this.set("showHUD", true);
      this.clearTabs();
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
        console.log('error updating doc', err);
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
            console.log('error updating doc', err);
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
          this.get('sessionAccount').updateOwnedDocuments().then(()=> {
            console.log("owneddocs", this.get('sessionAccount').ownedDocuments);
            this.transitionToRoute('code-editor',this.get('sessionAccount').ownedDocuments.firstObject.id);
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
      console.log("assetProgress", e.percent);
      if(parseInt(e.percent) < 100)
      {
        $("#asset-progress").css("display", "block");
        $("#asset-progress").css("width", (parseInt(e.percent))+"%");
      }
      else
      {
        $("#asset-progress").css("display", "none");
      }
    },
    assetUploaded(e) {
      console.log("assetComplete", e);
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
      }).catch((err)=>{console.log('ERROR updating doc with asset', err)});
    },
    assetUploadingComplete() {
      console.log("all uploads complete")
      document.getElementById("uploaded-assets-container").style['background-color'] = 'yellow';
      setTimeout(()=> {
        document.getElementById("uploaded-assets-container").style['background-color'] = 'inherit';
      }, 500);
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
            }).catch((err)=>{console.log(err)});
          }).catch((err)=>{
            console.log('ERROR deleting asset', err, asset);
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
          console.log('error updating doc', err);
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
          console.log('error updating doc', err);
        });
      }
    },
    toggleAutoRender() {
      this.toggleProperty('autoRender');
    },
    toggleShowSettings() {
      this.toggleProperty('showSettings');
    },
    toggleLibraryDropdown(){
      document.getElementById("myDropdown").classList.toggle("show");
    },
    insertLibrary(lib) {
      this.updateSourceFromSession().then(()=>{
        const op = this.get('codeParser').insertLibrary(lib.id, this.get('model.data.source'))
        this.submitOp(op);
        this.set('surpress', true);
        const deltas = this.get('codeParser').opTransform([op], this.get('editor'));
        this.get('editor.session').getDocument().applyDeltas(deltas);
        this.set('surpress', false);
        document.getElementById("myDropdown").classList.toggle("show");
      })
    },
    toggleShowShare() {
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
        this.set('fetchingDoc', false);
        this.set('showHUD', false);
        this.showFeedback("");
        this.set('renderedSource',"");
        this.set('droppedOps', []);
        this.set("consoleOutput", "");
        this.get('cs').clear();
        this.get('cs').clearObservers();
        if(this.get('wsAvailable'))
        {
          this.cleanUpConnections();
        }
        console.log('cleaned up');
        this.removeWindowListener();
      }
      this.set('leftCodeEditor', true);
      const actions = [this.updateSourceFromSession(), this.updateEditStats(), this.updateSavedVals()];
      Promise.all(actions).then(() => {fn();}).catch(()=>{fn();});
    },
    refresh() {
      this.refreshDoc();
    },

    //MOUSE LISTENERS
    mouseDown(e) {
      //console.log('mouseDown',e.target);
      this.set('isDragging', true);
      const startWidth = document.querySelector('#ace-container').clientWidth;
      const startX = e.clientX;
      this.set('startWidth', startWidth);
      this.set('startX', startX);
      let overlay = document.querySelector('#output-iframe');
      overlay.style["pointer-events"] = "none";
      let playback = document.querySelector('#playback-container');
      playback.style["pointer-events"] = "none";
      let overlay2 = document.querySelector('#output-container');
      overlay2.style["pointer-events"] = "auto";
    },
    mouseUp(e) {
      //console.log('mouseup',e.target);
      this.set('isDragging', false);
      let overlay = document.querySelector('#output-iframe');
      overlay.style["pointer-events"] = "auto";
      let playback = document.querySelector('#playback-container');
      playback.style["pointer-events"] = "auto";
      let overlay2 = document.querySelector('#output-container');
      overlay2.style["pointer-events"] = "none";
    },
    mouseMove(e) {
      if(this.get('isDragging'))
      {
        //console.log('mouseMove',e.target);
        this.set('aceW',(this.get('startWidth') - e.clientX + this.get('startX')) + "px");
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
      this.hideCode(true);
    },
    showCode() {
      this.hideCode(false);
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
      this.playOps();
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
      console.log('new tab', docId);
      this.fetchChildren().then(()=>{
        const children = this.get('model').children;
        const newChild = children[children.length-1]
        this.resetScrollPositions();
        //this.newDocSelected(newChild);
      });
    },
    tabSelected(docId) {
      console.log('tab selected', docId);
      this.updateSourceFromSession().then(()=> {
        this.updateScrollPosition();
        const doc = this.get("currentDoc");
        var currentDocId = "";
        if(!isEmpty(doc))
        {
          currentDocId = doc.data.documentId
        }
        if(docId != currentDocId)
        {
          this.newDocSelected(docId).then(()=> {
            this.fetchChildren()
          });
        }
      }).catch((err)=>{
        console.log('ERROR', err)
      });
    },
    tabDeleted(docId) {
      if(self.get('isOwner'))
      {
        console.log('deleting tab', docId);
        if (confirm('Are you sure you want to delete?')) {
          //SWITCH TO HOME TAB FIRST
          this.newDocSelected(this.get('model').id).then(()=>{
            this.get('documentService').deleteDoc(docId).then(()=> {
              const children = this.get('model').data.children;
              var newChildren = children.filter((c) => {return c != docId})
              this.get('documentService').updateDoc(this.get('model').id, "children", newChildren)
              .then(()=> {
                console.log("Did delete child from parent model", this.get('model').data.children);
                this.fetchChildren().then(()=>{
                  this.resetScrollPositions();
                });
              }).catch((err)=> {
                console.log(err);
              })
            }).catch((err)=> {
              console.log(err);
            })
          });
        }
      }
    }
  }
});
