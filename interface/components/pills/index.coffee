
require "./index.styl"

within = (val, arr) ->
  i = 0
  while i < arr.length
    if arr[i].val is val and arr[i].class() is "inactive"
      return arr[i]
    else if arr[i].val is val and arr[i].class() is "active"
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
      pill = within(num, @pills())
      if d.key is "Enter" and num and pill is false
        @pills.push((val: parseInt(@input()), class: ko.observable("active")))
        @pills.sort((left, right) => return left.val > right.val ? 1 : -1)
      else if d.key is "Enter" and num and pill != true
        @pills()[@pills.indexOf(pill)].class("active")
      true


    return this

