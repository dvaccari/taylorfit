# Include core libraries
require "core-js"
require "../engine/worker/subworkers.js"

# Choose correct adapter
# TODO: make selection based on build model
global.adapter = require "./adapter/worker"

# Setup knockout
global.ko = require "./ko-adapter"

# Setup lodash
global._ = require "lodash"

# Request statistics
global.allstats = ko.observableArray [ ]

global.send_incoming_stats = () ->
  adapter.on "statisticsMetadata", ( data ) ->
    for stat in data
      if stat.show != false && allstats().find((element) => element.id == stat.id) == undefined
        allstats.push
          id: stat.id
          name: stat.displayName or stat.id
          global: stat.globalOnly or false
          candidate: stat.candidateOnly or stat.currentModelOnly or false
          sort: stat.sort or ">"  # Uses specified sort value unless unspecified
          default: stat.default
          selected: ko.observable stat.default is true
          sorting: ko.observable false
          format: stat.format or "float"
          description: stat.description
  adapter.requestStatisticsMetadata()

if performance.navigation.type == performance.navigation.TYPE_RELOAD
  send_incoming_stats()

# Include components
require "./components"

document.body.appendChild \
  document.createElement "tf-app"

ko.applyBindings()
