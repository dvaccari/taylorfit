
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

clearActive = (arr) ->
  arr.forEach (obj) -> if obj.class() is "active" then obj.class "inactive"

ko.components.register "tf-pills",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @pills = ko.observableArray()
    @name = params.name
    @style = params.style

    params.vals.forEach (param) =>
      @pills.push((val: param, class: ko.observable("inactive")))

    @input = ko.observable ""



    @clicked = ( pill ) =>
      if @style is "check"
        if pill.class() is "inactive"
          pill.class("active")
        else
          pill.class("inactive")
      else if @style is "button"
        if pill.class() is "inactive"
          clearActive(@pills())
          pill.class("active")         

    @add = (e, d) =>
      if d.key is "Enter"
        num = parseInt(@input())
        if num > -10 and num < 10
          pill = within(num, @pills())
          if pill is false
            if @style is 'checked'
              @pills.push((val: parseInt(@input()), class: ko.observable("active")))
            else if @style is 'button'
              clearActive(@pills())
              @pills.push((val: parseInt(@input()), class: ko.observable("active")))
            @pills.sort((left, right) ->  if left.val < right.val then -1 else 1)
          else if typeof pill is "object"
            if @style is 'button'
              clearActive(@pills())
            @pills()[@pills.indexOf(pill)].class("active")
          @input("")
      true


    return this

