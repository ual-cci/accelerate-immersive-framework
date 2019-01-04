import Component from '@ember/component';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';

export default Component.extend({
  filter: null,
  killAnimation() {
    if(!isEmpty(this.get('animationInterval')))
    {
      clearInterval(this.get('animationInterval'))
    }
  },
  updateAnimationState() {
    this.killAnimation();
    if(this.get('filter').isSelected && !this.get('filter').id.includes('tag'))
    {
      this.set('animationInterval', setInterval(()=> {
        var sh = this.get('shapes')
        var newSh = Array(sh.length)
        for(var i = 0; i < sh.length; i++)
        {
          var s = sh[i];
          var newS = {x:s.x, y:s.y, r:s.r, dy:s.dy, dx:s.dx, isCircle:s.isCircle,isRect:s.isRect};
          var x = s.x
          x = x + s.dx;
          var y = s.y
          y = y + s.dy;
          if(x >= 100-s.r && newS.dx > 0)
          {
            newS.dx = -newS.dx;
          }
          if(x <= 0 && newS.dx < 0)
          {
            newS.dx = -newS.dx;
          }
          if(y >= 60 && newS.dy > 0)
          {
            newS.dy = -newS.dy;
          }
          if(y <= 0 && newS.dy < 0)
          {
            newS.dy = -newS.dy;
          }
          newS.x = x
          newS.y = y
          newS.yr = y - s.r
          newS.xr = x + s.r
          newS.x2r = x + s.r / 2
          newSh[i] = newS;
        }
        this.set('shapes',newSh)
      }, 70));
    }
  },
  initShapes() {
    if(isEmpty(this.get('shapes')) && !this.get('filter').id.includes('tag'))
    {
      var sh = [];
      var r;
      var xStart = 0;
      var indent = false;
      var isCircle = false;
      var isRect = false;
      var xShift;
      var yShift;
      var xIndent;

      //CIRCLE
      if(this.get('filter').id == "sortByRecent" || this.get('filter').id == "sortByEditted")
      {
        r = 8;
        xStart = 20;
        indent = true;
        xShift = 40;
        yShift = 12;
        xIndent = 20;
        isCircle = true;
      }
      //RECT
      else if (this.get('filter').id == "sortByPopular" || this.get('filter').id == "sortByUpdated")
      {
        r = 15;
        xShift = 2 * r;
        yShift = r;
        xIndent = r;
        isRect = true;
      }
      //TRIANGLE
      else
      {
        r = 20;
        xShift = 2 * r;
        yShift = r;
        xIndent = r;
      }

      const w = 100 + 2 * r;
      const h = 60;
      var y = 0;
      var x = xStart;

      while(y <= h)
      {
        while(x <= w)
        {
          sh.push({
            isCircle:isCircle,
            isRect:isRect,
            r:r,
            x:x,
            y:y,
            dx: Math.random() < 0.5 ? Math.random() : -1 * Math.random(),
            dy: Math.random() < 0.5 ? Math.random() : -1 * Math.random()
          })
          x += xShift
        }
        x = indent ? 0 : xIndent;
        indent = !indent;
        y += yShift
      }
      sh.forEach((i)=>{
        i.yr = i.y - i.r
        i.xr = i.x + i.r
        i.x2r = i.x + i.r / 2
      })
      this.set('shapes', sh);
      this.updateAnimationState();
    }
  },
  willDestroyElement(){
    this._super(...arguments);
    this.killAnimation();
  },
  didUpdateAttrs() {
    this._super(...arguments);
    this.initShapes();
    this.updateAnimationState();
  },
  didReceiveAttrs() {
    this._super(...arguments);
    this.initShapes();
  },
  actions: {
    onFilter() {
      console.log("FILTER", this.get('filter').id)
      this.get('onFilter')(this.get('filter'));
    },
  }
});
