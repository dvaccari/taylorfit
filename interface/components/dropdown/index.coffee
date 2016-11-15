

require "./index.styl"

ko.components.register "tf-dropdown",
  template: do require "./index.pug"
  viewModel: createViewModel: ( params, { element, templateNodes } ) ->
    # -- params
    if params.align
      element.className += " align-#{params.align}"

    # -- arrow
    arrow = element.children[0]

    # -- content
    element.appendChild content = document.createElement "div"
    content.className = "dropdown-content"
    content.setAttribute "data-bind", "with:$parents[#{params.shallow || 0}]"
    content.style.display = "none"
    content.appendChild node for node in templateNodes

    # -- event management
    arrow.onclick = ( event ) ->
      if content.style.display is "none"
        content.style.display = "block"
        setTimeout ->
          window.addEventListener "click", rm = ( ) ->
            content.style.display = "none"
            window.removeEventListener "click", rm

    return this
