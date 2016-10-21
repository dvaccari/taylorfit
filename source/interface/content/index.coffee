
<<<<<<< HEAD:source/interface/section/index.coffee
engine.register "section-template",
  do require "./index.jade"
=======
>>>>>>> Add template class for simplicity:source/interface/content/index.coffee
require "./index.styl"
Template = require "../Template.coffee"
template = do require "./index.jade"

<<<<<<< HEAD:source/interface/section/index.coffee
module.exports = class Section
  name: "section-template"
  as: "section"
=======
module.exports = class Content extends Template
  Content.register "content", template
>>>>>>> Add template class for simplicity:source/interface/content/index.coffee

  constructor: ( @bubble, @block ) ->
    super

