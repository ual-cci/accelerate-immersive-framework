import Component from '@ember/component'

export default Component.extend({
  actions: {
    insert(snippetInsertFn) {
      // This basically hijacks the form, updates the values and
      // then submits it.
      const formData = new FormData(
        document.getElementById('snippet-editor-form')
      )
      // Get form data which contains the new snippet info
      const opts = {}
      for (var [key, value] of formData.entries()) {
        opts[key] = value
      }
      const snip = snippetInsertFn(opts)
      this.toggle()
      this.submit(snip)
    },
    close() {
      this.toggle()
    },
    addSample(sample) {
      for (const prop in sample) {
        const el = document.getElementById(prop)
        if (el) el.value = sample[prop]()
      }
    },
  },
})
