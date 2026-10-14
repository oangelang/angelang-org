(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cvs=document.getElementById('shark-canvas');
  if(!cvs)return;
  var ctx=cvs.getContext('2d');
  var VW=1000,VH=560,N=0;
  var COL=['#ffffff','#9db4ff','#4cd0ff'];
  var tx,ty,tr,sx,sy,sd,cl;

  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

  function init(dots){
    N=dots.length;
    tx=new Float32Array(N);ty=new Float32Array(N);tr=new Float32Array(N);
    sx=new Float32Array(N);sy=new Float32Array(N);sd=new Float32Array(N);
    cl=new Uint8Array(N);
    var r=rng(23);
    for(var i=0;i<N;i++){
      tx[i]=dots[i][0];ty[i]=dots[i][1];tr[i]=dots[i][2];
      sx[i]=r();sy[i]=r();sd[i]=r();
      var c=r();cl[i]=c<0.06?2:c<0.2?1:0;
    }
    resize();
    var start=performance.now();
    function settle(t){
      var elapsed=(t-start)/1000;
      var progress=Math.min(elapsed/2,1);
      var e=progress<0.5?4*progress*progress*progress:1-Math.pow(-2*progress+2,3)/2;
      draw(e);
      if(progress<1&&!reduce)requestAnimationFrame(settle);
    }
    if(reduce){draw(1);}else{requestAnimationFrame(settle);}
  }

  function resize(){
    var rect=cvs.parentElement.getBoundingClientRect();
    var W=rect.width,H=rect.height;
    var DPR=Math.min(window.devicePixelRatio||1,2);
    cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR);
    cvs.style.width=W+'px';cvs.style.height=H+'px';
    cvs._W=W;cvs._H=H;cvs._DPR=DPR;
  }

  function draw(e){
    var W=cvs._W||560,H=cvs._H||256,DPR=cvs._DPR||1;
    var sc=Math.min(W/VW,H/VH)*0.9;
    var ox=(W-VW*sc)/2,oy=(H-VH*sc)/2;
    var TAU=Math.PI*2;
    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    var paths=[];for(var q=0;q<12;q++)paths.push(new Path2D());
    for(var i=0;i<N;i++){
      var spx=sx[i]*W,spy=sy[i]*H;
      var x=spx*(1-e)+(ox+tx[i]*sc)*e;
      var y=spy*(1-e)+(oy+ty[i]*sc)*e;
      var r=Math.max(0.8,0.8*(1-e)+tr[i]*sc*1.4*e);
      var an=0.2+0.8*e,b=Math.min(3,Math.floor(an*4));
      paths[cl[i]*4+b].moveTo(x+r,y);
      paths[cl[i]*4+b].arc(x,y,r,0,TAU);
    }
    for(var cc=0;cc<3;cc++){
      ctx.fillStyle=COL[cc];
      for(var bb=0;bb<4;bb++){ctx.globalAlpha=(bb+1)/4;ctx.fill(paths[cc*4+bb]);}
    }
    ctx.globalAlpha=1;
  }

  window.addEventListener('resize',function(){if(N){resize();draw(1);}});
  fetch('/shark-dots.json').then(function(r){return r.json();}).then(function(data){init(data.dots);});
})();
