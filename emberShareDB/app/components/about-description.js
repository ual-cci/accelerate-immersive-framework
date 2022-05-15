import Component from '@ember/component'
import { inject } from '@ember/service'
import config from '../config/environment'
import { isEmpty } from '@ember/utils'
import { computed } from '@ember/object'

export default Component.extend({
  mediaQueries: inject(),
  colours: computed(() => {
    return config.colours.map((col) => `${col}F2`)
  }),
  docURL: config.localOrigin + '/getting-started/beginner',
  didRender() {
    this._super(...arguments)
    let colour1 = Math.floor(Math.random() * 5)
    let colour2 = Math.floor(Math.random() * 5)
    while (colour2 == colour1) {
      colour2 = Math.floor(Math.random() * 5)
    }
    document.getElementById('about-overlay-title').style['background-color'] =
      this.get('colours')[colour1]
    const desc = document.getElementById('about-overlay-desc')
    if (!isEmpty(desc)) {
      desc.style['background-color'] = this.get('colours')[colour2]
    }
  },
})
