import Component from '@ember/component';
import HTMLHint from 'htmlhint';
import CodeMirror from 'codemirror';
import { inject }  from '@ember/service';

export default Component.extend({
  autocomplete: inject('autocomplete'),
  fontSize:14,
  didInsertElement() {
    this._super(...arguments);
    const myTextArea = this.element.querySelector("#code-mirror-container");
    const editor = CodeMirror.fromTextArea(myTextArea, {
      mode:"htmlmixed",
      theme:"monokai",
      lineWrapping:true,
      readOnly:true,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseTags: true,
      lint: true,
      gutters: ["CodeMirror-lint-markers"]
    });
    editor.showHints = true;
    var orig = CodeMirror.hint.javascript;
    CodeMirror.hint.javascript = function(cm) {
      var inner = orig(cm) || {from: cm.getCursor(), to: cm.getCursor(), list: []};
      return inner;
    };
    editor.setOption("extraKeys", {
      "Ctrl-Space": "autocomplete",
      "Cmd-\=": (cm)=> {
        this.incrementProperty("fontSize");
        let elements = document.getElementsByClassName("CodeMirror");
        console.log("ZOOMIN", elements[0], this.get("fontSize"))
        elements[0].style.fontSize = this.get("fontSize")+"pt";
      },
      "Cmd--": (cm)=>  {
        let newFont = this.get('fontSize') - 1;
        if(newFont < 1)
        {
          newFont = 1;
        }
        this.set("fontSize", newFont);
        let elements = document.getElementsByClassName("CodeMirror");
        elements[0].style.fontSize = this.get("fontSize")+"pt";
      },
      "Shift-Enter": (cm)=>  {
        this.onReevaluate();
      }
    });
    var widgets = [];
    var waiting;

    let updateHints = ()=> {
      editor.operation(()=> {
        for (var i = 0; i < widgets.length; ++i){
          editor.removeLineWidget(widgets[i])
        }

        widgets.length = 0
        console.log("HTMLHint", HTMLHint.HTMLHint, HTMLHint.HTMLHint.verify);
        const ruleSets = this.get('autocomplete').ruleSets("js");
        var messages = HTMLHint.HTMLHint.verify(editor.getValue(), ruleSets);
        console.log("ruleSets", ruleSets, "messages", messages);
        for (i = 0; i < messages.length; ++i) {
          let err = messages[i];
          if (!err) continue
          var msg = document.createElement("div")
          var icon = msg.appendChild(document.createElement("span"))
          icon.innerHTML = "!!"
          icon.className = "lint-error-icon"
          msg.appendChild(document.createTextNode(err.message))
          msg.className = "lint-error"
          widgets.push(editor.addLineWidget(err.line - 1, msg, {coverGutter: false, noHScroll: true}))
        }
      })
    }

    setTimeout(updateHints, 100);

    CodeMirror.commands.autocomplete = function(cm) {
        console.log("AUTOCOMPLETE")
        var doc = cm.getDoc();
        var POS = doc.getCursor();
        var mode = CodeMirror.innerMode(cm.getMode(), cm.getTokenAt(POS).state).mode.name;

        if (mode == 'xml') {
            console.log("AUTOCOMPLETE xml")
            CodeMirror.showHint(cm, CodeMirror.hint.html);
        } else if (mode == 'javascript') {
            console.log("AUTOCOMPLETE javascript")
            CodeMirror.showHint(cm, CodeMirror.hint.javascript);
        } else if (mode == 'css') {
            console.log("AUTOCOMPLETE css")
            CodeMirror.showHint(cm, CodeMirror.hint.css);
        }
    };
    var WORD = /[\w$]+/g, RANGE = 500;

    editor.on('change', (cm, change)=> {
      console.log("CM CHANGED");
      this.onChange(cm, change);
      clearTimeout(waiting);
      waiting = setTimeout(updateHints, 500);
    })
    this.set('codemirror', editor);
    this.onReady(editor);
  }
});
