
require "./index.styl"
Model = require "../Model"

ko.components.register "tf-app",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    if model = localStorage.getItem "tf-model"
      @model = ko.observable new Model JSON.parse model
    else @model = ko.observable null

    window.tfmo = @model


    @model.subscribe ( next ) ->
      localStorage.setItem "tf-model",
        next?.toJSON()
      console.debug "component/app/model:
        [update]", next

    return this

