/* Al Hamra. All geometry, materials and sound positions use local units. */
window.World = (() => {
  'use strict';
  const locations = {
    lane: {x:5,z:6,name:'الحارة القديمة'},
    majlis: {x:-7,z:-9,name:'سبلة الحارة'},
    mosque: {x:18,z:-18,name:'المسجد'}
  };
  const player={x:2,z:8,yaw:0}, salem={x:.5,z:6,yaw:.5};
  const keys=new Set(), stick={x:0,y:0};
  const bounds=[], triangles=[], actors=[], labels=[];
  const sunDir=[-.45,.76,.46];
  let scene,camera,renderer,sky,sun,hemi,canvas,ctx,host,overlay,actorGroups=[],paused=true;
  let yaw=0,pitch=.24,last=0,t=0,talkTime=0,talk=false,nearest,envTime=0,raf=0,ready=false,step=0,dirty=true;
  let doorQuest=null,feedbackTimer=0;
  const props={};
  let W=1,H=1,seed=72491,cam={x:3,y:4,z:14},aim={x:2,y:1.15,z:6};
  const rand=()=>((seed=(Math.imul(1664525,seed)+1013904223)>>>0)/4294967296);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const shade=(hex,m)=>{const n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(v=>clamp(Math.round(v*m),0,255).toString(16).padStart(2,'0')).join('')};
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const sub=(a,b)=>a.map((v,i)=>v-b[i]);
  const dot=(a,b)=>a.reduce((n,v,i)=>n+v*b[i],0);
  const unit=v=>{let l=Math.hypot(...v)||1;return v.map(n=>n/l)};
  function tri(dest,a,b,c,col) {
    const normal=unit(cross(sub(b,a),sub(c,a)));
    dest.push({a,b,c,col,ink:shade(col,.76+.34*Math.abs(dot(normal,sunDir))),x:(a[0]+b[0]+c[0])/3,z:(a[2]+b[2]+c[2])/3});
  }
  function quad(d,a,b,c,e,col){tri(d,a,b,c,col);tri(d,a,c,e,col)}
  function box(d,x,y,z,w,h,dep,col){
    let a=x-w/2,b=x+w/2,c=z-dep/2,e=z+dep/2,f=y+h;
    quad(d,[a,y,e],[b,y,e],[b,f,e],[a,f,e],col);
    quad(d,[b,y,c],[a,y,c],[a,f,c],[b,f,c],col);
    quad(d,[b,y,e],[b,y,c],[b,f,c],[b,f,e],col);
    quad(d,[a,y,c],[a,y,e],[a,f,e],[a,f,c],col);
    quad(d,[a,f,e],[b,f,e],[b,f,c],[a,f,c],col);
  }
  function tapered(d,x,y,z,base,top,height,col,sides=9,shift=0){
    for(let i=0;i<sides;i++){
      const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
      const v=(angle,r,h,s)=>[x+Math.cos(angle)*r+s,y+h,z+Math.sin(angle)*r];
      const A=v(a,base,0,0),B=v(b,base,0,0),C=v(b,top,height,shift),D=v(a,top,height,shift);
      quad(d,B,A,D,C,col); if(top) tri(d,[x+shift,y+height,z],C,D,col);
    }
  }
  const addBox=(...args)=>box(triangles,...args);
  function house(x,z,w,dep,h,col,kind='house'){
    bounds.push([x-w/2-.3,x+w/2+.3,z-dep/2-.3,z+dep/2+.3,h]);
    addBox(x,0,z,w,h,dep,col);
    const lip=.22;
    addBox(x,h,z+dep/2-lip/2,w,.32,lip,col);
    addBox(x,h,z-dep/2+lip/2,w,.32,lip,col);
    addBox(x-w/2+lip/2,h,z,lip,.32,dep,col);
    addBox(x+w/2-lip/2,h,z,lip,.32,dep,col);
    const f=z+dep/2,doorW=kind==='majlis'?1.7:1.22;
    addBox(x,0,f+.025,doorW+.37,2.35,.18,shade(col,.88));
    addBox(x,0,f+.14,doorW,2.13,.12,'#493124');
    for(let j=0;j<6;j++)addBox(x-doorW*.40+doorW*.16*j,.09,f+.213,doorW*.14,1.95,.025,j%2?'#77503a':'#68412d');
    addBox(x,.65,f+.24,doorW,.065,.027,'#422b23');
    addBox(x,1.55,f+.24,doorW,.075,.027,'#422b23');
    addBox(x+.25,1.02,f+.27,.08,.1,.05,'#dbad65');
    addBox(x,0,f+.35,doorW+.45,.16,.75,'#a78766');
    for(const side of [-1,1]){
      for(let floor=0;floor<(h>4.8?2:1);floor++){
        const wy=1.08+floor*2.1,wx=x+side*w*.32;
        addBox(wx,wy,f+.03,.86,1.15,.1,'#533d33');
        addBox(wx,wy-.08,f+.11,1.10,.12,.26,shade(col,.86));
        for(let j=-1;j<=1;j++)addBox(wx+j*.23,wy+.03,f+.095,.065,1.11,.045,'#886348');
      }
    }
    for(let j=0;j<Math.floor(w/1.12);j++)addBox(x-w/2+.5+j*1.12,h-.32,f+.11,.11,.12,.32,'#71503c');
    for(let j=0;j<4;j++){
      const wx=x+(rand()-.5)*(w-.7),wy=.45+rand()*(h-.9);
      addBox(wx,wy,f+.018,.16+rand()*.32,.045,.055,shade(col,.92));
    }
    if(kind==='mosque'){
      addBox(x+w*.31,h-.4,z-.4,1.1,2.1,1.1,'#e4d3ae');
      tapered(triangles,x+w*.31,h+1.7,z-.4,.55,.40,1.0,'#f4e4c4');
      tapered(triangles,x+w*.31,h+2.7,z-.4,.44,0,.59,'#c4ae88');
    }
  }
  function palm(x,z,h){
    const d=triangles,lx=.38+rand()*.4;
    tapered(d,x,0,z,.3,.17,h,'#806749',8,lx);
    for(let i=0;i<4;i++)tapered(d,x+lx*i/4,h*i/4,z,.30-.025*i,.24-.025*i,.21,'#9a7b53',8);
    const count=10, offset=rand()*3;
    for(let i=0;i<count;i++){
      const a=offset+i*2*Math.PI/count, len=h*(.50+rand()*.20), rise=h*(.18+rand()*.15);
      const pos=(v,b=0,drop=0)=>[x+lx+Math.cos(a)*len*v-Math.sin(a)*b,h+rise*Math.sin(Math.PI*v)-.46*v-drop,z+Math.sin(a)*len*v+Math.cos(a)*b];
      const color=['#527054','#748455','#697b49','#80935e','#496a49'][i%5];
      for(let j=0;j<6;j++){
        const u=j/6,v=(j+1)/6,width=.03+.34*Math.sin(Math.PI*(u+.06));
        for(const side of [-1,1])tri(d,pos(u),pos(v),pos(v+.08,side*width,width*.9),color);
      }
    }
  }
  function sign(x,z){
    addBox(x,0,z,.16,1.82,.16,'#644c34');
    addBox(x,1.27,z,1.35,.52,.17,'#17665e');
    addBox(x,1.76,z,1.40,.06,.21,'#d4b078');
  }
  function terrain(){
    // The main public lane runs north, with the gardens to its south.
    addBox(1,-.18,-3,118,.17,97,'#c39e73');
    addBox(2,.001,0,7.1,.016,64,'#dbc29a');
    addBox(3,.015,-8,76,.014,4.4,'#d4b88f');
    addBox(17,.01,-12,4.8,.015,26,'#d5b990');
    addBox(-7,.012,1,3,.018,25,'#d1b78f');
    for(let i=0;i<135;i++){
      const x=-26+rand()*57,z=-27+rand()*48,r=.045+rand()*.16;
      tri(triangles,[x,.04,z],[x+r,.04,z+.02],[x+r*.35,.04,z+r*.58],'#bba27c');
    }
    for(let k=0;k<3;k++){
      const ridge=[],n=64,dist=79+k*34;
      for(let i=0;i<=n;i++){
        const a=i/n*Math.PI*2;
        const h=11+3*k+4*Math.sin(a*7+k)+5*Math.cos(a*4.0)+rand()*5;
        ridge.push({upper:[Math.cos(a)*dist,h,Math.sin(a)*dist],mid:[Math.cos(a)*(dist-9),h*.42,Math.sin(a)*(dist-9)],foot:[Math.cos(a)*(dist-19),-.3,Math.sin(a)*(dist-19)]});
      }
      ridge[n]=ridge[0];
      const cols=[['#936f62','#b18a73','#a37c6b'],['#b29a8f','#b99e8f','#ba9c8d'],['#c3afa5','#c8b8ad','#bbaba6']][k];
      for(let i=0;i<n;i++){
        const a=ridge[i],b=ridge[i+1];
        tri(triangles,a.foot,a.mid,b.mid,cols[i%3]); tri(triangles,a.foot,b.mid,b.foot,cols[(i+1)%3]);
        tri(triangles,a.mid,a.upper,b.upper,cols[(i+2)%3]); tri(triangles,a.mid,b.upper,b.mid,cols[i%3]);
      }
    }
    house(5,2.0,5.0,5.1,4.75,'#bc825b');
    house(12,1,6.6,6.3,6.25,'#c08b65');
    house(-5.6,5.2,5.0,5.0,4.4,'#c69165');
    house(-12,4.4,5.6,6.1,5.3,'#ad7858');
    house(-7,-14.2,7.5,7,4.25,'#c48e62','majlis');
    house(-15.2,-15,6.4,6.2,5.9,'#b98662');
    house(18,-23.1,8.3,7.4,4.4,'#e4d6b9','mosque');
    house(4,-18,5,6,5.85,'#b68160');
    house(10.5,-17.4,6,6.5,4.8,'#c68f65');
    for(let i=0;i<10;i++)house(-28+i*5.9,-35-(i%3)*2,4.8,5,3.5+rand()*3,['#c39674','#b18869','#cb9c77'][i%3]);
    for(const v of [[-16,9,6.2],[-11,13,7.8],[-18,0,7.2],[-20,-13,8],[12,11,7.5],[17,9,8.2],[25,-10,7],[22,-31,8.8],[.1,-26,7],[-10,-28,7],[16,20,6],[5,25,7],[-7,27,8]])palm(...v);
    addBox(-20,.05,0,1.65,.14,55,'#648e84');
    for(const x of [-20.97,-19.03])addBox(x,.02,0,.32,.34,55,'#a68d6c');
    addBox(-20,.25,-8,2.6,.22,3.2,'#a77958');
    for(const [id,p] of Object.entries(locations)) {sign(p.x+1.55,p.z-.4); labels.push({id,x:p.x+1.55,y:2.5,z:p.z-.40,name:p.name});}
  }
  function person(robe,head,hat){
    const body=[],face=[],legs=[[],[]],arms=[[],[]];
    tapered(body,0,.28,0,.34,.235,1.19,robe,10);
    tapered(body,0,1.44,0,.18,.14,.13,robe,8);
    tapered(face,0,0,0,.197,.198,.31,head,10);
    tapered(face,0,.29,0,.212,.172,.13,hat,10);
    tapered(face,0,.31,0,.217,.218,.033,'#b7996d',10);
    for(const s of [-1,1])box(face,s*.067,.18,.184,.028,.021,.018,'#49372e');
    box(face,0,.099,.198,.071,.018,.016,'#885c48');
    box(body,.046,1.11,.236,.04,.31,.045,'#cfab7a');
    for(let i=0;i<2;i++){
      tapered(legs[i],0,-.25,0,.09,.105,.27,robe,7);
      box(legs[i],0,-.29,.04,.18,.08,.28,'#634b37');
      tapered(arms[i],0,-.53,0,.088,.12,.56,robe,7);
      tapered(arms[i],0,-.62,0,.064,.085,.12,head,7);
    }
    return {body,face,legs,arms};
  }
  const pose=(x,y,z,rx=0,ry=0)=>({x,y,z,rx,ry});
  function actorParts(model,phase,walk,bob,turn){
    return [
      [model.body,pose(0,bob,0)], [model.face,pose(0,1.48+bob,0,talk && turn ? .075*Math.sin(talkTime*9) : 0,turn)],
      ...[-1,1].map((s,i)=>[model.legs[i],pose(s*.155,.30+bob,0,walk*s*Math.sin(phase)*.48)]),
      ...[-1,1].map((s,i)=>[model.arms[i],pose(s*.25,1.43+bob,0,-walk*s*Math.sin(phase)*.36)])
    ];
  }
  function propSetup(){
    const door=[],coffee=[],shoes=[];
    // A welcome lantern beside the door, a tray at the gathering, and a shoe rack.
    tapered(door,5.98,1.66,4.81,.12,.13,.26,'#ffd675',6);
    tapered(door,5.98,1.93,4.81,.17,0,.13,'#60402e',6);
    addBox(-5.5,.33,-9.4,.95,.10,.58,'#816047');
    for(const x of [-5.86,-5.14])addBox(x,0,-9.4,.11,.33,.48,'#926f50');
    tapered(coffee,-5.5,.43,-9.4,.40,.4,.035,'#b58d47',12);
    for(let j=-1;j<=1;j++)tapered(coffee,-5.5+j*.19,.47,-9.4,.063,.091,.13,'#faf0cf',8);
    addBox(20.3,.30,-18.96,1.35,.11,.63,'#916f4e');
    for(const x of [19.73,20.86])addBox(x,0,-18.96,.12,.75,.60,'#916f4e');
    for(const x of [20.1,20.34])box(shoes,x,.41,-18.94,.16,.11,.36,'#5c4937');
    for(const [id,data] of [['lane',door],['majlis',coffee],['mosque',shoes]])props[id]={data,on:false,mesh:null};
  }
  function actorsSetup(){
    actors.push({pos:player,model:person('#658984','#a77557','#d9bb80')},{pos:salem,model:person('#f0e2c9','#a87251','#e7d8b4')});
    for(const [i,p] of Object.values(locations).entries())actors.push({pos:{x:p.x-.72,z:p.z-.5,yaw:.2},model:person(['#d5ba99','#e5d1af','#c6d4c9'][i],'#9e6b4c','#efe0c2')});
    actors.push({pos:{x:-2,z:-7,yaw:0},model:person('#ae8d66','#936748','#ddd0ad')});
  }
  function makeMesh(items){
    const three=window.THREE, geometry=new three.BufferGeometry(), vertices=[],colors=[];
    const color=new three.Color();
    for(const tr of items){
      color.set(tr.col);for(const pt of [tr.a,tr.b,tr.c]){vertices.push(...pt); colors.push(color.r,color.g,color.b);}
    }
    geometry.setAttribute('position',new three.Float32BufferAttribute(vertices,3));
    geometry.setAttribute('color',new three.Float32BufferAttribute(colors,3));
    geometry.computeVertexNormals();
    return new three.Mesh(geometry,new three.MeshLambertMaterial({vertexColors:true,side:three.DoubleSide}));
  }
  function webgl(){
    const T=window.THREE;if(!T)return false;
    const surface=document.createElement('canvas');
    try{
      const options={antialias:true,alpha:false,powerPreference:'low-power',depth:true,stencil:false};
      const gl=surface.getContext('webgl2',options)||surface.getContext('webgl',options);
      if(!gl)return false;
      renderer=new T.WebGLRenderer({canvas:surface,context:gl,...options});
    }
    catch(e){return false}
    canvas=surface;host.appendChild(canvas);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    scene=new T.Scene();sky=new T.Color('#d7d4be');scene.background=sky;
    scene.fog=new T.FogExp2('#d4c8ac',.0072);
    camera=new T.PerspectiveCamera(55,1,.12,260);
    hemi=new T.HemisphereLight(0xfff1d8,0xd3aa87,.83);scene.add(hemi);
    sun=new T.DirectionalLight(0xffe5bc,1.02);sun.position.set(-28,42,29);
    sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
    Object.assign(sun.shadow.camera,{left:-40,right:40,top:40,bottom:-40,far:115});
    sun.shadow.bias=-.00065;scene.add(sun);
    for(const p of Object.values(props)){p.mesh=makeMesh(p.data);p.mesh.visible=p.on;scene.add(p.mesh);}
    const world=makeMesh(triangles);world.receiveShadow=true;world.castShadow=true;scene.add(world);
    actorGroups=actors.map(a=>{
      const root=new T.Group();scene.add(root);
      const parts=actorParts(a.model,0,0,0,0).map(([arr])=>{const m=makeMesh(arr);m.castShadow=true;root.add(m);return m});
      return {root,parts};
    });
    return true;
  }
  function transform(v,p){
    let c=Math.cos(p.rx||0),s=Math.sin(p.rx||0),yy=v[1]*c-v[2]*s,zz=v[1]*s+v[2]*c;
    c=Math.cos(p.ry||0);s=Math.sin(p.ry||0);
    return [p.x+v[0]*c+zz*s,p.y+yy,p.z-v[0]*s+zz*c];
  }
  function blocked(x,z,r=.04){return bounds.some(b=>x>b[0]-r&&x<b[1]+r&&z>b[2]-r&&z<b[3]+r)}
  function move(pos,dx,dz){let x=clamp(pos.x+dx,-28,30),z=clamp(pos.z+dz,-29,24);if(!blocked(x,pos.z))pos.x=x;if(!blocked(pos.x,z))pos.z=z;}
  function basis(){
    const direction=unit(sub([aim.x,aim.y,aim.z],[cam.x,cam.y,cam.z]));
    const right=unit(cross(direction,[0,1,0]));return {direction,right,up:cross(right,direction),f:H/(2*Math.tan(55*Math.PI/360))};
  }
  function view(v,B){const s=[v[0]-cam.x,v[1]-cam.y,v[2]-cam.z];return [dot(s,B.right),dot(s,B.up),dot(s,B.direction)]}
  function project(v,B){return [W/2+v[0]*B.f/v[2],H/2-v[1]*B.f/v[2]]}
  // The offline renderer uses reciprocal depth so doors, alleys and characters
  // remain visible in their actual positions even on crossing triangles.
  let pixels,packed,depths,rowColors,fbW=0,fbH=0;
  const colors=new Map();
  function pack(r,g,b){return (255<<24)|((b&255)<<16)|((g&255)<<8)|(r&255);}
  function canvasFrame(B,poses,day){
    const width=canvas.width,height=canvas.height,scale=height/H;
    if(width!==fbW||height!==fbH){
      fbW=width;fbH=height;pixels=ctx.createImageData(width,height);
      packed=new Uint32Array(pixels.data.buffer);depths=new Float32Array(packed.length);rowColors=new Uint32Array(height);
    }
    depths.fill(0);
    for(let y=0;y<height;y++){
      const h=Math.min(1,y/(height*.78));
      rowColors[y]=pack(36+day*(100+h*90),51+day*(124+h*24),72+day*(107-h*9));
      packed.fill(rowColors[y],y*width,(y+1)*width);
    }
    const tint=.46+.54*day, focal=B.f*scale;
    function raster(a,b,c,ink){
      const ax=a[0],ay=a[1],bx=b[0],by=b[1],cx=c[0],cy=c[1];
      const lowX=Math.max(0,Math.floor(Math.min(ax,bx,cx))),highX=Math.min(width-1,Math.ceil(Math.max(ax,bx,cx)));
      const lowY=Math.max(0,Math.floor(Math.min(ay,by,cy))),highY=Math.min(height-1,Math.ceil(Math.max(ay,by,cy)));
      const det=(bx-ax)*(cy-ay)-(cx-ax)*(by-ay);
      if(lowX>highX||lowY>highY||Math.abs(det)<.006)return;
      const ux=(cy-ay)/det,uy=(ax-cx)/det,vx=(ay-by)/det,vy=(bx-ax)/det;
      const dzb=b[2]-a[2],dzc=c[2]-a[2];
      let u0=ux*(lowX+.5-ax)+uy*(lowY+.5-ay),v0=vx*(lowX+.5-ax)+vy*(lowY+.5-ay);
      for(let y=lowY;y<=highY;y++,u0+=uy,v0+=vy){
        let u=u0,v=v0,index=y*width+lowX;
        for(let x=lowX;x<=highX;x++,u+=ux,v+=vx,index++){
          if(u<-.00001||v<-.00001||u+v>1.00001)continue;
          const z=a[2]+u*dzb+v*dzc;
          if(z>depths[index]){depths[index]=z;packed[index]=ink}
        }
      }
    }
    function paint(a,b,c,tr){
      let pts=[view(a,B),view(b,B),view(c,B)];
      if(pts.every(v=>v[2]<=.19))return;
      if(pts.some(v=>v[2]<=.19)){
        const clipped=[];
        for(let i=0;i<3;i++){const u=pts[i],v=pts[(i+1)%3];
          if(u[2]>=.19)clipped.push(u);
          if((u[2]>=.19)!==(v[2]>=.19)){const k=(.19-u[2])/(v[2]-u[2]);clipped.push(u.map((n,j)=>n+(v[j]-n)*k));}}
        pts=clipped;
      }
      if(pts.length<3)return;
      const pp=pts.map(v=>[width*.5+focal*v[0]/v[2],height*.5-focal*v[1]/v[2],1/v[2]]);
      if(!colors.has(tr.ink))colors.set(tr.ink,parseInt(tr.ink.slice(1),16));
      const raw=colors.get(tr.ink),r=(raw>>>16)*tint,g=((raw>>>8)&255)*tint,bv=(raw&255)*tint;
      const ink=pack(r,g,bv+(1-day)*15);
      for(let i=1;i<pp.length-1;i++)raster(pp[0],pp[i],pp[i+1],ink);
    }
    for(const tr of triangles)paint(tr.a,tr.b,tr.c,tr);
    for(const p of Object.values(props))if(p.on)for(const tr of p.data)paint(tr.a,tr.b,tr.c,tr);
    for(let i=0;i<actors.length;i++){
      const p=actors[i].pos,base=pose(p.x,0,p.z,0,p.yaw);
      for(const [items,part] of poses[i])for(const tr of items){
        const apply=v=>transform(transform(v,part),base);
        paint(apply(tr.a),apply(tr.b),apply(tr.c),tr);
      }
    }
    ctx.putImageData(pixels,0,0);
  }
  function positionCamera(){
    const x=player.x,z=player.z;aim={x:x-Math.sin(yaw)*3.0,y:1.55,z:z-Math.cos(yaw)*3.0};
    const target=7.2;let dist=target;
    for(let q=.9;q<=target;q+=.3){if(blocked(x+Math.sin(yaw)*q,z+Math.cos(yaw)*q,.16)){dist=Math.max(.65,q-.32);break}}
    cam={x:x+Math.sin(yaw)*dist,y:1.95+dist*pitch,z:z+Math.cos(yaw)*dist};
    if(doorQuest){cam={x:12,y:25,z:30};aim={x:11,y:0,z:-10};}
    if(renderer){camera.position.set(cam.x,cam.y,cam.z);camera.lookAt(aim.x,aim.y,aim.z);}
  }
  function resize(){
    dirty=true;W=host.clientWidth||window.innerWidth;H=host.clientHeight||window.innerHeight;
    if(renderer){renderer.setSize(W,H,false);camera.aspect=W/H;camera.updateProjectionMatrix()}
    else{const r=Math.min(window.devicePixelRatio||1,900/W,600/H);canvas.width=Math.round(W*r);canvas.height=Math.round(H*r)}
  }
  function checkNear(force=false){
    const sorted=Object.entries(locations).map(([id,l])=>[id,Math.hypot(l.x-player.x,l.z-player.z)]).sort((a,b)=>a[1]-b[1]);
    const id=sorted[0][1]<4.7?sorted[0][0]:null;
    if(force||id!==nearest){nearest=id;window.nearPlace?.(id);}
  }
  function frame(ms){
    raf=requestAnimationFrame(frame);
    // Canvas fallback stays navigable on devices with no graphics acceleration.
    if((paused&&!dirty&&!talk)||(!renderer&&ms-last<45))return;
    dirty=false;
    const dt=clamp((ms-last)/1000,0,.075);last=ms;
    if(talk){talkTime+=dt;salem.yaw=Math.atan2(player.x-salem.x,player.z-salem.z);}
    let moving=0,guideWalking=0;
    if(!paused&&!doorQuest){
      t+=dt;
      const turn=Number(keys.has('KeyQ'))-Number(keys.has('KeyE'));yaw+=turn*dt*1.6;
      let dx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x;
      let forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-stick.y;
      const len=Math.hypot(dx,forward);
      if(len>.06){const factor=(keys.has('ShiftLeft')?5:3.65)*dt/Math.max(1,len);
        const vx=dx*Math.cos(yaw)-forward*Math.sin(yaw),vz=-dx*Math.sin(yaw)-forward*Math.cos(yaw);
        const px=player.x,pz=player.z;move(player,vx*factor,vz*factor);moving=Math.min(1,Math.hypot(player.x-px,player.z-pz)/Math.max(dt*3, .001));
        if(moving>.01)player.yaw=Math.atan2(vx,vz);step+=moving*dt*9;
      }
      const tx=player.x-1.35*Math.cos(yaw)-.35*Math.sin(yaw),tz=player.z+1.35*Math.sin(yaw)-.35*Math.cos(yaw);
      const dxs=tx-salem.x,dzs=tz-salem.z,distance=Math.hypot(dxs,dzs);
      if(distance>.30){const s=Math.min(1,dt*4.3/distance);move(salem,dxs*s,dzs*s);guideWalking=Math.min(1,distance);
        if(distance>6&&!blocked(tx,tz)){salem.x=tx;salem.z=tz;}
        salem.yaw=Math.atan2(dxs,dzs);}
      else salem.yaw=Math.atan2(player.x-salem.x,player.z-salem.z);
      actors[5].pos.x=-3+2.1*Math.sin(t*.27);actors[5].pos.z=-7;actors[5].pos.yaw=Math.cos(t*.27)>0?Math.PI/2:-Math.PI/2;
      envTime+=dt;if(envTime>.15){
        envTime=0;window.environmentTick?.({x:player.x,z:player.z,water:clamp(1-Math.abs(player.x+20)/14,0,1),surface:Math.abs(player.z+8)<2?'stone':'dirt',moving:moving>.05});checkNear();
      }
    }
    const day=(1+Math.cos(t*Math.PI/85))*.5;
    const poses=actors.map((a,i)=>{
      const w=i===0?moving:i===1?guideWalking:i===5&&!paused?.38:0;
      return actorParts(a.model,i===0?step:t*7+.3*i,w,w*Math.abs(Math.sin(t*7))*.035,i===1?(talk?.42:.01):0);
    });
    positionCamera();const B=basis();
    if(renderer){
      hemi.intensity=.38+day*.48;sun.intensity=.10+day*.97;
      sun.color.setHSL(.12-day*.035,.65,.65+day*.22);
      sky.setHSL(.15+(.46*(1-day)),.24,.19+day*.61);scene.fog.color.copy(sky);
      for(let i=0;i<actors.length;i++){
        const {root,parts}=actorGroups[i],p=actors[i].pos;
        root.position.set(p.x,0,p.z);root.rotation.y=p.yaw;
        poses[i].forEach(([,v],j)=>{parts[j].position.set(v.x,v.y,v.z);parts[j].rotation.set(v.rx,v.ry,0);});
      }
      renderer.render(scene,camera);
    }else canvasFrame(B,poses,day);
    for(const L of labels){const v=view([L.x,L.y,L.z],B),p=project(v,B);const dist=Math.hypot(L.x-player.x,L.z-player.z);
      const visible=!doorQuest&&v[2]>.8&&dist<22&&p[0]>50&&p[0]<W-50&&p[1]>48&&p[1]<H-45;
      L.el.style.display=visible?'block':'none';if(visible){L.el.style.left=p[0]+'px';L.el.style.top=p[1]+'px';}
    }
    if(doorQuest){
      for(const [i,k] of ['lane','mosque'].entries()){
        const loc=locations[k],pt=project(view([loc.x,2,loc.z-1.4],B),B),btn=doorQuest.buttons[i];
        btn.style.left=clamp(pt[0],68,W-68)+'px';btn.style.top=clamp(pt[1],55,H-48)+'px';
      }
    }
  }
  function controls(){
    const clear=()=>{keys.clear();stick.x=stick.y=0;const knob=document.querySelector('#knob');if(knob)knob.style.translate='0 0';};
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
    window.addEventListener('keydown',e=>{
      if(paused||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
      if(['KeyW','KeyA','KeyS','KeyD','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','KeyE'].includes(e.code)){
        e.preventDefault();keys.add(e.code);
      }
      if(e.code==='KeyF'&&!e.repeat){e.preventDefault();interact();}
    });
    window.addEventListener('keyup',e=>keys.delete(e.code));
    let drag=null;
    canvas.onpointerdown=e=>{if(paused)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};
    canvas.onpointermove=e=>{if(!drag||drag.id!==e.pointerId||paused)return;yaw-=(e.clientX-drag.x)*.006;pitch=clamp(pitch+(e.clientY-drag.y)*.003,.04,.78);drag.x=e.clientX;drag.y=e.clientY;};
    canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
    const pad=document.querySelector('#stick'),knob=document.querySelector('#knob');if(!pad)return;
    let finger=null;
    function update(e){
      const r=pad.getBoundingClientRect(),cap=Math.max(10,Math.min(r.width,r.height)*.36),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
      const k=Math.max(cap,Math.hypot(x,y));stick.x=x/k;stick.y=y/k;if(knob)knob.style.translate=stick.x*cap+'px '+stick.y*cap+'px';
    }
    pad.style.touchAction='none';pad.onpointerdown=e=>{if(paused)return;e.preventDefault();finger=e.pointerId;pad.setPointerCapture(finger);update(e);};
    pad.onpointermove=e=>{if(finger===e.pointerId)update(e);};
    pad.onpointerup=pad.onpointercancel=()=>{finger=null;clear();};
  }
  function init(){
    if(ready)return;host=document.querySelector('#scene');if(!host)return;ready=true;
    terrain();propSetup();actorsSetup();if(!webgl()){canvas=document.createElement('canvas');ctx=canvas.getContext('2d');host.appendChild(canvas);}
    Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',touchAction:'none',display:'block'});
    canvas.setAttribute('aria-label','الحارة القديمة في الحمراء، عالم قابل للاستكشاف');
    overlay=document.createElement('div');Object.assign(overlay.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'});host.appendChild(overlay);
    for(const L of labels){const b=document.createElement('button');b.type='button';b.textContent=L.name;b.title='انتقل إلى '+L.name;
      Object.assign(b.style,{position:'absolute',transform:'translate(-50%,-100%)',background:'#214b41',color:'#fff4d6',border:'1px solid #dfcfa9',borderRadius:'4px',font:'600 13px inherit',padding:'3px 8px',whiteSpace:'nowrap',pointerEvents:'auto',cursor:'pointer',lineHeight:'1.6'});b.onclick=()=>{if(!paused){go(L.id);interact();}};overlay.appendChild(b);L.el=b;}
    resize();if(window.ResizeObserver)new ResizeObserver(resize).observe(host);else window.addEventListener('resize',resize);
    controls();checkNear(true);frame(performance.now());
  }
  function go(id){const p=locations[id];if(!p||!ready)return;dirty=true;player.x=p.x;player.z=p.z+.55;player.yaw=Math.PI;salem.x=p.x-1.4;salem.z=p.z+.65;yaw=0;pitch=.24;checkNear(true);}
  function cancelFindDoor(){
    if(!doorQuest)return;
    clearTimeout(feedbackTimer);
    doorQuest.group.remove();doorQuest=null;dirty=true;
  }
  function findDoor(onSuccess){
    if(!ready)return;cancelFindDoor();dirty=true;
    const group=document.createElement('div');
    Object.assign(group.style,{position:'absolute',inset:'0',pointerEvents:'none'});
    const note=document.createElement('div');note.setAttribute('role','status');note.textContent='اقرأ اللافتتين. أين باب بيت سالم؟';
    Object.assign(note.style,{position:'absolute',left:'50%',top:'22%',transform:'translateX(-50%)',padding:'6px 12px',borderRadius:'12px',background:'#163d38',color:'#fff5e0',whiteSpace:'normal',textAlign:'center',maxWidth:'80%',lineHeight:'1.6'});
    group.appendChild(note);
    const buttons=['باب بيت سالم','باب المسجد'].map((name,i)=>{
      const b=document.createElement('button');b.type='button';b.textContent=name;
      Object.assign(b.style,{position:'absolute',transform:'translate(-50%,-100%)',padding:'8px 13px',pointerEvents:'auto',background:'#f7edd2',color:'#173f38',border:'2px solid #704c2d',borderRadius:'6px',fontSize:'16px',cursor:'pointer',whiteSpace:'nowrap'});
      b.onclick=()=>{
        if(i===1){note.textContent='هذه لافتة المسجد. ابحث عن كلمتي «بيت سالم».';
          clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{if(doorQuest)note.textContent='أيّ اللافتتين تدلّ على بيت سالم؟';},5000);return;}
        cancelFindDoor();go('lane');outcome('lane',true);if(typeof onSuccess==='function')onSuccess('lane');
      };
      group.appendChild(b);return b;
    });
    overlay.appendChild(group);doorQuest={group,buttons};buttons[0].focus({preventScroll:true});
  }
  function outcome(id,choice){
    const p=props[id];if(!p)return;
    p.on=id==='majlis'?choice==='accept':Boolean(choice);
    if(p.mesh)p.mesh.visible=p.on;
    const l=labels.find(item=>item.id===id);
    if(l?.el)l.el.textContent=l.name+(id==='majlis'?(p.on?' · قُدِّمت القهوة':' · شكرًا للزيارة'):id==='mosque'&&p.on?' · الحذاء على الرف':p.on?' · أهلًا بك':'');
    dirty=true;
  }
  function interact(){if(!paused&&!doorQuest&&nearest)window.openPlace?.(nearest)}
  function setPaused(value){dirty=true;paused=!!value;keys.clear();stick.x=stick.y=0;const k=document.querySelector('#knob');if(k)k.style.translate='0 0';if(paused)window.environmentTick?.({x:player.x,z:player.z,water:0,surface:'dirt',moving:false});if(ready)checkNear(true);}
  return {init,setPaused,go,interact,findDoor,cancelFindDoor,outcome,speaking(value){dirty=true;talk=!!value;}};
})();
