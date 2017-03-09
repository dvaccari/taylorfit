
# --- include core libraries
require "core-js"

# --- choose correct adapter
# TODO: make selection based on build model
global.adapter = require "./adapter/worker"

# --- setup knockout
global.ko = require "knockout"

ko.bindingHandlers.num =
  update: ( element, accessor ) ->
    value = ko.unwrap accessor()
    element.textContent = if value < 1
    then value.toExponential(3)
    else value.toPrecision(5)

# --- setup lodash
global._ = require "lodash"

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



