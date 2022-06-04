import Component from '@ember/component'

export default Component.extend({
  actions: {
    insert(fn) {
      const formData = new FormData(
        document.getElementById('snippet-editor-form')
      )
      // Get form data
      const opts = {}
      for (var [key, value] of formData.entries()) {
        opts[key] = value
      }
      const snip = fn(opts)
      this.toggle()
      this.submit(snip)
    },
  },
})
