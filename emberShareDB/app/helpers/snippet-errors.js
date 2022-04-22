export function parseSnippetError(err, snippet) {
  switch (err) {
    case 'markerNotFound':
      return `Cannot find '${snippet.marker}' tag so I don't know where to insert the ${snippet.title}!`
    case 'libNotFound':
      return `This snippet requires the '${snippet.lib}' library to be added first.`
    default:
      return 'Error inserting snippet!'
  }
}
