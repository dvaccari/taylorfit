// Karma configuration
// Generated on Mon Mar 06 2017 02:30:01 GMT-0500 (EST)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['chai', 'mocha'],


    // list of files / patterns to load in the browser
    files: [
      'test/worker/**/*.js'
      //'*.worker.js'
      //{ pattern: '*.worker.js', included: true }
    ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/worker/**/*.js': ['webpack'],
      '../*.worker.js': ['webpack']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome', 'Firefox'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,

    plugins: [
      require('karma-chai'),
      require('karma-mocha'),
      require('karma-webpack'),
      require('karma-chrome-launcher'),
      require('karma-firefox-launcher')
    ],

    browserNoActivityTimeout: 20000,

    webpack: {
      target: 'web',
      profile: true,
      cache: true,
      devtool: '#eval',
      module: {
        loaders: [{
          test: /worker\.js$/,
          loader: 'worker-loader'
        }, {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          loader: 'babel-loader?presets[]=es2017'
        }]
      },
      resolve: {
        alias: { _karma_webpack_: '../' }
      }
    },

    client: {
      mocha: {
        timeout: 15000
      }
    }
  });
};
