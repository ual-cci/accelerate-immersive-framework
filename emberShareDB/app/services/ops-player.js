import Service, {inject} from '@ember/service';
import { isEmpty } from '@ember/utils';
import RSVP from 'rsvp';
import config from  '../config/environment';

export default Service.extend({
  parser:inject('code-parsing'),
  sessionAccount:inject('session-account'),
  ops:null,
  opsToApply:null,
  ptr:0,
  prevDir:null,
  reset: function() {
    this.set('ptr', 0);
    this.set('ops', null);
  },
  loadOps:function() {
    const doc = this.get('sessionAccount').currentDoc;
    return new RSVP.Promise((resolve, reject) => {
      $.ajax({
          type: "GET",
          url: config.serverHost + "/documents/ops/" + doc,
        }).then((res) => {
          this.set('ops', res.data);
          this.set('ptr', this.get('ops').length - 1);
          resolve(res.data);
        }).catch((err) => {
          reject(err);
        });
    });
  },
  shift:function(prev, editor, rewind = false) {
    this.set('reachedEnd', false);
    return new RSVP.Promise((resolve, reject) => {
      const fetch = () => {
        if(rewind)
        {
          this.set('ptr', 1);
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
  inBounds:function(ptr) {
    const ops = this.get('ops');
    const inBounds = ptr >= 1 && ptr < ops.length;
    return inBounds;
  },
  updateOps(prev)
  {
    this.set('opsToApply', null);
    let newPtr = this.get('ptr');
    console.log('newPtr', newPtr);
    if(!isEmpty(this.get('prevDir')))
    {
      if(prev != this.get('prevDir'))
      {
        newPtr = prev ? newPtr + 1 : newPtr - 1;
      }
    }
    this.set('prevDir', prev);
    while(this.inBounds(newPtr) && isEmpty(this.get('opsToApply')))
    {
      newPtr = prev ? newPtr - 1 : newPtr + 1;
      if(this.inBounds(newPtr))
      {
        const ops = this.get('ops')[newPtr];
        for(let j = 0; j < ops.op.length; j++)
        {
          let op = ops.op[j];
          let toApply = [];
          if(op.p[0] == "source")
          {
            //INVERT
            if(prev)
            {
              if(op.si)
              {
                op = {p:op.p, sd:op.si};
              }
              else if(op.sd)
              {
                op = {p:op.p, si:op.sd};
              }
            }
            toApply.push(op);
          }
          if(toApply.length > 0)
          {
            this.set('opsToApply', toApply);
          }
        }
      }
    }
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
  prevOp:function(editor, rewind = false) {
    return this.shift(true, editor, rewind);
  },
  nextOp:function(editor, rewind = false) {
    return this.shift(false, editor, rewind);
  },
  getTransform:function(editor) {
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
