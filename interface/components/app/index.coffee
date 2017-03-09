
require "./index.styl"
Model = require "../Model"

ko.components.register "tf-app",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    if model = localStorage?.getItem "tf-model"
      @model = ko.observable new Model JSON.parse model
    else @model = ko.observable null

    window.model = @model

    @model.subscribe ( next ) ->
      if json = next?.toJSON()
        localStorage?.setItem "tf-model", json
      else
        localStorage?.removeItem "tf-model"

      console.debug "component/app/model:
        [update]", next

    return this

