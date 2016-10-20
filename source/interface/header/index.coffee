
engine.register "header-template",
  do require "./index.jade"

module.exports = class Header
  name: "header-template"
  as: "header"

  constructor: ( @title ) ->
    @data = this

