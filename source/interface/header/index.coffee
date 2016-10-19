
engine.register "header-template", do require "./index.jade"

module.exports = class Header
  constructor: ( @title ) ->
    @name = "header-template"
    @data = this
    @as = "header"

