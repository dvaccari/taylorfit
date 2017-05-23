
# --- include core libraries
require "core-js"
require "../engine/worker/subworkers.js"

# --- choose correct adapter
# TODO: make selection based on build model
global.adapter = require "./adapter/worker"

# --- setup knockout
global.ko = require "./ko-adapter"

# --- setup lodash
global._ = require "lodash"

# --- request statistics

global.allstats = ko.observableArray [ ]

adapter.on "statisticsMetadata", ( data ) ->
  for stat in data
    if stat.show != false
      allstats.push
        id: stat.id
        name: stat.displayName or stat.id
        global: stat.globalOnly or false
        candidate: stat.candidateOnly or false
        sort: stat.sort or ">"
        default: stat.default
        selected: ko.observable stat.default is true
        sorting: ko.observable false
        format: stat.format or "float"
adapter.requestStatisticsMetadata()

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()
