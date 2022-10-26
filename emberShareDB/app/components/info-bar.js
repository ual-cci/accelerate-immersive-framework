import Component from '@ember/component'

export default Component.extend({
  classNameBindings: ['isError:error:info'],
  isError: true,
  actions: {
    close() {
      this.hide()
    },
  },
})
