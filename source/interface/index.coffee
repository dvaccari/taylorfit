
# --- setup knockout
ko = require "knockout"
require "ko-shell"
require "ko-template"
global.engine = do ko.TemplateEngine.use

# --- include components
Header = require "./header/index.coffee"

ko.root.push new Header "TaylorFit"


