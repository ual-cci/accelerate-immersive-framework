export function getMarkers(source, from, to, inculsive = false) {
  const a = source.indexOf(from) + (inculsive ? 0 : from.length)
  const b = source.slice(a).indexOf(to) + a + (inculsive ? to.length : 0)

  return [a, b]
}

export function extract(source, markerA, markerB, inclusive = false) {
  const [a, b] = getMarkers(source, markerA, markerB, inclusive)
  const currentChunk = source.slice(a, b)
  return currentChunk
}

export function makeFirstEffect({ name, effect }) {
  return `\neffects="${name}"\n${effect}`
}

export function makeFirstAsset(asset) {
  return `\n<a-assets>\n\t${makeAsset(asset)}\n</a-assets>\n`
}

export function makeAsset({ name, src }) {
  return `<a-asset-item id="${name}" src="${src}"></a-asset-item>\n`
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
