export function getMarkers(source, from, to) {
  const a = source.indexOf(from) + from.length
  const b = source.slice(a).indexOf(to) + a

  return [a, b]
}
export function extractEffect(source) {
  const [a, b] = getMarkers(source, '<a-scene', '>')
  const currentEffect = source.slice(a, b)
  return currentEffect
}

export function makeFirstEffect({ name, effect }) {
  return `\neffects="${name}"\n${effect}`
}
