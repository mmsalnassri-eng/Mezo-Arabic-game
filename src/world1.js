/* Al Hamra — realistic open-world village renderer (PBR materials, procedural textures, soft shadows). */
window.World = (() => {
  'use strict';
  const locations = {
    lane: {x:5,z:6,name:'الحارة القديمة',pron:'AL-HAA-RA AL-QA-DEE-MA',en:'The old quarter'},
    majlis: {x:-7,z:-9,name:'سبلة الحارة',pron:'SAB-LAT AL-HAA-RA',en:'Village meeting room'},
    mosque: {x:18,z:-18,name:'المسجد',pron:'AL-MAS-JID',en:'The mosque'}
  };
  // Words that can be discovered by walking around the village.
  const worldWords = [
    {id:'palm',ar:'نَخْلَة',pron:'NAKH-LA',en:'palm tree',x:12,y:2.2,z:11},
    {id:'falaj',ar:'فَلَج',pron:'FA-LAJ',en:'water channel',x:-18.4,y:1.1,z:-2},
    {id:'water',ar:'مَاء',pron:'MAA’',en:'water',x:-18.4,y:1.1,z:9},
    {id:'bridge',ar:'جِسْر',pron:'JISR',en:'bridge',x:-18.2,y:1.3,z:-8},
    {id:'mountain',ar:'جَبَل',pron:'JA-BAL',en:'mountain',x:2,y:2.4,z:-27.5},
    {id:'garden',ar:'بُسْتَان',pron:'BUS-TAAN',en:'garden, orchard',x:-27,y:1.6,z:8},
    {id:'jar',ar:'جَرَّة',pron:'JAR-RA',en:'clay jar',x:8.3,y:1.3,z:5.3},
    {id:'wall',ar:'جِدَار',pron:'JI-DAAR',en:'wall',x:-1.4,y:2.2,z:15.5},
    {id:'tree',ar:'شَجَرَة',pron:'SHA-JA-RA',en:'tree',x:24,y:2.2,z:6},
    {id:'road',ar:'طَرِيق',pron:'TA-REEQ',en:'road, path',x:2,y:1.2,z:-3},
    {id:'sun',ar:'شَمْس',pron:'SHAMS',en:'sun',x:22,y:2.4,z:18},
    {id:'well',ar:'بِئْر',pron:'BI’R',en:'well',x:-12.5,y:1.7,z:-3.2}
  ];
  const player={x:2,z:8,yaw:Math.PI}, salem={x:.5,z:6,yaw:.5};
  const keys=new Set(), stick={x:0,y:0};
  const bounds=[], camBounds=[], labels=[], chips=[], houses=[], palmsList=[];
  const lanes=[[2,0,7.1,64],[3,-8,76,4.4],[17,-12,4.8,26],[-7,1,3,25]];
  const SUN=[-.52,.62,.59];
  let T,scene,camera,renderer,sun,host,overlay,canvas,paused=true,noGL=false;
  let yaw=0,pitch=.2,zoom=5.4,last=0,t=0,talkTime=0,talk=false,nearest,envTime=0,ready=false,step=0,dirty=true;
  let doorQuest=null,feedbackTimer=0,W=1,H=1,ratio=1,slow=0,lowTier=false,TS=512;
  let cam={x:3,y:4,z:14},aim={x:2,y:1.15,z:6},camSmooth=null;
  const uTime={value:0}, props={}, actors=[], mats={};
  let waterTex,dust,birds,mini,miniCtx,miniTime=0,vec,pendingOutcome=[];
  let seed=72491;
  const rand=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
  const rr=(a,b)=>a+rand()*(b-a);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const sstep=(a,b,x)=>{x=clamp((x-a)/(b-a),0,1);return x*x*(3-2*x)};
  const mix=(a,b,k)=>a+(b-a)*k;

  /* ---------- noise ---------- */
  function hash(i,j){let n=(Math.imul(i,374761393)+Math.imul(j,668265263))|0;n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967296}
  const wrap=(a,p)=>p?((a%p)+p)%p:a;
  function vnoise(x,y,px=0,py=px){
    const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
    const a=hash(wrap(xi,px),wrap(yi,py)),b=hash(wrap(xi+1,px),wrap(yi,py)),c=hash(wrap(xi,px),wrap(yi+1,py)),d=hash(wrap(xi+1,px),wrap(yi+1,py));
    return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;
  }
  function fbm(x,y,oct=4,px=0,py=px){let s=0,a=.5,n=0;for(let i=0;i<oct;i++){s+=a*vnoise(x,y,px,py);n+=a;a*=.5;x*=2;y*=2;px*=2;py*=2}return s/n}
  // Tileable cellular noise: returns [nearest distance, edge distance, cell id]
  function worley(u,v,n){
    const x=u*n,y=v*n,xi=Math.floor(x),yi=Math.floor(y);let d1=9,d2=9,id=0;
    for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){
      const cx=xi+i,cy=yi+j,wx=wrap(cx,n),wy=wrap(cy,n);
      const px=cx+.15+.7*hash(wx,wy+91),py=cy+.15+.7*hash(wx+47,wy);
      const d=Math.hypot(px-x,py-y);
      if(d<d1){d2=d1;d1=d;id=hash(wx+13,wy+7)}else if(d<d2)d2=d;
    }
    return [d1,d2-d1,id];
  }

  /* ---------- procedural textures ---------- */
  function finish(tex,srgb,rx=1,ry=rx){
    tex.wrapS=tex.wrapT=T.RepeatWrapping;tex.repeat.set(rx,ry);
    if(srgb)tex.encoding=T.sRGBEncoding;
    tex.anisotropy=renderer?Math.min(lowTier?4:8,renderer.capabilities.getMaxAnisotropy()):1;
    return tex;
  }
  function normalFromHeight(hs,S,strength){
    const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),im=g.createImageData(S,S),d=im.data;
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const l=hs[y*S+((x+S-1)%S)],r=hs[y*S+((x+1)%S)],up=hs[((y+S-1)%S)*S+x],dn=hs[((y+1)%S)*S+x];
      let nx=(l-r)*strength,ny=(dn-up)*strength,nz=1;const k=1/Math.hypot(nx,ny,nz),i=(y*S+x)*4;
      d[i]=(nx*k*.5+.5)*255;d[i+1]=(ny*k*.5+.5)*255;d[i+2]=(nz*k*.5+.5)*255;d[i+3]=255;
    }
    g.putImageData(im,0,0);return finish(new T.CanvasTexture(c),false);
  }
  // fn(u,v) -> [r,g,b,height]; colours 0..255, height 0..1
  function makeTex(fn,strength=3,S=TS){
    const c=document.createElement('canvas');c.width=c.height=S;const g=c.getContext('2d'),im=g.createImageData(S,S),d=im.data,hs=new Float32Array(S*S);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){
      const p=fn(x/S,y/S),i=(y*S+x)*4;d[i]=p[0];d[i+1]=p[1];d[i+2]=p[2];d[i+3]=255;hs[y*S+x]=p[3];
    }
    g.putImageData(im,0,0);
    return {map:finish(new T.CanvasTexture(c),true),normalMap:normalFromHeight(hs,S,strength)};
  }
  function drawnTex(w,h,draw,opts={}){
    const c=document.createElement('canvas');c.width=w;c.height=h;const g=c.getContext('2d');draw(g,w,h);
    const map=new T.CanvasTexture(c);map.encoding=T.sRGBEncoding;map.anisotropy=renderer?Math.min(8,renderer.capabilities.getMaxAnisotropy()):1;
    const out={map,canvas:c,ctx:g};
    if(opts.normal&&w===h){
      const im=g.getImageData(0,0,w,h).data,hs=new Float32Array(w*h);
      for(let i=0;i<w*h;i++)hs[i]=(im[i*4]*.3+im[i*4+1]*.59+im[i*4+2]*.11)/255;
      out.normalMap=normalFromHeight(hs,w,opts.normal);out.normalMap.wrapS=out.normalMap.wrapT=T.ClampToEdgeWrapping;
    }
    return out;
  }
  function textures(){
    const tx={};
    // sun-dried mud plaster with straw, hairline cracks and water staining
    tx.plaster=makeTex((u,v)=>{
      const n=fbm(u*5,v*5,5,5),g=fbm(u*40,v*40,2,40),streak=fbm(u*22,v*2,3,22,2);
      const ridge=1-Math.abs(2*fbm(u*7+3.1,v*7+1.7,5,7)-1),crack=sstep(.988,.998,ridge)*sstep(.45,.6,fbm(u*3+9,v*3,2,3));
      const straw=vnoise(u*70,v*260,70,260)>.86?1:0, course=sstep(.9,1,Math.abs(Math.sin(v*Math.PI*14+n*2)))*.25;
      let k=.82+.2*n+.08*g-.09*sstep(.35,.95,streak)-.22*crack-.04*course+.06*straw;
      return [212*k,168*k+3*straw,122*k,clamp(.5*n+.25*g-.5*crack-.12*course+.12*straw,0,1)];
    },3.2);
    // dry-stone rubble masonry
    tx.stone=makeTex((u,v)=>{
      const [d1,e,id]=worley(u,v,7),n=fbm(u*30,v*30,3,30),joint=sstep(0,.11,e);
      const tone=.62+.5*id,k=(.42+.58*joint)*(.84+.3*n)*tone;
      return [168*k+14*id,152*k+6*id,132*k,joint*(.65+.35*n)*(1-.35*d1)];
    },5);
    // compacted sandy earth with scattered gravel
    tx.ground=makeTex((u,v)=>{
      const n=fbm(u*6,v*6,5,6),g=fbm(u*60,v*60,2,60),[d1,,id]=worley(u,v,34);
      const peb=id>.72?sstep(.23,.1,d1):0,k=.83+.24*n+.1*g;
      return [mix(208*k,150+60*id,peb),mix(176*k,138+50*id,peb),mix(134*k,120+44*id,peb),clamp(.4*n+.2*g+.5*peb,0,1)];
    },2.4);
    // worn flagstones of the lanes
    tx.paving=makeTex((u,v)=>{
      const [d1,e,id]=worley(u,v,9),n=fbm(u*24,v*24,4,24),m=fbm(u*5,v*5,3,5),joint=sstep(0,.05,e),k=(.66+.34*joint)*(.8+.24*n)*(.86+.2*id)*(.84+.3*m);
      return [184*k,160*k,128*k,joint*(.7+.3*n)-.08*d1];
    },4);
    // weathered timber
    tx.wood=makeTex((u,v)=>{
      const g=fbm(u*4,v*70,4,4,70),n=fbm(u*8,v*8,3,8),k=.62+.5*g+.14*n;
      return [150*k,108*k,72*k,g];
    },2.5,TS/2);
    // date-palm trunk with old frond bases
    tx.bark=makeTex((u,v)=>{
      const row=v*12,col=u*10+(Math.floor(row)%2)*.5,fx=col-Math.floor(col)-.5,fy=row-Math.floor(row);
      const scale=clamp(1.2-Math.abs(fx)*2.2-fy*.75,0,1),n=fbm(u*30,v*30,3,30),k=.5+.55*scale+.2*n;
      return [142*k,116*k,86*k,scale*.8+n*.2];
    },5,TS/2);
    tx.water=makeTex((u,v)=>{const n=fbm(u*8,v*8,4,8);return [40,90,84,n]},2.2,128).normalMap;
    // carved Omani door
    tx.door=drawnTex(256,512,(g,w,h)=>{
      g.fillStyle='#b98d63';g.fillRect(0,0,w,h);
      for(let i=0;i<6;i++){const x=i*w/6;g.fillStyle=['#b28457','#bd9368','#a97b50','#c09a70','#b0835a','#b78c60'][i];g.fillRect(x+1,0,w/6-2,h);
        g.strokeStyle='#5c4029';g.lineWidth=2;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();
        g.strokeStyle='#8a6444aa';g.lineWidth=1;for(let k=0;k<7;k++){const gx=x+4+rand()*(w/6-8);g.beginPath();g.moveTo(gx,0);g.bezierCurveTo(gx+3,h*.3,gx-3,h*.7,gx+2,h);g.stroke()}}
      g.fillStyle='#6b4a30';g.fillRect(w/2-9,0,18,h);g.fillStyle='#8a6240';g.fillRect(w/2-5,0,10,h);
      for(const y of [70,200,330,455]){g.fillStyle='#7a5536';g.fillRect(0,y-13,w,26);g.fillStyle='#96704a';g.fillRect(0,y-10,w,5);
        for(let i=0;i<8;i++){const x=16+i*(w-32)/7;const gr=g.createRadialGradient(x-2,y-2,1,x,y,8);gr.addColorStop(0,'#bdb5a8');gr.addColorStop(.5,'#5d5850');gr.addColorStop(1,'#2a2622');g.fillStyle=gr;g.beginPath();g.arc(x,y,7,0,7);g.fill()}}
      for(const cx of [w*.25,w*.75]){g.strokeStyle='#5f422b';g.lineWidth=3;g.strokeRect(cx-40,96,80,80);
        for(let i=0;i<8;i++){g.save();g.translate(cx,136);g.rotate(i*Math.PI/4);g.fillStyle=i%2?'#946c47':'#6f4e33';g.beginPath();g.ellipse(0,-17,7,17,0,0,7);g.fill();g.restore()}
        g.fillStyle='#4f3724';g.beginPath();g.arc(cx,136,6,0,7);g.fill()}
      g.strokeStyle='#2f2b27';g.lineWidth=5;g.beginPath();g.arc(w*.62,268,13,0,7);g.stroke();g.fillStyle='#3a3530';g.beginPath();g.arc(w*.62,254,6,0,7);g.fill();
      const sh=g.createLinearGradient(0,0,0,h);sh.addColorStop(0,'#0005');sh.addColorStop(.12,'#0000');sh.addColorStop(.85,'#0000');sh.addColorStop(1,'#2a1a0c88');g.fillStyle=sh;g.fillRect(0,0,w,h);
    });
    // shuttered window with iron bars
    tx.window=drawnTex(256,256,(g,w,h)=>{
      g.fillStyle='#7a5a3e';g.fillRect(0,0,w,h);g.fillStyle='#17120e';g.fillRect(18,18,w-36,h-36);
      for(const [x0,x1] of [[18,w/2-3],[w/2+3,w-18]]){g.fillStyle='#a67d55';g.fillRect(x0,h*.42,x1-x0,h*.58-18);
        g.strokeStyle='#6a4c33';g.lineWidth=2;for(let y=h*.42;y<h-18;y+=13){g.beginPath();g.moveTo(x0,y);g.lineTo(x1,y);g.stroke()}
        g.strokeStyle='#5d412b';g.lineWidth=4;g.strokeRect(x0+2,h*.42+2,x1-x0-4,h*.58-22)}
      g.strokeStyle='#39332d';g.lineWidth=5;for(let i=1;i<6;i++){const x=18+i*(w-36)/6;g.beginPath();g.moveTo(x,18);g.lineTo(x,h*.42);g.stroke()}
      g.lineWidth=4;g.beginPath();g.moveTo(18,h*.22);g.lineTo(w-18,h*.22);g.stroke();
      g.strokeStyle='#5e432c';g.lineWidth=10;g.strokeRect(13,13,w-26,h-26);g.strokeStyle='#9a7450';g.lineWidth=2;g.strokeRect(8,8,w-16,h-16);
    });
    // a single palm frond (alpha tested)
    tx.frond=drawnTex(128,512,(g,w,h)=>{
      g.clearRect(0,0,w,h);g.lineCap='round';
      for(let i=0;i<64;i++){const k=i/63,y=h-12-k*(h-26),len=w*.47*Math.pow(Math.sin(Math.PI*(k*.86+.1)),.55);
        for(const s of [-1,1]){const gcol=70+rand()*45;g.strokeStyle='rgb('+(48+rand()*40|0)+','+(gcol+28|0)+','+(34+rand()*20|0)+')';g.lineWidth=3.4-k*1.3;
          g.beginPath();g.moveTo(w/2,y);g.quadraticCurveTo(w/2+s*len*.55,y-len*.32,w/2+s*len,y-len*.78-rand()*5);g.stroke()}}
      g.strokeStyle='#8b8a48';g.lineWidth=4;g.beginPath();g.moveTo(w/2,h);g.lineTo(w/2,6);g.stroke();
    });
    tx.frond.map.wrapS=tx.frond.map.wrapT=T.ClampToEdgeWrapping;
    // grass tuft
    tx.grass=drawnTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.lineCap='round';
      for(let i=0;i<46;i++){const x=10+rand()*(w-20),hh=h*(.35+rand()*.6),lean=(rand()-.5)*34;g.strokeStyle='rgb('+(70+rand()*60|0)+','+(110+rand()*55|0)+','+(40+rand()*30|0)+')';g.lineWidth=2+rand()*2;
        g.beginPath();g.moveTo(x,h);g.quadraticCurveTo(x+lean*.3,h-hh*.6,x+lean,h-hh);g.stroke()}});
    tx.grass.map.wrapS=tx.grass.map.wrapT=T.ClampToEdgeWrapping;
    tx.leaves=drawnTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);
      for(let i=0;i<150;i++){const x=10+rand()*(w-20),y=14+rand()*(h-28),dx=x-w/2,dy=(y-h/2)*1.5;if(dx*dx+dy*dy>w*w*.21)continue;g.fillStyle='rgb('+(52+rand()*50|0)+','+(86+rand()*60|0)+','+(38+rand()*26|0)+')';g.beginPath();g.ellipse(x,y,2+rand()*3.5,5+rand()*6,rand()*3,0,7);g.fill()}
      g.strokeStyle='#5b4a36';g.lineWidth=2;for(let i=0;i<5;i++){g.beginPath();g.moveTo(w/2,h*.6);g.lineTo(w*.5+(rand()-.5)*w*.7,h*.5+(rand()-.5)*h*.5);g.stroke()}});
    tx.leaves.map.wrapS=tx.leaves.map.wrapT=T.ClampToEdgeWrapping;
    // woven rug
    tx.rug=drawnTex(256,128,(g,w,h)=>{const cols=['#7d1f1c','#1d1a18','#e7dcc3','#a8472a','#c9a24b'];
      for(let y=0,i=0;y<h;i++){const bh=[18,4,8,4,26,4,8,4][i%8];g.fillStyle=cols[[0,2,1,2,3,2,1,4][i%8]];g.fillRect(0,y,w,bh);y+=bh}
      g.fillStyle='#e7dcc3';for(let x=8;x<w;x+=24){g.beginPath();g.moveTo(x,64);g.lineTo(x+8,56);g.lineTo(x+16,64);g.lineTo(x+8,72);g.fill()}
      const im=g.getImageData(0,0,w,h),d=im.data;for(let i=0;i<d.length;i+=4){const n=(rand()-.5)*26;d[i]+=n;d[i+1]+=n;d[i+2]+=n}g.putImageData(im,0,0)});
    // embroidered kumma band
    tx.kumma=drawnTex(256,64,(g,w,h)=>{g.fillStyle='#f3ecdc';g.fillRect(0,0,w,h);
      for(let x=0;x<w;x+=16){g.strokeStyle='#8a3b2e';g.lineWidth=2;g.beginPath();g.moveTo(x,32);g.lineTo(x+8,14);g.lineTo(x+16,32);g.lineTo(x+8,50);g.closePath();g.stroke();g.fillStyle='#2f5d77';g.fillRect(x+6,29,4,6)}
      g.fillStyle='#b88a3a';g.fillRect(0,3,w,3);g.fillRect(0,h-6,w,3)});
    tx.kumma.map.wrapS=T.RepeatWrapping;
    tx.massar=drawnTex(128,64,(g,w,h)=>{g.fillStyle='#e9e2d2';g.fillRect(0,0,w,h);
      for(let x=-h;x<w;x+=9){g.strokeStyle=['#7a2f3b','#2e4f6e','#b08a3c'][((x+h)/9|0)%3];g.lineWidth=3;g.beginPath();g.moveTo(x,h);g.lineTo(x+h,0);g.stroke()}});
    tx.massar.map.wrapS=tx.massar.map.wrapT=T.RepeatWrapping;
    // soft round sprite for dust
    tx.dot=drawnTex(32,32,(g)=>{const r=g.createRadialGradient(16,16,0,16,16,16);r.addColorStop(0,'#fff');r.addColorStop(1,'#fff0');g.fillStyle=r;g.fillRect(0,0,32,32)});
    return tx;
  }
  function faceTex(skin,hair,beard){
    return drawnTex(256,256,(g,w,h)=>{
      g.fillStyle=skin;g.fillRect(0,0,w,h);const cx=64;
      const sh=g.createRadialGradient(cx,120,20,cx,125,82);sh.addColorStop(0,'#fff1');sh.addColorStop(1,'#3a1c0c44');g.fillStyle=sh;g.fillRect(0,0,w,h);
      g.fillStyle=hair;g.fillRect(124,0,w,182);g.fillRect(0,0,6,182);g.fillRect(0,0,w,62);
      if(beard){const b=g.createLinearGradient(0,138,0,205);b.addColorStop(0,hair+'00');b.addColorStop(.35,hair+'d8');b.addColorStop(1,hair);g.fillStyle=b;g.beginPath();g.moveTo(cx-56,120);g.quadraticCurveTo(cx-50,215,cx,222);g.quadraticCurveTo(cx+50,215,cx+56,120);g.lineTo(cx+34,150);g.quadraticCurveTo(cx,140,cx-34,150);g.closePath();g.fill();
        g.fillStyle=hair;g.beginPath();g.ellipse(cx,152,19,5.5,0,0,7);g.fill()}
      for(const s of [-1,1]){const ex=cx+s*17;
        g.fillStyle='#f4efe6';g.beginPath();g.ellipse(ex,118,7.5,4.2,0,0,7);g.fill();
        g.fillStyle='#3a2416';g.beginPath();g.arc(ex,118,3.9,0,7);g.fill();g.fillStyle='#0c0907';g.beginPath();g.arc(ex,118,1.9,0,7);g.fill();g.fillStyle='#fff';g.fillRect(ex+1,116,1.6,1.6);
        g.strokeStyle='#2a1a10';g.lineWidth=1.6;g.beginPath();g.moveTo(ex-8,117);g.quadraticCurveTo(ex,111.5,ex+8,117);g.stroke();
        g.strokeStyle=hair;g.lineWidth=3.6;g.lineCap='round';g.beginPath();g.moveTo(ex-9,108+s*0);g.quadraticCurveTo(ex,103,ex+9,107);g.stroke()}
      g.strokeStyle='#5a301c66';g.lineWidth=2;g.beginPath();g.moveTo(cx-3,122);g.quadraticCurveTo(cx-6,140,cx-7,144);g.quadraticCurveTo(cx,149,cx+7,144);g.stroke();
      g.strokeStyle='#7a3e30';g.lineWidth=2.6;g.beginPath();g.moveTo(cx-11,160);g.quadraticCurveTo(cx,164,cx+11,160);g.stroke();
    });
  }
  function signTex(loc){
    const d=drawnTex(512,256,()=>{});const paint=()=>{const g=d.ctx;
      g.fillStyle='#1d5a50';g.fillRect(0,0,512,256);g.strokeStyle='#e2c78d';g.lineWidth=8;g.strokeRect(10,10,492,236);
      g.fillStyle='#fff6dc';g.textAlign='center';g.textBaseline='middle';g.direction='rtl';g.font='700 84px Naskh, "Traditional Arabic", serif';g.fillText(loc.name,256,96);
      g.direction='ltr';g.fillStyle='#f1d9a4';g.font='700 26px Arial, sans-serif';g.fillText(loc.pron,256,172);g.fillStyle='#d9e6dc';g.font='24px Arial, sans-serif';g.fillText(loc.en,256,210);d.map.needsUpdate=true};
    paint();document.fonts?.load?.('700 84px Naskh',loc.name).then(paint).catch(()=>{});return d.map;
  }

  /* ---------- geometry batching ---------- */
  const _m=()=>new T.Matrix4();
  function M(x=0,y=0,z=0,ry=0,rx=0,rz=0,sx=1,sy=sx,sz=sx){
    return _m().compose(new T.Vector3(x,y,z),new T.Quaternion().setFromEuler(new T.Euler(rx,ry,rz,'YXZ')),new T.Vector3(sx,sy,sz));
  }
  const mul=(a,b)=>_m().multiplyMatrices(a,b);
  class Batch{
    constructor(){this.p=[];this.n=[];this.u=[];this.c=[];this.s=[];this.hasSway=false}
    // color: [r,g,b] or fn(x,y,z)->[r,g,b]; uv: 'world' for metric box-mapping, else native; sway: fn(index,x,y,z)
    add(geo,matrix,color=[1,1,1],uv,scale=3,sway){
      if(matrix)geo.applyMatrix4(matrix);
      const g=geo.index?geo.toNonIndexed():geo;if(!g.attributes.normal)g.computeVertexNormals();
      const P=g.attributes.position.array,N=g.attributes.normal.array,U=g.attributes.uv?g.attributes.uv.array:null,fn=typeof color==='function';
      for(let i=0,k=0;i<P.length;i+=3,k+=2){
        const x=P[i],y=P[i+1],z=P[i+2],nx=N[i],ny=N[i+1],nz=N[i+2];this.p.push(x,y,z);this.n.push(nx,ny,nz);
        if(uv==='world'){if(Math.abs(ny)>.7)this.u.push(x/scale,z/scale);else if(Math.abs(nx)>Math.abs(nz))this.u.push(z/scale,y/scale);else this.u.push(x/scale,y/scale)}
        else this.u.push(U?U[k]:0,U?U[k+1]:0);
        const c=fn?color(x,y,z):color;this.c.push(c[0],c[1],c[2]);
        if(sway){this.hasSway=true;this.s.push(sway(i/3,x,y,z))}else this.s.push(0);
      }
      if(g!==geo)g.dispose();geo.dispose();return this;
    }
    geometry(){
      const g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(this.p,3));g.setAttribute('normal',new T.Float32BufferAttribute(this.n,3));
      g.setAttribute('uv',new T.Float32BufferAttribute(this.u,2));g.setAttribute('color',new T.Float32BufferAttribute(this.c,3));
      if(this.hasSway)g.setAttribute('sway',new T.Float32BufferAttribute(this.s,1));
      this.p=this.n=this.u=this.c=this.s=null;return g;
    }
    mesh(material,cast=true,receive=true){const m=new T.Mesh(this.geometry(),material);m.castShadow=cast;m.receiveShadow=receive;m.matrixAutoUpdate=false;return m}
  }
  const box=(w,h,d,sx=1,sy=1,sz=1)=>new T.BoxGeometry(w,h,d,sx,sy,sz);
  // box sitting on y=0 whose walls lean inward (battered mud walls)
  function taperBox(w,h,d,taper,seg=4){
    const g=new T.BoxGeometry(w,h,d,2,seg,2),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const y=p.getY(i)+h/2,k=1-taper*y/h;p.setXYZ(i,p.getX(i)*k,y,p.getZ(i)*k)}
    g.computeVertexNormals();return g;
  }
  function swayPatch(material){
    material.onBeforeCompile=sh=>{sh.uniforms.uTime=uTime;
      sh.vertexShader='attribute float sway;\nuniform float uTime;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n float sw=sin(uTime*1.25+position.x*.35+position.z*.27)+.45*sin(uTime*2.9+position.x*1.1);transformed.x+=sw*sway*.16;transformed.z+=cos(uTime*1.05+position.z*.4)*sway*.11;transformed.y-=abs(sw)*sway*.04;')};
    return material;
  }
