import Component from '@ember/component';
import CodeMirror from 'codemirror';

export default Component.extend({
  didInsertElement() {
    this._super(...arguments);
    const myTextArea = this.element.querySelector("#code-mirror-container");
    const codemirror = CodeMirror.fromTextArea(myTextArea, {
      mode:"htmlmixed",
      theme:"monokai",
      lineWrapping:true,
      lineNumbers:true,
      readOnly:true,
    });
    codemirror.on('change', (cm, change)=> {
      console.log("CM CHANGED");
      this.onChange(cm, change);
    })
    this.set('codemirror', codemirror);
    this.onReady(codemirror);
  }
});
