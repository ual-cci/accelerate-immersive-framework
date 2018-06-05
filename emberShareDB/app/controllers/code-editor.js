import Controller from '@ember/controller';
import { inject }  from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';

export default Controller.extend({
  queryParams: ['docId'],
  docId: null,
  websockets: inject('websockets'),
  sessionAccount: inject('session-account'),
  socketRef: null,
  con: null,
  doc: null,
  editor: null,
  suppress: false,
  getSession() {
    const editor = this.get('editor');
    const session = editor.getSession();
    return session;
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
    }
  },
  initShareDB() {
    const socket = new WebSocket('ws://localhost:8080');
    const con = new ShareDB.Connection(socket);
    this.set('connection', con);
    console.log("document",this.get('docId'));
    const doc = con.get('mimicDocs',this.get('docId'));
    this.set('doc', doc);
    const editor = this.get('editor');
    const session = editor.getSession();

    doc.subscribe((err) => {
      if (err) throw err;

      const doc = this.get('doc');
      console.log(doc.data);
      // const op = {p:['name'],oi:'louis'};
      // doc.submitOp(op);
      this.get('sessionAccount').set('currentDoc',this.get('docId'));
      this.set('surpress', true);
      session.setValue(doc.data.source);
      this.set('surpress', false);

      session.on('change',(delta)=>{
        this.onSessionChange(this, delta);
      });
    });
    doc.on('op',(ops,source) => {
      if(!source)
      {
        console.log('updating from remote',this.get('surpress'));
        const deltas = this.opTransform(ops, editor);
        this.set('surpress', true);
        session.getDocument().applyDeltas(deltas);
        this.set('surpress', false);
      }
    });
    console.log("DOC:","type",doc.type,"id", doc.id, "data", doc.data);
    this.set('socketRef', socket);
  },
  actions: {
    editorReady(editor) {
      console.log("editor ready", editor);
      this.set('editor', editor);
      this.initShareDB();
    }
  }
});
