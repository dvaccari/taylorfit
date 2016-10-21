
require "./index.styl"
Template = require "../Template.coffee"
template =  do require "./index.jade"

module.exports = class App extends Template
  App.register "app", template

  constructor: ( @header, @content ) ->
    super

