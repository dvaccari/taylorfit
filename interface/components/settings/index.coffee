
require "./index.styl"
Model = require "../Model"
Combintations = require "combinations-js"

download = ( name, type, content ) ->
  a = document.createElement "a"
  a.href = URL.createObjectURL \
    new Blob [ content ], { type }
  a.download = name

  document.body.appendChild a
  a.click()

  URL.revokeObjectURL a.href
  document.body.removeChild a

ko.components.register "tf-settings",
  template: do require "./index.pug"
  viewModel: ( params ) ->

    unless ko.isObservable params.model
      throw new TypeError "components/options:
      expects [model] to be observable"

    model = params.model() # now static

    @active = model.show_settings

    @exponents = model.exponents
    @multiplicands = model.multiplicands
    @lags = model.lags
    @timeseries = model.timeseries
    @candidates = model.candidates
    @psig = model.psig

    @multiplicands_max = ko.observable 0
    @num_terms = ko.observable 0
    ko.computed ( ) =>
      ncols = model.columns().length
      n_lags = 0
      zero_lag = false
      for key, value of @lags()
        if key == "0" and value != false then zero_lag = true
        if value != false then n_lags++
      accum = 0
      i = 0
      e = 0
      for key, value of @exponents()
        if value then e++
      if n_lags == 0 or (n_lags == 1 and zero_lag)
        comb_vals = ncols - 1
        base = e
      else if n_lags == 1 and zero_lag == false
        comb_vals = ncols
        base = e
      else if n_lags > 1 and zero_lag == false
        comb_vals = ncols
        base = e * n_lags
      else
        comb_vals = ncols - 1
        base = e * n_lags
      while i <= @multiplicands()

        if n_lags <= 1 or (zero_lag == false)
          c = Combintations comb_vals, i
          p = Math.pow(base, i)
          accum += c * p
        else
          if i == 0
            accum += 1
          else
            c1 = Combintations comb_vals, i
            p1 = Math.pow(base, i)
            c2 = Combintations comb_vals, i - 1
            p2 = Math.pow(base, i-1) * e * (n_lags - 1)
            accum += (c1 * p1) + (c2 * p2)
        i++
      @num_terms accum


    ko.computed ( ) =>
      active = 0
      zero = false
      ncols = model.columns().length
      for key, value of @lags() when ko.unwrap value
        active++
        zero = true if key is "0"
      unless @timeseries() and active
        @multiplicands_max ncols - 1
      else
        unless zero
          @multiplicands_max ncols * active
        else
          @multiplicands_max (ncols - 1) * active + active - 1
      unless @multiplicands.peek() <= @multiplicands_max()
        @multiplicands @multiplicands_max()


    @timeseries.subscribe ( next ) =>
      @lags { 0: true } unless next

    @active.subscribe ( next ) ->
      if next then adapter.unsubscribeToChanges()
      else adapter.subscribeToChanges()

    @download_model = ( ) ->
      model = params.model()
      download (model.id() or "model") + ".tf",
        "application/json", model.out()

    @clear_project = ( ) ->
      @clear_settings()
      params.model null

    @clear_model = ( ) ->
      model.show_settings(false)
      adapter.clear()
      adapter.addTerm([[0, 0, 0]])

    @clear_settings = ( ) ->
      model.exponents({1: true})
      model.multiplicands(1)
      model.lags({0: true})
      model.timeseries(false)
      model.psig(0.05)
      ko.precision(5)
      # Clear the selected stats to the default
      allstats().forEach((stat) => stat.selected(stat.default))

    return this
