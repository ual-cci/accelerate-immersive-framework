import Service from '@ember/service'
import { computed } from '@ember/object'

export default Service.extend({
  libraryMap: computed(() => {
    return [
      { title: 'MMLL', id: 'mmll', url: 'MMLL.js' },
      { title: 'RapidLib', id: 'rapidlib', url: 'rapidLib.js' },
      { title: 'Learner.js', id: 'learner', url: 'learner.v.0.2.js' },
      {
        title: 'Maxi Instrument',
        id: 'maxiinstrument',
        url: 'maxiInstruments.v.0.4.js',
      },
      { title: 'MIMIC Samples', id: 'mimicSamples', url: 'mimicSamples.js' },
      { title: 'maximilian.js', id: 'maximilian', url: 'maximilian.js' },
      { title: 'EvoLib', id: 'evolib', url: 'evolib.js' },
      {
        title: 'Chrome Auto Player',
        id: 'chromeplayer',
        url: 'chrome-player.js',
      },
      { title: 'Nexus', id: 'nexusUI', url: 'nexusUI.js' },
      { title: 'Processing', id: 'processing.js', url: 'processing.js' },
      { title: 'p5', id: 'p5', url: 'p5.min.js' },
      { title: 'SoundJS', id: 'soundjs', url: 'soundjs.js' },
      { title: 'Marked', id: 'marked', url: 'marked.js' },
      { title: 'ThreeJS', id: 'threejs', url: 'three.min.js' },
      {
        title: 'A-Frame',
        id: 'a-frame',
        url: 'aframe-v1.3.0.min.js',
      },
      {
        title: 'A-Frame Effects',
        id: 'a-frame-effects',
        url: 'aframe-effects.min.js',
      },
      { title: 'A-Game', id: 'a-game', url: 'a-game/a-game-0.47.0.js' },
      {
        title: 'GLTFExporter',
        id: 'gltfExporter',
        url: 'GLTFExporter.js',
      },
      {
        title: 'THREE Orbit Controls',
        id: 'orbitControls',
        url: 'OrbitControls.js',
      },
    ]
  }),
  url(id) {
    let url = ''
    this.get('libraryMap').forEach((lib) => {
      if (lib.id == id) {
        url = lib.url
      }
    })
    return url
  },
})
