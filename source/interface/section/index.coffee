
engine.register "section-template",
  do require "./index.jade"
require "./index.styl"

module.exports = class Section
  name: "section-template"
  as: "section"

  constructor: ( @bubble, @content ) ->
    @data = this

