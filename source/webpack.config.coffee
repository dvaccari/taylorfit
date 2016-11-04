
webpack = require "webpack"
# -- builtins
path = require "path"
# -- helpers
rel = ( p1 ) -> path.resolve __dirname, p1
# -- constants
CONTEXT = rel "."
ENGINE = rel "./engine"
INTERFACE = rel "./interface"
BUILD = rel "./build"
MATHJS = rel "./node_modules/mathjs/dist/math.min.js"

LOADERS = [
  # -- scripts
  { test: /\.coffee$/, loader: "coffee-loader" }
  # -- templates
  { test: /\.(?:pug|jade)$/, loader: "pug-loader" }
  # -- styles
  { test: /\.styl$/, loader: "style-loader!css-loader!stylus-loader" }
  # -- misc
  { test: /\.txt$/, loader: "raw-loader" }
  # -- es6
  { test: /\.jsx$/, exclude: /node_modules/, loader: "babel?presets[]=es2015"}
]

# -- exported configuration
module.exports =
  target: "web"
  profile: true
  progress: true
  cache: true
  devtool: "#source-map"
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
    engine: "#{ENGINE}/index.jsx"
    interface: "#{INTERFACE}/index.coffee"
  output:
    path: BUILD
    filename: "[name].js"
  resolve:
    alias:
      context: CONTEXT
      engine: ENGINE
      interface: INTERFACE
      blaba: MATHJS
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

