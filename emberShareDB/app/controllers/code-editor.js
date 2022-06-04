import Controller from '@ember/controller'
import { inject } from '@ember/service'
import ShareDB from 'sharedb/lib/client'
import ReconnectingWebSocket from 'reconnecting-websocket'
import config from '../config/environment'
import { isEmpty } from '@ember/utils'
import { htmlSafe } from '@ember/template'
import { computed } from '@ember/object'
import { scheduleOnce } from '@ember/runloop'
import RSVP from 'rsvp'
import { parseSnippetError } from '../helpers/snippet-errors'

export default Controller.extend({
  //Query Params
  queryParams: ['showCode', 'embed', 'viewer'],

  //Services
  websockets: inject('websockets'),
  mediaQueries: inject(),
  resizeService: inject('resize'),
  sessionAccount: inject('session-account'),
  assetService: inject('assets'),
  store: inject('store'),
  session: inject('session'),
  codeParser: inject('code-parsing'),
  modalsManager: inject('modalsManager'),
  documentService: inject('documents'),
  autocomplete: inject('autocomplete'),
  opsPlayer: inject('ops-player'),
  cs: inject('console'),
  library: inject(),
  snippet: inject(),
  currentSnip: {},

  //Parameters
  con: null,
  parentData: null,
  currentDoc: null,
  editor: null,
  suppress: false,
  codeTimer: null,
  isNotEdittingDocName: true,
  canEditSource: false,
  canEditSettings: false,
  isOwner: false,
  autoRender: true,
  codeTimerRefresh: 500,
  collapsed: true,
  showShare: false,
  showReadOnly: false,
  showRecordingPanel: false,
  showColabOptions: false,
  showAssets: false,
  showPreview: false,
  showSettings: false,
  showCodeControls: true,
  showConnectionWarning: false,
  isShowingCode: true,
  isDragging: false,
  startWidth: 0,
  startX: 0,
  codeW: '',
  savedVals: null,
  hideEditor: 'false',
  embed: 'false',
  titleName: '',
  wsAvailable: true,
  editCtr: 0,
  fontSize: 14,
  fetchingDoc: false,
  consoleOutput: '',
  feedbackTimer: null,
  doPlay: true,
  isPlayingOps: false,
  isRoot: true,
  isMobile: false,
  iframeTitle: 'title',
  prevEvalReceived: 0,
  gotFirstEval: false,
  updateSourceRate: 30000,
  updateSourceOnInterval: false,
  updateSourceInterval: undefined,
  evalPtr: 0,
  highContrast: false,
  showSnippetEditor: false,
  showErrorBar: false,
  snippetError: '',

  showHUD: true,
  hudMessage: 'Loading...',

  renderedSource: '',

  //Computed parameters

  aceStyle: computed('codeW', function () {
    this.updateDragPos()
    const codeW = this.get('codeW')
    const display = this.get('showCodeControls') ? 'inline' : 'none'
    //this.get('cs').log("updating ace style", codeW, display)
    return htmlSafe('width: ' + codeW + '; display: ' + display + ';')
  }),
  titleNoName: '',
  editLink: computed('model', function () {
    return config.localOrigin + '/code/' + this.get('model').id
  }),
  embedLink: computed('editLink', function () {
    return this.get('editLink') + '?embed=true'
  }),
  libraries: computed('library.libraryMap', function () {
    return this.get('library').libraryMap
  }),
  snippets: computed('snippet.snippetsMap', function () {
    return this.get('snippet').snippetsMap
  }),

  //Functions
  init: function () {
    this._super()
    this.set('tabs', [])
    this.set('droppedOps', [])
    this.set('cursors', {})
    this.set('children', [])
    this.set('recordingOptions', { isRecording: false })
    this.set('scrollPositions', {})
    // console.log("hijacking console")
    // this.hijackConsoleOutput();
    this.set('colabMode', config.colabMode)
    this.get('cs').log('colabMode', this.get('colabMode'))
    this.get('resizeService').on('didResize', () => {
      if (!this.get('leftCodeEditor')) {
        //Bound the code window
        const codeW = parseInt(
          this.get('codeW').substring(0, this.get('codeW').length - 2)
        )
        const containerW = document.getElementById(
          'main-code-container'
        ).offsetWidth
        if (codeW > containerW) {
          this.set('codeW', containerW + 'px')
        }
        this.set(
          'isMobile',
          !this.get('mediaQueries').isDesktop &&
            (!this.get('isEmbeddedWithCode') || !this.get('isEmbedded'))
        )
        this.get('cs').log('isMobile', this.get('isMobile'))
        document.getElementById('ace-container').style.visibility = this.get(
          'isMobile'
        )
          ? 'hidden'
          : 'visible'
        if (this.get('mediaQueries.isDesktop')) {
          this.updateDragPos()
        }
        this.syncOutputContainer()
      }
    })
  },
  begin: function () {
    this.get('cs').log('beginning')
    this.set('hudMessage', '')
    this.set('showHUD', true)
    this.clearTabs()
    this.set('wsAvailable', false)
    this.set('isViewer', this.get('viewer') == 'true')
    this.get('cs').log('selectRootDoc', 'begin')
    this.initFromUrl()
    this.selectRootDoc().then(() => {
      if (this.get('canEditSource')) {
        this.initShareDB()
      }
      this.initUI()
      this.addWindowListener()
    })
  },
  initViewer: function () {
    //Can't be a viewer and an editor
    if (this.get('canEditSource')) {
      this.set('isViewer', false)
    }
    if (this.get('isViewer')) {
      this.get('cs').log('initViewer')
      this.resetOpsPlayer()
    }
  },
  resetOpsPlayer: function () {
    if (this.get('isViewer')) {
      this.cleanUpOpPlayer()
      this.get('cs').log('starting op time (code editor)')
      this.get('opsPlayer')
        .startTimer(this.get('editor'))
        .then(() => {
          let didClear = false
          this.get('cs').log('started op time (code editor)')
          this.set(
            'viewerInterval',
            setInterval(() => {
              const playerOps = this.get('opsPlayer').getToSend()
              if (playerOps.length > 0) {
                playerOps.forEach((ops) => {
                  this.didReceiveOp(ops.op, null, ops.v)
                })
              }
              if (!didClear) {
                this.clearCursors()
                didClear = true
              }
            }, 100)
          )
        })
    }
  },
  initShareDB: function () {
    this.get('cs').log('initShareDB')
    this.set('leftCodeEditor', false)
    this.initWebSockets()
  },
  initFromUrl: function () {
    this.set('isEmbedded', this.get('embed') == 'true')
    this.set('isEmbeddedWithCode', this.get('showCode') == 'true')
  },
  initUI: function () {
    //this.set('collapsed', true);
    setTimeout(() => {
      const embed = this.get('isEmbedded')
      const embedWithCode = this.get('isEmbeddedWithCode')
      this.set(
        'isMobile',
        !this.get('mediaQueries').isDesktop &&
          (!this.get('isEmbeddedWithCode') || !this.get('isEmbedded'))
      )
      this.get('cs').log('isMobile', this.get('isMobile'))
      this.set(
        'showCodeControls',
        !(embed && !embedWithCode) || this.get('isDesktop')
      )
      this.set('codeW', embedWithCode ? '0px' : window.innerWidth / 2 + 'px')
      if (embed) {
        document.getElementById('main-code-container').style.height = '95vh'
        document.getElementById('main-code-container').style.width = '100vw'
        document.getElementById('output-container').style[
          'border-top-width'
        ] = 0
        document.getElementById('output-container').style[
          'border-bottom-width'
        ] = 0
        document.getElementById('output-container').style['border'] = 'none'
        document.getElementById('output-container').style['width'] = '100%'
        document.getElementById('output-container').style['height'] = '100%'
        document.getElementById('output-container').style['top'] = '0px'
        document.getElementById('output-container').style['left'] = '0px'
        document.getElementById('main-site-container').style.padding = '0px'
        document.getElementById('main-site-container').style.border = 'none'
      } else {
        document.getElementsByClassName('CodeMirror')[0].style.height = '80vh'
      }

      if (embedWithCode) {
        this.hideCode(true)
      }
      const nav = document.getElementById('mimic-navbar')
      nav.style.display = embed ? 'none' : 'block'
      const log = document.getElementById('login-container')
      log.style.top = '20px'
      const footer = document.getElementById('mimic-footer')
      footer.style.display = embed ? 'none' : 'block'
      const container = document.getElementById('main-site-container')
      container.style['padding-left'] = embed ? '0%' : '8%'
      container.style['padding-right'] = embed ? '0%' : '8%'
      this.updateDragPos()
      this.get('cs').observers.push(this)
    }, 50)
  },
  initWebSockets: function (onSelectDoc) {
    let socket = this.get('socket')
    this.get('cs').log('init websockets', socket)
    if (!isEmpty(socket) && socket.state == 1) {
      this.get('cs').log('websocket is empty')
      socket.onclose = () => {
        this.get('cs').log('websocket closed, reopening')
        this.set('socket', null)
        this.initWebSockets()
      }
      socket.close()
    } else {
      try {
        let url = this.get('model.isCollaborative')
          ? config.colabWsHost
          : config.wsHost
        if (isEmpty(url)) {
          url = config.wsHost
        }
        this.get('cs').log('connecting to', url)
        socket = new ReconnectingWebSocket(url)
        this.set('socket', socket)
        socket.onopen = () => {
          if (this.get('leftCodeEditor')) {
            this.get('cs').log(
              'opened connection but had already left code editor'
            )
          } else {
            this.set('wsAvailable', true)
            if (!this.get('fetchingDoc')) {
              this.get('cs').log('selectRootDoc', 'websockets')
              this.selectRootDoc().then(() => {
                if (onSelectDoc) {
                  onSelectDoc()
                }
              })
            }
          }
        }
        socket.onerror = () => {
          this.get('cs').log('web socket error')
          this.websocketError()
        }
        socket.onclose = () => {
          this.get('cs').log('websocket closed, calling error')
          this.websocketError()
        }
        socket.onmessage = (event) => {
          this.get('cs').log('web socket message', event)
          const d = JSON.parse(event.data)
          if (d.a == 'init' && d.type == 'http://sharejs.org/types/JSONv0') {
            this.set('fetchingDoc', false)
            this.websocketError()
          }
        }
      } catch (err) {
        this.get('cs').log('web sockets not available')
        this.websocketError()
      }
    }
  },
  cleanUpOpPlayer: function () {
    //this.set("isViewer",false);
    this.set('prevEvalReceived', 0)
    this.set('gotFirstEval', false)
    this.get('opsPlayer').cleanUp()
    if (!isEmpty(this.get('viewerInterval'))) {
      clearInterval(this.get('viewerInterval'))
      this.set('viewerInterval', null)
    }
  },
  cleanUpShareDB: function () {
    if (this.get('wsAvailable') && !isEmpty(this.get('sharedDBDoc'))) {
      this.get('cs').log('clearning up sharedb')
      try {
        this.get('sharedDBDoc').destroy()
      } catch (err) {
        this.get('cs').log('error destroying sharedb connection', err)
      }
      this.set('sharedDBDoc', null)
    }
  },
  cleanUpConnections: function () {
    return new RSVP.Promise((resolve, reject) => {
      this.cleanUpShareDB()
      this.set('currentDoc', null)

      if (!isEmpty(this.get('socket'))) {
        this.get('socket').removeEventListener('error')
        this.get('socket').removeEventListener('open')
        this.get('socket').removeEventListener('close')
        this.get('socket').removeEventListener('message')
        this.get('socket').onclose = null
        this.get('socket').onopen = null
        this.get('socket').onmessage = null
        this.get('socket').onerror = null
        this.get('socket').close()
        this.set('socket', null)
      }
      if (!isEmpty(this.get('connection'))) {
        this.get('connection').close()
        this.set('connection', null)
      }
      resolve()
    })
  },
  websocketError: function () {
    this.get('cs').log('websocket error')
    this.set('wsAvailable', false)
    this.cleanUpConnections().then(() => {
      if (!this.get('fetchingDoc') && !this.get('leftCodeEditor')) {
        // this.get('cs').log("selecting doc")
        // this.selectRootDoc();
      }
    })
  },
  newDocSelected: function (docId) {
    this.get('cs').log('newDocSelected')
    return new RSVP.Promise((resolve, reject) => {
      let doc = this.get('currentDoc')
      this.get('cs').log('newDocSelected', docId)
      this.set('isRoot', docId == this.get('model').id)
      if (!isEmpty(doc)) {
        this.cleanUpShareDB()
        this.set('sharedDBDoc', null)
        this.set('currentDoc', null)
      }
      if (!this.get('fetchingDoc')) {
        this.connectToDoc(docId)
          .then((newDoc) => {
            this.set('currentDoc', newDoc)
            this.didReceiveDoc()
              .then(() => {
                resolve()
              })
              .catch((err) => reject(err))
          })
          .catch((err) => reject(err))
      }
    })
  },
  selectRootDoc: function () {
    this.get('cs').log('selectRootDoc')
    return new RSVP.Promise((resolve, reject) => {
      this.newDocSelected(this.get('model').id).then(() => {
        this.updateTabbarLocation()
        this.get('cs').log('loaded root doc, preloading assets')
        this.fetchChildren().then(() => {
          this.resetScrollPositions()
          this.preloadAssets().then(() => {
            if (this.doPlayOnLoad()) {
              this.updateIFrame()
            }
            this.set('doPlay', !this.doPlayOnLoad())
            this.updatePlayButton()
            if (config.colabMode === false) {
              this.set('model.isCollaborative', false)
            }
            const doc = this.get('currentDoc')
            if (isEmpty(this.get('model.collaborators'))) {
              this.set('model.collaborators', [])
              this.get('documentService').updateDoc(doc.id, 'collaborators', [])
            }
            this.startSyncTimer()
            this.initViewer()
            resolve()
          })
        })
      })
    })
  },
  //This function does really work well for viewer or collaborate modes
  //because its at odds with the ops (disabled at the moment)
  startSyncTimer: function () {
    if (this.get('updateSourceOnInterval') && this.get('isViewer')) {
      this.get('cs').log('setting update source interval')
      if (!isEmpty(this.get('updateSourceInterval'))) {
        clearInterval(this.get('updateSourceInterval'))
        this.set('updateSourceInterval', null)
      }
      this.set(
        'updateSourceInterval',
        setInterval(() => {
          this.updateSessionFromServer()
        }, this.get('updateSourceRate'))
      )
    }
  },
  connectToDoc: function (docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('cs').log('connectToDoc doc')
      this.set('fetchingDoc', true)
      if (this.get('wsAvailable')) {
        const socket = this.get('socket')
        let con = this.get('connection')
        if (isEmpty(con) && !isEmpty(socket)) {
          this.get('cs').log('connecting to ShareDB')
          con = new ShareDB.Connection(socket)
        }
        if (isEmpty(con) || con.state == 'disconnected' || isEmpty(socket)) {
          this.get('cs').log('failed to connect to ShareDB', con)
          this.set('wsAvailable', false)
          this.fetchDoc(docId).then((doc) => resolve(doc))
          return
        }
        this.set('connection', con)
        const sharedDBDoc = con.get(config.contentCollectionName, docId)
        sharedDBDoc.subscribe((err) => {
          if (err) throw err
          this.get('cs').log('subscribed to doc')
          if (!isEmpty(sharedDBDoc.data)) {
            this.set('sharedDBDoc', sharedDBDoc)
            this.fetchDoc(docId).then((doc) => resolve(doc))
          }
        })
        sharedDBDoc.on('op', (ops, source) => {
          this.didReceiveOp(ops, source)
        })
      } else {
        this.fetchDoc(docId).then((doc) => resolve(doc))
      }
    })
  },
  fetchDoc: function (docId) {
    return new RSVP.Promise((resolve, reject) => {
      this.get('store')
        .findRecord('document', docId)
        .then((doc) => {
          this.get('cs').log('found record')
          resolve(doc)
        })
    })
  },
  //A check to see if we have drifted or lost ops, resyncs if necessary
  updateSessionFromServer: function () {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc')
      this.get('documentService')
        .getSource(doc.id)
        .then((serverSource) => {
          const localSource = this.get('editor').getValue()
          if (serverSource !== localSource) {
            this.set('surpress', true)
            const scrollPos = this.get('editor').getCursor(true)
            this.get('editor').focus()
            var scrollInfo = this.get('editor').getScrollInfo()
            this.get('editor').setValue(serverSource)
            this.get('editor').scrollTo(scrollInfo.left, scrollInfo.top)
            this.get('editor').setCursor({
              line: scrollPos.line,
              ch: scrollPos.ch,
            })
            this.set('surpress', false)
            this.get('cs').log('local code out of sync with server')
            resolve()
          } else {
            this.get('cs').log('local code is in sync')
            resolve()
          }
        })
    })
  },
  updateSourceFromSession: function () {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc')
      if (!isEmpty(doc) && this.get('droppedOps').length == 0) {
        const source = this.get('editor').getValue()
        //THIS DOESNT UPDATE THE ON THE SERVER, ONLY UPDATES THE EMBERDATA MODEL
        //BECAUSE THE "PATCH" REST CALL IGNORES THE SOURCE FIELD
        const actions = [
          this.get('documentService').updateDoc(doc.id, 'source', source),
        ]
        Promise.all(actions)
          .then(() => resolve())
          .catch((err) => {
            this.get('cs').log('error updateSourceFromSession - updateDoc', err)
            reject(err)
          })
      } else {
        resolve()
      }
    })
  },
  reloadDoc: function () {
    const scrollPos = this.get('editor').getCursor(true)
    const editor = this.get('editor')
    this.get('cs').log('reloading doc')
    editor.options.readOnly = true
    editor.focus()
    var scrollInfo = this.get('editor').getScrollInfo()
    this.updateSessionFromServer().then(() => {
      this.updateSourceFromSession().then(() => {
        this.cleanUpConnections().then(() => {
          this.initWebSockets(() => {
            editor.focus()
            this.get('cs').log('scrolling cur', scrollPos.line, scrollPos.ch)
            editor.scrollTo(scrollInfo.left, scrollInfo.top)
            editor.setCursor({ line: scrollPos.line, ch: scrollPos.ch })
            editor.options.readOnly = !this.get('canEditSource')
          })
        })
      })
    })
  },
  setLanguage: function () {
    const editor = this.get('editor')
    const doc = this.get('currentDoc')
    let lang = 'htmlmixed'
    if (!isEmpty(doc.get('parent'))) {
      const analysedLang = this.get('codeParser').getLanguage(doc.get('source'))
      if (!isEmpty(analysedLang)) {
        lang = analysedLang
      }
      this.get('documentService').updateDoc(doc.id, 'type', lang)
    }
    editor.setOption('mode', lang)
  },
  didReceiveDoc: function () {
    this.get('cs').log('didReceiveDoc', this.get('isMobile'))
    document.getElementById('ace-container').style.visibility = this.get(
      'isMobile'
    )
      ? 'hidden'
      : 'visible'
    return new RSVP.Promise((resolve, reject) => {
      this.set('iframeTitle', this.get('model').id)
      const doc = this.get('currentDoc')
      this.get('opsPlayer').reset(doc.id)
      const editor = this.get('editor')
      this.get('cs').log('didReceiveDoc', doc.get('type'))
      this.setLanguage()
      this.set('surpress', true)
      editor.setValue(doc.get('source'))
      editor.clearHistory()
      editor.refresh()
      this.set('surpress', false)
      this.set('savedVals', doc.get('savedVals'))
      this.setCanEditDoc()
      let stats = doc.get('stats')
      stats.views = parseInt(stats.views) + 1
      this.get('documentService')
        .updateDoc(this.get('model').id, 'stats', stats)
        .catch((err) => {
          this.get('cs').log('error updating doc', err)
          reject(err)
          return
        })
      editor.options.readOnly = !this.get('canEditSource')
      this.get('cs').log(
        'CAN EDIT SOURCE?',
        this.get('canEditSource'),
        editor.options.readOnly
      )
      this.set('showHUD', false)
      this.scrollToSavedPosition()
      this.set('titleName', doc.get('name') + ' by ' + this.get('model.owner'))
      this.set('titleNoName', doc.get('name'))
      this.get('sessionAccount').set('currentDoc', this.get('model').id)
      this.set('fetchingDoc', false)
      this.get('cs').log('isEmbeddedWithCode', this.get('isEmbeddedWithCode'))
      if (this.get('isEmbeddedWithCode')) {
        this.foldHead()
      }
      resolve()
    })
  },
  setParentData: function (data) {
    const currentDoc = this.get('currentDoc')
    let isSelected = true
    if (!isEmpty(currentDoc)) {
      isSelected = data.documentId == currentDoc.id
    }
    this.set('parentData', {
      name: data.name,
      id: data.id,
      children: data.children,
      source: data.source,
      assets: data.assets,
      isSelected: isSelected,
    })
  },
  clearTabs: function () {
    this.setParentData({
      name: '',
      id: '',
      children: [],
      source: '',
      assets: '',
    })
    this.set('tabs', [])
  },
  setTabs: function (data) {
    const currentDoc = this.get('currentDoc')
    const tabs = data.map((child) => {
      const canDelete = this.get('canEditSettings') && child.id == currentDoc.id
      return {
        name: child.name,
        id: child.id,
        isSelected: child.id == currentDoc.id,
        canDelete: canDelete,
      }
    })
    this.get('cs').log('tabs', tabs)
    this.set('tabs', tabs)
    this.syncOutputContainer()
  },
  fetchChildren: function () {
    this.get('cs').log('fetchChildren')
    return new RSVP.Promise((resolve, reject) => {
      let model = this.get('model')
      if (model.children.length == 0) {
        this.set('tabs', [])
        this.set('children', [])
        this.setParentData({
          name: model.name,
          id: model.id,
          children: model.children,
          source: model.source,
          assets: model.assets,
        })
        resolve()
      } else {
        this.get('documentService')
          .getChildren(model.children)
          .then((data) => {
            this.get('cs').log('got children', data.children)
            this.set('children', data.children)
            this.setTabs(data.children)
            this.setParentData({
              name: this.get('model.name'),
              id: this.get('model.id'),
              children: this.get('model.children'),
              source: this.get('model.source'),
              assets: this.get('model.assets'),
            })
            resolve()
          })
          .catch((err) => {
            this.get('cs').log(err)
            reject(err)
          })
      }
    })
  },
  clearCursors() {
    this.get('cs').log('clearing cursors')
    const cursors = this.get('cursors')
    Object.keys(cursors).forEach((c) => {
      this.get('cs').log('removing', cursors[c])
      cursors[c].marker.clear()
    })
  },
  newCursor(op) {
    //this.get("cs").log(op)
    if (isEmpty(op.owner)) {
      return
    }
    const toUpdate = this.get('cursors')
    const prev = toUpdate[op.owner]
    if (!isEmpty(prev)) {
      prev.marker.clear()
    } else {
      toUpdate[op.owner] = {
        colour: config.colours[Math.floor(Math.random() * 5)],
      }
      this.get('cs').log(toUpdate[op.owner].colour)
    }

    const cursorPos = op.cursor
    const cm = this.get('editor')
    const cursorCoords = cm.cursorCoords(cursorPos)
    const h = cursorCoords.bottom - cursorCoords.top

    const container = document.createElement('span')
    container.style.height = `${h}px`
    container.classList.add('cursor-container')

    const label = document.createElement('span')
    label.classList.add('cursor-label')
    label.style.backgroundColor = toUpdate[op.owner].colour

    label.style.top = `${h}px`
    label.innerHTML = op.owner

    const line = document.createElement('span')
    line.classList.add('cursor-line')
    line.style.borderLeftColor = toUpdate[op.owner].colour

    container.appendChild(line)
    container.appendChild(label)

    toUpdate[op.owner].marker = cm.setBookmark(cursorPos, { widget: container })
    this.set('cursors', toUpdate)
  },
  didReceiveOp: function (ops, source, version = 0) {
    const editor = this.get('editor')
    const canReceiveOp = () => {
      return (
        (this.get('model.isCollaborative') || this.get('isViewer')) &&
        !this.get('isEmbedded')
      )
    }
    this.get('cs').log('didReceiveOp', ops, source, version)
    if (ops.length > 0 && canReceiveOp()) {
      let isFromOwner = false
      //json inserts have uuids (we might be able to remove these?)
      //source is true if it came from the local machine, seems reliable
      if (ops[0].oi !== undefined) {
        isFromOwner =
          ops[0].oi.uuid === this.get('sessionAccount').getSessionID()
      }
      //text ops have owners
      if (ops[0].owner !== undefined) {
        isFromOwner =
          ops[0].owner === this.get('sessionAccount').currentUserName
      }
      const isCodeUpdate = ops[0].p[0] === 'source'
      const isAssetUpdate =
        ops[0].p[0] == 'assetsUpdated' && !isEmpty(ops[0].oi)
      const isReevaluation = ops[0].p[0] === 'newEval' && !isEmpty(ops[0].oi)
      if (!source && !isFromOwner && isCodeUpdate) {
        this.set('surpress', true)
        this.get('opsPlayer').set('opsToApply', ops)
        let prevHistory = editor.doc.getHistory()
        this.get('opsPlayer').applyTransform(editor)
        let afterHistory = editor.doc.getHistory()
        //WE REMOVE ANY NEW ITEMS FROM THE UNDO HISTORY AS THEY DID NOT
        //COME FROM THE LOCAL EDITOR
        afterHistory.done = afterHistory.done.slice(0, prevHistory.done.length)
        editor.doc.setHistory(afterHistory)
        this.set('surpress', false)
        this.newCursor(ops[0])
      } else if (!source && !isFromOwner && isAssetUpdate) {
        this.get('cs').log(ops[0].oi)
        this.get('store')
          .findRecord('document', this.get('model').id)
          .then((toChange) => {
            toChange.set('assets', ops[0].oi.assets)
            this.get('cs').log('didReceiveOp', 'preloadAssets')
            this.preloadAssets()
          })
      }
      //If inserting (oi) a newEval
      else if (!source && !isFromOwner && isReevaluation) {
        console.log('newEval', version, ops, this.get('prevEvalReceived'))
        /*
        We need to filter out unwanted extra newEval ops
        When viewing, we get one extra and make sure the version is higher
        than the last.
        */
        let doFlash = false
        const date = ops[0].oi.date
        const doExecute =
          date > this.get('prevEvalReceived') || !this.get('gotFirstEval')
        if (doExecute) {
          this.set('surpress', true)
          this.set('gotFirstEval', true)
          this.set('prevEvalReceived', date)
          doFlash = true
          const code = ops[0].oi.code
          this.updateSavedVals()
          const savedVals = this.get('savedVals')
          let model = this.get('model')
          //We replace the assets etc... on this side (we are sent the raw code)
          this.get('documentService')
            .getCombinedSource(model.id, true, code, savedVals)
            .then((combined) => {
              console.log('executing', combined)
              try {
                document
                  .getElementById('output-iframe')
                  .contentWindow.eval(combined)
              } catch (err) {
                doFlash = false
                console.log('error evaluating received code', err)
              }
              if (doFlash && !isEmpty(ops[0].oi.pos)) {
                this.flashSelectedText(ops[0].oi.pos)
              }
            })
          this.set('surpress', false)
        } else {
          console.log('recieved but skipped')
        }
      } else if (!source && ops[0].p[0] == 'children') {
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
  submitOp: function (op, retry = 0) {
    return new RSVP.Promise((resolve, reject) => {
      const doc = this.get('currentDoc')
      const error = () => {
        this.reloadDoc()
        this.get('cs').log('FAKE error submitting op (ws)')
        reject()
      }
      if (this.get('wsAvailable')) {
        const sharedDBDoc = this.get('sharedDBDoc')
        //For testing purposes!!! definietly keep commented!!!
        //if(Math.random()>0.1) {
        if (true) {
          try {
            //this.get('cs').log("Submitting op on ws")
            sharedDBDoc.submitOp(op, (err) => {
              //this.get('cs').log("callback", err)
              if (!isEmpty(err) && op.p[0] !== 'trig') {
                error()
                return
              } else {
                resolve()
                return
              }
            })
          } catch (err) {
            this.get('cs').log('catch', err)
            if (op.p[0] !== 'trig') {
              error()
              return
            } else {
              resolve()
              return
            }
          }
        } else {
          //This is the else for a place where we simulate failed ops submissions
          error()
          return
        }
      } else {
        console.log('WARNING, websockets failed, attempting https to send op')
        this.get('documentService')
          .submitOp(op, doc.id)
          .then(() => {
            this.get('cs').log('did sumbit op', op)
            resolve()
            return
          })
          .catch((err) => {
            this.get('cs').log('ERROR Not submitted')
            error()
            return
          })
      }
    })
  },
  doPlayOnLoad: function () {
    let model = this.get('model')
    const embed = this.get('isEmbedded')
    if (embed) {
      return true
    }
    return model.get('dontPlay') === 'false' || !model.get('dontPlay')
  },
  preloadAssets: function () {
    this.get('cs').log('preloadAssets')
    return new RSVP.Promise((resolve, reject) => {
      let model = this.get('model')
      if (!isEmpty(model.get('assets'))) {
        this.set('hudMessage', 'Loading assets...')
        this.set('showHUD', true)
        this.get('assetService')
          .preloadAssets(model.get('assets'), model.id)
          .then(() => {
            this.showFeedback('')
            this.set('showHUD', false)
            resolve()
          })
          .catch((err) => {
            this.showFeedback('')
            this.set('showHUD', false)
            reject(err)
          })
      } else {
        resolve()
      }
    })
  },
  getSelectedText: function () {
    const doc = this.get('editor').getDoc()
    let selection = doc.getSelection()
    if (selection.length === 0) {
      const line = this.get('editor').getCursor(true).line
      selection = doc.getLine(line)
      this.get('cs').log(this.get('editor').getCursor(true), doc.getLine(line))
    }
    return selection
  },

  updateIFrame: function (selection = false) {
    this.updateSourceFromSession()
      .then(() => {
        this.fetchChildren()
          .then(() => {
            this.updateSavedVals()
            const savedVals = this.get('savedVals')
            let model = this.get('model')
            const mainText = this.get('model.source')
            let toRender = selection ? this.getSelectedText() : mainText
            this.get('documentService')
              .getCombinedSource(model.id, true, toRender, savedVals)
              .then((combined) => {
                this.get('cs').clear()
                if (selection) {
                  const pos = this.flashSelectedText()
                  this.get('cs').log('NEW EVAL', combined)
                  let doSend = true
                  try {
                    document
                      .getElementById('output-iframe')
                      .contentWindow.eval(combined)
                  } catch (err) {
                    console.log('ERROR EVAL', err)
                    doSend = false
                  }
                  if (doSend) {
                    //We send the uncombined raw text (eg without base64 assets etc..),
                    //and convert on the other side
                    const toSend = {
                      uuid: this.get('sessionAccount').getSessionID(),
                      code: toRender,
                      pos: pos,
                      date: new Date().getTime(),
                    }
                    this.set('evalPtr', this.get('evalPtr') + 1)
                    let op = {
                      p: ['newEval'],
                      oi: toSend,
                    }
                    console.log('sending op', op)
                    //Send then immediately delete
                    this.submitOp(op)
                      .then(() => {
                        let op = {
                          p: ['newEval'],
                          od: toSend,
                        }
                        this.submitOp(op)
                      })
                      .catch((err) => {
                        this.get('cs').log('error updating doc', err)
                      })
                    this.set('prevEval', toSend)
                  }
                } else {
                  combined = this.get('documentService').addRecording(
                    combined,
                    this.get('recordingOptions')
                  )
                  this.writeIframeContent(combined)
                }
              })
          })
          .catch((err) => {
            this.get('cs').log(err)
          })
      })
      .catch((err) => {
        this.get('cs').log(err)
      })
  },
  writeIframeContent: function (src) {
    const viewer = document.getElementById('output-iframe')
    if (!isEmpty(viewer)) {
      const cd = viewer.contentDocument
      if (!isEmpty(cd)) {
        const parent = document.getElementById('output-container')
        const newIframe = document.createElement('iframe')
        newIframe.setAttribute('id', 'output-iframe')
        newIframe.setAttribute('title', 'output-iframe')
        newIframe.setAttribute('name', this.get('iframeTitle'))
        parent.appendChild(newIframe)
        const newCd = newIframe.contentDocument
        newCd.open()
        try {
          newCd.write(src)
        } catch (err) {
          this.get('cs').log('error running code', err)
        }
        newCd.close()

        const delay = src == '' ? 0 : 10
        viewer.setAttribute('id', 'output-iframe-gone')
        setTimeout(() => {
          cd.open()
          try {
            cd.write('')
          } catch (err) {
            this.get('cs').log('error running code', err)
          }
          cd.close()
          viewer.parentNode.removeChild(viewer)
        }, delay)
      }
    }
  },
  flashAutoRender: function () {
    // let autoInput = document.getElementsByClassName('CodeMirror').item(0)
    // autoInput.style["border-style"] = "solid"
    // autoInput.style["border-width"] = "5px"
    // autoInput.style["border-color"] = 'rgba(255, 102, 255, 150)'
    // setTimeout(()=> {
    //     autoInput.style["border-style"] = "none"
    // }, 250);
  },
  flashSelectedText: function (pos) {
    const editor = this.get('editor')
    let start = editor.getCursor(true)
    let end = editor.getCursor(false)
    if (isEmpty(pos)) {
      if (start.line == end.line && start.ch == end.ch) {
        this.get('cs').log('flash, single line')
        start = { line: start.line, ch: 0 }
        end = { line: end.line, ch: editor.getLine(end.line).length }
        this.get('cs').log('flash', start, end)
      }
    } else {
      start = pos.start
      end = pos.end
    }
    this.get('cs').log('flash', start, end)
    const marker = editor
      .getDoc()
      .markText(start, end, { className: 'codeMirrorMarked' })
    setTimeout(() => {
      marker.clear()
    }, 500)
    return { start: start, end: end }
  },
  onCodingFinished: function () {
    if (this.get('autoRender')) {
      this.flashAutoRender()
      //this.writeIframeContent("");
      this.updateIFrame()
    }
    this.set('codeTimer', null)
  },
  restartCodeTimer: function () {
    if (this.get('codeTimer')) {
      clearTimeout(this.get('codeTimer'))
    }
    this.set(
      'codeTimer',
      setTimeout(() => {
        this.onCodingFinished()
      }, this.get('codeTimerRefresh'))
    )
  },
  onSessionChange: function (delta) {
    //dont send up the op if we're embedded (allows local code changes)
    if (this.get('isEmbeddedWithCode')) {
      return
    }
    const surpress = this.get('surpress')
    const doc = this.get('currentDoc')
    const editor = this.get('editor')
    if (this.get('highContrast')) {
      this.setAllCodeWhite()
    }
    //this.get('cs').log("session change, surpress", surpress);
    if (
      !surpress &&
      delta[0].origin !== 'playback' &&
      this.get('droppedOps').length == 0 &&
      this.get('canEditSource')
    ) {
      this.incrementProperty('editCtr')

      const ops = this.get('codeParser').getOps(delta, editor)
      ops.forEach((op) => {
        this.submitOp(op).catch((err) => {
          this.get('cs').log('error submitting op')
        })
      })
      if (isEmpty(doc.type)) {
        this.setLanguage()
      }
      this.get('opsPlayer').reset(doc.id)
      this.restartCodeTimer()
    }
  },
  addWindowListener: function () {
    this.removeWindowListener()
    var eventMethod = window.addEventListener
      ? 'addEventListener'
      : 'attachEvent'
    var eventer = window[eventMethod]
    window.self = this
    var messageEvent = eventMethod === 'attachEvent' ? 'onmessage' : 'message'
    eventer(messageEvent, this.handleWindowEvent, false)
    window.onclick = function (event) {
      if (!event.target.matches('.dropbtn')) {
        var dropdowns = document.getElementsByClassName('dropdown-content')
        var i
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i]
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show')
          }
        }
      }
    }
  },
  removeWindowListener: function () {
    var eventMethod = window.removeEventListener
      ? 'removeEventListener'
      : 'detachEvent'
    var eventer = window[eventMethod]
    window.self = null
    var messageEvent = eventMethod === 'detachEvent' ? 'onmessage' : 'message'
    eventer(messageEvent, this.handleWindowEvent, false)
  },
  handleWindowEvent: (e) => {
    const self = e.target.self
    const drag = self.get('showCodeControls')
    if (e.origin === config.localOrigin && drag && !isEmpty(e.data)) {
      if (e.data[0] && e.data[0].substring(0, 2) == 'p_') {
        let savedVals = self.get('savedVals')
        savedVals[e.data[0]] = e.data[1]
        // if(this.get('isCollaborative'))
        // {
        //   let code = e.data[0] + " = " + e.data[1];
        //   self.get('documentService').updateDoc(self.model.id, 'newEval', code)
        //   .catch((err)=>{
        //     self.get('cs').log('error updating doc', err);
        //   });
        // }
        self.set('savedVals', savedVals)
        //this.get('cs').log(e.data[0], e.data[1])
      } else if (e.data[0] === 'console') {
        for (let i = 1; i < e.data.length; i++) {
          self.get('cs').logToScreen(e.data[i])
        }
      } else if (e.data[0] === 'fl_stats') {
        self
          .get('documentService')
          .updateDoc(self.get('model.id'), 'stats', e.data)
          .then(() => {
            self.printFl(self)
          })
      }
    }
  },
  printFl: function (self) {
    self
      .get('opsPlayer')
      .loadOps()
      .then((ops) => {
        ops.forEach((op) => {
          if (op.op !== undefined) {
            if (op.op[0].p[0] === 'stats' && op.op[0].oi[0] === 'fl_stats') {
              self.get('cs').log(op.op[0].oi[1])
            }
          }
        })
      })
  },
  update: function () {
    this.set('consoleOutput', this.get('cs').output)
    var textarea = document.getElementById('console')
    textarea.scrollTop = textarea.scrollHeight
  },
  isCollaborator: function () {
    let currentUserName = this.get('sessionAccount').currentUserName
    if (isEmpty(currentUserName)) {
      currentUserName = ''
    }
    currentUserName = currentUserName.toLowerCase()
    let collaborators = this.get('model.collaborators').map((i) =>
      i.toLowerCase()
    )
    if (!isEmpty(collaborators)) {
      const isCollaborator =
        collaborators.includes(currentUserName) &&
        this.get('model.isCollaborative')
      return isCollaborator
    }
    return false
  },
  setCanEditDoc: function () {
    const currentUser = this.get('sessionAccount').currentUserId
    let currentUserName = this.get('sessionAccount').currentUserName
    if (isEmpty(currentUserName)) {
      currentUserName = ''
    }
    let model = this.get('model')
    this.get('cs').log('setCanEditDoc')
    //If embedded, allow editting (ops dont get sent)
    if (this.get('isEmbeddedWithCode')) {
      this.set('canEditSource', true)
      this.set('showReadOnly', false)
      this.set('isOwner', false)
      return
    }
    //Noone signed in
    if (isEmpty(currentUser) || isEmpty(model)) {
      this.get('cs').log('NO USER OR MODEL')
      this.set('canEditSource', false)
      this.set('canEditSettings', false)
      this.set('showReadOnly', true)
      this.set('isOwner', false)
      return
    }
    //Someone signed in but not the owner
    if (currentUser !== model.get('ownerId')) {
      this.get('cs').log('NOT OWNER')
      this.set('isOwner', false)
      let isCollaborator = this.isCollaborator()
      this.get('cs').log(this.get('model.collaborators'), currentUserName)
      this.get('cs').log('isCollaborator', isCollaborator)
      this.set('canEditSettings', false)
      //Not owner but read only
      if (model.get('readOnly')) {
        this.set('canEditSource', isCollaborator)
        this.set('showReadOnly', !isCollaborator)
      } else {
        //not owner by and not read only
        this.set('canEditSource', true)
        this.set('showReadOnly', false)
      }
      return
    } else {
      //signed in and is the owner
      this.set('isOwner', true)
      this.set('canEditSource', true)
      this.set('canEditSettings', true)
      this.set('showReadOnly', false)
      this.get('cs').log('IS OWNER')
      return
    }
    //Never gets here?
    this.get('cs').log('IS DESKTOP?', this.get('mediaQueries.isDesktop'))
    this.set('showReadOnly', false)
    if (!this.get('mediaQueries.isDesktop')) {
      this.set('canEditSource', false)
      this.set('canEditSettings', false)
    }
  },
  deleteCurrentDocument: function () {
    let model = this.get('model')
    if (confirm('Are you sure you want to delete?')) {
      this.get('cs').log('deleting root doc')
      this.get('documentService')
        .deleteDoc(model.id)
        .then(() => {
          this.get('cs').log(
            'completed deleting root doc and all children + assets'
          )
          this.transitionToRoute('application')
        })
        .catch((err) => {
          this.get('cs').log('error deleting doc', err)
        })
    }
  },
  resetScrollPositions: function () {
    var scrollPositions = {}
    scrollPositions[this.get('model').id] = 0
    this.get('children').forEach((child) => {
      scrollPositions[child.id] = 0
    })
    this.set('scrollPositions', scrollPositions)
  },
  updateScrollPosition: function () {
    this.get('scrollPositions')[this.get('currentDoc').id] =
      this.get('editor').getCursor(true)
  },
  scrollToSavedPosition: function () {
    const pos = this.get('scrollPositions')[this.get('currentDoc').id]
    this.get('editor').scrollIntoView(pos)
  },
  /*
  This is necessary as the output container has to have an abolsute position
  otherwise when you use anchor links in Chrome, things get weird. This means when
  we do stuff like drop downs or scroll bars appearing, the code container shifts
  down appropirately but the output doesnt. We use this method to keep them in sync
  */
  syncOutputContainer: function () {
    setTimeout(() => {
      const ace = $('#ace-container')
      if (!isEmpty(ace)) {
        document.getElementById('output-container').style.top =
          ace.offset().top + 'px'
      }
    }, 50)
  },
  updateDragPos: function () {
    this.syncOutputContainer()
    const codeW = parseInt(
      this.get('codeW').substring(0, this.get('codeW').length - 2)
    )
    const drag = document.getElementById('drag-container')
    if (!isEmpty(drag)) {
      drag.style.right = codeW - 31 + 'px'
    }
    const tab = document.getElementById('project-tabs')
    if (!isEmpty(tab)) {
      tab.style.width = codeW + 'px'
    }
    const editor = this.get('editor')
    if (!isEmpty(editor)) {
      editor.refresh()
      if (this.get('highContrast')) {
        this.setAllCodeWhite()
      }
    }
  },
  skipOp: function (prev, rewind = false) {
    const update = () => {
      return new RSVP.Promise((resolve, reject) => {
        const editor = this.get('editor')
        this.set('surpress', true)
        //this.get('cs').log("SURPRESSING");
        if (prev) {
          this.get('opsPlayer')
            .prevOp(editor, rewind)
            .then(() => {
              resolve()
            })
        } else {
          this.get('opsPlayer')
            .nextOp(editor, rewind)
            .then(() => {
              resolve()
            })
        }
      })
    }
    update().then(() => {
      this.set('surpress', false)
      this.get('cs').log('UNSURPRESSING')
    })
  },
  updateSavedVals: function () {
    return new RSVP.Promise((resolve, reject) => {
      const savedVals = this.get('savedVals')
      if (isEmpty(savedVals)) {
        resolve()
        return
      } else {
        const vals = Object.keys(savedVals).map((key) => savedVals[key])
        const hasVals = vals.length > 0
        if (hasVals) {
          this.get('documentService')
            .updateDoc(this.get('model').id, 'savedVals', savedVals)
            .then(() => resolve())
            .catch((err) => reject(err))
            .catch((err) => {
              this.get('cs').log('error updating doc', err)
              reject(err)
              return
            })
        } else {
          resolve()
        }
      }
    })
  },
  updateEditStats: function () {
    return new RSVP.Promise((resolve, reject) => {
      let model = this.get('model')
      let stats = model.get('stats')
        ? model.get('stats')
        : { views: 0, forks: 0, edits: 0 }
      stats.edits = parseInt(stats.edits) + this.get('editCtr')
      const actions = [
        this.get('documentService').updateDoc(model.id, 'stats', stats),
      ]
      if (this.get('isOwner')) {
        this.get('cs').log('updating lastEdited (i own this)')
        actions.push(
          this.get('documentService').updateDoc(
            model.id,
            'lastEdited',
            new Date()
          )
        )
      }
      Promise.all(actions)
        .then(() => {
          this.set('editCtr', 0)
          resolve()
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  refreshDoc: function () {
    const doc = this.get('currentDoc')
    if (!isEmpty(doc)) {
      const fn = () => {
        this.set('titleName', '')
        this.get('opsPlayer').reset(doc.id)
        this.set('showConnectionWarning', false)
        this.set('droppedOps', [])
        this.set('recordingOptions', { isRecording: false })
        this.writeIframeContent('')
        this.cleanUpShareDB()
        this.cleanUpOpPlayer()
        this.set('currentDoc', null)
        if (!isEmpty(this.get('editor'))) {
          this.get('cs').log('selectRootDoc', 'refreshDoc')
          this.selectRootDoc()
        }
      }
      const actions = [
        this.updateSourceFromSession(),
        this.updateEditStats(),
        this.updateSavedVals(),
      ]
      Promise.all(actions)
        .then(() => {
          fn()
        })
        .catch(() => {
          fn()
        })
    }
  },
  showFeedback: function (msg) {
    this.set('feedbackMessage', msg)
    if (!isEmpty(this.get('feedbackTimer'))) {
      clearTimeout(this.get('feedbackTimer'))
      this.set('feedbackTimer', null)
    }
    this.set(
      'feedbackTimer',
      setTimeout(() => {
        this.set('feedbackMessage', null)
      }, 5000)
    )
  },
  pauseOps: function () {
    this.set('isPlayingOps', false)
    if (this.get('opsInterval')) {
      clearInterval(this.get('opsInterval'))
    }
  },
  playOps: function () {
    this.pauseOps()
    this.set('isPlayingOps', true)
    this.set(
      'opsInterval',
      setInterval(() => {
        this.skipOp(false)
        if (this.get('opsPlayer').reachedEnd) {
          this.set('isPlayingOps', false)
          clearInterval(this.get('opsInterval'))
        }
      }, 100)
    )
  },
  hijackConsoleOutput: function () {
    ;(() => {
      let oldLog = this.get('cs').log
      this.get('cs').log = (msg) => {
        if (config.debugConsole) {
          this.set(
            'consoleOutput',
            this.get('consoleOutput') + '\n' + JSON.stringify(msg)
          )
          console.log(msg)
        }
      }
      var oldWarn = console.warn
      console.warn = (msg) => {
        this.set('consoleOutput', this.get('consoleOutput') + '\n' + msg)
        console.warn(msg)
      }
      var oldError = console.error
      console.error = (msg) => {
        console.log('ERRRERERER')
        this.set('consoleOutput', this.get('consoleOutput') + '\n' + msg)
        console.error(msg)
      }
    })()
  },
  updatePlayButton: function () {
    let update = (button) => {
      if (!isEmpty(button)) {
        if (!this.get('doPlay')) {
          $(button)
            .find('.glyphicon')
            .removeClass('glyphicon-play')
            .addClass('glyphicon-pause')
        } else {
          $(button)
            .find('.glyphicon')
            .removeClass('glyphicon-pause')
            .addClass('glyphicon-play')
        }
      }
    }
    update(document.getElementById('code-play-btn'))
    update(document.getElementById('embedded-run-button'))
  },
  updateTabbarLocation: function () {
    const codeW = this.get('codeW')
    let tab = document.getElementById('project-tabs')
    if (tab) {
      tab.style.width = codeW
    }
  },
  foldHead: function () {
    const editor = this.get('editor')
    this.get('cs').log('FOLDING HEAD')
    editor.operation(() => {
      for (var l = editor.firstLine(); l <= editor.lastLine(); ++l) {
        if (editor.doc.getLine(l).includes('<head>')) {
          this.get('cs').log('FOLDING HEAD FOUND ELEMENT')
          editor.foldCode({ line: l, ch: 0 }, null, 'fold')
        }
      }
    })
  },
  hideCode: function (doHide) {
    let container = document.getElementById('ace-container')
    container.classList.add(doHide ? 'hiding-code' : 'showing-code')
    container.classList.remove(!doHide ? 'hiding-code' : 'showing-code')
    this.set('isDragging', false)
    const tab = document.getElementById('project-tabs')
    if (!isEmpty(tab)) {
      tab.classList.add(doHide ? 'hiding-code' : 'showing-code')
      tab.classList.remove(!doHide ? 'hiding-code' : 'showing-code')
    }
    setTimeout(() => {
      const proportion = this.get('isEmbeddedWithCode') ? 0.9 : 0.65
      const w = window.innerWidth * proportion + 'px'
      this.set('isShowingCode', !doHide)
      this.get('cs').log('setting codeW to ', doHide ? '30px' : w)
      this.set('codeW', doHide ? '30px' : w)
      const editor = this.get('editor')
      if (!isEmpty(editor) && !doHide) {
        console.log('refresh')
        editor.refresh()
        setTimeout(() => {
          console.log('refresh')
          editor.refresh()
          editor.refresh()
          editor.refresh()
          editor.refresh()
        }, 1000)
      }
    }, 200)
  },
  setAllCodeWhite() {
    document
      .querySelectorAll('#ace-container')
      .forEach((el) =>
        el.querySelectorAll('span').forEach((el) => (el.style.color = 'white'))
      )
  },
  showProject() {
    //this.transitionToRoute("code-editor", this.get("model.id"))
    //this.transitionToRoute("about")
  },
  alertAssetsUpdated(newAssets) {
    const toSend = {
      uuid: this.get('sessionAccount').getSessionID(),
      assets: newAssets,
      date: new Date().getTime(),
    }
    let op = {
      p: ['assetsUpdated'],
      oi: toSend,
    }
    //Delete after send
    this.submitOp(op)
      .then(() => {
        let op = {
          p: ['assetsUpdated'],
          od: toSend,
        }
        this.submitOp(op)
      })
      .catch((err) => {
        this.get('cs').log('error updating doc', err)
      })
  },
  actions: {
    //codemirror
    onEditorReady(editor) {
      this.set('editor', editor)
      let elements = document.getElementsByClassName('CodeMirror')
      elements[0].style.fontSize = '12pt'
      this.get('editor').on('scroll', (cm) => {
        if (this.get('highContrast')) {
          this.setAllCodeWhite()
        }
      })
      this.begin()
    },
    onSessionChange(cm, change) {
      this.set('editor', cm)
      this.onSessionChange(change)
    },
    onReevaluate() {
      if (this.get('canEditSource')) {
        this.updateIFrame(true)
      }
    },

    suggestCompletions(editor, options) {
      this.get('cs').log('CUSTOM COMPLETIONS')
      let targets = []
      const assets = this.get('model.assets')
      if (!isEmpty(assets)) {
        targets = targets.concat(this.get('autocomplete').assets(assets))
      }
      const children = this.get('children')
      if (!isEmpty(children)) {
        targets = targets.concat(this.get('autocomplete').tabs(children))
      }

      return this.get('autocomplete').toFind(editor, options, targets)
    },

    //DOC PROPERTIES
    collaboratorsChanged(users) {
      this.get('documentService')
        .updateDoc(this.get('model').id, 'collaborators', users)
        .then(() => {
          this.reloadDoc()
        })
        .catch((err) => {
          this.get('cs').log('error updating doc', err)
        })
    },
    searchCollaborator(user) {
      this.get('cs').log('search Collaborator', user)
      this.transitionToRoute('documents', user, 0, 'views')
    },
    tagsChanged(tags) {
      this.get('documentService')
        .updateDoc(this.get('model').id, 'tags', tags)
        .catch((err) => {
          this.get('cs').log('error updating doc', err)
        })
    },
    searchTag(tag) {
      this.get('cs').log('search tag', tag)
      this.transitionToRoute('documents', tag, 0, 'views')
    },
    syncOutputContainer() {
      this.get('cs').log('syncOutputContainer')
      setTimeout(() => {
        this.syncOutputContainer()
      }, 50)
    },
    doEditDocName() {
      if (this.get('canEditSettings')) {
        this.set('isNotEdittingDocName', false)
        scheduleOnce('afterRender', function () {
          $('#doc-name-input').focus()
        })
      }
    },
    endEdittingDocName() {
      this.set('isNotEdittingDocName', true)
      const newName = this.get('titleNoName')
      this.set('titleName', newName + ' by ' + this.get('model.owner'))
      this.get('documentService')
        .updateDoc(this.get('currentDoc').id, 'name', newName)
        .then(() =>
          this.fetchChildren().then(() =>
            this.get('sessionAccount').updateOwnedDocuments()
          )
        )
    },
    deleteDoc() {
      if (this.get('canEditSettings')) {
        this.deleteCurrentDocument()
      }
    },
    download() {
      this.get('assetService').zip()
    },
    flagDocument() {
      this.get('documentService')
        .flagDoc()
        .then(() => {
          let model = this.get('model')
          let flags = parseInt(model.get('flags'))
          if (flags < 2) {
            flags = flags + 1
            this.get('documentService')
              .updateDoc(model.id, 'flags', flags)
              .catch((err) => {
                this.get('cs').log('error updating doc', err)
              })
          } else {
            this.deleteCurrentDocument()
          }
        })
        .catch((err) => {
          alert('Already flagged')
        })
    },
    forkDocument() {
      this.fetchChildren().then(() => {
        const currentUser = this.get('sessionAccount').currentUserName
        let model = this.get('model')
        let stats = model.get('stats')
          ? model.get('stats')
          : { views: 0, forks: 0, edits: 0 }
        stats.forks = parseInt(stats.forks) + 1
        let actions = [
          this.get('documentService').updateDoc(model.id, 'stats', stats),
          this.get('documentService').forkDoc(model.id, this.get('children')),
        ]
        Promise.all(actions)
          .then(() => {
            this.get('sessionAccount')
              .updateOwnedDocuments()
              .then(() => {
                this.get('cs').log(
                  'owneddocs',
                  this.get('sessionAccount').ownedDocuments
                )
                this.transitionToRoute(
                  'code-editor',
                  this.get('sessionAccount').ownedDocuments.firstObject.id
                )
              })
              .catch((err) => {
                this.set('feedbackMessage', err.errors[0])
              })
            this.showFeedback('Here is your very own new copy!')
          })
          .catch((err) => {
            this.set('feedbackMessage', err.errors[0])
          })
      })
    },

    //ASSETS
    assetError(err) {
      document.getElementById('asset-progress').style.display = 'none'
      alert('Error uploading there is a 100MB limit to assets')
    },
    assetProgress(e) {
      this.get('cs').log('assetProgress', e.percent)
      const prog = document.getElementById('asset-progress')
      if (parseInt(e.percent) < 100) {
        prog.style.display = 'block'
        prog.style.width = parseInt(e.percent) + '%'
      } else {
        prog.style.display = 'none'
      }
    },
    assetUploaded(e) {
      this.get('cs').log('assetComplete', e)
      document.getElementById('asset-progress').style.display = 'none'
      const doc = this.get('model')
      let newAssets = doc.assets
      newAssets.push(e)
      const actions = [
        this.get('documentService').updateDoc(doc.id, 'assets', newAssets),
        this.get('documentService').updateDoc(
          doc.id,
          'assetQuota',
          e.size + doc.get('assetQuota')
        ),
      ]

      Promise.all(actions)
        .then(() => {
          this.alertAssetsUpdated(newAssets)
          if (!this.get('wsAvailable')) {
            this.refreshDoc()
          }
        })
        .catch((err) => {
          this.get('cs').log('ERROR updating doc with asset', err)
        })
    },
    assetUploadingComplete() {
      this.get('cs').log('all uploads complete')
      document.getElementById('uploaded-assets-container').style[
        'background-color'
      ] = 'yellow'
      setTimeout(() => {
        document.getElementById('uploaded-assets-container').style[
          'background-color'
        ] = 'inherit'
      }, 500)
    },
    deleteAsset(asset) {
      if (this.get('canEditSource')) {
        if (confirm('Are you sure you want to delete?')) {
          this.get('cs').log('deleting asset', asset)
          this.get('assetService')
            .deleteAsset(asset)
            .then(() => {
              const doc = this.get('model')
              let newAssets = doc.get('assets')
              newAssets = newAssets.filter((oldAsset) => {
                this.get('cs').log(oldAsset.name, asset)
                return oldAsset.name !== asset
              })
              let totalSize = 0
              newAssets.forEach((a) => {
                totalSize += a.size
              })
              const actions = [
                this.get('documentService').updateDoc(
                  doc.id,
                  'assets',
                  newAssets
                ),
                this.get('documentService').updateDoc(
                  doc.id,
                  'assetQuota',
                  totalSize
                ),
              ]
              Promise.all(actions)
                .then(() => {
                  this.alertAssetsUpdated(newAssets)
                  if (!this.get('wsAvailable')) {
                    this.refreshDoc()
                  }
                })
                .catch((err) => {
                  this.get('cs').log(err)
                })
            })
            .catch((err) => {
              this.get('cs').log('ERROR deleting asset', err, asset)
            })
        }
      }
    },
    previewAsset(asset) {
      var url =
        config.serverHost + '/asset/' + this.get('model').id + '/' + asset.name
      const isImage = asset.fileType.includes('image')
      const isAudio = asset.fileType.includes('audio')
      const isVideo = asset.fileType.includes('video')
      this.get('modalsManager').alert({
        title: asset.name,
        bodyComponent: 'modal-preview-body',
        assetURL: url,
        assetType: asset.fileType,
        isImage: isImage,
        isAudio: isAudio,
        isVideo: isVideo,
      })
      this.toggleProperty('showPreview')
    },
    //SHOW AND HIDE MENUS
    togglePrivacy() {
      if (this.get('canEditSettings')) {
        let model = this.get('model')
        model.set('isPrivate', !model.get('isPrivate'))
        this.get('documentService')
          .updateDoc(model.id, 'isPrivate', model.get('isPrivate'))
          .catch((err) => {
            this.get('cs').log('error updating doc', err)
          })
      }
    },
    toggleReadOnly() {
      if (this.get('canEditSettings')) {
        let model = this.get('model')
        model.set('readOnly', !model.get('readOnly'))
        this.get('documentService')
          .updateDoc(model.id, 'readOnly', model.get('readOnly'))
          .catch((err) => {
            this.get('cs').log('error updating doc', err)
          })
      }
    },
    toggleDontPlay() {
      if (this.get('isOwner')) {
        let model = this.get('model')
        model.set('dontPlay', !model.get('readOnly'))
        this.get('documentService')
          .updateDoc(model.id, 'dontPlay', model.get('readOnly'))
          .catch((err) => {
            this.get('cs').log('error updating doc', err)
          })
      }
    },
    toggleAutoRender() {
      this.toggleProperty('autoRender')
    },
    toggleCollaborative() {
      if (this.get('canEditSettings')) {
        let model = this.get('model')
        model.set('isCollaborative', !model.get('isCollaborative'))
        const checkbox = document.getElementById('colab-checkbox')
        if (model.get('isCollaborative')) {
          checkbox.classList.add('orange-checkbox')
        } else {
          checkbox.classList.remove('orange-checkbox')
        }
        this.get('documentService')
          .updateDoc(model.id, 'isCollaborative', model.get('isCollaborative'))
          .then(() => {
            this.reloadDoc()
          })
          .catch((err) => {
            this.get('cs').log('error updating doc', err)
          })
      }
    },
    toggleShowSettings() {
      this.toggleProperty('showSettings')
      this.syncOutputContainer()
    },
    toggleLibraryDropdown() {
      document
        .getElementById('snippetsDropdown')
        .classList.toggle('show', false)
      document.getElementById('librariesDropdown').classList.toggle('show')
    },
    toggleSnippetsDropdown() {
      document
        .getElementById('librariesDropdown')
        .classList.toggle('show', false)
      document.getElementById('snippetsDropdown').classList.toggle('show')
    },
    toggleSnippetEditor(snippet) {
      this.toggleProperty('showSnippetEditor')
      this.set('currentSnip', snippet)
    },
    insertLibrary(lib) {
      this.updateSourceFromSession().then(() => {
        const op = this.get('codeParser').insertLibrary(
          lib.id,
          this.get('model.source')
        )
        this.submitOp(op)
        this.set('surpress', true)
        this.get('codeParser').applyOps([op], this.get('editor'))
        this.set('surpress', false)
        document.getElementById('librariesDropdown').classList.toggle('show')
      })
    },
    insertSnippet(snippet) {
      // I think something renders twice and sends two things to this func,
      // one of which is some junk, hence:
      if (!snippet.hasOwnProperty('snip')) {
        this.set('consoleOutput', 'Error with the snippet')
        return
      }

      this.updateSourceFromSession().then(() => {
        const source = this.get('model.source')
        const op = this.get('codeParser').insertSnippet(source, snippet)
        if (typeof op === 'string') {
          const error = parseSnippetError(op, snippet)
          this.set('snippetError', error)
          this.set('showErrorBar', true)
          this.syncOutputContainer()
          return
        }
        this.submitOp(op)
        this.set('surpress', true)
        this.get('codeParser').applyOps([op], this.get('editor'))
        this.set('surpress', false)
        document.getElementById('snippetsDropdown').classList.toggle('show')
        if (this.get('autoRender')) {
          this.updateIFrame()
        }
      })
    },
    toggleShowShare() {
      this.toggleProperty('showShare')
    },
    closeErrorBar() {
      this.set('snippetError', '')
      this.set('showErrorBar', false)
      this.syncOutputContainer()
    },
    toggleShowRecordingPanel() {
      this.updateSourceFromSession().then(() => {
        this.fetchChildren().then(() => {
          this.get('documentService')
            .getCombinedSource(
              this.get('model.id'),
              true,
              this.get('model.source'),
              this.get('savedVals')
            )
            .then((combined) => {
              this.set(
                'possibleRecordingNodes',
                this.get('codeParser').getPossibleNodes(combined)
              )
              this.get('cs').log(
                'possibleRecordingNodes',
                this.get('possibleRecordingNodes')
              )
              this.toggleProperty('showRecordingPanel')
              this.syncOutputContainer()
            })
        })
      })
    },
    onRecordingOptionsChanged(options) {
      this.get('cs').log('rec options', options)
      this.set('recordingOptions', options)
    },
    toggleShowAssets() {
      this.toggleProperty('showAssets')
      this.get('cs').log(this.get('showAssets'))
      this.syncOutputContainer()
    },
    enterFullscreen() {
      document.onfullscreenchange = (event) => {
        if (document.fullscreenElement) {
          console.log(
            `Element: ${document.fullscreenElement.id} entered full-screen mode.`
          )
          const o = document.getElementById('output-container')
          o.style.left = '0px'
          o.style.width = '100%'
          o.style.height = '100%'
          const m = document.getElementById('main-code-container')
          m.style.height = '100%'
        } else {
          console.log('Leaving full-screen mode.')
          const o = document.getElementById('output-container')
          o.style.left = '8%'
          o.style.width = '84%'
          o.style.height = '80vh'
          const m = document.getElementById('main-code-container')
          m.style.height = '80vh'
          this.syncOutputContainer()
        }
      }
      var target = document.getElementById('fullscreen')
      if (target.requestFullscreen) {
        target.requestFullscreen()
      } else if (target.msRequestFullscreen) {
        target.msRequestFullscreen()
      } else if (target.mozRequestFullScreen) {
        target.mozRequestFullScreen()
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT)
      }
    },

    //TIDYING UP ON EXIT / REFRESH
    cleanUp() {
      const fn = () => {
        this.get('cs').log('clean up')
        this.set('fetchingDoc', false)
        this.set('showHUD', false)
        this.showFeedback('')
        this.writeIframeContent('')
        this.set('droppedOps', [])
        this.set('consoleOutput', '')
        this.set('titleName', '')
        this.get('cs').clear()
        this.get('cs').clearObservers()
        this.cleanUpOpPlayer()
        if (!isEmpty(this.get('updateSourceInterval'))) {
          clearInterval(this.get('updateSourceInterval'))
          this.set('updateSourceInterval', null)
        }
        if (this.get('wsAvailable')) {
          this.cleanUpConnections()
        }
        this.set('highContrast', false)
        this.get('cs').log('cleaned up')
        //this.removeWindowListener();
      }
      this.set('leftCodeEditor', true)
      const actions = [
        this.updateSourceFromSession(),
        this.updateEditStats(),
        this.updateSavedVals(),
      ]
      Promise.all(actions)
        .then(() => {
          fn()
        })
        .catch(() => {
          fn()
        })
    },
    refresh() {
      this.refreshDoc()
    },

    //MOUSE LISTENERS
    mouseDown(e) {
      //this.get('cs').log('mouseDown',e.target);
      this.set('isDragging', true)
      const startWidth = document.querySelector('#ace-container').clientWidth
      const startX = e.clientX
      this.set('startWidth', startWidth)
      this.set('startX', startX)
      let overlay = document.querySelector('#output-iframe')
      overlay.style['pointer-events'] = 'none'
      let playback = document.querySelector('#playback-container')
      if (!isEmpty(playback)) {
        playback.style['pointer-events'] = 'none'
      }
    },
    mouseUp(e) {
      //this.get('cs').log('mouseup',e.target);
      this.set('isDragging', false)
      let overlay = document.querySelector('#output-iframe')
      overlay.style['pointer-events'] = 'auto'
      let playback = document.querySelector('#playback-container')
      if (!isEmpty(playback)) {
        playback.style['pointer-events'] = 'auto'
      }
    },
    mouseMove(e) {
      if (this.get('isDragging')) {
        //this.get('cs').log('mouseMove',e.target);
        this.set(
          'codeW',
          this.get('startWidth') - e.clientX + this.get('startX') + 'px'
        )
      }
    },
    mouseoverCodeTransport(e) {
      const transport = document.getElementById('code-transport-container')
      const trackingArea = document.getElementById(
        'code-transport-tracking-area'
      )
      trackingArea.style['pointer-events'] = 'none'
      transport.style.display = 'block'
    },
    mouseoutCodeTransport(e) {
      const transport = document.getElementById('code-transport-container')
      const trackingArea = document.getElementById(
        'code-transport-tracking-area'
      )
      trackingArea.style['pointer-events'] = 'auto'
      transport.style.display = 'none'
    },

    //OPERATIONS ON CODE
    playOrPause() {
      if (this.get('doPlay')) {
        this.updateIFrame()
      } else {
        this.writeIframeContent('')
      }
      this.toggleProperty('doPlay')
      this.updatePlayButton()
    },
    toggleHighContrast() {
      this.toggleProperty('highContrast')
      if (this.get('highContrast')) {
        this.setAllCodeWhite()
        document.getElementById('ace-container').style.opacity = 1.0
      } else {
        this.get('editor').refresh()
        document.getElementById('ace-container').style.opacity = 0.95
      }
    },
    cycleColourscheme() {
      const themes = ['cm-s-monokai', 'cm-s-night', 'cm-s-dracula']
      const prefix = 'cm-s-'
      const codeMirror = document.getElementsByClassName('CodeMirror')[0]
      let currentTheme = ''
      for (const cl of codeMirror.classList.values()) {
        if (cl.startsWith(prefix)) {
          currentTheme = cl
          break
        }
      }
      const newTheme =
        themes[(themes.indexOf(currentTheme) + 1) % themes.length]
      codeMirror.classList.remove(currentTheme)
      codeMirror.classList.add(newTheme)
    },
    renderCode() {
      this.updateIFrame()
    },
    pauseCode() {
      this.writeIframeContent('')
    },
    hideCode() {
      this.hideCode(true)
    },
    showCode() {
      this.hideCode(false)
    },
    showProject() {
      this.get('cs').log('showProject', this.get('model.id'))
    },

    //OP PLAYBACK
    skipOp(prev) {
      this.skipOp(prev)
    },
    rewindOps() {
      this.set('surpress', true)
      this.get('editor').setValue('')
      this.writeIframeContent('')
      this.set('surpress', false)
      this.skipOp(false, true)
    },
    playOps() {
      this.playOps()
    },
    pauseOps() {
      this.pauseOps()
    },
    zoomOut() {
      this.get('editor').refresh()
      if (this.get('highContrast')) {
        this.setAllCodeWhite()
      }
      let elements = document.getElementsByClassName('CodeMirror')
      const currentFontSize = parseInt(
        elements[0].style.fontSize.substring(0, 2)
      )
      elements[0].style.fontSize = currentFontSize - 1 + 'pt'
    },
    zoomIn() {
      this.get('editor').refresh()
      if (this.get('highContrast')) {
        this.setAllCodeWhite()
      }
      let elements = document.getElementsByClassName('CodeMirror')
      const currentFontSize = parseInt(
        elements[0].style.fontSize.substring(0, 2)
      )
      elements[0].style.fontSize = currentFontSize + 1 + 'pt'
    },

    //TABS
    newTab(docId) {
      if (this.get('canEditSettings')) {
        this.get('cs').log('new tab', docId)
        this.fetchChildren().then(() => {
          const children = this.get('model').children
          const newChild = children[children.length - 1]
          this.resetScrollPositions()
          //this.newDocSelected(newChild);
        })
      }
    },
    tabSelected(docId) {
      this.get('cs').log('tab selected', docId)
      this.updateSourceFromSession()
        .then(() => {
          this.updateScrollPosition()
          const doc = this.get('currentDoc')
          var currentDocId = ''
          if (!isEmpty(doc)) {
            currentDocId = doc.id
          }
          if (docId != currentDocId) {
            this.newDocSelected(docId).then(() => {
              this.fetchChildren()
              this.resetOpsPlayer()
            })
          }
        })
        .catch((err) => {
          this.get('cs').log('ERROR', err)
        })
    },
    tabDeleted(docId) {
      if (self.get('isOwner')) {
        this.get('cs').log('deleting tab', docId)
        if (confirm('Are you sure you want to delete?')) {
          //SWITCH TO HOME TAB FIRST
          this.newDocSelected(this.get('model').id).then(() => {
            this.get('documentService')
              .deleteDoc(docId)
              .then(() => {
                const children = this.get('model.children')
                var newChildren = children.filter((c) => {
                  return c != docId
                })
                this.get('documentService')
                  .updateDoc(this.get('model').id, 'children', newChildren)
                  .then(() => {
                    this.get('cs').log(
                      'Did delete child from parent model',
                      this.get('model.children')
                    )
                    this.fetchChildren().then(() => {
                      this.resetScrollPositions()
                    })
                  })
                  .catch((err) => {
                    this.get('cs').log(err)
                  })
              })
              .catch((err) => {
                this.get('cs').log(err)
              })
          })
        }
      }
    },
  },
})
