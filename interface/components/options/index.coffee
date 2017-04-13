
require "./index.styl"

ko.components.register "tf-options",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model() # now static

    @candidates = model.candidates

    @candidates.maxWidth = ko.observable 0
    @candidates.maxWidth.subscribe ( next ) ->
      document.querySelector(".split-model > .split-data > .options")
        .style.maxWidth = next + "px"
      document.querySelector(".split-model > .split-data > .model")
        .style.minWidth = "calc(100% - #{next}px)"

    @candidates.subscribe ( ) =>
      setTimeout =>
        @candidates.maxWidth 60 + document.querySelector(
          ".candidate-wrapper > .candidates").clientWidth


    return this
