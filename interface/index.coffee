
# --- include core libraries
require "core-js"

# --- choose correct adapter
# TODO: make selection based on build model
global.adapter = require "./adapter/worker"

# --- setup knockout
global.ko = require "knockout"

ko.bindingHandlers.each =
  transform: ( obj ) ->
    properties = [ ]
    ko.utils.objectForEach obj, ( key, value ) ->
      properties.push $key: key, $value: value
    return properties
  init: ( element, accessor, all, view, context ) ->
    properties = ko.pureComputed ( ) ->
      obj = ko.utils.unwrapObservable accessor()
      ko.bindingHandlers.each.transform obj
    ko.applyBindingsToNode element,
      { foreach: properties }, context

    return controlsDescendantBindings: true

ko.virtualElements.allowedBindings.each = true

ko.bindingHandlers.num =
  update: ( element, accessor ) ->
    value = ko.unwrap(accessor()) or 0
    negative = value < 0
    value = Math.abs value

    if value < 0.0001
      value = value.toExponential 3
    else if value < 1
      value = value.toFixed 4
    else if value < 99999
      value = value.toPrecision 5
    else
      value = value.toExponential 3

    if negative
      value = "-" + value

    element.textContent = value

# --- setup lodash
global._ = require "lodash"

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



