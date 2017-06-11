
module.exports = ko = require "knockout"

ko.isObservableArray ?= ( value ) ->
  ko.isObservable(value) and
  value.push instanceof Function

iteration_binding = ( name, transform ) ->
  ko.virtualElements.allowedBindings[name] = true
  ko.bindingHandlers[name] =
    init: ( element, accessor, all, view, context ) ->
      properties = ko.pureComputed ( ) ->
        transform ko.utils.unwrapObservable accessor()
      ko.applyBindingsToNode element,
        { foreach: properties }, context
      return controlsDescendantBindings: true

iteration_binding "iter", ( obj ) ->
  # object should have from, to, by
  _from = ko.unwrap obj.from or 0
  _to = ko.unwrap obj.to
  _by = ko.unwrap obj.by or 1
  {index} for index in [_from.._to] by _by

iteration_binding "each", ( obj ) ->
  properties = [ ]
  ko.utils.objectForEach obj, ( key, value ) ->
    properties.push $key: key, $value: value
  return properties

ko.precision = ko.observable 5

ko.formatters =
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
      value = value.toFixed precision - 1
    else if value < Math.pow 10, precision
      value = value.toPrecision precision
    else
      value = value.toExponential precision - 1

    # catch too-small numbers
    if 0 is Number value
      value = (0).toPrecision precision

    if negative
      value = "-" + value

    return value

  int: ( value ) ->
    Math.round value

ko.bindingHandlers.int =
  update: ( element, accessor ) ->
    element.textContent = ko.formatters.int ko.unwrap do accessor

ko.bindingHandlers.float =
  update: ( element, accessor ) ->
    element.textContent = ko.formatters.float ko.unwrap do accessor

ko.bindingHandlers.num =

  update: ( element, accessor, allBindings ) ->
    format = allBindings().fmt or "float"
    element.textContent = ko.formatters[format] ko.unwrap do accessor
