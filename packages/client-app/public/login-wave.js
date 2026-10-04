// Decorative wave background for login.html. Was inline — the second of the two
// blocks that forced script-src 'unsafe-inline'. Deferred: purely cosmetic.
(function () {
  'use strict';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 600) return;
  var cvs = document.getElementById('wave-bg');
  if (!cvs || !cvs.getContext) return;
  var ctx = cvs.getContext('2d');

  var SR = 244, SG = 63, SB = 94;
  var sig = function(a) { return 'rgba('+SR+','+SG+','+SB+','+a+')'; };

  var COUNT = 70, SPEED = 0.28, MAX_DIST = 175;
  var DOT_MIN_R = 1.2, DOT_MAX_R = 2.8;
  var LINE_ALPHA = 0.08, DOT_ALPHA = 0.45, GLOW_R = 6;
  var MOUSE_RADIUS = 200, MOUSE_BOOST = 0.25;
  var MAX_SQ = MAX_DIST * MAX_DIST, MOUSE_SQ = MOUSE_RADIUS * MOUSE_RADIUS;

  var W = 0, H = 0, mouse = { x: -9999, y: -9999 }, particles = [];

  function mkPt(initial) {
    var vx, vy;
    do { vx = (Math.random() - 0.5) * SPEED * 2; } while (Math.abs(vx) < 0.04);
    do { vy = (Math.random() - 0.5) * SPEED * 2; } while (Math.abs(vy) < 0.04);
    return { x: initial ? Math.random()*W : (Math.random()<0.5?-10:W+10),
             y: initial ? Math.random()*H : Math.random()*H,
             vx: vx, vy: vy, r: DOT_MIN_R+Math.random()*(DOT_MAX_R-DOT_MIN_R),
             phase: Math.random()*Math.PI*2, freq: 0.018+Math.random()*0.018 };
  }

  function init() {
    W = cvs.width = window.innerWidth; H = cvs.height = window.innerHeight;
    particles = []; for (var i = 0; i < COUNT; i++) particles.push(mkPt(true));
  }

  function dSq(ax, ay, bx, by) { return (ax-bx)*(ax-bx)+(ay-by)*(ay-by); }

  function draw() {
    requestAnimationFrame(draw);
    if (document.hidden) return;
    ctx.clearRect(0, 0, W, H);
    for (var k = 0; k < particles.length; k++) {
      var p = particles[k]; p.x+=p.vx; p.y+=p.vy; p.phase+=p.freq;
      if (p.x<-20) p.x=W+20; if (p.x>W+20) p.x=-20;
      if (p.y<-20) p.y=H+20; if (p.y>H+20) p.y=-20;
    }
    ctx.lineWidth = 0.75;
    for (var i = 0; i < particles.length; i++) {
      var a = particles[i];
      for (var j = i+1; j < particles.length; j++) {
        var b = particles[j], sq = dSq(a.x,a.y,b.x,b.y);
        if (sq > MAX_SQ) continue;
        var alpha = (1-sq/MAX_SQ)*LINE_ALPHA;
        var nm = Math.min(dSq(a.x,a.y,mouse.x,mouse.y), dSq(b.x,b.y,mouse.x,mouse.y));
        if (nm < MOUSE_SQ) alpha += (1-nm/MOUSE_SQ)*MOUSE_BOOST;
        ctx.beginPath(); ctx.strokeStyle = sig(Math.min(alpha,0.45));
        ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
      }
      var mSq = dSq(a.x,a.y,mouse.x,mouse.y);
      if (mSq < MOUSE_SQ) {
        ctx.beginPath(); ctx.strokeStyle = sig((1-mSq/MOUSE_SQ)*0.28);
        ctx.lineWidth=0.9; ctx.moveTo(a.x,a.y); ctx.lineTo(mouse.x,mouse.y); ctx.stroke(); ctx.lineWidth=0.75;
      }
    }
    ctx.shadowColor = sig(0.6); ctx.shadowBlur = GLOW_R;
    for (var n = 0; n < particles.length; n++) {
      var pt = particles[n], r = pt.r*(0.88+Math.sin(pt.phase)*0.12);
      ctx.beginPath(); ctx.arc(pt.x,pt.y,r,0,Math.PI*2); ctx.fillStyle=sig(DOT_ALPHA); ctx.fill();
    }
    ctx.shadowBlur = 0;
    if (mouse.x > 0 && mouse.y > 0) {
      ctx.shadowColor=sig(0.9); ctx.shadowBlur=12;
      ctx.beginPath(); ctx.arc(mouse.x,mouse.y,2.5,0,Math.PI*2); ctx.fillStyle=sig(0.75); ctx.fill();
      ctx.shadowBlur=0;
    }
  }

  var rt;
  window.addEventListener('resize', function() { clearTimeout(rt); rt=setTimeout(init,120); }, { passive:true });
  window.addEventListener('mousemove',  function(e) { mouse.x=e.clientX; mouse.y=e.clientY; });
  window.addEventListener('mouseleave', function()  { mouse.x=-9999; mouse.y=-9999; });
  init(); draw();
})();

