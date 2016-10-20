
engine.register "header-template",
  do require "./index.jade"
require "./index.styl"

module.exports = class Header
  name: "header-template"
  as: "header"

  constructor: ( @title ) ->
    @data = this

