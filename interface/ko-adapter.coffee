
module.exports = ko = require "knockout"

ko.isObservableArray ?= ( value ) ->
  ko.isObservable(value) and
  value.push instanceof Function

ko.virtualElements.allowedBindings.each = true
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

ko.precision = ko.observable 5

formatters =
  # If X < 0.0010, then use exponential notation with four digits, e.g. 2.135e-06
  # If 0.00100 <= X < 1.0, then use fixed to 5 digits (e.g. 0.53621 or 0.00131)
  # If 1.0 <= X < 100,000., give precision of 5 digits (52,327.86>52,328)
  # If X => 100,000, use exponential format with four digits, e.g. 2.135e+12
  float: ( value ) ->
    negative = value < 0
    value = Math.abs value

    if isNaN value
      return NaN

    precision = ko.precision()

    if value < Math.pow 10, 2 - precision
      value = value.toExponential precision - 1
    else if value < 1
      value = value.toFixed precision
    else if value < Math.pow 10, precision
      value = value.toPrecision precision
    else
      value = value.toExponential precision - 1

    # catch too-small numbers
    if 0 is Number value
      value = (0).toFixed precision

    if negative
      value = "-" + value

    return value

  int: ( value ) ->
    Math.round value

ko.bindingHandlers.int =
  update: ( element, accessor ) ->
    element.textContent = formatters.int ko.unwrap do accessor

ko.bindingHandlers.float =
  update: ( element, accessor ) ->
    element.textContent = formatters.float ko.unwrap do accessor

ko.bindingHandlers.num =

  update: ( element, accessor, allBindings ) ->
    format = allBindings().fmt or "float"
    element.textContent = formatters[format] ko.unwrap do accessor
