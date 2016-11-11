
require "./index.styl"

ko.components.register "tf-grid",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    @cols = ko.observableArray [
      name: ko.observable ""
    ]
    @rows = ko.observableArray [
      ko.observableArray [
        t = ko.observable 123
      ]
      ko.observableArray [
        ko.observable undefined
      ]
    ]

    t.subscribe =>
      console.log ko.toJS @rows

    @cols.add = ( ) =>
      # ORDER MATTERS
      for row in @rows()
        row.push ko.observable undefined
      @cols.push name: ko.observable ""
    @rows.add = ( ) =>
      @rows.push row = ko.observableArray [ ]
      for col in @cols()
        row.push ko.observable undefined


    return this

