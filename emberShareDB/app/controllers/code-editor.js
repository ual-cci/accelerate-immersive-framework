import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import config from  '../config/environment';
import { isEmpty } from '@ember/utils';

export default Controller.extend({
  websockets: inject('websockets'),
  sessionAccount: inject('session-account'),
  socketRef: null,
  con: null,
  doc: null,
  editor: null,
  suppress: false,
  codeTimer: new Date(),
  renderedSource:"",
  collapsed: true,
  isNotEdittingDocName:true,
  updateIFrame(self) {
    const doc = self.get('doc');
    let toRender = doc.data.source;
    toRender = self.replaceAssets(toRender, self.get('model').assets);
    self.set('renderedSource', toRender);
  },
  replaceAssets(source, assets) {
    for(let i = 0; i < assets.length; i++)
    {
      console.log(assets[i].name);
      const toFind = assets[i].name;
      const url = config.serverHost + "/asset/" + assets[i].fileId;
      source = source.replace(new RegExp(toFind,"gm"),url);
    }
    return source;
  },
  executeCode(self) {
    if(self.get('codeTimer'))
    {
      clearTimeout(self.get('codeTimer'));
    }
    self.set('codeTimer', setTimeout(function() {
      self.updateIFrame(self);
      self.set('codeTimer',null);
    },1500));
  },
  opTransform(ops, editor) {
    function opToDelta(op) {
      const index = op.p[op.p.length - 1];
      const session = editor.getSession();
      const pos = session.doc.indexToPosition(index, 0);
      const start = pos;
      let action;
      let lines;
      let end;
      if ('sd' in op) {
        action = 'remove';
        lines = op.sd.split('\n');
        const count = lines.reduce((total, line) => total + line.length, lines.length - 1);
        end = session.doc.indexToPosition(index + count, 0);
      } else if ('si' in op) {
        action = 'insert';
        lines = op.si.split('\n');
        if (lines.length === 1) {
          end = {
            row: start.row,
            column: start.column + op.si.length,
          };
        } else {
          end = {
            row: start.row + (lines.length - 1),
            column: lines[lines.length - 1].length,
          };
        }
      } else {
        throw new Error(`Invalid Operation: ${JSON.stringify(op)}`);
      }
      const delta = {
        start,
        end,
        action,
        lines,
      };
      return delta;
    }
    const deltas = ops.map(opToDelta);
    return deltas;
  },
  onSessionChange(self, delta) {
    const surpress = self.get('surpress');
    const doc = self.get('doc');
    if(!surpress)
    {
      const editor = self.editor;
      const session = editor.getSession();

      const aceDoc = session.getDocument();
      const op = {};
      const start = aceDoc.positionToIndex(delta.start);
      op.p = ['source',start];
      let action;
      if (delta.action === 'insert') {
        action = 'si';
      } else if (delta.action === 'remove') {
        action = 'sd';
      } else {
        throw new Error(`action ${action} not supported`);
      }
      const str = delta.lines.join('\n');
      op[action] = str;
      doc.submitOp(op);
      this.executeCode(self);
    }
  },
  initShareDB() {
    const socket = new WebSocket('ws://localhost:8080');
    const con = new ShareDB.Connection(socket);
    this.set('connection', con);
    const doc = con.get('mimicDocs',this.get('model').id);
    this.set('doc', doc);
    this.set('isPrivate', this.get('model').isPrivate);
    this.set('renderedSource', this.get('model').source);
    const editor = this.get('editor');
    const session = editor.getSession();
    session.setMode("ace/mode/html");
    doc.subscribe((err) => {
      if (err) throw err;

      const doc = this.get('doc');
      this.get('sessionAccount').set('currentDoc',this.get('model').id);
      this.set('surpress', true);
      this.updateIFrame(this);
      session.setValue(doc.data.source);
      this.set('surpress', false);

      session.on('change',(delta)=>{
        this.onSessionChange(this, delta);
      });
    });
    doc.on('op',(ops,source) => {
      if(!source && ops[0].p[0] == "source")
      {
        this.set('surpress', true);
        const deltas = this.opTransform(ops, editor);
        session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      }
    });
    this.set('socketRef', socket);
  },
  canEditDoc() {
    const currentUser = this.get('sessionAccount').currentUserName;
    if(isEmpty(currentUser))
    {
      return false;
    }
    const doc = this.get('doc');
    if(currentUser != doc.data.owner)
    {
      return false;
    }
    return true;
  },
  actions: {
    editorReady(editor) {
      this.set('editor', editor);
      this.initShareDB();
    },
    tagsChanged(tags) {
      console.log("tagsChanged", tags);
      const doc = this.get('doc');
      this.set('surpress', true);
      doc.submitOp({p:['tags'],oi:tags},{source:true});
      this.set('surpress', false);
    },
    doEditDocName() {
      console.log('edit doc name');
      if(this.canEditDoc())
      {
        this.set('isNotEdittingDocName', false);
        Ember.run.scheduleOnce('afterRender', this, function() {
          $('#doc-name-input').focus();
        });
      }
    },
    endEdittingDocName() {
      this.set('isNotEdittingDocName', true);
      const doc = this.get('doc');
      const newName = this.get('model').name;
      console.log('endEdittingDocName',newName);
      this.set('surpress', true);
      doc.submitOp({p:['name'],oi:newName},{source:true});
      this.set('surpress', false);
    },
    privacyToggled() {
      this.toggleProperty('isPrivate');
      const doc = this.get('doc');
      this.set('surpress', true);
      doc.submitOp({p:['isPrivate'],oi:this.get('isPrivate')},{source:true});
      this.set('surpress', false);
    },
    toggleCollapsed() {
      this.toggleProperty('collapsed');
    }
  }
});
