
const webpack = require('webpack');
const path = require('path');

const rel = function(p1) {
  return path.resolve(__dirname, p1);
};

const CONTEXT = rel('.');
const ENGINE = rel('./engine');
const INTERFACE = rel('./interface');
const BUILD = rel('./build');
const WORKER = rel('./engine/worker');

module.exports = {
  target: 'web',
  profile: true,
  progress: true,
  cache: true,
  devtool: '#eval',
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
    'interface': INTERFACE,
    'engine-worker': WORKER
  },
  output: {
    path: BUILD,
    filename: '[name].js',
    pathinfo: true
  },
  resolve: {
    alias: {
      context: CONTEXT,
      engine: ENGINE,
      interface: INTERFACE
    },
    extensions: ['', '.webpack-loader.js', '.web-loader.js',
                 '.loader.js', '.js', '.coffee', '.es6']
  },
  module: {
    loaders: [{
      test: /\.coffee$/,
      loader: 'coffee-loader'
    }, {
      test: /\.(?:pug|jade)$/,
      loader: 'pug-loader'
    }, {
      test: /\.styl$/,
      loader: 'style-loader!css-loader!stylus-loader'
    }, {
      test: /\.txt$/,
      loader: 'raw-loader'
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /\.jsx$/,
      exclude: /node_modules/,
      loader: 'babel?presets[]=es2015'
    }]
  },
  plugins: [
    new webpack.BannerPlugin(';;(function(){this.global=this;this.window=this})();;', {
      raw: true,
      entryOnly: true
    }), new webpack.optimize.UglifyJsPlugin()
  ],
  stylus: {
    use: [require('nib')()],
    'import': ['~nib/lib/nib/index.styl', rel('./config.styl')],
    preferPathResolver: 'webpack'
  }
};

