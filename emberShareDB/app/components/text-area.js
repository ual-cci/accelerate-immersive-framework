import Component from '@ember/component';
import { inject as service } from '@ember/service';
import ShareDB from 'npm:sharedb/lib/client';
import StringBinding from 'npm:sharedb-string-binding';

export default Component.extend({
  websockets: service(),
  socketRef: null,
  con: null,
  doc: null,
  didInsertElement() {
    this._super(...arguments);
    const socket = new WebSocket('ws://localhost:8080');
    const con = new ShareDB.Connection(socket);
    this.set('connection', con);

    const doc = con.get('MIMIC','text-area');
    this.set('doc', doc);

    doc.subscribe((err) => {
      if (err) throw err;
      console.log()
      const binding = new StringBinding(this.$("textarea").get(0), doc);
      binding.setup();
    });
    console.log("DOC:","type",doc.type,"id", doc.id, "data", doc.data);
    this.set('socketRef', socket);
  },
  willDestroyElement() {
    this._super(...arguments);
  },
  actions: {
    valueUpdated()  {
      //console.log("editor updated");
    },
    editorReady(editor) {
      console.log("editor ready", editor);
      this.set('editor', editor);
    }
  }
});
