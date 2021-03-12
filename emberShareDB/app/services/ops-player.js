import Service, { inject } from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';
import config from  '../config/environment';
import { bind } from '@ember/runloop';


export default Service.extend({
  parser:inject('code-parsing'),
  sessionAccount:inject('session-account'),
  cs:inject('console'),
  ops: null,
  opsToApply: null,
  ptr:0,
  prevDir: null,
  doc:null,
  atHead() {
    const ptr = this.get('ptr');
    if(isEmpty(this.get('ops')))
    {
      return true;
    }
    else
    {
      this.get('cs').log("checking head", ptr, this.get('ops').length)
      return ptr >= this.get('ops').length - 1;
    }
  },
  reset(doc) {
    this.set('doc', doc);
    this.set('ops', null);
  },
  startTimer(editor, didReceiveOp) {
    this.shift(true, editor, true).then(()=>{
      let currentOp = this.get("ops")[this.get("ptr")]
      let forwardUntil = new Date() - 15;
      while(this.inBounds(this.get("ptr")))
      {
        currentOp = this.get("ops")[this.get("ptr")]
        let doSend = false;
        if(currentOp.op !== undefined)
        {
          currentOp.op.forEach((op)=> {
            if(op.p[0]=="source")
            {
              if(!op.date || op.date < forwardUntil) {
                doSend = true;
              }
            }
          })
        }
        if(doSend) {
          didReceiveOp(currentOp.op)
        }
        this.incrementProperty("ptr")
      }
    })
  },
  loadOps() {
    const doc = this.get('doc');
    this.get('cs').log("loading ops", doc);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "GET",
          url: config.serverHost + "/documents/ops/" + doc,
          headers: {'Authorization': 'Bearer ' + this.get('sessionAccount.bearerToken')}
        }).then((res) => {
          this.set('ops', res.data);
          this.get('cs').log("GOT OPS", res.data)
          //this.set('ptr', this.get('ops').length);
          resolve(res.data);
        }).catch(bind((err) => {
          this.get("cs").log("op GET rejected", err)
          reject(err);
        }));
    });
  },
  shift(prev, editor, rewind = false) {
    this.get("cs").log("shift", rewind)
    this.set('reachedEnd', false);
    return new RSVP.Promise((resolve, reject) => {
      const fetch = () => {
        this.get("cs").log("Fetch");
        if(rewind)
        {
          this.set('prevDir', null);
          this.set('ptr', 0);
        }
        this.get("cs").log("updateOps");
        this.updateOps(prev);
        this.get("cs").log("applyTransform");
        this.applyTransform(editor)
        this.get("cs").log("resolve");
        resolve();
      }
      this.get("cs").log(isEmpty(this.get('ops')))
      if(isEmpty(this.get('ops')))
      {
        this.loadOps().then(() => {fetch()}).catch((err) => {reject(err)});
      }
      else
      {
        fetch();
      }
    });
  },
  inBounds(ptr) {
    const ops = this.get('ops');
    const inBounds = ptr >= 0 && ptr < ops.length;
    return inBounds;
  },
  updateOps(prev) {
    this.set('opsToApply', null);
    this.get("cs").log("updateOps", this.get("ptr"))
    let newPtr = this.get('ptr');
    if(!isEmpty(this.get('prevDir')))
    {
      if(prev != this.get('prevDir'))
      {
        newPtr = prev ? newPtr + 1 : newPtr - 1;
      }
    }
    this.set('prevDir', prev);
    let hasHitBounds = false;
    while(!hasHitBounds && isEmpty(this.get('opsToApply')))
    {
      newPtr = prev ? newPtr - 1 : newPtr + 1;
      this.get("cs").log("newPtr", newPtr,this.get('opsToApply'))
      if(this.inBounds(newPtr))
      {
        const ops = this.get('ops')[newPtr];
        if(!isEmpty(ops.op))
        {
          let toApply = [];
          for(let j = 0; j < ops.op.length; j++)
          {
            let op = ops.op[j];
            if(op.p[0] == "source")
            {
              //INVERT
              if(prev)
              {
                if(!isEmpty(op.si))
                {
                  op = {p:op.p, sd:op.si};
                }
                else if(!isEmpty(op.sd))
                {
                  op = {p:op.p, si:op.sd};
                }
              }
              toApply.push(op);
            }
          }
          if(prev)
          {
            //You have to reverse if youre going backwards
            toApply = toApply.reverse()
          }
          if(toApply.length > 0)
          {
            this.get('cs').log(toApply);
            this.set('opsToApply', toApply);
          }
        }
      }
      else
      {
        hasHitBounds = true;
      }
    }
    this.get('cs').log("newPtr", newPtr, "oldPtr", this.get('ptr'))
    if(this.inBounds(newPtr))
    {
      this.set('ptr', newPtr);
    }
    else
    {
      this.set('reachedEnd', true);
    }
  },
  clamp(num, min, max) {
    return num <= min ? min : num >= max ? max : num;
  },
  prevOp(editor, rewind = false) {
    return this.shift(true, editor, rewind);
  },
  nextOp(editor, rewind = false) {
    return this.shift(false, editor, rewind);
  },
  applyTransform(editor) {
    this.get('cs').log("applying", this.get('opsToApply'))
    if(!isEmpty(this.get('opsToApply')))
    {
      return this.get('parser').applyOps(this.get('opsToApply'), editor);
    }
    else
    {
      return [];
    }
  }
});
