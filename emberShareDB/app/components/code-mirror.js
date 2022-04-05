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
  shiftDown:false,
  evalDown:false,
  didInsertElement() {
    this._super(...arguments);
    const myTextArea = this.element.querySelector('#code-mirror-container');
    const editor = CodeMirror.fromTextArea(myTextArea, {
      mode:'htmlmixed',
      theme:'monokai',
      lineWrapping:true,
      readOnly:true,
      lineNumbers: true,
      matchBrackets: true,
      autoCloseTags: true,
      autocomplete:true,
      foldGutter: true,
      autorefresh:true,
      gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter']
    });
    editor.on('keydown', (cm, event)=> {
      //this.get('cs').log("KEY", event.keyCode);
      //17 = ctrl, 16 = shift, apple cmd = 224 | 91 | 93,
      if (!cm.state.completionActive
        && !cm.options.readOnly)
      {
        if(event.keyCode == 16)
        {
          this.set('shiftDown', true)
        }
        if(event.keyCode == 17 ||
          event.keyCode == 224 ||
          event.keyCode == 91 ||
          event.keyCode == 93)
        {
          this.set('evalDown', true)
        }
        if(this.get('evalDown') && this.get('shiftDown'))
        {
          //this.onReevaluate();
        }
      }
    });
    editor.on('keyup', (cm, event) => {
        //console.log("KEY", event.keyCode);
        if (!cm.state.completionActive
          && !cm.options.readOnly)
        {
          if(event.keyCode == 16)
          {
            this.set('shiftDown', false)
          }
          if(event.keyCode == 17 ||
            event.keyCode == 224 ||
            event.keyCode == 91 ||
            event.keyCode == 93)
          {
            this.set('evalDown', false)
          }
        }

        if (!cm.state.completionActive
          && !cm.options.readOnly
          && event.keyCode > 31
          && event.keyCode != 9 //tab
          && event.keyCode != 8
          && event.keyCode != 32
          && event.keyCode != 13
          && event.keyCode != 37
          && event.keyCode != 38
          && event.keyCode != 39
          && event.keyCode != 40
          && event.keyCode != 224 //apple cmd
        ) {
          let cursor = cm.getCursor(), line = cm.getLine(cursor.line)
          let start = cursor.ch, end = cursor.ch
          let from, to;
          while (start && /\w/.test(line.charAt(start - 1))) --start;
          while (end < line.length && /\w/.test(line.charAt(end))) ++end
          var word = line.slice(start, end).toLowerCase()
          if(word.length > 1)
          {
            cm.showHint({completeSingle: false});
          }
        }
    });
    editor.setOption('extraKeys', {
      'Ctrl-Space': 'autocomplete',
      'Cmd-\=': (cm)=> {
        let elements = document.getElementsByClassName('CodeMirror');
        const currentFontSize = parseInt(elements[0].style.fontSize.substring(0,2))
        elements[0].style.fontSize = (currentFontSize + 1) + 'pt';
      },
      'Cmd--': (cm)=>  {
        let elements = document.getElementsByClassName('CodeMirror');
        const currentFontSize = parseInt(elements[0].style.fontSize.substring(0,2))
        elements[0].style.fontSize = (currentFontSize - 1) + 'pt';
      },
      'Cmd-Enter': (cm)=>  {
        this.get('cs').log('shift-cmd')
        this.onReevaluate();
      },
      'Ctrl-Enter': (cm)=>  {
        this.get('cs').log('shift-Ctrl')
        this.onReevaluate();
      },
      'Cmd-/': (cm)=>  {
        cm.toggleComment();
        console.log('COMMENT');
      }
    });
    var widgets = [];
    var waiting;

    let updateHints = ()=> {
      editor.operation(()=> {
        for (var i = 0; i < widgets.length; ++i){
          editor.setGutterMarker(widgets[i], 'CodeMirror-linenumbers', null)
        }
        var doc = editor.getDoc();
        var pos = doc.getCursor();
        var mode = editor.getMode().name;
        widgets.length = 0
        const ruleSets = this.get('autocomplete').ruleSets(mode);

        let src = editor.getValue();
        if(mode == 'javascript')
        {
          //Add script tags around javascript to force js linting
          src = '<script>' + editor.getValue() + '</script>';
        }
        else if (mode == 'css')
        {
          //Add style tags around css to force css linting
          src = '<style>' + editor.getValue() + '</style>';
        }
        var messages = HTMLHint.HTMLHint.verify(src, ruleSets);
        //collate all errors on the same line together
        var lines = {};
        for (i = 0; i < messages.length; ++i) {
          let err = messages[i];
          //HTMLHint misclassifies this, ignore
          if(err.message != 'Tag must be paired, no start tag: [ </input> ]' &&
             err.message != 'Unnecessary semicolon.')
          {
            if(!isEmpty(lines[err.line]))
            {
              lines[err.line] = lines[err.line] + '\n' + err.message;
            }
            else
            {
              lines[err.line] = err.message;
            }
          }
        }
        //this.get('cs').log("lines",lines);
        for (let line in lines) {
          if (lines.hasOwnProperty(line))
          {
            let msg = document.createElement('div');
            msg.style['background-color'] = 'transparent';
            msg.style['width'] = '1000px';
            msg.style['height'] = '100%';
            let icon = msg.appendChild(document.createElement('div'));
            icon.innerHTML = '!!';
            icon.className = 'lint-error-icon';

            let txt = document.createElement('div');
            txt.innerHTML = lines[line];
            txt.style.display = 'none';
            msg.appendChild(txt);
            msg.className = 'lint-error';
            icon.onmouseover = ()=> {
              this.get('cs').log('over');
              msg.style['background-color'] = 'rgba(255,255,255,0.8)';
              txt.style.display = 'inline';
            };
            icon.onmouseout = ()=> {
              msg.style['background-color'] = 'transparent';
              txt.style.display = 'none';
            }
            //widgets.push(editor.addLineWidget(parseInt(line) - 1, msg, {coverGutter: true, noHScroll: true}));
            widgets.push(editor.setGutterMarker(parseInt(line) - 1, 'CodeMirror-linenumbers', msg));
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
  },
});
