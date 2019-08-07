import Component from '@ember/component';
import HTMLHint from 'htmlhint';
import CodeMirror from 'codemirror';
import { inject }  from '@ember/service';
import JSHINT from 'jshint';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  autocomplete: inject('autocomplete'),
  fontSize:14,
  cs: inject('console'),
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
        var mode = editor.getMode().name;
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
        //collate all errors on the same line together
        var lines = {};
        for (i = 0; i < messages.length; ++i) {
          let err = messages[i];
          //HTMLHint misclassifies this, ignore
          if(err.message != "Tag must be paired, no start tag: [ </input> ]")
          {
            if(!isEmpty(lines[err.line]))
            {
              lines[err.line] = lines[err.line] + "\n" + err.message;
            }
            else
            {
              lines[err.line] = err.message;
            }
          }
        }
        this.get('cs').log("lines",lines);
        for (let line in lines) {
          if (lines.hasOwnProperty(line))
          {
            let msg = document.createElement("div");
            msg.style["background-color"] = "transparent";
            let icon = msg.appendChild(document.createElement("div"));
            icon.innerHTML = "!!";
            icon.className = "lint-error-icon";

            let txt = document.createElement("div");
            txt.innerHTML = lines[line];
            txt.style.display = "none";
            msg.appendChild(txt);
            msg.className = "lint-error";
            icon.onmouseover = ()=> {
              this.get('cs').log("over");
              msg.style["background-color"] = "white";
              txt.style.display = "inline";
            };
            icon.onmouseout = ()=> {
              msg.style["background-color"] = "transparent";
              txt.style.display = "none";
            }
            widgets.push(editor.addLineWidget(parseInt(line) - 1, msg, {coverGutter: true, noHScroll: true}));
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
