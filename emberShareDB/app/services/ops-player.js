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
  opsToApply:null,
  fromPlayer:[],
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
  getToSend() {
    let toSend = [];
    if(this.get("fromPlayer").length > 0) {
      toSend = JSON.parse(JSON.stringify(this.get('fromPlayer')))
      this.set("fromPlayer",[]);
    }
    return toSend
  },
  executeUntil(time) {
    let latestTime = 0;
    //Whilst not off the end and behind time
    while(this.inBounds(this.get("ptr")) && latestTime < time)
    {
      let currentOp = this.get("ops")[this.get("ptr")]
      let doSend = false;
      currentOp.op.forEach((op)=> {
        if(op.date)
        {
          latestTime = op.date
          if(op.date < time)
          {
            doSend = true;
          }
        }
        else
        {
          doSend = true;
        }
      })
      if(doSend) {
        this.get("fromPlayer").push(currentOp.op)
        this.incrementProperty("ptr")
      }
    }
  },
  startTimer(editor) {
    this.shift(true, editor, true).then(()=>{
      const lag = 10000
      let now = new Date().getTime() - lag;
      const interval = 100;
      this.cleanUp()
      this.set("schedulerInteval",setInterval(()=>{
        now += (interval)
        this.executeUntil(now)
      },interval))
      this.set("updateOpsInterval",setInterval(()=>{
        this.loadOps()
      },lag))
      this.executeUntil(now)
    })
  },
  filterOps(allOps) {
    let sourceOps = []
    allOps.forEach((ops) => {
      if(ops.op !== undefined)
      {
        if(ops.op.length > 0)
        {
          if(ops.op[0].p[0] === "newEval" || ops.op[0].p[0] === "source")
          {
            sourceOps.push(ops)
          }
        }
      }
    });
    return sourceOps
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
          this.set('ops', this.filterOps(res.data));
          this.get('cs').log("GOT OPS",this.get('ops'))
          resolve(this.get('ops'));
        }).catch((err) => {
          this.get("cs").log("op GET rejected", err)
          reject(err);
        });
    });
  },
  cleanUp() {
    this.get("cs").log("cleaned up op player")
    if(!isEmpty(this.get("schedulerInteval"))) {
      clearInterval(this.get("schedulerInteval"))
      this.set("schedulerInteval", null)
    }
    if(!isEmpty(this.get("updateOpsInterval"))) {
      clearInterval(this.get("updateOpsInterval"))
      this.set("updateOpsInterval", null)
    }
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
        this.updateOps(prev);
        this.applyTransform(editor)
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
