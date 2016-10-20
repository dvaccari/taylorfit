
engine.register "content-template",
  do require "./index.jade"
require "./index.styl"

module.exports = class Content
  name: "content-template"
  as: "content"

  constructor: ( @bubble, @content ) ->
    @data = this

