(function(){
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse=window.matchMedia('(pointer: coarse)').matches;
  var cvs=document.getElementById('dots'),ctx=cvs.getContext('2d');
  var deepEl=document.getElementById('deep'),hd=document.getElementById('hd');
  var W=0,H=0,DPR=1,N=0,lastD=-1,alphaCur=0.3;
  var VW=1000,VH=560,TAU=Math.PI*2;
  var A=[10,34,102],B=[1,6,22];
  var COL=['#ffffff','#9db4ff','#4cd0ff'];
  var tx,ty,tr,sx,sy,dl,sd,cl;
  var paused=reduce;
  var pauseBtn=document.getElementById('dots-pause');
  var fc=0,TEXTSEL='h1,h2,h3,h4,p,li,a,button,label,time,figure,figcaption,img,.btn,.tag,.card,.hud,.dot-card';

  /* Plankton: the pointer pushes dots away, and they drift back slowly. */
  var PART_R=150,PART_MAX=90,RATE_OUT=0.2,RATE_BACK=0.03;
  var ox,oy;
  var px=-9999,py=-9999,pvx=0,pvy=0;
  /* Sonar: a ring leaves the pointer every few seconds. Dots that are still drifting light up as it passes. Settled shark dots never react. */
  var pgx=[],pgy=[],pgr=[],lastPing=-9999,lastMv=-9999,lx=[],ly=[],lrr=[],lk=[],nl=0,PING_GAP=2600,PING_BAND=26;

  /* Highlighted dots: a few dots on the whale shark that hold still, glow, and open a card. */
  var CLAIMS=[
    {t:'AI governance',h:'Co-founder, Humanity in the Room',w:'Feb 2026 to now',d:'Formerly AI for Good NYC. Ran eight events for more than 2,000 members, and writes a weekly newsletter on AI philanthropy, evaluations, and governance.',s:'https://humanityintheroom.org/',sl:'Website'},
    {t:'AI governance',h:'AI governance advising, Jailhouse Lawyers Initiative',d:'Leads AI governance and literacy advising under a partnership MOU.'},
    {t:'AI governance',h:'Emerging Leaders Fellow, Globethics',w:'2026',d:'Fellowship in Ethical AI Governance. Wrote a comparative report on AI ethics frameworks and implementation failures in Global Majority civil society, plus a three-lens toolkit.',s:'https://globethics.net/fellows/angela-ng',sl:'Globethics'},
    {t:'AI governance',h:'Hackathon wins',w:'2026',d:'Winner, NYC Climate Week Climate Hackathon (Model Routing). Third place, Tech Week AI for Humans Hackathon.'},
    {t:'Global health',h:'First author, BMJ Open',w:'2022',d:'Phone-survey reliability across four districts in Madhya Pradesh (n=5,095 baseline, 375 phone). Funded by the Gates Foundation.',s:'https://doi.org/10.1136/bmjopen-2021-056076',sl:'Paper'},
    {t:'Global health',h:'MSPH, Johns Hopkins',w:'2019',d:'Global Disease Epidemiology and Control, Humanitarian Health concentration.'},
    {t:'Global health',h:'USAID WASH study, DRC',d:'Supervised data collection for a 500-household study and trained 20 field and lab assistants.'},
    {t:'Global health',h:'Fieldwork in seven countries',d:'Bangladesh, India, the DRC, South Africa, Zimbabwe, Rwanda, and Qatar.'},
    {t:'Leadership',h:'Director of Business Innovation, CMU',w:'Oct 2019 to Oct 2026',d:'Managed a $6M annual budget and a 14-person team across Pittsburgh, Qatar, and Rwanda. Founded an Innovation Studio with 30 resident trainees.'},
    {t:'Water',h:'Folia Water',w:'2015 to 2017',d:'Product engineer and microbiologist. Helped raise $1.5M as the organization became a social enterprise. Silver nanoparticle filters tested in villages across Bangladesh and South Africa.'},
    {t:'Mental health',h:'Creator, The Mindfulness Room',d:'Proposed, designed, and built a student wellness space from nothing at Carnegie Mellon. Now in colleges, hospitals, and high schools worldwide.'},
    {t:'Climate',h:'First EcoCampus Green Flag in MENA',d:'Built the program at CMU-Q, the first in the Middle East and North Africa. CMU Andy Award, 2024.'}
  ];
  var ANCH=['hitr','jli','globethics','hackathons','bmj','msph','drc','experience','cmu','folia','mindfulness','ecocampus'];
  CLAIMS.forEach(function(c,i){c.r='/resume#'+ANCH[i];});
  var M=CLAIMS.length;
  var spOf,spX=new Float32Array(M),spY=new Float32Array(M),spR=new Float32Array(M),spPh=new Float32Array(M),glowK=new Float32Array(M),cov=new Uint8Array(M);
  var specialsOn=false,hover=-1,cardK=-1,pinned=false,cardHover=false,hideT=0,card=null;

  function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;var t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
  function clamp(v,a,b){return v<a?a:v>b?b:v;}

  /* Spread `count` highlight dots across the body of the shark, away from the edge and the tail, then order them by x. */
  function pickSpecials(X,Y,R,n,count){
    var CELL=24,grid={},i,a,b;
    for(i=0;i<n;i++){var key=((X[i]/CELL)|0)+','+((Y[i]/CELL)|0);(grid[key]||(grid[key]=[])).push(i);}
    function dens(j){var cx=(X[j]/CELL)|0,cy=(Y[j]/CELL)|0,c=0;for(a=-1;a<=1;a++)for(b=-1;b<=1;b++){var g=grid[(cx+a)+','+(cy+b)];if(g)c+=g.length;}return c;}
    var cand=[],minX=330,minR=1.2,minD=14;
    while(true){
      cand=[];
      for(i=0;i<n;i++)if(X[i]>=minX&&R[i]>=minR&&dens(i)>=minD)cand.push(i);
      if(cand.length>=count*4||(minD<=2&&minR<=0.85))break;
      minD=Math.max(2,minD-3);minR=Math.max(0.85,minR-0.1);
    }
    var mx=0,my=0;cand.forEach(function(j){mx+=X[j];my+=Y[j];});mx/=cand.length;my/=cand.length;
    var best=cand[0],bd=1e18;
    cand.forEach(function(j){var d=(X[j]-mx)*(X[j]-mx)+(Y[j]-my)*(Y[j]-my);if(d<bd){bd=d;best=j;}});
    var picks=[best],minDist=new Float32Array(cand.length).fill(1e18);
    while(picks.length<count&&picks.length<cand.length){
      var last=picks[picks.length-1],far=-1,fd=-1;
      for(var c=0;c<cand.length;c++){
        var j2=cand[c],d2=(X[j2]-X[last])*(X[j2]-X[last])+(Y[j2]-Y[last])*(Y[j2]-Y[last]);
        if(d2<minDist[c])minDist[c]=d2;
        if(minDist[c]>fd){fd=minDist[c];far=j2;}
      }
      picks.push(far);
    }
    picks.sort(function(p,q){return X[q]-X[p];});
    return picks;
  }

  function init(dots){
    N=dots.length;
    tx=new Float32Array(N);ty=new Float32Array(N);tr=new Float32Array(N);
    sx=new Float32Array(N);sy=new Float32Array(N);dl=new Float32Array(N);sd=new Float32Array(N);
    ox=new Float32Array(N);oy=new Float32Array(N);
    cl=new Uint8Array(N);
    var r=rng(23);
    for(var i=0;i<N;i++){
      tx[i]=dots[i][0];ty[i]=dots[i][1];tr[i]=dots[i][2];
      sx[i]=r();sy[i]=r();sd[i]=r();dl[i]=r()*0.6;
      var c=r();cl[i]=c<0.06?2:c<0.2?1:0;
    }
    spOf=new Int16Array(N).fill(-1);
    var picks=pickSpecials(tx,ty,tr,N,M);
    picks.forEach(function(j,k){spOf[j]=k;spPh[k]=r()*TAU;});
    buildCard();buildList();
    resize();
    if(paused){frame(0);}else{requestAnimationFrame(frame);}
  }

  function resize(){
    W=window.innerWidth;H=window.innerHeight;DPR=Math.min(window.devicePixelRatio||1,2);
    cvs.width=Math.round(W*DPR);cvs.height=Math.round(H*DPR);
  }
  function layout(){
    var mobile=W<760;
    var bw=mobile?W*0.94:Math.min(W*0.56,860);
    var sc=Math.min(bw/VW,(H*(mobile?0.36:0.78))/VH);
    var cx=mobile?W/2:W*0.7,cy=mobile?H*0.72:H*0.55;
    return{sc:sc,ox:cx-VW*sc/2,oy:cy-VH*sc/2,mobile:mobile};
  }

  function frame(t){
    if(!N)return;
    var lay=layout(),sc=lay.sc,ox0=lay.ox,oy0=lay.oy;
    var max=Math.max(1,document.documentElement.scrollHeight-H);
    var y0=window.scrollY,p=clamp(y0/max,0,1);
    document.body.style.backgroundColor='rgb('+[0,1,2].map(function(k){return Math.round(A[k]+(B[k]-A[k])*p);}).join(',')+')';
    var d=Math.round(p*40);
    if(d!==lastD){hd.textContent=d;lastD=d;}

    var dTop=deepEl.getBoundingClientRect().top+y0;
    var P=clamp(y0/Math.max(1,dTop-H*0.3),0,1);
    var v=clamp((H*0.9-deepEl.getBoundingClientRect().top)/(H*0.6),0,1);
    var aT=lay.mobile?0.32+0.4*v:0.3+0.7*v;
    alphaCur+=(aT-alphaCur)*(paused?1:0.1);

    /* shown: the shark is formed and visible. Each highlighted dot then glows only while no text or photo sits on top of it. */
    var shown=(P>=1&&alphaCur>0.55);
    specialsOn=shown;
    if(!shown&&cardK>=0){hideCard();}
    fc++;
    if(shown&&(paused||(fc&1)===0)){
      for(var c0=0;c0<M;c0++){
        var elAt=(c0===cardK||c0===hover)?null:document.elementFromPoint(spX[c0],spY[c0]);
        cov[c0]=(elAt&&elAt.closest&&elAt.closest(TEXTSEL))?1:0;
      }
    }
    for(var g0=0;g0<M;g0++){glowK[g0]+=(((shown&&!cov[g0])?1:0)-glowK[g0])*(paused?1:0.1);}
    if(cardK>=0&&glowK[cardK]<0.2&&hover!==cardK){hideCard();}
    pvx*=0.88;pvy*=0.88;
    var move=!paused,R2=PART_R*PART_R;
    var maxR=Math.min(560,Math.max(W,H)*0.5);
    if(move&&px>-9000&&t-lastMv<4000&&t-lastPing>PING_GAP){pgx.push(px);pgy.push(py);pgr.push(0);lastPing=t;}
    for(var pj=pgr.length-1;pj>=0;pj--){pgr[pj]+=5;if(!move||pgr[pj]>maxR){pgx.splice(pj,1);pgy.splice(pj,1);pgr.splice(pj,1);}}
    var npg=pgr.length;nl=0;

    ctx.setTransform(DPR,0,0,DPR,0,0);
    ctx.clearRect(0,0,W,H);
    var paths=[];for(var q=0;q<12;q++)paths.push(new Path2D());
    for(var i=0;i<N;i++){
      var local=clamp((P-dl[i])/0.4,0,1);
      var e=local<0.5?4*local*local*local:1-Math.pow(-2*local+2,3)/2;
      var wob=1-e,seed=sd[i];
      var spx=sx[i]*W,spy=sy[i]*H;
      if(!paused){spx+=Math.sin(t*0.00035+seed*20)*24*wob;spy+=Math.cos(t*0.0003+seed*17)*24*wob;}
      var ttx=tx[i],tty=ty[i];
      if(!paused&&e>0){var dd=1-ttx/VW;tty+=(Math.sin(t*0.0014-ttx*0.006)*20*dd*dd+Math.sin(t*0.0007)*5)*e;}
      var x=spx*(1-e)+(ox0+ttx*sc)*e,y=spy*(1-e)+(oy0+tty*sc)*e;
      var r=Math.max(1.1,1.4*(1-e)+tr[i]*sc*1.5*e);
      var k=spOf[i];
      if(k>=0&&shown){spX[k]=x;spY[k]=y;spR[k]=r;continue;}
      if(move){
        var ddx=x-px,ddy=y-py,tgx=0,tgy=0;
        if(e<0.999&&ddx<PART_R&&ddx>-PART_R&&ddy<PART_R&&ddy>-PART_R){
          var d2=ddx*ddx+ddy*ddy;
          if(d2<R2){
            var dist=Math.sqrt(d2),m=1-dist/PART_R,amp=PART_MAX*m*Math.sqrt(m)*(0.6+0.8*seed),ux,uy;
            if(dist>1){ux=ddx/dist;uy=ddy/dist;}else{var ang=seed*TAU;ux=Math.cos(ang);uy=Math.sin(ang);}
            tgx=(ux*amp+pvx*m*5)*(1-e);tgy=(uy*amp+pvy*m*5)*(1-e);
          }
        }
        var cx_=ox[i],cy_=oy[i];
        var rate=(tgx*tgx+tgy*tgy>cx_*cx_+cy_*cy_)?RATE_OUT:RATE_BACK;
        cx_+=(tgx-cx_)*rate;cy_+=(tgy-cy_)*rate;
        ox[i]=cx_;oy[i]=cy_;x+=cx_;y+=cy_;
      }
      if(npg&&e<0.999){
        var bestK=0;
        for(var pj2=0;pj2<npg;pj2++){
          var qx=x-pgx[pj2],qy=y-pgy[pj2],dr=Math.abs(Math.sqrt(qx*qx+qy*qy)-pgr[pj2]);
          if(dr<PING_BAND){var kq=(1-dr/PING_BAND)*(1-pgr[pj2]/maxR*0.6);if(kq>bestK)bestK=kq;}
        }
        if(bestK>0){bestK*=(1-e);if(bestK>0.02){lx[nl]=x;ly[nl]=y;lrr[nl]=r;lk[nl]=bestK;nl++;}}
      }
      var an=0.3+0.7*e,b=Math.min(3,Math.floor(an*4));
      var pth=paths[cl[i]*4+b];
      pth.moveTo(x+r,y);pth.arc(x,y,r,0,TAU);
    }
    for(var cc=0;cc<3;cc++){
      ctx.fillStyle=COL[cc];
      for(var bb=0;bb<4;bb++){ctx.globalAlpha=((bb+1)/4)*alphaCur;ctx.fill(paths[cc*4+bb]);}
    }
    ctx.globalAlpha=1;

    if(npg){
      ctx.lineWidth=1.2;
      for(var pr=0;pr<npg;pr++){
        ctx.globalAlpha=0.32*(1-pgr[pr]/maxR)*Math.min(1,alphaCur+0.2);
        ctx.strokeStyle='#bfeaf5';
        ctx.beginPath();ctx.arc(pgx[pr],pgy[pr],pgr[pr],0,TAU);ctx.stroke();
      }
      ctx.fillStyle='#e6fbff';
      for(var li=0;li<nl;li++){
        ctx.globalAlpha=Math.min(1,lk[li]*0.95)*Math.max(alphaCur,0.45);
        ctx.beginPath();ctx.arc(lx[li],ly[li],lrr[li]*(1+1.1*lk[li]),0,TAU);ctx.fill();
      }
      ctx.globalAlpha=1;
    }

    if(shown){
      var base=Math.min(1,alphaCur);
      for(var s=0;s<M;s++){
        var g=glowK[s];
        var hot=(s===hover||s===cardK);
        var tw=paused?0.5:0.5+0.5*Math.sin(t*0.0022+spPh[s]);
        var big=Math.max(3.4,spR[s]*2.1)*(hot?1.25:1);
        var core=spR[s]*(1-g)+big*g;
        ctx.save();
        ctx.globalAlpha=base*(0.75+0.25*g);
        ctx.shadowColor='#4cd0ff';ctx.shadowBlur=(hot?22:12+tw*8)*g;
        ctx.fillStyle='#ffffff';
        ctx.beginPath();ctx.arc(spX[s],spY[s],core,0,TAU);ctx.fill();
        ctx.shadowBlur=0;
        ctx.strokeStyle='#4cd0ff';ctx.lineWidth=1.5;
        ctx.globalAlpha=base*(hot?1:0.4+0.5*tw)*g;
        ctx.beginPath();ctx.arc(spX[s],spY[s],core+(hot?8:5+tw*4),0,TAU);ctx.stroke();
        ctx.restore();
      }
    }
    if(!paused)requestAnimationFrame(frame);
  }

  /* Hit testing and the detail card */
  function hit(cx,cy,rad){
    if(!specialsOn)return -1;
    var best=-1,bd=rad*rad;
    for(var s=0;s<M;s++){if(glowK[s]<0.5)continue;var dx=spX[s]-cx,dy=spY[s]-cy,dd=dx*dx+dy*dy;if(dd<bd){bd=dd;best=s;}}
    return best;
  }

  function buildCard(){
    card=document.createElement('div');
    card.className='dot-card';card.hidden=true;
    card.setAttribute('role','dialog');card.setAttribute('aria-label','Highlight from the resume');
    card.innerHTML='<button type="button" class="dot-x" aria-label="Close">&times;</button><p class="dot-k"></p><h3></h3><p class="dot-d"></p><p class="dot-w"></p><a class="dot-s"></a>';
    document.body.appendChild(card);
    card.querySelector('.dot-x').addEventListener('click',function(){hideCard();});
    card.addEventListener('pointerenter',function(){cardHover=true;clearTimeout(hideT);});
    card.addEventListener('pointerleave',function(){cardHover=false;if(!pinned)scheduleHide();});
  }
  function buildList(){
    var ul=document.createElement('ul');
    ul.className='sr';ul.setAttribute('aria-label','Highlights from the resume, shown as glowing dots on the whale shark');
    CLAIMS.forEach(function(c){
      var li=document.createElement('li');
      li.textContent=c.t+'. '+c.h+(c.w?' ('+c.w+')':'')+'. '+c.d;
      ul.appendChild(li);
    });
    deepEl.appendChild(ul);
  }
  function showCard(k,pin){
    if(pinned&&!pin&&k!==cardK)return;
    var c=CLAIMS[k];
    cardK=k;if(pin)pinned=true;
    card.querySelector('.dot-k').textContent=c.t;
    card.querySelector('h3').textContent=c.h;
    card.querySelector('.dot-d').textContent=c.d;
    var wEl=card.querySelector('.dot-w');wEl.textContent=c.w||'';wEl.hidden=!c.w;
    var a=card.querySelector('.dot-s');
    if(c.s){a.href=c.s;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Source: '+c.sl+' ↗';}
    else{a.href=c.r||'/resume';a.removeAttribute('target');a.removeAttribute('rel');a.textContent='See the resume';}
    card.classList.toggle('pinned',pinned);
    card.hidden=false;card.classList.remove('on');
    card.style.left='0px';card.style.top='0px';
    var w=card.offsetWidth,h=card.offsetHeight,dx=spX[k],dy=spY[k],left,top;
    if(W<760){left=clamp(dx-w/2,16,W-w-16);top=dy-h-22;if(top<16)top=dy+22;top=clamp(top,16,H-h-16);}
    else{left=dx>W*0.45?dx-w-26:dx+26;left=clamp(left,16,W-w-16);top=clamp(dy-h/2,16,H-h-16);}
    card.style.left=Math.round(left)+'px';card.style.top=Math.round(top)+'px';
    requestAnimationFrame(function(){card.classList.add('on');});
    if(paused&&N)frame(0);
  }
  function hideCard(){
    clearTimeout(hideT);
    if(card){card.hidden=true;card.classList.remove('on','pinned');}
    cardK=-1;pinned=false;cardHover=false;
    if(paused&&N)frame(0);
  }
  function scheduleHide(){
    clearTimeout(hideT);
    hideT=setTimeout(function(){if(!pinned&&!cardHover&&hover<0)hideCard();},350);
  }
  function setHover(h){
    if(h===hover)return;
    hover=h;
    document.body.classList.toggle('dot-hover',h>=0);
    if(h>=0){clearTimeout(hideT);if(!pinned)showCard(h,false);}
    else if(!pinned)scheduleHide();
    if(paused&&N)frame(0);
  }

  window.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch')return;
    if(px>-9000){pvx=clamp(pvx+(e.clientX-px-pvx)*0.35,-30,30);pvy=clamp(pvy+(e.clientY-py-pvy)*0.35,-30,30);}
    px=e.clientX;py=e.clientY;lastMv=performance.now();
    setHover(hit(px,py,20));
  },{passive:true});
  document.documentElement.addEventListener('mouseleave',function(){px=py=-9999;pvx=pvy=0;setHover(-1);});
  document.addEventListener('click',function(e){
    if(card&&card.contains(e.target))return;
    var interactive=e.target.closest&&e.target.closest('a,button,input,textarea,select,summary,label');
    var h=interactive?-1:hit(e.clientX,e.clientY,coarse?30:22);
    if(h>=0){showCard(h,true);}
    else if(pinned){hideCard();}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&cardK>=0)hideCard();});

  if(pauseBtn){
    pauseBtn.addEventListener('click',function(){
      paused=!paused;
      pauseBtn.setAttribute('aria-label',paused?'Play animation':'Pause animation');
      pauseBtn.textContent=paused?'▶':'⏸';
      if(paused&&ox){ox.fill(0);oy.fill(0);}
      if(!paused)requestAnimationFrame(frame);
      else if(N)frame(0);
    });
  }

  window.addEventListener('resize',function(){resize();if(cardK>=0)hideCard();if(paused)frame(0);});
  if(paused)window.addEventListener('scroll',function(){frame(0);},{passive:true});

  document.addEventListener('visibilitychange',function(){
    if(!paused&&!document.hidden)requestAnimationFrame(frame);
  });

  fetch('/shark-dots.json').then(function(r){return r.json();}).then(function(data){init(data.dots);});
})();
