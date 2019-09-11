import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'sharedb/lib/client';
import ReconnectingWebSocket from 'reconnecting-websocket';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';
import { htmlSafe } from '@ember/template';
import { computed } from '@ember/object';
import { scheduleOnce } from '@ember/runloop';
import RSVP from 'rsvp';
import HTMLHint from 'htmlhint';

export default Controller.extend({
  //Query Params
  queryParams:["showCode","embed"],

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
  aceW:"",
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
  isMobile:false,

  showHUD:true,
  hudMessage:"Loading...",

  //Computed parameters

  aceStyle: computed('aceW', function() {
    this.updateDragPos();
    const aceW = this.get('aceW');
    const display = this.get('showCodeControls') ? "inline":"none";
    //this.get('cs').log("updating ace style", aceW, display)
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
      if(!this.get('leftCodeEditor'))
      {
        this.set('isMobile', !(this.get('mediaQueries').isDesktop) && (!this.get('isEmbeddedWithCode') || !this.get('isEmbedded')));
        this.get('cs').log("isMobile", this.get('isMobile'));
        document.getElementById("ace-container").style.visibility = this.get('isMobile') ? "hidden":"visible";
        if(this.get("mediaQueries.isDesktop"))
        {
          this.updateDragPos();
        }
      }
    });

  },
  begin: function() {
    this.get('cs').log("beginning");
    this.set("hudMessage", "");
    this.set("showHUD", true);
    this.clearTabs();
    this.initShareDB();
  },
  initShareDB: function() {
    this.get('cs').log('initShareDB');
    this.set('leftCodeEditor', false);
    this.initWebSockets();
    this.addWindowListener();
    this.initUI();
  },
  initUI: function() {
    this.set('collapsed', true);
    this.get('cs').log("hello world", "hello world","hello world","hello world");
    setTimeout(()=> {
      const embed = this.get('embed') == "true";
      const embedWithCode = this.get('showCode') == "true";
      this.get('cs').log("embed",embed,"embedWithCode",embedWithCode)
      this.set('isEmbedded', embed);
      this.set('isEmbeddedWithCode', embedWithCode);
      this.set('isMobile', !(this.get('mediaQueries').isDesktop) && (!this.get('isEmbeddedWithCode') || !this.get('isEmbedded')));
      this.get('cs').log("isMobile", this.get('isMobile'));
      this.set('showCodeControls', !(embed && !embedWithCode) || this.get('isDesktop'));
      this.set("aceW", embedWithCode ? "0px" : ($(window).width() / 2)  + "px");
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
      $("#mimic-footer").css("display", embed ? "none" : "block");
      $("#main-site-container").css("padding-left", embed ? "0%" : "8%");
      $("#main-site-container").css("padding-right", embed ? "0%" : "8%");
      this.updateDragPos();
      this.get('cs').observers.push(this);
    },50)
  },
  initWebSockets: function() {
    let socket = this.get('socket');
    this.get('cs').log("init websockets", socket);
    if(!isEmpty(socket) && socket.state == 1)
    {
      this.get('cs').log("websocket is empty")
      socket.onclose = ()=> {
        this.get('cs').log("websocket closed, reopening");
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
          if(this.get('leftCodeEditor'))
          {
            this.get('cs').log("opened connection but had already left code editor")
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
          this.get('cs').log("web socket error");
          this.websocketError();
        }
        socket.onclose =  () =>  {
          this.get('cs').log("websocket closed, calling error");
          this.websocketError();
        }
        socket.onmessage = (event) =>  {
          this.get('cs').log("web socket message", event);
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
        this.get('cs').log("web sockets not available");
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
    this.get('cs').log("websocket error")
    this.set('wsAvailable', false);
    this.cleanUpConnections().then(()=>{
      if(!this.get('fetchingDoc') && !this.get('leftCodeEditor'))
      {
        this.get('cs').log("selecting doc")
        this.selectRootDoc();
      }
    })
  },
  newDocSelected: function(docId) {
    this.get('cs').log("newDocSelected")
    return new RSVP.Promise((resolve, reject)=> {
      let doc = this.get('currentDoc');
      this.get('cs').log("newDocSelected", docId);
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
    this.get('cs').log("selectRootDoc")
    this.newDocSelected(this.get('model').id).then(()=> {
      this.updateTabbarLocation();
      this.get('cs').log("loaded root doc, preloading assets");
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
      this.get('cs').log("connectToDoc doc");
      this.set('fetchingDoc', true);
      if(this.get('wsAvailable'))
      {
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
        this.get('cs').log("found record");
        resolve(doc);
      });
    })
  },
  didReceiveDoc: function() {
    this.get('cs').log("isMobile", this.get('isMobile'));
    document.getElementById("ace-container").style.visibility = this.get('isMobile') ? "hidden":"visible";
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      this.get('opsPlayer').reset(doc.id);
      const editor = this.get('editor');
      this.get('cs').log("didReceiveDoc", doc.get('data').type);
      if(!isEmpty(doc.get('data').parent))
      {
        let lang = this.get('codeParser').getLanguage(doc.get('data').source);
        if(isEmpty(lang))
        {
          editor.setOption("mode","htmlmixed");
        }
        else if (lang == "css")
        {
          editor.setOption("mode","css");
        }
        else if (lang == "javascript")
        {
          editor.setOption("mode","javascript");
        }
      }
      else
      {
        editor.setOption("mode","htmlmixed");
      }
      this.set('surpress', true);
      editor.setValue(doc.get('data').source);
      editor.clearHistory();
      editor.refresh();
      this.set('surpress', false);
      this.set('savedVals', doc.get('data').savedVals);
      this.setCanEditDoc();
      let stats = doc.get('data').stats;
      stats.views = parseInt(stats.views) + 1;
      this.get('documentService').updateDoc(this.get('model').id, 'stats', stats)
      .catch((err)=>{
        this.get('cs').log('error updating doc', err);
        reject(err);
        return;
      });
      this.get('cs').log("CAN EDIT?", this.get('canEditDoc'))
      editor.options.readOnly = !this.get('canEditDoc');
      this.set('showHUD', false);
      this.scrollToSavedPosition();
      this.set('titleName', doc.get('data').name + " by " + doc.get('data').owner);
      this.set('titleNoName', doc.get('data').name);
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
    this.get('cs').log("tabs", tabs);
    this.set('tabs', tabs);
  },
  fetchChildren: function() {
    this.get('cs').log("fetchChildren");
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
          this.get('cs').log("got children", data.children);
          this.set('children', data.children);
          this.setTabs(data.children);
          this.setParentData(data.parent.data);
          resolve();
        }).catch((err)=>{
          this.get('cs').log(err);
          reject(err);
        });
      }
    })
  },
  didReceiveOp: function (ops,source) {
    //this.get('cs').log("did receive op", ops, source)
    const embed = this.get('isEmbedded');
    //const editor = this.get('editor');
    if(!embed && ops.length > 0)
    {
      if(!source && ops[0].p[0] == "source")
      {
        this.set('surpress', true);
        // this.get('cs').log("applying remote op")
        // const deltas = this.get('codeParser').opTransform(ops, editor);
        // editor.session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      }
      else if (ops[0].p[0] == "assets")
      {
        // this.get('store').findRecord('document',this.get('model').id).then((toChange) => {
        //   toChange.set('assets',ops[0].oi);
        // });
        // this.get('cs').log("didReceiveOp", "preloadAssets")
        // this.preloadAssets();
      }
      else if (!source && ops[0].p[0] == "newEval")
      {
        document.getElementById("output-iframe").contentWindow.eval(ops[0].oi);
      }
      else if (!source && ops[0].p[0] == "children")
      {
        // this.get('cs').log(ops[0].oi)
        // this.get('documentService').updateDoc(this.get('model').id, "children", ops[0].oi)
        // .then(()=>{
        //   this.fetchChildren();
        // }).catch((err)=>{
        //   this.get('cs').log('error updating doc', err);
        // });
      }
    }
  },
  submitOp: function(op, retry = 0) {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      let droppedOps = this.get('droppedOps');
      //let droppedOps = [1,2,3]
      //this.get('cs').log("Submitting op")
      if(droppedOps.length > 0) {
        this.set('droppedOps', droppedOps.push(op));
        reject();
        return;
      }

      if(this.get('wsAvailable'))
      {
        const sharedDBDoc = this.get('sharedDBDoc');
        //this.get('cs').log("Submitting op on ws")
        try
        {
          sharedDBDoc.submitOp(op, (err) => {
            //this.get('cs').log("callback", err)
            if(err)
            {
              droppedOps.push(op);
              this.set('connectionWarning', "Warning: connection issues mean that the autosave function has ceased working. We recommend you reload the site to avoid losing work")
              this.set('showConnectionWarning', true);
              this.get('cs').log("error submitting op (ws)")
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
          if(isEmpty(this.get('model').data.parent))
          {
            this.set('connectionWarning', "Warning: Your document may have become corrupted. Please reload the page. If this problem persists, please fork this document to fix issues")
          }
          else
          {
            this.set('connectionWarning', "Warning: Your document may have become corrupted. Please reload the page. If this problem persists, we recommend you create a new tab, copy acorss your code and delete this one.")
          }

          this.set('showConnectionWarning', true);
          this.get('cs').log("error submitting op (ws)",err)
          reject(err);
        }
      }
      else
      {
        this.get('documentService').submitOp(op, doc.id).then(() => {
          this.get('cs').log("did sumbit op",op);
          resolve();
          return;
        }).catch((err) => {
          this.get('cs').log("ERROR Not submitted");
          droppedOps.push(op);
          this.set('connectionWarning', "Warning: connection issues mean that the autosave function has ceased working. We recommend you reload the site to avoid losing work");
          this.set('showConnectionWarning', true);
          reject(err);
          return;
        });
      }
    });
  },
  doPlayOnLoad: function() {
    let model = this.get('model');
    const embed = this.get('isEmbedded');
    if(embed) {
      return true;
    }
    return model.get('data').dontPlay === "false" || !model.get('data').dontPlay;
  },
  preloadAssets: function() {
    this.get('cs').log('preloadAssets')
    return new RSVP.Promise((resolve, reject)=> {
      let model = this.get('model');
      if(!isEmpty(model.get('data').assets))
      {
        this.set("hudMessage", "Loading assets...");
        this.set("showHUD", true);
        this.get('assetService').preloadAssets(model.get('data').assets, model.id)
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
  getSelectedText: function()
  {
    const doc = this.get('editor').getDoc();
    let selection = doc.getSelection();
    if(selection.length === 0)
    {
      const line = this.get('editor').getCursor(true).line;
      selection = doc.getLine(line);
      this.get('cs').log(this.get('editor').getCursor(true), doc.getLine(line))
    }
    return selection;
  },
  updateSourceFromSession: function() {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc');
      if(!isEmpty(doc) && this.get('droppedOps').length == 0)
      {
        const source = this.get('editor').getValue();
        this.get('cs').log(this.get('editor'))
        //THIS DOESNT UPDATE THE ON THE SERVER, ONLY UPDATES THE EMBERDATA MODEL
        //BECAUSE THE "PATCH" REST CALL IGNORES THE SOURCE FIELD
        this.get('documentService').updateDoc(doc.id, "source", source)
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
        const mainText = model.get('data').source;
        let toRender = selection ? this.getSelectedText() : mainText;
        //this.get('cs').log("updateiframe", toRender)
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
        });
      }).catch((err)=>{this.get('cs').log(err)});
    }).catch((err)=>{this.get('cs').log(err)});
  },
  flashAutoRender:function()
  {
    let autoInput = document.getElementsByClassName('CodeMirror').item(0)
    autoInput.style["border-style"] = "solid"
    autoInput.style["border-width"] = "5px"
    autoInput.style["border-color"] = 'rgba(255, 102, 255, 150)'
    setTimeout(()=> {
        autoInput.style["border-style"] = "none"
    }, 250);
  },
  flashSelectedText: function() {
    const editor = this.get('editor');
    let start = editor.getCursor(true);
    let end = editor.getCursor(false);
    if(start.line == end.line && start.ch == end.ch)
    {
      this.get('cs').log("flash, single line");
      start = {line:start.line, ch:0};
      end = {line:end.line, ch:editor.getLine(end.line).length};
      this.get('cs').log("flash", start, end);
    }
    this.get('cs').log("flash", start, end);
    const marker = editor.getDoc().markText(start, end, {"className":"codeMirrorMarked"});
    setTimeout(()=> {
      marker.clear();
    }, 500);
  },
  onCodingFinished: function() {
    if(this.get('autoRender'))
    {
      this.flashAutoRender();
      this.updateIFrame();
    }
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
    //this.get('cs').log("session change, surpress", surpress);
    if(!surpress && this.get('droppedOps').length == 0)
    {
      const editor = this.get('editor');
      this.incrementProperty('editCtr');

      if(!this.get('opsPlayer').atHead())
      {
        this.get('cs').log("not at head", doc.get('data').source, editor.getValue());
        this.submitOp({p: ["source", 0], sd: doc.get('data').source});
        this.submitOp({p: ["source", 0], si: editor.getValue()});
      }
      else
      {
        const ops = this.get('codeParser').getOps(delta, editor);
        ops.forEach((op)=>{
          this.submitOp(op);
        })
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
    this.get('cs').log("setCanEditDoc")
    if(isEmpty(currentUser) || isEmpty(model.get('data')))
    {
      this.get('cs').log("NO USER OR MODEL")
      this.set('canEditDoc', false);
      this.set('showReadOnly', true);
      this.set('isOwner', false);
      return;
    }
    if(currentUser != model.get('data').ownerId)
    {
      this.get('cs').log("NOT OWNER")
      this.set('isOwner', false);
      if(model.get('data').readOnly)
      {
        this.get('cs').log("READ ONLY")
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
      this.get('cs').log("IS OWNER")
      return;
    }
    this.get('cs').log("IS DESKTOP?", this.get('mediaQueries.isDesktop'))
    this.set('showReadOnly', false);
    this.set('canEditDoc', this.get('mediaQueries.isDesktop'));
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
  resetScrollPositions: function() {
    var scrollPositions = {}
    scrollPositions[this.get('model').id] = 0;
    this.get('children').forEach((child)=> {
      scrollPositions[child.id] = 0;
    });
    this.set('scrollPositions', scrollPositions);
  },
  updateScrollPosition: function() {
    this.get('scrollPositions')[this.get('currentDoc').id] = this.get('editor').getCursor(true);
  },
  scrollToSavedPosition: function() {
    const pos = this.get('scrollPositions')[this.get('currentDoc').id];
    this.get('editor').scrollIntoView(pos);
  },
  updateDragPos: function() {
    const aceW = parseInt(this.get('aceW').substring(0, this.get('aceW').length-2));
    const drag = document.getElementById('drag-container')
    if(!isEmpty(drag))
    {
      drag.style.right = (aceW - 31) + "px";
    }
    const tab = document.getElementById('project-tabs');
    if(!isEmpty(tab))
    {
      tab.style.width = aceW + "px"
    }
    const editor = this.get('editor');
    if(!isEmpty(editor))
    {
      editor.refresh();
    }
  },
  skipOp:function(prev, rewind = false) {
    const update = ()=> {
      return new RSVP.Promise((resolve, reject)=> {
        const editor = this.get('editor');
        this.set('surpress', true);
        this.get('cs').log("SURPRESSING");
        if(prev)
        {
          this.get('opsPlayer').prevOp(editor, rewind).then(()=>{resolve()});
        }
        else
        {
          this.get('opsPlayer').nextOp(editor, rewind).then(()=>{resolve()});
        }
      });

    }
    if(this.get('opsPlayer').atHead())
    {
      this.updateSourceFromSession().then(()=> {
        update().then(()=>{
          this.set('surpress', false);
          this.get('cs').log("UNSURPRESSING");
        });
      }).catch((err)=>{this.get('cs').log(err)})
    }
    else
    {
      update().then(()=>{
        this.set('surpress', false);
        this.get('cs').log("UNSURPRESSING");
      });
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
      let stats = model.get('data').stats ? model.get('data').stats : {views:0,forks:0,edits:0};
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
        this.set('titleName', "");
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
        // var oldLog = this.get('cs').log;
        // this.get('cs').log = (msg) => {
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
    let container = document.getElementById('ace-container');
    $(container).addClass(doHide ? 'hiding-code' : 'showing-code');
    $(container).removeClass(!doHide ? 'hiding-code' : 'showing-code');
    this.set("isDragging", false);
    const tab = document.getElementById("project-tabs");
    $(tab).addClass(doHide ? 'hiding-code' : 'showing-code');
    $(tab).removeClass(!doHide ? 'hiding-code' : 'showing-code');
    setTimeout(()=> {
      const w = ($(window).width() / 2)  + "px";
      this.set('isShowingCode', !doHide);
      this.get('cs').log("setting aceW to ", doHide ? "30px" : w);
      this.set('aceW', doHide ? "30px" : w);
    }, 200)
  },
  actions: {

    //codemirror
    onEditorReady(editor) {
      this.set('editor', editor);
      this.begin();
    },
    onSessionChange(cm, change) {
      this.set('editor', cm);
      this.onSessionChange(change);
    },
    onReevaluate() {
      this.updateIFrame(true);
    },

    suggestCompletions(editor, options) {
      this.get('cs').log("CUSTOM COMPLETIONS");
      let targets = [];
      const assets = this.get('model').data.assets;
      if(!isEmpty(assets))
      {
        targets = targets.concat(this.get('autocomplete').assets(assets));
      }
      const children = this.get('children');
      if(!isEmpty(children))
      {
        targets = targets.concat(this.get('autocomplete').tabs(children));
      }

      return this.get('autocomplete').toFind(editor, options, targets);
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
        let flags = parseInt(model.get('data').flags);
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
        let stats = model.get('data').stats ? model.get('data').stats : {views:0,forks:0,edits:0};
        stats.forks = parseInt(stats.forks) + 1;
        let actions = [this.get('documentService').updateDoc(model.id, 'stats', stats),
                      this.get('documentService').forkDoc(model.id, this.get('children'))];
        Promise.all(actions).then(()=>{
          this.get('sessionAccount').updateOwnedDocuments().then(()=> {
            this.get('cs').log("owneddocs", this.get('sessionAccount').ownedDocuments);
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
      alert("Error uploading there is a 100MB limit to assets");
    },
    assetProgress(e) {
      this.get('cs').log("assetProgress", e.percent);
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
      this.get('cs').log("assetComplete", e);
      $("#asset-progress").css("display", "none");
      const doc = this.get('model');
      let newAssets = doc.get('data').assets;
      newAssets.push(e);
      const actions = [
        this.get('documentService').updateDoc(doc.id, "assets", newAssets),
        this.get('documentService').updateDoc(doc.id, "assetQuota", e.size + doc.data.assetQuota)
      ];
      Promise.all(actions).then(()=>{
        if(!this.get('wsAvailable'))
        {
          this.refreshDoc();
        }
      }).catch((err)=>{this.get('cs').log('ERROR updating doc with asset', err)});
    },
    assetUploadingComplete() {
      this.get('cs').log("all uploads complete")
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
          this.get('cs').log("deleting asset", asset)
          this.get('assetService').deleteAsset(asset).then(()=> {
            const doc = this.get('model');
            let newAssets = doc.get('data').assets;
            newAssets = newAssets.filter((oldAsset) => {
                this.get('cs').log(oldAsset.name,asset)
                return oldAsset.name !== asset
            });
            let totalSize = 0;
            newAssets.forEach((a)=>{totalSize+=a.size});
            const actions = [
              this.get('documentService').updateDoc(doc.id, "assets", newAssets),
              this.get('documentService').updateDoc(doc.id, "assetQuota", totalSize)
            ];
            Promise.all(actions).then(()=>{
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
      var url = config.serverHost + "/asset/"+this.get('model').id + "/" + asset.name;
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
        model.get('data').isPrivate = !model.get('data').isPrivate;
        this.get('documentService').updateDoc(model.id, 'isPrivate', model.get('data').isPrivate)
        .catch((err)=>{
          this.get('cs').log('error updating doc', err);
        });
      }
    },
    toggleReadOnly() {
      if(this.get('canEditDoc'))
      {
        let model = this.get('model');
        model.get('data').readOnly = !model.get('data').readOnly;
        this.get('documentService').updateDoc(model.id, 'readOnly', model.get('data').readOnly)
        .catch((err)=>{
          this.get('cs').log('error updating doc', err);
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
        const deltas = this.get('codeParser').applyOps([op], this.get('editor'));
        this.set('surpress', false);
        document.getElementById("myDropdown").classList.toggle("show");
      })
    },
    toggleShowShare() {
      this.toggleProperty('showShare');
    },
    toggleShowAssets() {
      this.toggleProperty('showAssets');
      this.get('cs').log(this.get('showAssets'))
    },
    enterFullscreen() {
      var target = document.getElementById("main-code-container");
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
        this.get('cs').log("clean up")
        this.set('fetchingDoc', false);
        this.set('showHUD', false);
        this.showFeedback("");
        this.set('renderedSource',"");
        this.set('droppedOps', []);
        this.set("consoleOutput", "");
        this.set("titleName", "");
        this.get('cs').clear();
        this.get('cs').clearObservers();
        if(this.get('wsAvailable'))
        {
          this.cleanUpConnections();
        }
        this.get('cs').log('cleaned up');
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
      //this.get('cs').log('mouseDown',e.target);
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
      //this.get('cs').log('mouseup',e.target);
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
        //this.get('cs').log('mouseMove',e.target);
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
      this.get('editor').setValue("");
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
      this.get('cs').log('new tab', docId);
      this.fetchChildren().then(()=>{
        const children = this.get('model').children;
        const newChild = children[children.length-1]
        this.resetScrollPositions();
        //this.newDocSelected(newChild);
      });
    },
    tabSelected(docId) {
      this.get('cs').log('tab selected', docId);
      this.updateSourceFromSession().then(()=> {
        this.updateScrollPosition();
        const doc = this.get("currentDoc");
        var currentDocId = "";
        if(!isEmpty(doc))
        {
          currentDocId = doc.get('data').documentId
        }
        if(docId != currentDocId)
        {
          this.newDocSelected(docId).then(()=> {
            this.fetchChildren()
          });
        }
      }).catch((err)=>{
        this.get('cs').log('ERROR', err)
      });
    },
    tabDeleted(docId) {
      if(self.get('isOwner'))
      {
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
                this.fetchChildren().then(()=>{
                  this.resetScrollPositions();
                });
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
  }
});
