export function parseSnippetError(err, snippet) {
  switch (err) {
    case 'markerNotFound':
      return `Cannot find '<strong>${snippet.marker}</strong>' tag so I don't know where to insert the <strong>${snippet.title}</strong>!`
    case 'libNotFound':
      return `This snippet requires the '<strong>${snippet.libs.join(
        "</strong>' and '<strong>"
      )}</strong>' librar${
        snippet.libs.length > 1 ? 'ies' : 'y'
      } to be added first.`
    default:
      return 'Error inserting snippet!'
  }
}
