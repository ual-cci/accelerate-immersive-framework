/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./node_modules/firebase-key-encode/firebase-key-encode.js":
/*!*****************************************************************!*\
  !*** ./node_modules/firebase-key-encode/firebase-key-encode.js ***!
  \*****************************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
module.exports = {
  encode: function encode(decoded) {
    return encodeURIComponent(decoded).replace(/\./g, '%2E');
  },
  decode: function decode(encoded) {
    return decodeURIComponent(encoded.replace('%2E', '.'));
  },
  // Replaces the key with `fn(key)` on each key in an object tree.
  // i.e. making all keys uppercase.
  deepKeyReplace: function deepKeyReplace(obj, fn) {
    var rebuiltTree = Object.assign({}, obj);
    function traverse(o, x, func) {
      if (_typeof(o) === "object") {
        for (var i in o) {
          if (o[i] !== null && (_typeof(o[i]) == "object" || Array.isArray(o[i]))) {
            //going on step down in the object tree!!
            traverse(o[i], x[i], func);
          }
          func.apply(this, [x, i, x[i]]);
        }
      } else if (Array.isArray(o)) {
        for (var i = 0; i < o.length; i++) {
          // func.apply(this,[o, i,o[i]]);
          if (o[i] !== null && (_typeof(o[i]) == "object" || Array.isArray(o[i]))) {
            //going on step down in the object tree!!
            traverse(o[i], x[i], func);
          }
        }
      }
    }
    traverse(obj, rebuiltTree, function (parent, key, val) {
      delete parent[key];
      parent[fn(key)] = val;
    });
    return rebuiltTree;
  },
  deepDecode: function deepDecode(encodedTree) {
    var $this = this;
    var rebuiltTree = this.deepKeyReplace(encodedTree, function (key) {
      return $this.decode(key);
    });
    return rebuiltTree;
  },
  deepEncode: function deepEncode(decodedTree) {
    var $this = this;
    var rebuiltTree = this.deepKeyReplace(decodedTree, function (key) {
      return $this.encode(key);
    });
    return rebuiltTree;
  }
};

/***/ }),

/***/ "./src/WebRtcPeer.js":
/*!***************************!*\
  !*** ./src/WebRtcPeer.js ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var WebRtcPeer = /*#__PURE__*/function () {
  function WebRtcPeer(localId, remoteId, sendSignalFunc) {
    _classCallCheck(this, WebRtcPeer);
    this.localId = localId;
    this.remoteId = remoteId;
    this.sendSignalFunc = sendSignalFunc;
    this.open = false;
    this.channelLabel = "networked-aframe-channel";
    this.pc = this.createPeerConnection();
    this.channel = null;
  }
  _createClass(WebRtcPeer, [{
    key: "setDatachannelListeners",
    value: function setDatachannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
    }
  }, {
    key: "offer",
    value: function offer() {
      var self = this;
      // reliable: false - UDP
      this.setupChannel(this.pc.createDataChannel(this.channelLabel, {
        reliable: false
      }));
      this.pc.createOffer(function (sdp) {
        self.handleSessionDescription(sdp);
      }, function (error) {
        console.error("WebRtcPeer.offer: " + error);
      });
    }
  }, {
    key: "handleSignal",
    value: function handleSignal(signal) {
      // ignores signal if it isn't for me
      if (this.localId !== signal.to || this.remoteId !== signal.from) return;
      switch (signal.type) {
        case "offer":
          this.handleOffer(signal);
          break;
        case "answer":
          this.handleAnswer(signal);
          break;
        case "candidate":
          this.handleCandidate(signal);
          break;
        default:
          console.error("WebRtcPeer.handleSignal: Unknown signal type " + signal.type);
          break;
      }
    }
  }, {
    key: "send",
    value: function send(type, data) {
      // TODO: throw error?
      if (this.channel === null || this.channel.readyState !== "open") return;
      this.channel.send(JSON.stringify({
        type: type,
        data: data
      }));
    }
  }, {
    key: "getStatus",
    value: function getStatus() {
      if (this.channel === null) return WebRtcPeer.NOT_CONNECTED;
      switch (this.channel.readyState) {
        case "open":
          return WebRtcPeer.IS_CONNECTED;
        case "connecting":
          return WebRtcPeer.CONNECTING;
        case "closing":
        case "closed":
        default:
          return WebRtcPeer.NOT_CONNECTED;
      }
    }

    /*
       * Privates
       */
  }, {
    key: "createPeerConnection",
    value: function createPeerConnection() {
      var self = this;
      var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection;
      if (RTCPeerConnection === undefined) {
        throw new Error("WebRtcPeer.createPeerConnection: This browser does not seem to support WebRTC.");
      }
      var pc = new RTCPeerConnection({
        iceServers: WebRtcPeer.ICE_SERVERS
      });
      pc.onicecandidate = function (event) {
        if (event.candidate) {
          self.sendSignalFunc({
            from: self.localId,
            to: self.remoteId,
            type: "candidate",
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
          });
        }
      };

      // Note: seems like channel.onclose hander is unreliable on some platforms,
      //       so also tries to detect disconnection here.
      pc.oniceconnectionstatechange = function () {
        if (self.open && pc.iceConnectionState === "disconnected") {
          self.open = false;
          self.closedListener(self.remoteId);
        }
      };
      return pc;
    }
  }, {
    key: "setupChannel",
    value: function setupChannel(channel) {
      var self = this;
      this.channel = channel;

      // received data from a remote peer
      this.channel.onmessage = function (event) {
        var data = JSON.parse(event.data);
        self.messageListener(self.remoteId, data.type, data.data);
      };

      // connected with a remote peer
      this.channel.onopen = function (event) {
        self.open = true;
        self.openListener(self.remoteId);
      };

      // disconnected with a remote peer
      this.channel.onclose = function (event) {
        if (!self.open) return;
        self.open = false;
        self.closedListener(self.remoteId);
      };

      // error occurred with a remote peer
      this.channel.onerror = function (error) {
        console.error("WebRtcPeer.channel.onerror: " + error);
      };
    }
  }, {
    key: "handleOffer",
    value: function handleOffer(message) {
      var self = this;
      this.pc.ondatachannel = function (event) {
        self.setupChannel(event.channel);
      };
      this.setRemoteDescription(message);
      this.pc.createAnswer(function (sdp) {
        self.handleSessionDescription(sdp);
      }, function (error) {
        console.error("WebRtcPeer.handleOffer: " + error);
      });
    }
  }, {
    key: "handleAnswer",
    value: function handleAnswer(message) {
      this.setRemoteDescription(message);
    }
  }, {
    key: "handleCandidate",
    value: function handleCandidate(message) {
      var self = this;
      var RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;
      this.pc.addIceCandidate(new RTCIceCandidate(message), function () {}, function (error) {
        console.error("WebRtcPeer.handleCandidate: " + error);
      });
    }
  }, {
    key: "handleSessionDescription",
    value: function handleSessionDescription(sdp) {
      var self = this;
      this.pc.setLocalDescription(sdp, function () {}, function (error) {
        console.error("WebRtcPeer.handleSessionDescription: " + error);
      });
      this.sendSignalFunc({
        from: this.localId,
        to: this.remoteId,
        type: sdp.type,
        sdp: sdp.sdp
      });
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(message) {
      var self = this;
      var RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription || window.msRTCSessionDescription;
      this.pc.setRemoteDescription(new RTCSessionDescription(message), function () {}, function (error) {
        console.error("WebRtcPeer.setRemoteDescription: " + error);
      });
    }
  }]);
  return WebRtcPeer;
}();
WebRtcPeer.IS_CONNECTED = "IS_CONNECTED";
WebRtcPeer.CONNECTING = "CONNECTING";
WebRtcPeer.NOT_CONNECTED = "NOT_CONNECTED";
WebRtcPeer.ICE_SERVERS = [{
  urls: "stun:stun1.l.google.com:19302"
}, {
  urls: "stun:stun2.l.google.com:19302"
}, {
  urls: "stun:stun3.l.google.com:19302"
}, {
  urls: "stun:stun4.l.google.com:19302"
}];
module.exports = WebRtcPeer;

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }
function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor); } }
function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); Object.defineProperty(Constructor, "prototype", { writable: false }); return Constructor; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var firebaseKeyEncode = __webpack_require__(/*! firebase-key-encode */ "./node_modules/firebase-key-encode/firebase-key-encode.js");
var WebRtcPeer = __webpack_require__(/*! ./WebRtcPeer */ "./src/WebRtcPeer.js");
var FirebaseWebRtcAdapter = /*#__PURE__*/function () {
  /**
    Config structure:
    config.authType: none;
    config.apiKey: your-api;
    config.authDomain: your-project.firebaseapp.com;
    config.databaseURL: https://your-project.firebaseio.com;
  */
  function FirebaseWebRtcAdapter(firebase, config) {
    _classCallCheck(this, FirebaseWebRtcAdapter);
    this.rootPath = "networked-aframe";
    this.localId = null;
    this.appId = null;
    this.roomId = null;
    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> joinTimestamp

    this.serverTimeRequests = 0;
    this.timeOffsets = [];
    this.avgTimeOffset = 0;
    config = config || window.top.firebaseConfig || window.firebaseConfig;
    this.firebase = firebase || window.top.firebase || window.firebase;
    if (this.firebase === undefined) {
      throw new Error("Import https://www.gstatic.com/firebasejs/x.x.x/firebase.js");
    }
    this.authType = config.authType;
    this.apiKey = config.apiKey;
    this.authDomain = config.authDomain;
    this.databaseURL = config.databaseURL;
  }

  /*
   * Call before `connect`
   */
  _createClass(FirebaseWebRtcAdapter, [{
    key: "setServerUrl",
    value: function setServerUrl(url) {
      // handled in config
    }
  }, {
    key: "setApp",
    value: function setApp(appId) {
      this.appId = appId;
    }
  }, {
    key: "setRoom",
    value: function setRoom(roomId) {
      this.roomId = roomId;
    }

    // options: { datachannel: bool, audio: bool }
  }, {
    key: "setWebRtcOptions",
    value: function setWebRtcOptions(options) {
      // TODO: support audio and video
      if (options.datachannel === false) NAF.log.warn("FirebaseWebRtcAdapter.setWebRtcOptions: datachannel must be true.");
      if (options.audio === true) NAF.log.warn("FirebaseWebRtcAdapter does not support audio yet.");
      if (options.video === true) NAF.log.warn("FirebaseWebRtcAdapter does not support video yet.");
    }
  }, {
    key: "setServerConnectListeners",
    value: function setServerConnectListeners(successListener, failureListener) {
      this.connectSuccess = successListener;
      this.connectFailure = failureListener;
    }
  }, {
    key: "setRoomOccupantListener",
    value: function setRoomOccupantListener(occupantListener) {
      this.occupantListener = occupantListener;
    }
  }, {
    key: "setDataChannelListeners",
    value: function setDataChannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = function (remoteId, dataType, data) {
        var decodedData = firebaseKeyEncode.deepDecode(data);
        messageListener(remoteId, dataType, decodedData);
      };
    }
  }, {
    key: "connect",
    value: function connect() {
      var self = this;
      this.initFirebase(function (id) {
        self.updateTimeOffset();
        self.localId = id;
        var firebaseApp = self.firebaseApp;

        // Note: assuming that data transfer via firebase realtime database
        //       is reliable and in order
        // TODO: can race among peers? If so, fix

        self.getTimestamp(function (timestamp) {
          self.myRoomJoinTime = timestamp;
          var userRef = firebaseApp.database().ref(self.getUserPath(self.localId));
          userRef.set({
            timestamp: timestamp,
            signal: "",
            data: ""
          });
          userRef.onDisconnect().remove();
          var roomRef = firebaseApp.database().ref(self.getRoomPath());
          roomRef.on("child_added", function (data) {
            var remoteId = data.key;
            if (remoteId === self.localId || remoteId === "timestamp" || self.peers[remoteId] !== undefined) return;
            var remoteTimestamp = data.val().timestamp;
            var peer = new WebRtcPeer(self.localId, remoteId,
            // send signal function
            function (data) {
              firebaseApp.database().ref(self.getSignalPath(self.localId)).set(data);
            });
            peer.setDatachannelListeners(self.openListener, self.closedListener, self.messageListener);
            self.peers[remoteId] = peer;
            self.occupants[remoteId] = remoteTimestamp;

            // received signal
            firebaseApp.database().ref(self.getSignalPath(remoteId)).on("value", function (data) {
              var value = data.val();
              if (value === null || value === "") return;
              peer.handleSignal(value);
            });

            // received data
            firebaseApp.database().ref(self.getDataPath(remoteId)).on("value", function (data) {
              var value = data.val();
              if (value === null || value === "" || value.to !== self.localId) return;
              self.messageListener(remoteId, value.type, value.data);
            });

            // send offer from a peer who
            //   - later joined the room, or
            //   - has larger id if two peers joined the room at same time
            if (timestamp > remoteTimestamp || timestamp === remoteTimestamp && self.localId > remoteId) peer.offer();
            self.occupantListener(self.occupants);
          });
          roomRef.on("child_removed", function (data) {
            var remoteId = data.key;
            if (remoteId === self.localId || remoteId === "timestamp" || self.peers[remoteId] === undefined) return;
            delete self.peers[remoteId];
            delete self.occupants[remoteId];
            self.occupantListener(self.occupants);
          });
          self.connectSuccess(self.localId);
        });
      });
    }
  }, {
    key: "shouldStartConnectionTo",
    value: function shouldStartConnectionTo(client) {
      return (this.myRoomJoinTime || 0) <= (client ? client.roomJoinTime : 0);
    }
  }, {
    key: "startStreamConnection",
    value: function startStreamConnection(clientId) {
      // Handled by WebRtcPeer
    }
  }, {
    key: "closeStreamConnection",
    value: function closeStreamConnection(clientId) {
      // Handled by WebRtcPeer
    }
  }, {
    key: "sendData",
    value: function sendData(clientId, dataType, data) {
      this.peers[clientId].send(dataType, data);
    }
  }, {
    key: "sendDataGuaranteed",
    value: function sendDataGuaranteed(clientId, dataType, data) {
      var clonedData = JSON.parse(JSON.stringify(data));
      var encodedData = firebaseKeyEncode.deepEncode(clonedData);
      this.firebaseApp.database().ref(this.getDataPath(this.localId)).set({
        to: clientId,
        type: dataType,
        data: encodedData
      });
    }
  }, {
    key: "broadcastData",
    value: function broadcastData(dataType, data) {
      for (var clientId in this.peers) {
        if (this.peers.hasOwnProperty(clientId)) {
          this.sendData(clientId, dataType, data);
        }
      }
    }
  }, {
    key: "broadcastDataGuaranteed",
    value: function broadcastDataGuaranteed(dataType, data) {
      for (var clientId in this.peers) {
        if (this.peers.hasOwnProperty(clientId)) {
          this.sendDataGuaranteed(clientId, dataType, data);
        }
      }
    }
  }, {
    key: "getConnectStatus",
    value: function getConnectStatus(clientId) {
      var peer = this.peers[clientId];
      if (peer === undefined) return NAF.adapters.NOT_CONNECTED;
      switch (peer.getStatus()) {
        case WebRtcPeer.IS_CONNECTED:
          return NAF.adapters.IS_CONNECTED;
        case WebRtcPeer.CONNECTING:
          return NAF.adapters.CONNECTING;
        case WebRtcPeer.NOT_CONNECTED:
        default:
          return NAF.adapters.NOT_CONNECTED;
      }
    }
  }, {
    key: "getMediaStream",
    value: function getMediaStream(clientId) {
      return Promise.reject("Interface method not implemented: getMediaStream");
    }

    /*
     * Privates
     */
  }, {
    key: "initFirebase",
    value: function initFirebase(callback) {
      this.firebaseApp = this.firebase.initializeApp({
        apiKey: this.apiKey,
        authDomain: this.authDomain,
        databaseURL: this.databaseURL
      }, this.appId);
      this.auth(this.authType, callback);
    }
  }, {
    key: "auth",
    value: function auth(type, callback) {
      switch (type) {
        case "none":
          this.authNone(callback);
          break;
        case "anonymous":
          this.authAnonymous(callback);
          break;

        // TODO: support other auth type
        default:
          NAF.log.write("FirebaseWebRtcInterface.auth: Unknown authType " + type);
          break;
      }
    }
  }, {
    key: "authNone",
    value: function authNone(callback) {
      var self = this;

      // asynchronously invokes open listeners for the compatibility with other auth types.
      // TODO: generate not just random but also unique id
      requestAnimationFrame(function () {
        callback(self.randomString());
      });
    }
  }, {
    key: "authAnonymous",
    value: function authAnonymous(callback) {
      var self = this;
      var firebaseApp = this.firebaseApp;
      firebaseApp.auth().signInAnonymously()["catch"](function (error) {
        NAF.log.error("FirebaseWebRtcInterface.authAnonymous: " + error);
        self.connectFailure(null, error);
      });
      firebaseApp.auth().onAuthStateChanged(function (user) {
        if (user !== null) {
          callback(user.uid);
        }
      });
    }

    /*
     * realtime database layout
     *
     * /rootPath/appId/roomId/
     *   - /userId/
     *     - timestamp: joining the room timestamp
     *     - signal: used to send signal
     *     - data: used to send guaranteed data
     *   - /timestamp/: working path to get timestamp
     *     - userId:
     */
  }, {
    key: "getRootPath",
    value: function getRootPath() {
      return this.rootPath;
    }
  }, {
    key: "getAppPath",
    value: function getAppPath() {
      return this.getRootPath() + "/" + this.appId;
    }
  }, {
    key: "getRoomPath",
    value: function getRoomPath() {
      return this.getAppPath() + "/" + this.roomId;
    }
  }, {
    key: "getUserPath",
    value: function getUserPath(id) {
      return this.getRoomPath() + "/" + id;
    }
  }, {
    key: "getSignalPath",
    value: function getSignalPath(id) {
      return this.getUserPath(id) + "/signal";
    }
  }, {
    key: "getDataPath",
    value: function getDataPath(id) {
      return this.getUserPath(id) + "/data";
    }
  }, {
    key: "getTimestampGenerationPath",
    value: function getTimestampGenerationPath(id) {
      return this.getRoomPath() + "/timestamp/" + id;
    }
  }, {
    key: "randomString",
    value: function randomString() {
      var stringLength = 16;
      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz0123456789";
      var string = "";
      for (var i = 0; i < stringLength; i++) {
        var randomNumber = Math.floor(Math.random() * chars.length);
        string += chars.substring(randomNumber, randomNumber + 1);
      }
      return string;
    }
  }, {
    key: "getTimestamp",
    value: function getTimestamp(callback) {
      var firebaseApp = this.firebaseApp;
      var ref = firebaseApp.database().ref(this.getTimestampGenerationPath(this.localId));
      ref.set(this.firebase.database.ServerValue.TIMESTAMP);
      ref.once("value", function (data) {
        var timestamp = data.val();
        ref.remove();
        callback(timestamp);
      });
      ref.onDisconnect().remove();
    }
  }, {
    key: "updateTimeOffset",
    value: function updateTimeOffset() {
      var _this = this;
      return this.firebaseApp.database().ref("/.info/serverTimeOffset").once("value").then(function (data) {
        var timeOffset = data.val();
        _this.serverTimeRequests++;
        if (_this.serverTimeRequests <= 10) {
          _this.timeOffsets.push(timeOffset);
        } else {
          _this.timeOffsets[_this.serverTimeRequests % 10] = timeOffset;
        }
        _this.avgTimeOffset = _this.timeOffsets.reduce(function (acc, offset) {
          return acc += offset;
        }, 0) / _this.timeOffsets.length;
        if (_this.serverTimeRequests > 10) {
          setTimeout(function () {
            return _this.updateTimeOffset();
          }, 5 * 60 * 1000); // Sync clock every 5 minutes.
        } else {
          _this.updateTimeOffset();
        }
      });
    }
  }, {
    key: "getServerTime",
    value: function getServerTime() {
      return new Date().getTime() + this.avgTimeOffset;
    }
  }]);
  return FirebaseWebRtcAdapter;
}();
NAF.adapters.register("firebase", FirebaseWebRtcAdapter);
module.exports = FirebaseWebRtcAdapter;

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL2ZpcmViYXNlLWtleS1lbmNvZGUvZmlyZWJhc2Uta2V5LWVuY29kZS5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvV2ViUnRjUGVlci5qcyIsIndlYnBhY2s6Ly8vLi9zcmMvaW5kZXguanMiXSwibmFtZXMiOlsibW9kdWxlIiwiZXhwb3J0cyIsImVuY29kZSIsImRlY29kZWQiLCJlbmNvZGVVUklDb21wb25lbnQiLCJyZXBsYWNlIiwiZGVjb2RlIiwiZW5jb2RlZCIsImRlY29kZVVSSUNvbXBvbmVudCIsImRlZXBLZXlSZXBsYWNlIiwib2JqIiwiZm4iLCJyZWJ1aWx0VHJlZSIsIk9iamVjdCIsImFzc2lnbiIsInRyYXZlcnNlIiwibyIsIngiLCJmdW5jIiwiX3R5cGVvZiIsImkiLCJBcnJheSIsImlzQXJyYXkiLCJhcHBseSIsImxlbmd0aCIsInBhcmVudCIsImtleSIsInZhbCIsImRlZXBEZWNvZGUiLCJlbmNvZGVkVHJlZSIsIiR0aGlzIiwiZGVlcEVuY29kZSIsImRlY29kZWRUcmVlIiwiV2ViUnRjUGVlciIsImxvY2FsSWQiLCJyZW1vdGVJZCIsInNlbmRTaWduYWxGdW5jIiwiX2NsYXNzQ2FsbENoZWNrIiwib3BlbiIsImNoYW5uZWxMYWJlbCIsInBjIiwiY3JlYXRlUGVlckNvbm5lY3Rpb24iLCJjaGFubmVsIiwiX2NyZWF0ZUNsYXNzIiwidmFsdWUiLCJzZXREYXRhY2hhbm5lbExpc3RlbmVycyIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwib2ZmZXIiLCJzZWxmIiwic2V0dXBDaGFubmVsIiwiY3JlYXRlRGF0YUNoYW5uZWwiLCJyZWxpYWJsZSIsImNyZWF0ZU9mZmVyIiwic2RwIiwiaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uIiwiZXJyb3IiLCJjb25zb2xlIiwiaGFuZGxlU2lnbmFsIiwic2lnbmFsIiwidG8iLCJmcm9tIiwidHlwZSIsImhhbmRsZU9mZmVyIiwiaGFuZGxlQW5zd2VyIiwiaGFuZGxlQ2FuZGlkYXRlIiwic2VuZCIsImRhdGEiLCJyZWFkeVN0YXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsImdldFN0YXR1cyIsIk5PVF9DT05ORUNURUQiLCJJU19DT05ORUNURUQiLCJDT05ORUNUSU5HIiwiUlRDUGVlckNvbm5lY3Rpb24iLCJ3aW5kb3ciLCJ3ZWJraXRSVENQZWVyQ29ubmVjdGlvbiIsIm1velJUQ1BlZXJDb25uZWN0aW9uIiwibXNSVENQZWVyQ29ubmVjdGlvbiIsInVuZGVmaW5lZCIsIkVycm9yIiwiaWNlU2VydmVycyIsIklDRV9TRVJWRVJTIiwib25pY2VjYW5kaWRhdGUiLCJldmVudCIsImNhbmRpZGF0ZSIsInNkcE1MaW5lSW5kZXgiLCJvbmljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZSIsImljZUNvbm5lY3Rpb25TdGF0ZSIsIm9ubWVzc2FnZSIsInBhcnNlIiwib25vcGVuIiwib25jbG9zZSIsIm9uZXJyb3IiLCJtZXNzYWdlIiwib25kYXRhY2hhbm5lbCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwiY3JlYXRlQW5zd2VyIiwiUlRDSWNlQ2FuZGlkYXRlIiwid2Via2l0UlRDSWNlQ2FuZGlkYXRlIiwibW96UlRDSWNlQ2FuZGlkYXRlIiwiYWRkSWNlQ2FuZGlkYXRlIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsIlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1zUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwidXJscyIsImZpcmViYXNlS2V5RW5jb2RlIiwicmVxdWlyZSIsIkZpcmViYXNlV2ViUnRjQWRhcHRlciIsImZpcmViYXNlIiwiY29uZmlnIiwicm9vdFBhdGgiLCJhcHBJZCIsInJvb21JZCIsInBlZXJzIiwib2NjdXBhbnRzIiwic2VydmVyVGltZVJlcXVlc3RzIiwidGltZU9mZnNldHMiLCJhdmdUaW1lT2Zmc2V0IiwidG9wIiwiZmlyZWJhc2VDb25maWciLCJhdXRoVHlwZSIsImFwaUtleSIsImF1dGhEb21haW4iLCJkYXRhYmFzZVVSTCIsInNldFNlcnZlclVybCIsInVybCIsInNldEFwcCIsInNldFJvb20iLCJzZXRXZWJSdGNPcHRpb25zIiwib3B0aW9ucyIsImRhdGFjaGFubmVsIiwiTkFGIiwibG9nIiwid2FybiIsImF1ZGlvIiwidmlkZW8iLCJzZXRTZXJ2ZXJDb25uZWN0TGlzdGVuZXJzIiwic3VjY2Vzc0xpc3RlbmVyIiwiZmFpbHVyZUxpc3RlbmVyIiwiY29ubmVjdFN1Y2Nlc3MiLCJjb25uZWN0RmFpbHVyZSIsInNldFJvb21PY2N1cGFudExpc3RlbmVyIiwib2NjdXBhbnRMaXN0ZW5lciIsInNldERhdGFDaGFubmVsTGlzdGVuZXJzIiwiZGF0YVR5cGUiLCJkZWNvZGVkRGF0YSIsImNvbm5lY3QiLCJpbml0RmlyZWJhc2UiLCJpZCIsInVwZGF0ZVRpbWVPZmZzZXQiLCJmaXJlYmFzZUFwcCIsImdldFRpbWVzdGFtcCIsInRpbWVzdGFtcCIsIm15Um9vbUpvaW5UaW1lIiwidXNlclJlZiIsImRhdGFiYXNlIiwicmVmIiwiZ2V0VXNlclBhdGgiLCJzZXQiLCJvbkRpc2Nvbm5lY3QiLCJyZW1vdmUiLCJyb29tUmVmIiwiZ2V0Um9vbVBhdGgiLCJvbiIsInJlbW90ZVRpbWVzdGFtcCIsInBlZXIiLCJnZXRTaWduYWxQYXRoIiwiZ2V0RGF0YVBhdGgiLCJzaG91bGRTdGFydENvbm5lY3Rpb25UbyIsImNsaWVudCIsInJvb21Kb2luVGltZSIsInN0YXJ0U3RyZWFtQ29ubmVjdGlvbiIsImNsaWVudElkIiwiY2xvc2VTdHJlYW1Db25uZWN0aW9uIiwic2VuZERhdGEiLCJzZW5kRGF0YUd1YXJhbnRlZWQiLCJjbG9uZWREYXRhIiwiZW5jb2RlZERhdGEiLCJicm9hZGNhc3REYXRhIiwiaGFzT3duUHJvcGVydHkiLCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCIsImdldENvbm5lY3RTdGF0dXMiLCJhZGFwdGVycyIsImdldE1lZGlhU3RyZWFtIiwiUHJvbWlzZSIsInJlamVjdCIsImNhbGxiYWNrIiwiaW5pdGlhbGl6ZUFwcCIsImF1dGgiLCJhdXRoTm9uZSIsImF1dGhBbm9ueW1vdXMiLCJ3cml0ZSIsInJlcXVlc3RBbmltYXRpb25GcmFtZSIsInJhbmRvbVN0cmluZyIsInNpZ25JbkFub255bW91c2x5Iiwib25BdXRoU3RhdGVDaGFuZ2VkIiwidXNlciIsInVpZCIsImdldFJvb3RQYXRoIiwiZ2V0QXBwUGF0aCIsImdldFRpbWVzdGFtcEdlbmVyYXRpb25QYXRoIiwic3RyaW5nTGVuZ3RoIiwiY2hhcnMiLCJzdHJpbmciLCJyYW5kb21OdW1iZXIiLCJNYXRoIiwiZmxvb3IiLCJyYW5kb20iLCJzdWJzdHJpbmciLCJTZXJ2ZXJWYWx1ZSIsIlRJTUVTVEFNUCIsIm9uY2UiLCJfdGhpcyIsInRoZW4iLCJ0aW1lT2Zmc2V0IiwicHVzaCIsInJlZHVjZSIsImFjYyIsIm9mZnNldCIsInNldFRpbWVvdXQiLCJnZXRTZXJ2ZXJUaW1lIiwiRGF0ZSIsImdldFRpbWUiLCJyZWdpc3RlciJdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0EseUNBQXlDLGlDQUFpQztRQUMxRSxnSEFBZ0gsbUJBQW1CLEVBQUU7UUFDckk7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwy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TyxJQUFJQyxJQUFJLEVBQUUsQ0FBQ0MsT0FBTyxFQUFFLEdBQUcsSUFBSSxDQUFDekcsYUFBYTtJQUNsRDtFQUFDO0VBQUEsT0FBQVYscUJBQUE7QUFBQTtBQUdId0IsR0FBRyxDQUFDbUQsUUFBUSxDQUFDeUMsUUFBUSxDQUFDLFVBQVUsRUFBRXBILHFCQUFxQixDQUFDO0FBRXhEaEgsTUFBTSxDQUFDQyxPQUFPLEdBQUcrRyxxQkFBcUIsQyIsImZpbGUiOiJuYWYtZmlyZWJhc2UtYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZW5jb2RlOiBmdW5jdGlvbiAoZGVjb2RlZCkge1xuICAgICAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KGRlY29kZWQpLnJlcGxhY2UoL1xcLi9nLCAnJTJFJyk7XG4gICAgfSxcbiAgICBkZWNvZGU6IGZ1bmN0aW9uIChlbmNvZGVkKSB7XG4gICAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQoZW5jb2RlZC5yZXBsYWNlKCclMkUnLCAnLicpKTtcbiAgICB9LFxuICAgIC8vIFJlcGxhY2VzIHRoZSBrZXkgd2l0aCBgZm4oa2V5KWAgb24gZWFjaCBrZXkgaW4gYW4gb2JqZWN0IHRyZWUuXG4gICAgLy8gaS5lLiBtYWtpbmcgYWxsIGtleXMgdXBwZXJjYXNlLlxuICAgIGRlZXBLZXlSZXBsYWNlOiBmdW5jdGlvbiAob2JqLCBmbikge1xuICAgICAgICB2YXIgcmVidWlsdFRyZWUgPSBPYmplY3QuYXNzaWduKHt9LCBvYmopO1xuXG4gICAgICAgIGZ1bmN0aW9uIHRyYXZlcnNlKG8sIHgsIGZ1bmMpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YobykgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpIGluIG8pIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9baV0gIT09IG51bGwgJiYgKHR5cGVvZihvW2ldKT09XCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KG9baV0pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9nb2luZyBvbiBzdGVwIGRvd24gaW4gdGhlIG9iamVjdCB0cmVlISFcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlKG9baV0seFtpXSxmdW5jKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBmdW5jLmFwcGx5KHRoaXMsW3gsIGksIHhbaV1dKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKEFycmF5LmlzQXJyYXkobykpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG8ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZnVuYy5hcHBseSh0aGlzLFtvLCBpLG9baV1dKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9baV0gIT09IG51bGwgJiYgKHR5cGVvZihvW2ldKT09XCJvYmplY3RcIiB8fCBBcnJheS5pc0FycmF5KG9baV0pKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy9nb2luZyBvbiBzdGVwIGRvd24gaW4gdGhlIG9iamVjdCB0cmVlISFcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyYXZlcnNlKG9baV0sIHhbaV0sIGZ1bmMpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdHJhdmVyc2Uob2JqLCByZWJ1aWx0VHJlZSwgZnVuY3Rpb24gKHBhcmVudCwga2V5LCB2YWwpIHtcbiAgICAgICAgICAgIGRlbGV0ZSBwYXJlbnRba2V5XTtcbiAgICAgICAgICAgIHBhcmVudFtmbihrZXkpXSA9IHZhbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHJlYnVpbHRUcmVlO1xuICAgIH0sXG4gICAgZGVlcERlY29kZTogZnVuY3Rpb24gKGVuY29kZWRUcmVlKSB7XG4gICAgICAgIHZhciAkdGhpcyA9IHRoaXM7XG5cbiAgICAgICAgdmFyIHJlYnVpbHRUcmVlID0gdGhpcy5kZWVwS2V5UmVwbGFjZShlbmNvZGVkVHJlZSwgZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgcmV0dXJuICR0aGlzLmRlY29kZShrZXkpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gcmVidWlsdFRyZWU7XG4gICAgfSxcbiAgICBkZWVwRW5jb2RlOiBmdW5jdGlvbiAoZGVjb2RlZFRyZWUpIHtcbiAgICAgICAgdmFyICR0aGlzID0gdGhpcztcblxuICAgICAgICB2YXIgcmVidWlsdFRyZWUgPSB0aGlzLmRlZXBLZXlSZXBsYWNlKGRlY29kZWRUcmVlLCBmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gJHRoaXMuZW5jb2RlKGtleSk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiByZWJ1aWx0VHJlZTtcbiAgICB9XG59XG4iLCJjbGFzcyBXZWJSdGNQZWVyIHtcbiAgY29uc3RydWN0b3IobG9jYWxJZCwgcmVtb3RlSWQsIHNlbmRTaWduYWxGdW5jKSB7XG4gICAgdGhpcy5sb2NhbElkID0gbG9jYWxJZDtcbiAgICB0aGlzLnJlbW90ZUlkID0gcmVtb3RlSWQ7XG4gICAgdGhpcy5zZW5kU2lnbmFsRnVuYyA9IHNlbmRTaWduYWxGdW5jO1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMuY2hhbm5lbExhYmVsID0gXCJuZXR3b3JrZWQtYWZyYW1lLWNoYW5uZWxcIjtcblxuICAgIHRoaXMucGMgPSB0aGlzLmNyZWF0ZVBlZXJDb25uZWN0aW9uKCk7XG4gICAgdGhpcy5jaGFubmVsID0gbnVsbDtcbiAgfVxuXG4gIHNldERhdGFjaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xuICAgIHRoaXMub3Blbkxpc3RlbmVyID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgfVxuXG4gIG9mZmVyKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyByZWxpYWJsZTogZmFsc2UgLSBVRFBcbiAgICB0aGlzLnNldHVwQ2hhbm5lbChcbiAgICAgIHRoaXMucGMuY3JlYXRlRGF0YUNoYW5uZWwodGhpcy5jaGFubmVsTGFiZWwsIHsgcmVsaWFibGU6IGZhbHNlIH0pXG4gICAgKTtcbiAgICB0aGlzLnBjLmNyZWF0ZU9mZmVyKFxuICAgICAgZnVuY3Rpb24oc2RwKSB7XG4gICAgICAgIHNlbGYuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIldlYlJ0Y1BlZXIub2ZmZXI6IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBoYW5kbGVTaWduYWwoc2lnbmFsKSB7XG4gICAgLy8gaWdub3JlcyBzaWduYWwgaWYgaXQgaXNuJ3QgZm9yIG1lXG4gICAgaWYgKHRoaXMubG9jYWxJZCAhPT0gc2lnbmFsLnRvIHx8IHRoaXMucmVtb3RlSWQgIT09IHNpZ25hbC5mcm9tKSByZXR1cm47XG5cbiAgICBzd2l0Y2ggKHNpZ25hbC50eXBlKSB7XG4gICAgICBjYXNlIFwib2ZmZXJcIjpcbiAgICAgICAgdGhpcy5oYW5kbGVPZmZlcihzaWduYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImFuc3dlclwiOlxuICAgICAgICB0aGlzLmhhbmRsZUFuc3dlcihzaWduYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImNhbmRpZGF0ZVwiOlxuICAgICAgICB0aGlzLmhhbmRsZUNhbmRpZGF0ZShzaWduYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgY29uc29sZS5lcnJvcihcbiAgICAgICAgICBcIldlYlJ0Y1BlZXIuaGFuZGxlU2lnbmFsOiBVbmtub3duIHNpZ25hbCB0eXBlIFwiICsgc2lnbmFsLnR5cGVcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgc2VuZCh0eXBlLCBkYXRhKSB7XG4gICAgLy8gVE9ETzogdGhyb3cgZXJyb3I/XG4gICAgaWYgKHRoaXMuY2hhbm5lbCA9PT0gbnVsbCB8fCB0aGlzLmNoYW5uZWwucmVhZHlTdGF0ZSAhPT0gXCJvcGVuXCIpIHJldHVybjtcblxuICAgIHRoaXMuY2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogdHlwZSwgZGF0YTogZGF0YSB9KSk7XG4gIH1cblxuICBnZXRTdGF0dXMoKSB7XG4gICAgaWYgKHRoaXMuY2hhbm5lbCA9PT0gbnVsbCkgcmV0dXJuIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDtcblxuICAgIHN3aXRjaCAodGhpcy5jaGFubmVsLnJlYWR5U3RhdGUpIHtcbiAgICAgIGNhc2UgXCJvcGVuXCI6XG4gICAgICAgIHJldHVybiBXZWJSdGNQZWVyLklTX0NPTk5FQ1RFRDtcblxuICAgICAgY2FzZSBcImNvbm5lY3RpbmdcIjpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuQ09OTkVDVElORztcblxuICAgICAgY2FzZSBcImNsb3NpbmdcIjpcbiAgICAgIGNhc2UgXCJjbG9zZWRcIjpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBXZWJSdGNQZWVyLk5PVF9DT05ORUNURUQ7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICAgKiBQcml2YXRlc1xuICAgICAqL1xuXG4gIGNyZWF0ZVBlZXJDb25uZWN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgUlRDUGVlckNvbm5lY3Rpb24gPVxuICAgICAgd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gICAgICB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgICAgIHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgd2luZG93Lm1zUlRDUGVlckNvbm5lY3Rpb247XG5cbiAgICBpZiAoUlRDUGVlckNvbm5lY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIldlYlJ0Y1BlZXIuY3JlYXRlUGVlckNvbm5lY3Rpb246IFRoaXMgYnJvd3NlciBkb2VzIG5vdCBzZWVtIHRvIHN1cHBvcnQgV2ViUlRDLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih7IGljZVNlcnZlcnM6IFdlYlJ0Y1BlZXIuSUNFX1NFUlZFUlMgfSk7XG5cbiAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XG4gICAgICAgIHNlbGYuc2VuZFNpZ25hbEZ1bmMoe1xuICAgICAgICAgIGZyb206IHNlbGYubG9jYWxJZCxcbiAgICAgICAgICB0bzogc2VsZi5yZW1vdGVJZCxcbiAgICAgICAgICB0eXBlOiBcImNhbmRpZGF0ZVwiLFxuICAgICAgICAgIHNkcE1MaW5lSW5kZXg6IGV2ZW50LmNhbmRpZGF0ZS5zZHBNTGluZUluZGV4LFxuICAgICAgICAgIGNhbmRpZGF0ZTogZXZlbnQuY2FuZGlkYXRlLmNhbmRpZGF0ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gTm90ZTogc2VlbXMgbGlrZSBjaGFubmVsLm9uY2xvc2UgaGFuZGVyIGlzIHVucmVsaWFibGUgb24gc29tZSBwbGF0Zm9ybXMsXG4gICAgLy8gICAgICAgc28gYWxzbyB0cmllcyB0byBkZXRlY3QgZGlzY29ubmVjdGlvbiBoZXJlLlxuICAgIHBjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2VsZi5vcGVuICYmIHBjLmljZUNvbm5lY3Rpb25TdGF0ZSA9PT0gXCJkaXNjb25uZWN0ZWRcIikge1xuICAgICAgICBzZWxmLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgc2VsZi5jbG9zZWRMaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHBjO1xuICB9XG5cbiAgc2V0dXBDaGFubmVsKGNoYW5uZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmNoYW5uZWwgPSBjaGFubmVsO1xuXG4gICAgLy8gcmVjZWl2ZWQgZGF0YSBmcm9tIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyKHNlbGYucmVtb3RlSWQsIGRhdGEudHlwZSwgZGF0YS5kYXRhKTtcbiAgICB9O1xuXG4gICAgLy8gY29ubmVjdGVkIHdpdGggYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbm9wZW4gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgc2VsZi5vcGVuID0gdHJ1ZTtcbiAgICAgIHNlbGYub3Blbkxpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xuICAgIH07XG5cbiAgICAvLyBkaXNjb25uZWN0ZWQgd2l0aCBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKCFzZWxmLm9wZW4pIHJldHVybjtcbiAgICAgIHNlbGYub3BlbiA9IGZhbHNlO1xuICAgICAgc2VsZi5jbG9zZWRMaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcbiAgICB9O1xuXG4gICAgLy8gZXJyb3Igb2NjdXJyZWQgd2l0aCBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuICAgICAgY29uc29sZS5lcnJvcihcIldlYlJ0Y1BlZXIuY2hhbm5lbC5vbmVycm9yOiBcIiArIGVycm9yKTtcbiAgICB9O1xuICB9XG5cbiAgaGFuZGxlT2ZmZXIobWVzc2FnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucGMub25kYXRhY2hhbm5lbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzZWxmLnNldHVwQ2hhbm5lbChldmVudC5jaGFubmVsKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zZXRSZW1vdGVEZXNjcmlwdGlvbihtZXNzYWdlKTtcblxuICAgIHRoaXMucGMuY3JlYXRlQW5zd2VyKFxuICAgICAgZnVuY3Rpb24oc2RwKSB7XG4gICAgICAgIHNlbGYuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIldlYlJ0Y1BlZXIuaGFuZGxlT2ZmZXI6IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBoYW5kbGVBbnN3ZXIobWVzc2FnZSkge1xuICAgIHRoaXMuc2V0UmVtb3RlRGVzY3JpcHRpb24obWVzc2FnZSk7XG4gIH1cblxuICBoYW5kbGVDYW5kaWRhdGUobWVzc2FnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgUlRDSWNlQ2FuZGlkYXRlID1cbiAgICAgIHdpbmRvdy5SVENJY2VDYW5kaWRhdGUgfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSVENJY2VDYW5kaWRhdGUgfHxcbiAgICAgIHdpbmRvdy5tb3pSVENJY2VDYW5kaWRhdGU7XG5cbiAgICB0aGlzLnBjLmFkZEljZUNhbmRpZGF0ZShcbiAgICAgIG5ldyBSVENJY2VDYW5kaWRhdGUobWVzc2FnZSksXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIldlYlJ0Y1BlZXIuaGFuZGxlQ2FuZGlkYXRlOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucGMuc2V0TG9jYWxEZXNjcmlwdGlvbihcbiAgICAgIHNkcCxcbiAgICAgIGZ1bmN0aW9uKCkge30sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb246IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB0aGlzLnNlbmRTaWduYWxGdW5jKHtcbiAgICAgIGZyb206IHRoaXMubG9jYWxJZCxcbiAgICAgIHRvOiB0aGlzLnJlbW90ZUlkLFxuICAgICAgdHlwZTogc2RwLnR5cGUsXG4gICAgICBzZHA6IHNkcC5zZHBcbiAgICB9KTtcbiAgfVxuXG4gIHNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiA9XG4gICAgICB3aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICB3aW5kb3cud2Via2l0UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICB3aW5kb3cubW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICB3aW5kb3cubXNSVENTZXNzaW9uRGVzY3JpcHRpb247XG5cbiAgICB0aGlzLnBjLnNldFJlbW90ZURlc2NyaXB0aW9uKFxuICAgICAgbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihtZXNzYWdlKSxcbiAgICAgIGZ1bmN0aW9uKCkge30sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5zZXRSZW1vdGVEZXNjcmlwdGlvbjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxufVxuXG5XZWJSdGNQZWVyLklTX0NPTk5FQ1RFRCA9IFwiSVNfQ09OTkVDVEVEXCI7XG5XZWJSdGNQZWVyLkNPTk5FQ1RJTkcgPSBcIkNPTk5FQ1RJTkdcIjtcbldlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRCA9IFwiTk9UX0NPTk5FQ1RFRFwiO1xuXG5XZWJSdGNQZWVyLklDRV9TRVJWRVJTID0gW1xuICB7IHVybHM6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuMi5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuMy5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuNC5sLmdvb2dsZS5jb206MTkzMDJcIiB9XG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYlJ0Y1BlZXI7XG4iLCJjb25zdCBmaXJlYmFzZUtleUVuY29kZSA9IHJlcXVpcmUoXCJmaXJlYmFzZS1rZXktZW5jb2RlXCIpO1xuY29uc3QgV2ViUnRjUGVlciA9IHJlcXVpcmUoXCIuL1dlYlJ0Y1BlZXJcIik7XG5cbmNsYXNzIEZpcmViYXNlV2ViUnRjQWRhcHRlciB7XG4gIC8qKlxuICAgIENvbmZpZyBzdHJ1Y3R1cmU6XG4gICAgY29uZmlnLmF1dGhUeXBlOiBub25lO1xuICAgIGNvbmZpZy5hcGlLZXk6IHlvdXItYXBpO1xuICAgIGNvbmZpZy5hdXRoRG9tYWluOiB5b3VyLXByb2plY3QuZmlyZWJhc2VhcHAuY29tO1xuICAgIGNvbmZpZy5kYXRhYmFzZVVSTDogaHR0cHM6Ly95b3VyLXByb2plY3QuZmlyZWJhc2Vpby5jb207XG4gICovXG4gIGNvbnN0cnVjdG9yKGZpcmViYXNlLCBjb25maWcpIHtcbiAgICB0aGlzLnJvb3RQYXRoID0gXCJuZXR3b3JrZWQtYWZyYW1lXCI7XG5cbiAgICB0aGlzLmxvY2FsSWQgPSBudWxsO1xuICAgIHRoaXMuYXBwSWQgPSBudWxsO1xuICAgIHRoaXMucm9vbUlkID0gbnVsbDtcblxuICAgIHRoaXMucGVlcnMgPSB7fTsgLy8gaWQgLT4gV2ViUnRjUGVlclxuICAgIHRoaXMub2NjdXBhbnRzID0ge307IC8vIGlkIC0+IGpvaW5UaW1lc3RhbXBcblxuICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzID0gMDtcbiAgICB0aGlzLnRpbWVPZmZzZXRzID0gW107XG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcblxuICAgIGNvbmZpZyA9IGNvbmZpZyB8fCB3aW5kb3cudG9wLmZpcmViYXNlQ29uZmlnIHx8IHdpbmRvdy5maXJlYmFzZUNvbmZpZztcbiAgICB0aGlzLmZpcmViYXNlID0gZmlyZWJhc2UgfHwgd2luZG93LnRvcC5maXJlYmFzZSB8fCB3aW5kb3cuZmlyZWJhc2U7XG5cbiAgICBpZiAodGhpcy5maXJlYmFzZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiSW1wb3J0IGh0dHBzOi8vd3d3LmdzdGF0aWMuY29tL2ZpcmViYXNlanMveC54LngvZmlyZWJhc2UuanNcIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICB0aGlzLmF1dGhUeXBlID0gY29uZmlnLmF1dGhUeXBlO1xuICAgIHRoaXMuYXBpS2V5ID0gY29uZmlnLmFwaUtleTtcbiAgICB0aGlzLmF1dGhEb21haW4gPSBjb25maWcuYXV0aERvbWFpbjtcbiAgICB0aGlzLmRhdGFiYXNlVVJMID0gY29uZmlnLmRhdGFiYXNlVVJMO1xuICB9XG5cbiAgLypcbiAgICogQ2FsbCBiZWZvcmUgYGNvbm5lY3RgXG4gICAqL1xuXG4gIHNldFNlcnZlclVybCh1cmwpIHtcbiAgICAvLyBoYW5kbGVkIGluIGNvbmZpZ1xuICB9XG5cbiAgc2V0QXBwKGFwcElkKSB7XG4gICAgdGhpcy5hcHBJZCA9IGFwcElkO1xuICB9XG5cbiAgc2V0Um9vbShyb29tSWQpIHtcbiAgICB0aGlzLnJvb21JZCA9IHJvb21JZDtcbiAgfVxuXG4gIC8vIG9wdGlvbnM6IHsgZGF0YWNoYW5uZWw6IGJvb2wsIGF1ZGlvOiBib29sIH1cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgLy8gVE9ETzogc3VwcG9ydCBhdWRpbyBhbmQgdmlkZW9cbiAgICBpZiAob3B0aW9ucy5kYXRhY2hhbm5lbCA9PT0gZmFsc2UpXG4gICAgICBOQUYubG9nLndhcm4oXG4gICAgICAgIFwiRmlyZWJhc2VXZWJSdGNBZGFwdGVyLnNldFdlYlJ0Y09wdGlvbnM6IGRhdGFjaGFubmVsIG11c3QgYmUgdHJ1ZS5cIlxuICAgICAgKTtcbiAgICBpZiAob3B0aW9ucy5hdWRpbyA9PT0gdHJ1ZSlcbiAgICAgIE5BRi5sb2cud2FybihcIkZpcmViYXNlV2ViUnRjQWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IGF1ZGlvIHlldC5cIik7XG4gICAgaWYgKG9wdGlvbnMudmlkZW8gPT09IHRydWUpXG4gICAgICBOQUYubG9nLndhcm4oXCJGaXJlYmFzZVdlYlJ0Y0FkYXB0ZXIgZG9lcyBub3Qgc3VwcG9ydCB2aWRlbyB5ZXQuXCIpO1xuICB9XG5cbiAgc2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyhzdWNjZXNzTGlzdGVuZXIsIGZhaWx1cmVMaXN0ZW5lcikge1xuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIgPSBvY2N1cGFudExpc3RlbmVyO1xuICB9XG5cbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lciA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMubWVzc2FnZUxpc3RlbmVyID0gZnVuY3Rpb24ocmVtb3RlSWQsIGRhdGFUeXBlLCBkYXRhKSB7XG4gICAgICB2YXIgZGVjb2RlZERhdGEgPSBmaXJlYmFzZUtleUVuY29kZS5kZWVwRGVjb2RlKGRhdGEpO1xuICAgICAgbWVzc2FnZUxpc3RlbmVyKHJlbW90ZUlkLCBkYXRhVHlwZSwgZGVjb2RlZERhdGEpO1xuICAgIH07XG4gIH1cblxuICBjb25uZWN0KCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuaW5pdEZpcmViYXNlKGZ1bmN0aW9uKGlkKSB7XG4gICAgICBzZWxmLnVwZGF0ZVRpbWVPZmZzZXQoKTtcblxuICAgICAgc2VsZi5sb2NhbElkID0gaWQ7XG4gICAgICB2YXIgZmlyZWJhc2VBcHAgPSBzZWxmLmZpcmViYXNlQXBwO1xuXG4gICAgICAvLyBOb3RlOiBhc3N1bWluZyB0aGF0IGRhdGEgdHJhbnNmZXIgdmlhIGZpcmViYXNlIHJlYWx0aW1lIGRhdGFiYXNlXG4gICAgICAvLyAgICAgICBpcyByZWxpYWJsZSBhbmQgaW4gb3JkZXJcbiAgICAgIC8vIFRPRE86IGNhbiByYWNlIGFtb25nIHBlZXJzPyBJZiBzbywgZml4XG5cbiAgICAgIHNlbGYuZ2V0VGltZXN0YW1wKGZ1bmN0aW9uKHRpbWVzdGFtcCkge1xuICAgICAgICBzZWxmLm15Um9vbUpvaW5UaW1lID0gdGltZXN0YW1wO1xuXG4gICAgICAgIHZhciB1c2VyUmVmID0gZmlyZWJhc2VBcHBcbiAgICAgICAgICAuZGF0YWJhc2UoKVxuICAgICAgICAgIC5yZWYoc2VsZi5nZXRVc2VyUGF0aChzZWxmLmxvY2FsSWQpKTtcbiAgICAgICAgdXNlclJlZi5zZXQoeyB0aW1lc3RhbXA6IHRpbWVzdGFtcCwgc2lnbmFsOiBcIlwiLCBkYXRhOiBcIlwiIH0pO1xuICAgICAgICB1c2VyUmVmLm9uRGlzY29ubmVjdCgpLnJlbW92ZSgpO1xuXG4gICAgICAgIHZhciByb29tUmVmID0gZmlyZWJhc2VBcHAuZGF0YWJhc2UoKS5yZWYoc2VsZi5nZXRSb29tUGF0aCgpKTtcblxuICAgICAgICByb29tUmVmLm9uKFwiY2hpbGRfYWRkZWRcIiwgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIHZhciByZW1vdGVJZCA9IGRhdGEua2V5O1xuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgcmVtb3RlSWQgPT09IHNlbGYubG9jYWxJZCB8fFxuICAgICAgICAgICAgcmVtb3RlSWQgPT09IFwidGltZXN0YW1wXCIgfHxcbiAgICAgICAgICAgIHNlbGYucGVlcnNbcmVtb3RlSWRdICE9PSB1bmRlZmluZWRcbiAgICAgICAgICApXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICB2YXIgcmVtb3RlVGltZXN0YW1wID0gZGF0YS52YWwoKS50aW1lc3RhbXA7XG5cbiAgICAgICAgICB2YXIgcGVlciA9IG5ldyBXZWJSdGNQZWVyKFxuICAgICAgICAgICAgc2VsZi5sb2NhbElkLFxuICAgICAgICAgICAgcmVtb3RlSWQsXG4gICAgICAgICAgICAvLyBzZW5kIHNpZ25hbCBmdW5jdGlvblxuICAgICAgICAgICAgZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICBmaXJlYmFzZUFwcFxuICAgICAgICAgICAgICAgIC5kYXRhYmFzZSgpXG4gICAgICAgICAgICAgICAgLnJlZihzZWxmLmdldFNpZ25hbFBhdGgoc2VsZi5sb2NhbElkKSlcbiAgICAgICAgICAgICAgICAuc2V0KGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICk7XG4gICAgICAgICAgcGVlci5zZXREYXRhY2hhbm5lbExpc3RlbmVycyhcbiAgICAgICAgICAgIHNlbGYub3Blbkxpc3RlbmVyLFxuICAgICAgICAgICAgc2VsZi5jbG9zZWRMaXN0ZW5lcixcbiAgICAgICAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHNlbGYucGVlcnNbcmVtb3RlSWRdID0gcGVlcjtcbiAgICAgICAgICBzZWxmLm9jY3VwYW50c1tyZW1vdGVJZF0gPSByZW1vdGVUaW1lc3RhbXA7XG5cbiAgICAgICAgICAvLyByZWNlaXZlZCBzaWduYWxcbiAgICAgICAgICBmaXJlYmFzZUFwcFxuICAgICAgICAgICAgLmRhdGFiYXNlKClcbiAgICAgICAgICAgIC5yZWYoc2VsZi5nZXRTaWduYWxQYXRoKHJlbW90ZUlkKSlcbiAgICAgICAgICAgIC5vbihcInZhbHVlXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YS52YWwoKTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSBcIlwiKSByZXR1cm47XG4gICAgICAgICAgICAgIHBlZXIuaGFuZGxlU2lnbmFsKHZhbHVlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgLy8gcmVjZWl2ZWQgZGF0YVxuICAgICAgICAgIGZpcmViYXNlQXBwXG4gICAgICAgICAgICAuZGF0YWJhc2UoKVxuICAgICAgICAgICAgLnJlZihzZWxmLmdldERhdGFQYXRoKHJlbW90ZUlkKSlcbiAgICAgICAgICAgIC5vbihcInZhbHVlXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YS52YWwoKTtcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09PSBudWxsIHx8IHZhbHVlID09PSBcIlwiIHx8IHZhbHVlLnRvICE9PSBzZWxmLmxvY2FsSWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcihyZW1vdGVJZCwgdmFsdWUudHlwZSwgdmFsdWUuZGF0YSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgIC8vIHNlbmQgb2ZmZXIgZnJvbSBhIHBlZXIgd2hvXG4gICAgICAgICAgLy8gICAtIGxhdGVyIGpvaW5lZCB0aGUgcm9vbSwgb3JcbiAgICAgICAgICAvLyAgIC0gaGFzIGxhcmdlciBpZCBpZiB0d28gcGVlcnMgam9pbmVkIHRoZSByb29tIGF0IHNhbWUgdGltZVxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHRpbWVzdGFtcCA+IHJlbW90ZVRpbWVzdGFtcCB8fFxuICAgICAgICAgICAgKHRpbWVzdGFtcCA9PT0gcmVtb3RlVGltZXN0YW1wICYmIHNlbGYubG9jYWxJZCA+IHJlbW90ZUlkKVxuICAgICAgICAgIClcbiAgICAgICAgICAgIHBlZXIub2ZmZXIoKTtcblxuICAgICAgICAgIHNlbGYub2NjdXBhbnRMaXN0ZW5lcihzZWxmLm9jY3VwYW50cyk7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJvb21SZWYub24oXCJjaGlsZF9yZW1vdmVkXCIsIGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICB2YXIgcmVtb3RlSWQgPSBkYXRhLmtleTtcblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIHJlbW90ZUlkID09PSBzZWxmLmxvY2FsSWQgfHxcbiAgICAgICAgICAgIHJlbW90ZUlkID09PSBcInRpbWVzdGFtcFwiIHx8XG4gICAgICAgICAgICBzZWxmLnBlZXJzW3JlbW90ZUlkXSA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgZGVsZXRlIHNlbGYucGVlcnNbcmVtb3RlSWRdO1xuICAgICAgICAgIGRlbGV0ZSBzZWxmLm9jY3VwYW50c1tyZW1vdGVJZF07XG5cbiAgICAgICAgICBzZWxmLm9jY3VwYW50TGlzdGVuZXIoc2VsZi5vY2N1cGFudHMpO1xuICAgICAgICB9KTtcblxuICAgICAgICBzZWxmLmNvbm5lY3RTdWNjZXNzKHNlbGYubG9jYWxJZCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudCkge1xuICAgIHJldHVybiAodGhpcy5teVJvb21Kb2luVGltZSB8fCAwKSA8PSAoY2xpZW50ID8gY2xpZW50LnJvb21Kb2luVGltZSA6IDApO1xuICB9XG5cbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7XG4gICAgLy8gSGFuZGxlZCBieSBXZWJSdGNQZWVyXG4gIH1cblxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHtcbiAgICAvLyBIYW5kbGVkIGJ5IFdlYlJ0Y1BlZXJcbiAgfVxuXG4gIHNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xuICAgIHRoaXMucGVlcnNbY2xpZW50SWRdLnNlbmQoZGF0YVR5cGUsIGRhdGEpO1xuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSkge1xuICAgIHZhciBjbG9uZWREYXRhID0gSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShkYXRhKSk7XG4gICAgdmFyIGVuY29kZWREYXRhID0gZmlyZWJhc2VLZXlFbmNvZGUuZGVlcEVuY29kZShjbG9uZWREYXRhKTtcbiAgICB0aGlzLmZpcmViYXNlQXBwXG4gICAgICAuZGF0YWJhc2UoKVxuICAgICAgLnJlZih0aGlzLmdldERhdGFQYXRoKHRoaXMubG9jYWxJZCkpXG4gICAgICAuc2V0KHtcbiAgICAgICAgdG86IGNsaWVudElkLFxuICAgICAgICB0eXBlOiBkYXRhVHlwZSxcbiAgICAgICAgZGF0YTogZW5jb2RlZERhdGFcbiAgICAgIH0pO1xuICB9XG5cbiAgYnJvYWRjYXN0RGF0YShkYXRhVHlwZSwgZGF0YSkge1xuICAgIGZvciAodmFyIGNsaWVudElkIGluIHRoaXMucGVlcnMpIHtcbiAgICAgIGlmICh0aGlzLnBlZXJzLmhhc093blByb3BlcnR5KGNsaWVudElkKSkge1xuICAgICAgICB0aGlzLnNlbmREYXRhKGNsaWVudElkLCBkYXRhVHlwZSwgZGF0YSk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQoZGF0YVR5cGUsIGRhdGEpIHtcbiAgICBmb3IgKHZhciBjbGllbnRJZCBpbiB0aGlzLnBlZXJzKSB7XG4gICAgICBpZiAodGhpcy5wZWVycy5oYXNPd25Qcm9wZXJ0eShjbGllbnRJZCkpIHtcbiAgICAgICAgdGhpcy5zZW5kRGF0YUd1YXJhbnRlZWQoY2xpZW50SWQsIGRhdGFUeXBlLCBkYXRhKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XG4gICAgdmFyIHBlZXIgPSB0aGlzLnBlZXJzW2NsaWVudElkXTtcblxuICAgIGlmIChwZWVyID09PSB1bmRlZmluZWQpIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcblxuICAgIHN3aXRjaCAocGVlci5nZXRTdGF0dXMoKSkge1xuICAgICAgY2FzZSBXZWJSdGNQZWVyLklTX0NPTk5FQ1RFRDpcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XG5cbiAgICAgIGNhc2UgV2ViUnRjUGVlci5DT05ORUNUSU5HOlxuICAgICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLkNPTk5FQ1RJTkc7XG5cbiAgICAgIGNhc2UgV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xuICAgIH1cbiAgfVxuXG4gIGdldE1lZGlhU3RyZWFtKGNsaWVudElkKSB7XG4gICAgcmV0dXJuIFByb21pc2UucmVqZWN0KFwiSW50ZXJmYWNlIG1ldGhvZCBub3QgaW1wbGVtZW50ZWQ6IGdldE1lZGlhU3RyZWFtXCIpO1xuICB9XG5cbiAgLypcbiAgICogUHJpdmF0ZXNcbiAgICovXG5cbiAgaW5pdEZpcmViYXNlKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5maXJlYmFzZUFwcCA9IHRoaXMuZmlyZWJhc2UuaW5pdGlhbGl6ZUFwcChcbiAgICAgIHtcbiAgICAgICAgYXBpS2V5OiB0aGlzLmFwaUtleSxcbiAgICAgICAgYXV0aERvbWFpbjogdGhpcy5hdXRoRG9tYWluLFxuICAgICAgICBkYXRhYmFzZVVSTDogdGhpcy5kYXRhYmFzZVVSTFxuICAgICAgfSxcbiAgICAgIHRoaXMuYXBwSWRcbiAgICApO1xuXG4gICAgdGhpcy5hdXRoKHRoaXMuYXV0aFR5cGUsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIGF1dGgodHlwZSwgY2FsbGJhY2spIHtcbiAgICBzd2l0Y2ggKHR5cGUpIHtcbiAgICAgIGNhc2UgXCJub25lXCI6XG4gICAgICAgIHRoaXMuYXV0aE5vbmUoY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImFub255bW91c1wiOlxuICAgICAgICB0aGlzLmF1dGhBbm9ueW1vdXMoY2FsbGJhY2spO1xuICAgICAgICBicmVhaztcblxuICAgICAgLy8gVE9ETzogc3VwcG9ydCBvdGhlciBhdXRoIHR5cGVcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIE5BRi5sb2cud3JpdGUoXCJGaXJlYmFzZVdlYlJ0Y0ludGVyZmFjZS5hdXRoOiBVbmtub3duIGF1dGhUeXBlIFwiICsgdHlwZSk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGF1dGhOb25lKGNhbGxiYWNrKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgLy8gYXN5bmNocm9ub3VzbHkgaW52b2tlcyBvcGVuIGxpc3RlbmVycyBmb3IgdGhlIGNvbXBhdGliaWxpdHkgd2l0aCBvdGhlciBhdXRoIHR5cGVzLlxuICAgIC8vIFRPRE86IGdlbmVyYXRlIG5vdCBqdXN0IHJhbmRvbSBidXQgYWxzbyB1bmlxdWUgaWRcbiAgICByZXF1ZXN0QW5pbWF0aW9uRnJhbWUoZnVuY3Rpb24oKSB7XG4gICAgICBjYWxsYmFjayhzZWxmLnJhbmRvbVN0cmluZygpKTtcbiAgICB9KTtcbiAgfVxuXG4gIGF1dGhBbm9ueW1vdXMoY2FsbGJhY2spIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIGZpcmViYXNlQXBwID0gdGhpcy5maXJlYmFzZUFwcDtcblxuICAgIGZpcmViYXNlQXBwXG4gICAgICAuYXV0aCgpXG4gICAgICAuc2lnbkluQW5vbnltb3VzbHkoKVxuICAgICAgLmNhdGNoKGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJGaXJlYmFzZVdlYlJ0Y0ludGVyZmFjZS5hdXRoQW5vbnltb3VzOiBcIiArIGVycm9yKTtcbiAgICAgICAgc2VsZi5jb25uZWN0RmFpbHVyZShudWxsLCBlcnJvcik7XG4gICAgICB9KTtcblxuICAgIGZpcmViYXNlQXBwLmF1dGgoKS5vbkF1dGhTdGF0ZUNoYW5nZWQoZnVuY3Rpb24odXNlcikge1xuICAgICAgaWYgKHVzZXIgIT09IG51bGwpIHtcbiAgICAgICAgY2FsbGJhY2sodXNlci51aWQpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLypcbiAgICogcmVhbHRpbWUgZGF0YWJhc2UgbGF5b3V0XG4gICAqXG4gICAqIC9yb290UGF0aC9hcHBJZC9yb29tSWQvXG4gICAqICAgLSAvdXNlcklkL1xuICAgKiAgICAgLSB0aW1lc3RhbXA6IGpvaW5pbmcgdGhlIHJvb20gdGltZXN0YW1wXG4gICAqICAgICAtIHNpZ25hbDogdXNlZCB0byBzZW5kIHNpZ25hbFxuICAgKiAgICAgLSBkYXRhOiB1c2VkIHRvIHNlbmQgZ3VhcmFudGVlZCBkYXRhXG4gICAqICAgLSAvdGltZXN0YW1wLzogd29ya2luZyBwYXRoIHRvIGdldCB0aW1lc3RhbXBcbiAgICogICAgIC0gdXNlcklkOlxuICAgKi9cblxuICBnZXRSb290UGF0aCgpIHtcbiAgICByZXR1cm4gdGhpcy5yb290UGF0aDtcbiAgfVxuXG4gIGdldEFwcFBhdGgoKSB7XG4gICAgcmV0dXJuIHRoaXMuZ2V0Um9vdFBhdGgoKSArIFwiL1wiICsgdGhpcy5hcHBJZDtcbiAgfVxuXG4gIGdldFJvb21QYXRoKCkge1xuICAgIHJldHVybiB0aGlzLmdldEFwcFBhdGgoKSArIFwiL1wiICsgdGhpcy5yb29tSWQ7XG4gIH1cblxuICBnZXRVc2VyUGF0aChpZCkge1xuICAgIHJldHVybiB0aGlzLmdldFJvb21QYXRoKCkgKyBcIi9cIiArIGlkO1xuICB9XG5cbiAgZ2V0U2lnbmFsUGF0aChpZCkge1xuICAgIHJldHVybiB0aGlzLmdldFVzZXJQYXRoKGlkKSArIFwiL3NpZ25hbFwiO1xuICB9XG5cbiAgZ2V0RGF0YVBhdGgoaWQpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRVc2VyUGF0aChpZCkgKyBcIi9kYXRhXCI7XG4gIH1cblxuICBnZXRUaW1lc3RhbXBHZW5lcmF0aW9uUGF0aChpZCkge1xuICAgIHJldHVybiB0aGlzLmdldFJvb21QYXRoKCkgKyBcIi90aW1lc3RhbXAvXCIgKyBpZDtcbiAgfVxuXG4gIHJhbmRvbVN0cmluZygpIHtcbiAgICB2YXIgc3RyaW5nTGVuZ3RoID0gMTY7XG4gICAgdmFyIGNoYXJzID0gXCJBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hUWmFiY2RlZmdoaWtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5XCI7XG4gICAgdmFyIHN0cmluZyA9IFwiXCI7XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN0cmluZ0xlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgcmFuZG9tTnVtYmVyID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogY2hhcnMubGVuZ3RoKTtcbiAgICAgIHN0cmluZyArPSBjaGFycy5zdWJzdHJpbmcocmFuZG9tTnVtYmVyLCByYW5kb21OdW1iZXIgKyAxKTtcbiAgICB9XG5cbiAgICByZXR1cm4gc3RyaW5nO1xuICB9XG5cbiAgZ2V0VGltZXN0YW1wKGNhbGxiYWNrKSB7XG4gICAgdmFyIGZpcmViYXNlQXBwID0gdGhpcy5maXJlYmFzZUFwcDtcbiAgICB2YXIgcmVmID0gZmlyZWJhc2VBcHBcbiAgICAgIC5kYXRhYmFzZSgpXG4gICAgICAucmVmKHRoaXMuZ2V0VGltZXN0YW1wR2VuZXJhdGlvblBhdGgodGhpcy5sb2NhbElkKSk7XG4gICAgcmVmLnNldCh0aGlzLmZpcmViYXNlLmRhdGFiYXNlLlNlcnZlclZhbHVlLlRJTUVTVEFNUCk7XG4gICAgcmVmLm9uY2UoXCJ2YWx1ZVwiLCBmdW5jdGlvbihkYXRhKSB7XG4gICAgICB2YXIgdGltZXN0YW1wID0gZGF0YS52YWwoKTtcbiAgICAgIHJlZi5yZW1vdmUoKTtcbiAgICAgIGNhbGxiYWNrKHRpbWVzdGFtcCk7XG4gICAgfSk7XG4gICAgcmVmLm9uRGlzY29ubmVjdCgpLnJlbW92ZSgpO1xuICB9XG5cbiAgdXBkYXRlVGltZU9mZnNldCgpIHtcbiAgICByZXR1cm4gdGhpcy5maXJlYmFzZUFwcFxuICAgICAgLmRhdGFiYXNlKClcbiAgICAgIC5yZWYoXCIvLmluZm8vc2VydmVyVGltZU9mZnNldFwiKVxuICAgICAgLm9uY2UoXCJ2YWx1ZVwiKVxuICAgICAgLnRoZW4oZGF0YSA9PiB7XG4gICAgICAgIHZhciB0aW1lT2Zmc2V0ID0gZGF0YS52YWwoKTtcblxuICAgICAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cysrO1xuXG4gICAgICAgIGlmICh0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA8PSAxMCkge1xuICAgICAgICAgIHRoaXMudGltZU9mZnNldHMucHVzaCh0aW1lT2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnRpbWVPZmZzZXRzW3RoaXMuc2VydmVyVGltZVJlcXVlc3RzICUgMTBdID0gdGltZU9mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXZnVGltZU9mZnNldCA9XG4gICAgICAgICAgdGhpcy50aW1lT2Zmc2V0cy5yZWR1Y2UoKGFjYywgb2Zmc2V0KSA9PiAoYWNjICs9IG9mZnNldCksIDApIC9cbiAgICAgICAgICB0aGlzLnRpbWVPZmZzZXRzLmxlbmd0aDtcblxuICAgICAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPiAxMCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVUaW1lT2Zmc2V0KCksIDUgKiA2MCAqIDEwMDApOyAvLyBTeW5jIGNsb2NrIGV2ZXJ5IDUgbWludXRlcy5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBnZXRTZXJ2ZXJUaW1lKCkge1xuICAgIHJldHVybiBuZXcgRGF0ZSgpLmdldFRpbWUoKSArIHRoaXMuYXZnVGltZU9mZnNldDtcbiAgfVxufVxuXG5OQUYuYWRhcHRlcnMucmVnaXN0ZXIoXCJmaXJlYmFzZVwiLCBGaXJlYmFzZVdlYlJ0Y0FkYXB0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IEZpcmViYXNlV2ViUnRjQWRhcHRlcjtcbiJdLCJzb3VyY2VSb290IjoiIn0=