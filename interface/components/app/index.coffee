
require "./index.styl"

ko.components.register "tf-app",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @model = ko.observable null

    @model.subscribe ( next ) ->
      if next
        console.debug "component/app/model:
        [update]", next.toJS()

    return this

