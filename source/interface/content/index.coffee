
require "./index.styl"
Template = require "../Template.coffee"
template = do require "./index.jade"

module.exports = class Content extends Template
  Content.register "content", template

  constructor: ( @bubble, @block ) ->
    super

