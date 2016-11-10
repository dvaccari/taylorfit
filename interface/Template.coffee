
require "ko-template"
engine = do ko.TemplateEngine.use

module.exports = class Template
  @register: ( as, template ) ->
    name = "#{as}-template"
    engine.register name, template
    @::name = name
    @::as = as

  constructor: ( ) ->
    @data = this

