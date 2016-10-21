
require "./index.styl"
Template = require "../Template.coffee"
template = do require "./index.jade"

module.exports = class Header extends Template
  Header.register "header", template

  constructor: ( @title ) ->
    super

