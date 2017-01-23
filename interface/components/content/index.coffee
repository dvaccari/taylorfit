
require "./index.styl"

ko.components.register "tf-content",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @pane1 = ko.observable 600
    @pane1drag = ( model, event ) =>
      if event.clientX
        @pane1 event.clientX

    update = ( ) =>
      exponents = [ ]
      for k, v of @exponents()
        if v() then exponents.push Number k
      multiplicands = [ ]
      for k, v of @multiplicands()
        if v() then multiplicands.push Number k

      adapter.send_model([
        [ 0, 0, 0, 0 ]
      ], 3, exponents, multiplicands).then ( {candidates} ) =>
        @candidates candidates

    @candidates = ko.observable [ ]

    @multiplicands = ko.observable
      1: false
    @exponents = ko.observable
      "-1": false
      0: true
      1: false

    @multiplicands.subscribe update
    @exponents.subscribe update

    return this

