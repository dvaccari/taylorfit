
require "./index.styl"
Model = require "../Model"

ko.components.register "tf-app",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    update = ( model ) ->
      if json = model?.out()
        localStorage?.setItem "tf-model", json
      else
        localStorage?.removeItem "tf-model"
        adapter.clear()

      console.debug "component/app/model:
        [update]", model

    register = ( model ) ->
      for own key, value of model
        if ko.isObservable value
          value.subscribe ( ) -> update model

    if model = localStorage?.getItem "tf-model"
      @model = ko.observable new Model JSON.parse model
      register @model()
    else @model = ko.observable null

    window.model = @model

    @model.subscribe ( next ) ->
      update next
      register next

    return this
