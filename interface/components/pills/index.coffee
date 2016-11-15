
require "./index.styl"

within = (val, arr) ->
  i = 0
  while i < arr.length
    if arr[i].val is val
      return true
    i++
  false

ko.components.register "tf-pills",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @pills = ko.observableArray [
      (val: -1, class: ko.observable("inactive"))
      (val: 1, class: ko.observable("inactive"))
      (val: 2, class: ko.observable("inactive"))
    ]

    @input = ko.observable ""

    @clicked = ( pill ) =>
      if pill.class() is "inactive"
        pill.class("active")
      else
        pill.class("inactive")

    @add = (e, d) =>
     num = parseInt(@input())
     if d.key is "Enter" and num and not within(num, @pills())
      @pills.push((val: parseInt(@input()), class: ko.observable("active")))
     true


    return this

