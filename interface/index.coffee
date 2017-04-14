
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
  # If X < 0.0010, then use exponential notation with four digits, e.g. 2.135e-06
  # If 0.00100 <= X < 1.0, then use fixed to 5 digits (e.g. 0.53621 or 0.00131)
  # If 1.0 <= X < 100,000., give precision of 5 digits (52,327.86>52,328)
  # If X => 100,000, use exponential format with four digits, e.g. 2.135e+12
  update: ( element, accessor ) ->
    value = Number ko.unwrap(accessor())
    unless isNaN value
      negative = value < 0
      value = Math.abs value

      if value < 0.0010
        value = value.toExponential 4
      else if value < 1
        value = value.toFixed 5
      else if value < 100000
        value = value.toPrecision 5
      else
        value = value.toExponential 4

      # catch too-small numbers
      if value is "0.0000e+0"
        value = (0).toFixed 5

      if negative
        value = "-" + value

    element.textContent = value

# --- setup lodash
global._ = require "lodash"

# --- request statistics

global.allstats = ko.observableArray [ ]

adapter.on "statisticsMetadata", ( data ) ->
  for id, values of data
    if values.show != false
      allstats.push
        id: id
        name: values.displayName or id
        global: values.globalOnly or false
        candidate: values.candidateOnly or false
        sort: values.sort or "<"
        selected: ko.observable id.toLowerCase() in [ "p(f)", "f" ]
adapter.requestStatisticsMetadata()

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



