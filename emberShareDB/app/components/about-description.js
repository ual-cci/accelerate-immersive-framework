import Component from '@ember/component'
import { inject } from '@ember/service'
import config from '../config/environment'
import { isEmpty } from '@ember/utils'
import { computed } from '@ember/object'

export default Component.extend({
  mediaQueries: inject(),
  colours: computed(() => config.colours.map((col) => `${col}F2`)),
  docURL: config.localOrigin + '/getting-started/beginner',
  didRender() {
    this._super(...arguments)
    const numColours = config.colours.length
    let colour1 = Math.floor(Math.random() * numColours)
    let colour2 = Math.floor(Math.random() * numColours)
    while (colour2 == colour1) {
      colour2 = Math.floor(Math.random() * numColours)
    }
    document.getElementById('about-overlay-title').style['background-color'] =
      this.get('colours')[colour1]
    const desc = document.getElementById('about-overlay-desc')
    if (!isEmpty(desc)) {
      desc.style['background-color'] = this.get('colours')[colour2]
    }
  },
})
