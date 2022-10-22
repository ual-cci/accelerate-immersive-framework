export function getMarkers(source, from, to) {
  const a = source.indexOf(from) + from.length
  const b = source.slice(a).indexOf(to) + a

  return [a, b]
}

export function extract(source, markerA, markerB) {
  const [a, b] = getMarkers(source, markerA, markerB)
  const currentChunk = source.slice(a, b)
  return currentChunk
}

export function makeFirstEffect({ name, effect }) {
  return `\neffects="${name}"\n${effect}`
}

export function randRange(from, to, fixed = 0) {
  return (Math.random() * (to - from) + from).toFixed(fixed)
}

export function randomAframeAttr(from, to) {
  return `${randRange(from, to)} ${randRange(from, to)} ${randRange(from, to)}`
}

export function randInt(length) {
  return Math.floor(Math.random() * Math.pow(10, length))
}
