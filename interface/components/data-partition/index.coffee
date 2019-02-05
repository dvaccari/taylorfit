require "./index.styl"

ko.components.register "tf-data-partition",
  template: do require "./index.pug"
  viewModel: ( params ) ->
    unless ko.isObservable params.show_partition
      throw new TypeError "components/data_partition:
      expects [show_partition] to be observable"

    @show_partition = params.show_partition
    @error_msg = ko.observable undefined
    @invalid = ko.observable undefined
    @p = ko.observable 100

    @change_partition = ( ) ->
      @invalid = !@p() || isNaN(@p())

    # Check if data partition popup should render
    @active = ko.computed ( ) => @show_partition() != undefined && @show_partition != false
  
    return this
