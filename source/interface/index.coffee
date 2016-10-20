
# --- include core libraries
require "core-js"

# --- setup knockout
global.ko = require "knockout"
require "ko-shell"
require "ko-template"
global.engine = do ko.TemplateEngine.use

# --- include components
App = require "./app/index.coffee"
Header = require "./header/index.coffee"

ko.root.push new App new Header "TaylorFit"

