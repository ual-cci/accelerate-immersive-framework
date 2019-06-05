import Component from '@ember/component';
import CodeMirror from 'codemirror';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    const myTextArea = this.element.querySelector("#code-mirror-container");
    const codemirror = CodeMirror.fromTextArea(myTextArea, {
      mode:"javascript",
      value:"const louis = () => {\nreturn great\n}",
      theme:"monokai"
    });
    codemirror.on('change', ()=> {
      console.log("change", this.get('codemirror'))
    })
    codemirror.setValue("const louis = () => {\n    return great\n}");
    this.set('codemirror', codemirror);
  }
});
