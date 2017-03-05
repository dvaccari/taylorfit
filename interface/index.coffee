
# --- include core libraries
require "core-js"

# --- choose correct adapter
# TODO: make selection based on build model
global.adapter = require "./adapter/worker"

# --- setup knockout
global.ko = require "knockout"

# --- setup lodash
global._ = require "lodash"

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



