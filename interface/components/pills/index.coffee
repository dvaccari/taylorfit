
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
      if d.key is "Enter"
        num = parseInt(@input())
        if num
          pill = within(num, @pills())
          if pill is false
            @pills.push((val: parseInt(@input()), class: ko.observable("active")))
            @pills.sort((left, right) ->  if left.val < right.val then -1 else 1)
            @input("")
          else if typeof pill is "object"
            @pills()[@pills.indexOf(pill)].class("active")
            @input("")
      true


    return this

