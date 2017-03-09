
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
    if value < 0.0001
      value = value.toExponential 3
    else if value < 1
      value = value.toFixed 4
    else if value < 99999
      value = value.toPrecision 5
    else
      value = value.toExponential 3

    element.textContent = value

# --- setup lodash
global._ = require "lodash"

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



