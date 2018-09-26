!function(){this.global=this,this.window=this}(),function(e){function n(s){if(t[s])return t[s].exports;var r=t[s]={i:s,l:!1,exports:{}};return e[s].call(r.exports,r,r.exports,n),r.l=!0,r.exports}var t={};n.m=e,n.c=t,n.i=function(e){return e},n.d=function(e,t,s){n.o(e,t)||Object.defineProperty(e,t,{configurable:!1,enumerable:!0,get:s})},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,n){return Object.prototype.hasOwnProperty.call(e,n)},n.p="",n(n.s=432)}({26:/*!*************************************!*\
  !*** ./engine/worker/subworkers.js ***!
  \*************************************/
function(module,exports,__webpack_require__){eval("(function () {\n\n  /* Detect if we're in a worker or not */\n  var isWorker = false;\n  try {\n    document;\n  } catch (e) {\n    isWorker = true;\n  }\n\n  if (isWorker) {\n    // Replace self.postMessage because webpack-dev-server doesn't recognize\n    // workers\n    let oldPostMessage = self.postMessage;\n    self.postMessage = (msg, otherthing) => {\n      try {\n        oldPostMessage(msg, otherthing);\n      } catch (e) {\n        console.warn(e.message);\n      }\n    };\n\n    // For some reason, nested workers on firefox sucks. So, just polyfill all\n    // of the browsers to make this work\n    if (true /* we don't really need to check this */) {\n        self.Worker = function (path) {\n          var that = this;\n          this.id = Math.random().toString(36).substr(2, 5);\n\n          this.eventListeners = {\n            \"message\": []\n          };\n          self.addEventListener(\"message\", function (e) {\n            if (e.data._from === that.id) {\n              var newEvent = new MessageEvent(\"message\");\n              newEvent.initMessageEvent(\"message\", false, false, e.data.message, that, \"\", null, []);\n              that.dispatchEvent(newEvent);\n              if (that.onmessage) {\n                that.onmessage(newEvent);\n              }\n            }\n          });\n\n          var location = self.location.pathname;\n          var absPath = path; //location.substring(0, location.lastIndexOf('/')) + '/' + path;\n          self.postMessage({\n            _subworker: true,\n            cmd: 'newWorker',\n            id: this.id,\n            path: absPath\n          });\n        };\n        Worker.prototype = {\n          onerror: null,\n          onmessage: null,\n          postMessage: function (message) {\n            self.postMessage({\n              _subworker: true,\n              id: this.id,\n              cmd: 'passMessage',\n              message: message\n            });\n          },\n          terminate: function () {\n            self.postMessage({\n              _subworker: true,\n              cmd: 'terminate',\n              id: this.id\n            });\n          },\n          addEventListener: function (type, listener, useCapture) {\n            if (this.eventListeners[type]) {\n              this.eventListeners[type].push(listener);\n            }\n          },\n          removeEventListener: function (type, listener, useCapture) {\n            if (!(type in this.eventListeners)) return;\n            var index = this.eventListeners[type].indexOf(listener);\n            if (index !== -1) {\n              this.eventListeners[type].splice(index, 1);\n            }\n          },\n          dispatchEvent: function (event) {\n            var listeners = this.eventListeners[event.type];\n            for (var i = 0; i < listeners.length; i++) {\n              listeners[i](event);\n            }\n          }\n        };\n      }\n  }\n\n  var allWorkers = {};\n  var cmds = {\n    newWorker: function (event) {\n      var worker = new Worker(event.data.path);\n      worker.addEventListener(\"message\", function (e) {\n        var envelope = {\n          _from: event.data.id,\n          message: e.data\n        };\n        event.target.postMessage(envelope);\n      });\n      allWorkers[event.data.id] = worker;\n    },\n    terminate: function (event) {\n      allWorkers[event.data.id].terminate();\n    },\n    passMessage: function (event) {\n      allWorkers[event.data.id].postMessage(event.data.message);\n    }\n  };\n  var messageRecieved = function (event) {\n    if (event.data._subworker) {\n      cmds[event.data.cmd](event);\n    }\n  };\n\n  /* Hijack Worker */\n  var oldWorker = window.Worker;\n  window.Worker = function (path) {\n\n    var blobIndex = path.indexOf('blob:');\n\n    if (blobIndex !== -1 && blobIndex !== 0) {\n      path = path.substring(blobIndex);\n    }\n\n    var newWorker = new oldWorker(path);\n    newWorker.addEventListener(\"message\", messageRecieved);\n\n    return newWorker;\n  };\n})();\n\n//////////////////\n// WEBPACK FOOTER\n// ./engine/worker/subworkers.js\n// module id = 26\n// module chunks = 0 1 2 3\n\n//# sourceURL=webpack:///./engine/worker/subworkers.js?")},432:/*!*******************************************!*\
  !*** multi ./engine/worker/subworkers.js ***!
  \*******************************************/
function(module,exports,__webpack_require__){eval("module.exports = __webpack_require__(/*! /Users/justint/Documents/2018-Fall/CS-423/taylorfit/engine/worker/subworkers.js */26);\n\n\n//////////////////\n// WEBPACK FOOTER\n// multi ./engine/worker/subworkers.js\n// module id = 432\n// module chunks = 3\n\n//# sourceURL=webpack:///multi_./engine/worker/subworkers.js?")}});