
require "./index.styl"

ko.components.register "tf-pager",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.source
      throw new TypeError "components/pager: source must be observable"

    unless ko.isObservable params.pagesize
      params.pagesize = ko.observable params.pagesize or 10

    @pagesize = params.pagesize

    @source = params.source

    if params.current
      @current = params.current
    else
      @current = ko.observable null

    ko.computed ( ) =>
      pagesize = @pagesize()
      start = @current() * pagesize
      params.start? start
      params.end? Math.min start + pagesize - 1, @source().length - 1
      params.result? @source().slice start, start + pagesize
      return undefined

    # invoke computation
    @current 0

    @length = ko.computed ( ) =>
      Math.ceil @source().length / @pagesize()

    @hasFirst = ko.computed ( ) =>
      @current() > 1
    @first = ( ) =>
      @current 0

    @hasPrev = ko.computed ( ) =>
      @current() > 0
    @prev = ( ) =>
      @current @current() - 1

    @hasLast = ko.computed ( ) =>
      @current() < @length() - 2
    @last = ( ) =>
      @current @length() - 1

    @hasNext = ko.computed ( ) =>
      @current() < @length() - 1
    @next = ( ) =>
      @current @current() + 1

    @range = ko.computed ( ) =>
      min = Math.max 0, @current() - 2
      max = Math.min @length(), min + 5
      [min...max]
    @goto = ( n ) =>
      @current n

    return this
