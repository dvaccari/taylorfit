
const webpack = require('webpack');
const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');

const rel = function(p1) {
  return path.resolve(__dirname, p1);
};

const CONTEXT = rel('.');
const ENGINE = rel('./engine');
const INTERFACE = rel('./interface');
const BUILD = rel('./build');
const ENGINE_WORKER = rel('./engine/worker/engine-worker.js');
const SUBWORKERS = rel('./engine/worker/subworkers.js');
const CANDIDATE_WORKER = rel('./engine/worker/candidate-worker.js');

module.exports = {
  target: 'web',
  profile: true,
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
    'engine-worker': ENGINE_WORKER,
    'candidate-worker': CANDIDATE_WORKER,
    'subworkers': [SUBWORKERS],
    'interface': INTERFACE
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
    extensions: ['.webpack-loader.js', '.web-loader.js',
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
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'stylus-loader',
          options: {
            use: [require('nib')()],
            import: ['~nib/lib/nib/index.styl', rel('./config.styl')],
            preferPathResolver: 'webpack'
          }
        }
      ]
    }, {
      test: /\.html$/,
      loader: 'file-loader'
    }, {
      test: /\.txt$/,
      loader: 'raw-loader'
    }, {
      test: /\.json$/,
      loader: 'json-loader'
    }, {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      loader: 'babel-loader?presets[]=es2017'
    }]
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: ';;(function(){this.global=this;this.window=this})();;',
      raw: true,
      entryOnly: true
    }),
    new webpack.optimize.UglifyJsPlugin(),
    new HtmlWebpackPlugin({
      title: 'TaylorFit',
      chunks: ['interface', 'subworkers']
    })
  ]
};

