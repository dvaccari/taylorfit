
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

global.send_incoming_stats = () ->
  adapter.on "statisticsMetadata", ( data ) ->
    for stat in data
      console.log(stat.sort);
      if stat.show != false
        console.log("Sorting allstats push")
        allstats.push
          id: stat.id
          name: stat.displayName or stat.id
          global: stat.globalOnly or false
          candidate: stat.candidateOnly or false
          sort: stat.sort or ">"  # Uses specified sort value unless unspecified
          default: stat.default
          selected: ko.observable stat.default is true
          sorting: ko.observable false
          format: stat.format or "float"
          description: stat.description
        console.log("Sorting allstats")
  adapter.requestStatisticsMetadata()

send_incoming_stats()

# --- include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()
