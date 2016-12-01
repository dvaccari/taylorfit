
# --- include core libraries
require "core-js"

# --- setup knockout
global.ko = require "knockout"

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



