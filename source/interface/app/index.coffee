
engine.register "app-template",
  do require "./index.jade"
require "./index.styl"

module.exports = class App
  name: "app-template"
  as: "app"

  constructor: ( @header, @content ) ->
    @data = this

