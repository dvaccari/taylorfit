
var BUILD, CONTEXT, ENGINE, INTERFACE, path, rel, webpack;

webpack = require("webpack");
path = require("path");

rel = function(p1) {
  return path.resolve(__dirname, p1);
};

CONTEXT = rel(".");
ENGINE = rel("./engine");
INTERFACE = rel("./interface");
BUILD = rel("./build");
WORKER = rel("./worker");

module.exports = {
  target: "web",
  profile: true,
  progress: true,
  cache: true,
  devtool: "#eval",
  devServer: {
    contentBase: BUILD,
    inline: true,
    hot: true
  },
  node: {
    console: false,
    global: false,
    process: true,
    Buffer: false,
    setImmediate: false
  },
  entry: {
    "interface": INTERFACE,
    "engine-worker": WORKER
  },
  output: {
    path: BUILD,
    filename: "[name].js",
    pathinfo: true
  },
  resolve: {
    alias: {
      context: CONTEXT,
      engine: ENGINE,
      "interface": INTERFACE
    },
    extensions: ["", ".webpack-loader.js", ".web-loader.js",
    ".loader.js", ".js", ".coffee", ".es6"]
  },
  module: {
    loaders: [{
      test: /\.coffee$/,
      loader: "coffee-loader"
    }, {
      test: /\.(?:pug|jade)$/,
      loader: "pug-loader"
    }, {
      test: /\.styl$/,
      loader: "style-loader!css-loader!stylus-loader"
    }, {
      test: /\.txt$/,
      loader: "raw-loader"
    }, {
      test: /\.jsx$/,
      exclude: /node_modules/,
      loader: "babel?presets[]=es2015"
    }]
  },
  plugins: [
    new webpack.BannerPlugin(";;(function(){this.global=this;this.window=this})();;", {
      raw: true,
      entryOnly: true
    }), new webpack.optimize.UglifyJsPlugin()
  ],
  stylus: {
    use: [require("nib")()],
    "import": ["~nib/lib/nib/index.styl", rel("./config.styl")],
    preferPathResolver: "webpack"
  }
};

