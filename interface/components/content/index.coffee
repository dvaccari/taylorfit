
require "./index.styl"

ko.components.register "tf-content",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @pane1 = ko.observable 600
    @pane1drag = ( model, event ) =>
      if event.clientX
        @pane1 event.clientX

    @candidates = ko.observable [ ]
    adapter.on "candidates", ( candidates ) =>
      @candidates candidates

    adapter.post_dataset [ 0, 0, 0, 0 ]
    adapter.post_dependent 3

    @multiplicands = ko.observable()
    @exponents = ko.observable()

    @multiplicands.subscribe ( next ) ->
      adapter.post_multiplicands Number next
    @exponents.subscribe ( next ) ->
      next =  (key for key, value of next when ko.unwrap value)
      adapter.post_exponents next

    @multiplicands 1
    @exponents
      0: true
      1: false

    return this

