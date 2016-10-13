
webpack = require "webpack"
# -- builtins
path = require "path"
# -- helpers
rel = ( p1 ) -> path.resolve __dirname, p1
# -- constants
CONTEXT = rel "."
ALGORITHM = rel "./algorithm"
INTERFACE = rel "./interface"
BUILD = rel "./build"

LOADERS = [
  # -- scripts
  { test: /\.coffee$/, loader: "coffee-loader" }
  # -- templates
  { test: /\.(?:pug|jade)$/, loader: "pug-loader" }
  # -- styles
  { test: /\.styl$/, loader: "style-loader!css-loader!stylus-loader" }
  # -- misc
  { test: /\.txt$/, loader: "raw-loader" }
]

# -- exported configuration
module.exports =
  target: "web"
  profile: true
  progress: true
  cache: true
  devtool: "#inline-source-map"
  devServer:
    contentBase: BUILD
    inline: true
    hot: true
  node:
    console: false
    global: false
    process: true
    Buffer: false
    setImmediate: false
  entry:
    algorithm: "#{ALGORITHM}/index.coffee"
    interface: "#{INTERFACE}/index.coffee"
  output:
    path: BUILD
    filename: "[name].js"
  resolve:
    alias:
      context: CONTEXT
      algorithm: ALGORITHM
      interface: INTERFACE
  resolveLoader:
    extensions: [ "", ".webpack-loader.js",
      ".web-loader.js", ".loader.js", ".js",
      ".coffee" ]
  module:
    loaders: LOADERS
  plugins: [
    new webpack.BannerPlugin ";;(window.global = window);;",
      raw: true
      entryOnly: true
    new webpack.optimize.UglifyJsPlugin
  ]

  stylus:
    use: [ do require "nib" ]
    import: [ "~nib/lib/nib/index.styl" ]
    preferPathResolver: "webpack"

