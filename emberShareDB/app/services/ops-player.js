import Service, {inject} from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';
import config from  '../config/environment';

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
      console.log("checking head", ptr, this.get('ops').length)
      return ptr >= this.get('ops').length - 1;
    }
  },
  reset(doc) {
    this.set('doc', doc);
    this.set('ops', null);
  },
  loadOps() {
    const doc = this.get('doc');
    console.log("loading ops", doc);
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "GET",
          url: config.serverHost + "/documents/ops/" + doc,
        }).then((res) => {
          this.set('ops', res.data);
          console.log("GOT OPS", res.data)
          this.set('ptr', this.get('ops').length);
          resolve(res.data);
        }).catch((err) => {
          reject(err);
        });
    });
  },
  shift(prev, editor, rewind = false) {
    this.set('reachedEnd', false);
    return new RSVP.Promise((resolve, reject) => {
      const fetch = () => {
        if(rewind)
        {
          this.set('prevDir', null);
          this.set('ptr', 0);
        }
        this.updateOps(prev);
        resolve(this.getTransform(editor));
      }
      if(isEmpty(this.get('ops')))
      {
        this.loadOps()
        .then(() => {fetch()})
        .catch((err) => {reject(err)});
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
            console.log(toApply);
            this.set('opsToApply', toApply);
          }
        }
      }
      else
      {
        hasHitBounds = true;
      }
    }
    console.log("newPtr", newPtr, "oldPtr", this.get('ptr'))
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
  getTransform(editor) {
    if(!isEmpty(this.get('opsToApply')))
    {
      return this.get('parser').opTransform(this.get('opsToApply'), editor);
    }
    else
    {
      return [];
    }
  }
});
