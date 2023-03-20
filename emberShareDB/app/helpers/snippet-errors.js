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
    case 'alternativeFound':
      const libraries = `'<strong>${snippet.libs.join(
        "</strong>' and '<strong>"
      )}</strong>'`
      const plural = snippet.libs.length > 1
      const noun = `librar${plural ? 'ies' : 'y'}`
      return `An incorrect version of the ${noun} ${libraries} was found in the document.\nYou can delete and re-add th${
        plural ? 'ese' : 'is'
      } ${noun} by using <strong>Add Libraries</strong> above.`
    default:
      return 'Error inserting snippet!'
  }
}
