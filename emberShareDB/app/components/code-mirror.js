import Component from '@ember/component';
import HTMLHint from 'htmlhint';
import CodeMirror from 'codemirror';
import { inject }  from '@ember/service';
import JSHINT from 'jshint';

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
      gutters: ["CodeMirror-lint-markers"],
      hintOptions:{hint:this.get("suggestCompletions")}
    });

    editor.setOption("extraKeys", {
      "Ctrl-Space": "autocomplete",
      "Cmd-\=": (cm)=> {
        this.incrementProperty("fontSize");
        let elements = document.getElementsByClassName("CodeMirror");
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
        var doc = editor.getDoc();
        var pos = doc.getCursor();
        var mode = CodeMirror.innerMode(editor.getMode(), editor.getTokenAt(pos).state).mode.name;
        widgets.length = 0
        const ruleSets = this.get('autocomplete').ruleSets(mode);

        let src = editor.getValue();
        if(mode == "javascript")
        {
          //Add script tags around javascript to force js linting
          src = "<script>" + editor.getValue() + "</script>";
        }
        else if (mode == "css")
        {
          //Add style tags around css to force css linting
          src = "<style>" + editor.getValue() + "</style>";
        }
        var messages = HTMLHint.HTMLHint.verify(src, ruleSets);
        for (i = 0; i < messages.length; ++i) {
          let err = messages[i];
          //HTMLHint misclassifies this, ignore
          if(err.message != "Tag must be paired, no start tag: [ </input> ]")
          {
            if (!err) continue
            let msg = document.createElement("div");
            msg.style["background-color"] = "transparent";
            let icon = msg.appendChild(document.createElement("div"));
            icon.innerHTML = "!!";
            icon.className = "lint-error-icon";

            let txt = document.createElement("div");
            txt.innerHTML = err.message;
            txt.style.display = "none";
            msg.appendChild(txt);
            msg.className = "lint-error";
            icon.onmouseover = ()=> {
              console.log("over");
              msg.style["background-color"] = "white";
              txt.style.display = "inline";
            };
            icon.onmouseout = ()=> {
              msg.style["background-color"] = "transparent";
              txt.style.display = "none";
            }
            console.log(txt);
            widgets.push(editor.addLineWidget(err.line - 1, msg, {coverGutter: true, noHScroll: true}));
          }
        }
      })
    }

    setTimeout(updateHints, 100);

    editor.on('changes', (cm, change)=> {
      this.onChange(cm, change);
      clearTimeout(waiting);
      waiting = setTimeout(updateHints, 500);
    })
    this.set('codemirror', editor);
    this.onReady(editor);
  }
});
