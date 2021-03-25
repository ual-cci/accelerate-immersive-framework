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
  prevDir: null,
  doc:null,
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
  executeUntil(time, justSource=false) {
    return new RSVP.Promise((resolve, reject) => {
      let toSend = [];
      if(!isEmpty(this.get("ops")))
      {
        this.get("ops").forEach((currentOp)=>
        {
          let send = false;
          currentOp.op.forEach((op)=> {
            if(op.date)
            {
              if(op.date < time)
              {
                send = true;
              }
            }
            else
            {
              //Dont send if no date, unless first op
              send = currentOp.v < 2;
            }
            if(justSource && op.p[0] !== "source")
            {
              send = false;
            }
          })
          if(send) {
            this.get("cs").log("sending",currentOp.v,currentOp.op[0].p[0],justSource,currentOp.op[0])
            toSend.push(currentOp)
          } else {
            //this.get("cs").log("skipping",currentOp.v)
          }
        })
      }
      toSend.forEach((currentOp)=>{
        this.set("latestVersion", currentOp.v + 1)
        this.get("fromPlayer").push(currentOp)
        const index = this.get('ops').indexOf(currentOp);
        if (index > -1) {
          this.get('ops').splice(index, 1);
        }
      });
      resolve();
    });
  },
  startTimer(editor) {
    this.set("latestVersion", 0);
    this.set("ptr", 0);
    this.loadOps(0).then(()=>{
      const lag = 10000;
      const interval = 100;
      let now = new Date().getTime() - lag;
      this.cleanUp()
      let justSource = true;
      this.executeUntil(now, true).then(()=> {
        this.set("schedulerInteval",setInterval(()=>{
          now = new Date().getTime() - lag;
          this.executeUntil(now, justSource)
        },interval))
        this.set("updateOpsInterval",setInterval(()=>{
          this.loadOps(this.get("latestVersion")).then(()=>{
            justSource = false;
          });
        },lag))
      });
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
  loadOps(from=0) {
    const doc = this.get('doc');
    this.get('cs').log("loading ops", doc, from);
    return new RSVP.Promise((resolve, reject) => {
      let url = config.serverHost + "/documents/ops/" + doc
      url = url + "?version="+from;
      $.ajax({
          type: "GET",
          url:url,
          headers: {'Authorization': 'Bearer ' + this.get('sessionAccount.bearerToken')}
        }).then((res) => {
          if(res) {
            this.set('ops', this.filterOps(res.data));
          }
          else {
            this.set('ops', [])
          }
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
    this.set("latestVersion", 0);
    if(!isEmpty(this.get("schedulerInteval"))) {
      clearInterval(this.get("schedulerInteval"))
      this.set("schedulerInteval", null)
    }
    if(!isEmpty(this.get("updateOpsInterval"))) {
      clearInterval(this.get("updateOpsInterval"))
      this.set("updateOpsInterval", null)
    }
  },
  applyTransform(editor) {
    //this.get('cs').log("applying", this.get('opsToApply'))
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
