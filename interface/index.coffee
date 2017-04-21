
# --- include core libraries
require "core-js"

# --- choose correct adapter
# TODO: make selection based on build model
global.adapter = require "./adapter/worker"

# --- setup knockout
global.ko = require "knockout"

ko.isObservableArray ?= ( value ) ->
  ko.isObservable(value) and
  value.push instanceof Function

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

numFormatters =
  float: ( value ) ->
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
    value

  int: ( value ) ->
    Math.round value

ko.bindingHandlers.num =
  # If X < 0.0010, then use exponential notation with four digits, e.g. 2.135e-06
  # If 0.00100 <= X < 1.0, then use fixed to 5 digits (e.g. 0.53621 or 0.00131)
  # If 1.0 <= X < 100,000., give precision of 5 digits (52,327.86>52,328)
  # If X => 100,000, use exponential format with four digits, e.g. 2.135e+12
  update: ( element, accessor, allBindings ) ->
    format = allBindings().fmt || "float"
    value = Number ko.unwrap(accessor())

    console.log allBindings()

    unless isNaN value
      value = numFormatters[format] value

    element.textContent = value

# --- setup lodash
global._ = require "lodash"

# --- request statistics

global.allstats = ko.observableArray [ ]

adapter.on "statisticsMetadata", ( data ) ->
  for stat in data
    if stat.show != false
      allstats.push
        id: stat.id
        name: stat.displayName or stat.id
        global: stat.globalOnly or false
        candidate: stat.candidateOnly or false
        sort: stat.sort or ">"
        selected: ko.observable stat.default == true
        format: stat.format or "float"
adapter.requestStatisticsMetadata()

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()



