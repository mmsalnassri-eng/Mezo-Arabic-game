
  /* ---------- world construction ---------- */
  let B={};
  function materials(tx){
    const std=o=>new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.92,metalness:0,envMapIntensity:.32},o));
    const ns=v=>new T.Vector2(v,v);
    mats.plaster=std({map:tx.plaster.map,normalMap:tx.plaster.normalMap,normalScale:ns(.85),roughness:.96});
    mats.stone=std({map:tx.stone.map,normalMap:tx.stone.normalMap,normalScale:ns(1.1),roughness:.94});
    mats.ground=std({map:tx.ground.map,normalMap:tx.ground.normalMap,normalScale:ns(.7),roughness:1});
    mats.paving=std({map:tx.paving.map,normalMap:tx.paving.normalMap,normalScale:ns(1),roughness:.82,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
    mats.wood=std({map:tx.wood.map,normalMap:tx.wood.normalMap,roughness:.78});
    mats.bark=swayPatch(std({map:tx.bark.map,normalMap:tx.bark.normalMap,normalScale:ns(1.2),roughness:.95}));
    mats.leaves=swayPatch(std({map:tx.leaves.map,alphaTest:.45,side:T.DoubleSide,roughness:.75}));
    mats.door=std({map:tx.door.map,roughness:.66});
    mats.window=std({map:tx.window.map,roughness:.72});
    mats.rug=std({map:tx.rug.map,roughness:1});
    mats.plain=std({roughness:.8});
    mats.frond=swayPatch(std({map:tx.frond.map,alphaTest:.42,side:T.DoubleSide,roughness:.62,envMapIntensity:.7}));
    mats.frondDepth=swayPatch(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:tx.frond.map,alphaTest:.42}));
    mats.grass=swayPatch(std({map:tx.grass.map,alphaTest:.4,side:T.DoubleSide,roughness:.8}));
    mats.water=new T.MeshStandardMaterial({color:0x2b6b66,roughness:.05,metalness:.15,normalMap:tx.water,normalScale:ns(.55),transparent:true,opacity:.84,envMapIntensity:1.5});
    tx.water.repeat.set(1,24);
    waterTex=tx.water;
  }
  function heightAt(x,z){
    const r=Math.hypot(x,z+3);if(r<52)return 0;
    const hills=sstep(52,82,r)*(fbm(x*.022+7,z*.022+3,4)*17-3.5);
    const north=.3+.7*sstep(.35,-.5,(z+3)/r);
    const ridge=1-Math.abs(2*fbm(x*.0072+11,z*.0072+5,5)-1);
    return Math.max(0,hills)+Math.pow(sstep(74,160,r),1.2)*(20+92*ridge*ridge)*north;
  }
  const inGrove=(x,z)=>x<-21.5&&x>-41&&Math.abs(z)<31;
  function terrain(){
    const size=520,seg=lowTier?130:190,g=new T.PlaneGeometry(size,size,seg,seg);g.rotateX(-Math.PI/2);
    const p=g.attributes.position,uv=g.attributes.uv,col=new Float32Array(p.count*3);
    for(let i=0;i<p.count;i++){const x=p.getX(i),z=p.getZ(i);p.setY(i,heightAt(x,z));uv.setXY(i,x/5.5,z/5.5)}
    g.computeVertexNormals();const n=g.attributes.normal;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),f=fbm(x*.03,z*.03,3),slope=1-n.getY(i);
      const k=clamp(Math.max(sstep(.4,7,y),slope*2.4),0,1),band=.86+.2*Math.sin(y*.42+f*7)+.1*f;
      let r=mix(1.02,(.74+.2*f)*band,k),gg=mix(.98,(.66+.16*f)*band,k),b=mix(.93,(.63+.12*f)*band,k);
      const soil=inGrove(x,z)?.72:1-.18*sstep(.55,.8,fbm(x*.09+3,z*.09,3));r*=soil;gg*=soil*(inGrove(x,z)?.98:1);b*=soil*(inGrove(x,z)?.9:1);
      const haze=sstep(40,120,y)*.12;col[i*3]=r+haze;col[i*3+1]=gg+haze;col[i*3+2]=b+haze*1.3;
    }
    g.setAttribute('color',new T.BufferAttribute(col,3));
    const m=new T.Mesh(g,mats.ground);m.receiveShadow=true;m.matrixAutoUpdate=false;scene.add(m);
    // paved lanes
    lanes.forEach(([cx,cz,w,d],i)=>{const pg=new T.PlaneGeometry(w,d,Math.ceil(w/3),Math.ceil(d/3));pg.rotateX(-Math.PI/2);
      B.paving.add(pg,M(cx,.02+i*.006,cz),(x,y,z)=>{const k=.86+.24*fbm(x*.4,z*.4,3);return [k,k*.99,k*.97]},'world',3.4)});
  }
  const plasterTint=(tint,h)=>(x,y,z)=>{const damp=.7+.3*sstep(0,1.7,y),top=1-.1*sstep(h-.7,h,y),n=.92+.16*fbm(x*.7+z*.3,y*.7,3),k=damp*top*n;return [tint[0]*k,tint[1]*k,tint[2]*k]};
  function facade(x,z,w,d,h,taper,face){
    const ang=[0,Math.PI/2,Math.PI,-Math.PI/2][face],half=(face%2?w:d)/2,width=face%2?d:w;
    const at=(lx,ly,lz=0)=>mul(M(x,0,z,ang),M(lx,ly,half*(1-taper*ly/h)+lz));
    return {at,width};
  }
  function windowAt(F,lx,ly,ww,wh,tint,trim){
    B.plaster.add(box(ww+.26,wh+.26,.1),F.at(lx,ly,.02),trim,'world',3.2);
    const g=new T.PlaneGeometry(ww,wh);B.window.add(g,F.at(lx,ly,.085),tint);
    B.wood.add(box(ww+.36,.07,.2),F.at(lx,ly-wh/2-.12,.09),[.8,.7,.6],'world',1);
  }
  function house(o){
    const {x,z,w,d,h}=o,kind=o.kind||'house',tint=o.tint||[1,.93,.86],taper=.045,col=plasterTint(tint,h);
    bounds.push([x-w/2-.3,x+w/2+.3,z-d/2-.3,z+d/2+.3]);camBounds.push(bounds[bounds.length-1]);houses.push(o);
    const trim=kind==='mosque'?[1.5,1.5,1.46]:[tint[0]*1.16,tint[1]*1.15,tint[2]*1.12];
    B.stone.add(box(w+.3,.6,d+.3),M(x,.3,z),[.95,.9,.84],'world',2.2);
    B.plaster.add(taperBox(w,h,d,taper),M(x,0,z),col,'world',3.2);
    // parapet, roof and projecting ceiling beams
    const tw=w*(1-taper),td=d*(1-taper),ph=.5,pt=.3;
    for(const [bx,bz,bw,bd] of [[0,td/2-pt/2,tw,pt],[0,-td/2+pt/2,tw,pt],[tw/2-pt/2,0,pt,td],[-tw/2+pt/2,0,pt,td]])
      B.plaster.add(box(bw,ph,bd,Math.max(2,bw|0),1,Math.max(2,bd|0)),M(x+bx,h+ph/2-.02,z+bz),(px,py,pz)=>{const c=col(px,h-.2,pz);return [c[0]*1.03,c[1]*1.03,c[2]*1.03]},'world',3.2);
    for(const [cx,cz] of [[1,1],[1,-1],[-1,1],[-1,-1]])B.plaster.add(taperBox(.44,.42,.44,.5,1),M(x+cx*(tw/2-.2),h+ph-.04,z+cz*(td/2-.2)),col(x,h-.2,z).map(v=>v*1.05),'world',3.2);
    const roof=new T.PlaneGeometry(tw-.5,td-.5);roof.rotateX(-Math.PI/2);B.plaster.add(roof,M(x,h+.06,z),[tint[0]*.82,tint[1]*.8,tint[2]*.76],'world',3.2);
    for(const face of [0,2]){const F=facade(x,z,w,d,h,taper,face);
      for(let bx=-F.width/2+.6;bx<F.width/2-.3;bx+=.95){const g=new T.CylinderGeometry(.065,.075,.62,7);g.rotateX(Math.PI/2);B.wood.add(g,F.at(bx,h-.52,.1),[.62,.5,.4])}}
    // drain spouts with stains on the side walls
    for(const face of [1,3]){const F=facade(x,z,w,d,h,taper,face);const sx=rr(-F.width*.3,F.width*.3);
      B.wood.add(box(.14,.1,.85),F.at(sx,h-.12,.3),[.7,.58,.46],'world',1);
      if(F.width>4.5){const wy=h>5?h-1.7:h*.55;windowAt(F,rr(-.8,.8),wy,.7,.9,[.9,.78,.66],trim)}
      for(let i=0;i<3;i++)B.dark.add(box(.14,.3,.06),F.at(-F.width*.25+i*.42+sx*.2,h-.95,.0))}
    // front face: door, threshold, windows
    const F=facade(x,z,w,d,h,taper,0),dw=kind==='house'?1.2:1.75,dh=kind==='house'?2.15:2.5,doorTint=o.door||[.82,.62,.46];
    B.plaster.add(box(dw+.62,dh+.48,.14),F.at(0,(dh+.3)/2+.12,.0),trim,'world',3.2);
    if(kind!=='house'){const s=new T.Shape();s.absarc(0,0,dw/2+.31,0,Math.PI,false);const eg=new T.ExtrudeGeometry(s,{depth:.14,bevelEnabled:false,curveSegments:14});B.plaster.add(eg,F.at(0,dh+.36,-.07),trim,'world',3.2);
      const s2=new T.Shape();s2.absarc(0,0,dw/2-.02,0,Math.PI,false);B.dark.add(new T.ShapeGeometry(s2,14),F.at(0,dh+.34,.085));
      for(let i=-2;i<=2;i++){const sp=box(.05,dw*.44,.04);sp.translate(0,dw*.22,0);B.wood.add(sp,mul(F.at(0,dh+.34,.1),M(0,0,0,0,0,i*.5)),[.5,.38,.28])}}
    B.door.add(new T.PlaneGeometry(dw,dh),F.at(0,dh/2+.3,.09),doorTint);
    B.wood.add(box(.13,dh+.1,.16),F.at(-dw/2-.06,dh/2+.32,.1),[.6,.46,.36],'world',1).add(box(.13,dh+.1,.16),F.at(dw/2+.06,dh/2+.32,.1),[.6,.46,.36],'world',1).add(box(dw+.5,.16,.2),F.at(0,dh+.4,.11),[.56,.43,.33],'world',1);
    B.stone.add(box(dw+.9,.3,1.0),F.at(0,.15,.5),[1.05,1,.94],'world',2.2).add(box(dw+1.5,.14,1.5),F.at(0,.07,.75),[1,.95,.9],'world',2.2);
    const floors=h>5.2?2:1;
    for(let fl=0;fl<floors;fl++)for(const s of [-1,1]){const wx=s*w*.31,wy=(floors===2?1.75:1.9)+fl*2.25;if(Math.abs(wx)-.5<dw/2+.5&&fl===0&&w<5.4)continue;
      windowAt(F,wx,wy,.82,fl?1.0:1.12,[.9,.78,.66].map(v=>v*rr(.85,1.05)),trim)}
    if(floors===2)windowAt(F,0,4.05,.7,.9,[.85,.74,.62],trim);
    for(let i=0;i<Math.floor(w/1.4);i++)B.dark.add(box(.13,.26,.06),F.at(-w/2+.9+i*1.4,h-1.0,.0));
    if(kind==='mosque'){
      const tx0=x+w*.3,tz=z-.4;
      B.plaster.add(taperBox(1.5,3.3,1.5,.12),M(tx0,h-.3,tz),plasterTint([1.42,1.4,1.34],9),'world',3.2);
      B.plaster.add(new T.CylinderGeometry(.5,.62,1.6,14),M(tx0,h+3.75,tz),[1.45,1.43,1.37],'world',3.2);
      B.plaster.add(new T.CylinderGeometry(.78,.66,.16,14),M(tx0,h+3.0,tz),[1.3,1.28,1.2],'world',3.2);
      B.plaster.add(new T.SphereGeometry(.55,16,10,0,6.2832,0,Math.PI/2),M(tx0,h+4.52,tz,0,0,0,1,1.25,1),[1.5,1.48,1.4],'world',3.2);
      B.plain.add(new T.CylinderGeometry(.02,.03,.55,6),M(tx0,h+5.4,tz),[.9,.7,.3]);
      B.plaster.add(new T.SphereGeometry(1.75,24,12,0,6.2832,0,Math.PI/2),M(x-w*.16,h+.05,z-.2,0,0,0,1,.8,1),[1.5,1.48,1.42],'world',3.2);
    }
    if(o.stairs){const s=o.stairs,n=Math.round(h/.3);for(let i=0;i<n;i++)B.plaster.add(box(1,.3*(i+1),.42),M(x+s*(w/2+.5),.15*(i+1),z-d/2+.4+i*.42),col,'world',3.2);
      bounds.push([x+(s>0?w/2:-w/2-1.1),x+(s>0?w/2+1.1:-w/2),z-d/2,z-d/2+n*.42+.2])}
  }
  function ruin(x,z,len,ry,hm,tint=[.98,.9,.82]){
    const g=new T.BoxGeometry(len,hm,.55,Math.ceil(len*2.2),3,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++){const px=p.getX(i);let y=p.getY(i)+hm/2;const top=hm*(.35+.65*fbm(px*.55+x,z*.3,3))*(1-.5*sstep(len*.2,len*.5,Math.abs(px)));
      p.setY(i,y/hm*top);p.setZ(i,p.getZ(i)*(1-.3*y/hm)+(vnoise(px*2,y*2)-.5)*.08)}
    g.computeVertexNormals();B.plaster.add(g,M(x,0,z,ry),plasterTint(tint,hm),'world',3.2);
    const c=Math.abs(Math.cos(ry)),s=Math.abs(Math.sin(ry)),hx=len/2*c+.35*s+.1,hz=len/2*s+.35*c+.1;const b=[x-hx,x+hx,z-hz,z+hz];bounds.push(b);if(hm>2)camBounds.push(b);
  }
  function lowWall(x0,z0,x1,z1,hh=.75){
    const len=Math.hypot(x1-x0,z1-z0),ry=Math.atan2(-(z1-z0),x1-x0),g=new T.BoxGeometry(len,hh,.38,Math.ceil(len),1,1),p=g.attributes.position;
    for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setY(i,p.getY(i)+(vnoise(p.getX(i)*.8+x0,z0)-.5)*.22);p.setZ(i,p.getZ(i)*.7)}
    g.computeVertexNormals();B.plaster.add(g,M((x0+x1)/2,hh/2,(z0+z1)/2,ry),plasterTint([.9,.8,.7],hh+.6),'world',3.2);
    bounds.push([Math.min(x0,x1)-.25,Math.max(x0,x1)+.25,Math.min(z0,z1)-.25,Math.max(z0,z1)+.25]);
  }
  function frondGeo(len,droop,width){
    const N=7,pos=[],uv=[],idx=[];
    for(let i=0;i<=N;i++){const k=i/N,z=len*k*(1-.12*k*droop),y=-droop*len*k*k*.62+Math.sin(k*Math.PI)*len*.07,fold=.34*(1-.4*k),hw=width/2;
      pos.push(-hw*Math.cos(fold),y+hw*Math.sin(fold),z, 0,y,z, hw*Math.cos(fold),y+hw*Math.sin(fold),z);uv.push(0,k,.5,k,1,k);
      if(i<N){const a=i*3;idx.push(a,a+1,a+3,a+1,a+4,a+3,a+1,a+2,a+4,a+2,a+5,a+4)}}
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
  }
  function palm(x,z,h){
    palmsList.push([x,z]);bounds.push([x-.36,x+.36,z-.36,z+.36]);const gy=heightAt(x,z)-.15;
    const lean=rr(.15,.9),la=rr(0,6.28),lx=Math.cos(la)*lean,lz=Math.sin(la)*lean,seg=9;
    const g=new T.CylinderGeometry(.2,.32,h,10,seg,true),p=g.attributes.position,u=g.attributes.uv;
    for(let i=0;i<p.count;i++){const y=p.getY(i)+h/2,k=y/h,bulge=1+.35*sstep(.86,1,k)+.3*sstep(.1,0,k);p.setXYZ(i,p.getX(i)*bulge+lx*k*k,y,p.getZ(i)*bulge+lz*k*k);u.setY(i,u.getY(i)*h/1.6)}
    g.computeVertexNormals();const shade=rr(.85,1.05);B.bark.add(g,M(x,gy,z),(px,py)=>{const k=(.7+.3*sstep(0,1.5,py-gy))*shade;return [k,k,k]},null,1,(i,px,py)=>Math.pow(clamp((py-gy)/h,0,1),2)*.35);
    const top=[x+lx,gy+h,z+lz],count=lowTier?15:21,off=rr(0,6.28);
    B.bark.add(new T.SphereGeometry(.42,10,8),M(top[0],top[1]-.05,top[2],0,0,0,1,1.1,1),[.8,.72,.6],null,1,()=>.35);
    for(let i=0;i<count;i++){
      const ring=i/count,a=off+i*2.39996,el=mix(1.15,-.5,Math.pow(ring,.8))+rr(-.12,.12),len=h*rr(.42,.56)*(.72+.5*Math.sin(Math.PI*clamp(ring+.2,0,1))),dead=ring>.86;
      const tint=dead?[.72,.58,.36]:[rr(.72,1),rr(.86,1.08),rr(.6,.85)];
      B.frond.add(frondGeo(len,rr(.35,.8)+ring*.5,rr(.95,1.25)),M(top[0],top[1]+.05,top[2],a,-el,rr(-.25,.25)),tint,null,1,(vi,px,py,pz)=>{const k=Math.min(1,Math.hypot(px-top[0],py-top[1],pz-top[2])/len);return .35+k*k*1.5});
    }
    // date clusters
    for(let i=0;i<3;i++){const a=off+i*2.1;B.plain.add(new T.SphereGeometry(.2,7,6),M(top[0]+Math.cos(a)*.5,top[1]-.55,top[2]+Math.sin(a)*.5,0,0,0,1,1.5,1),[.78,.5,.16],null,1,()=>.35)}
  }
  function tree(x,z){ // a spreading ghaf tree for shade
    bounds.push([x-.4,x+.4,z-.4,z+.4]);
    const g=new T.CylinderGeometry(.22,.42,3.2,8,5),p=g.attributes.position;for(let i=0;i<p.count;i++){const k=(p.getY(i)+1.6)/3.2;p.setX(i,p.getX(i)+Math.sin(k*3)*.25)}g.computeVertexNormals();
    B.bark.add(g,M(x,1.6,z),[.62,.55,.5]);
    for(let i=0;i<5;i++){const a=i*1.26,g2=new T.CylinderGeometry(.06,.14,2.4,6);g2.translate(0,1.2,0);B.bark.add(g2,M(x+.1,2.9,z,a,0,.85),[.6,.54,.5])}
    for(let i=0;i<(lowTier?22:40);i++){const a=rr(0,6.28),r=rr(.2,3.1),gy=4.3+rr(-.6,1.0)-r*.25,s=rr(1.5,2.5),c=rr(.7,1.1);
      for(let k=0;k<3;k++)B.leaves.add(new T.PlaneGeometry(s,s*.7),M(x+Math.cos(a)*r,gy,z+Math.sin(a)*r,k*1.05+a,rr(-.5,.5),0),[.8*c,c,.72*c],null,1,()=>.5)}
  }
  function rock(x,z,s){const g=new T.SphereGeometry(1,9,7),p=g.attributes.position,q=x*7.3+z*3.1;
    for(let i=0;i<p.count;i++){const px=p.getX(i),py=p.getY(i),pz=p.getZ(i),n=.68+.6*fbm(px*1.3+q,py*1.3+pz*1.7+q,3);p.setXYZ(i,px*n,py*n*.62,pz*n)}
    g.computeVertexNormals();const c=rr(.8,1.1);B.stone.add(g,M(x,heightAt(x,z)+s*.18,z,rr(0,6),0,0,s),[c,c*.96,c*.9],'world',1.6)}
  function tuft(x,z,s,tint){for(let i=0;i<2;i++){const g=new T.PlaneGeometry(s*1.4,s);g.translate(0,s/2,0);B.grass.add(g,M(x,0,z,i*1.57+rr(0,1)),tint,null,1,(vi,px,py)=>py/s*.5)}}
  function jar(x,z,s,tint=[1,.62,.42]){
    const pts=[[.0,0],[.16,0],[.3,.18],[.36,.42],[.3,.68],[.16,.82],[.14,.9],[.19,.94],[.16,.96],[.12,.9]].map(p=>new T.Vector2(p[0],p[1]));
    B.plain.add(new T.LatheGeometry(pts,16),M(x,0,z,rr(0,6),0,0,s),(px,py)=>{const k=.75+.25*sstep(0,.6*s,py);return tint.map(v=>v*k)});
  }
  function falaj(){
    const fx=-20,len=92;
    for(const s of [-1,1])B.stone.add(box(.42,.4,len,1,1,40),M(fx+s*.96,.2,0),[1,.96,.9],'world',1.8);
    const floor=new T.PlaneGeometry(1.5,len);floor.rotateX(-Math.PI/2);B.stone.add(floor,M(fx,.04,0),[.45,.5,.46],'world',1.8);
    const wg=new T.PlaneGeometry(1.5,len,1,1);wg.rotateX(-Math.PI/2);const water=new T.Mesh(wg,mats.water);water.position.set(fx,.27,0);water.receiveShadow=true;scene.add(water);
    for(const bz of [-8,12]){B.stone.add(box(3.4,.22,3.2,3,1,3),M(fx,.42,bz),[1.08,1.04,.98],'world',2).add(box(.5,.36,3.2),M(fx-1.9,.16,bz,0,0,-.3),[1,.96,.9],'world',2).add(box(.5,.36,3.2),M(fx+1.9,.16,bz,0,0,.3),[1,.96,.9],'world',2)}
    for(const [a,b] of [[-46,-9.75],[-6.25,10.25],[13.75,46]])bounds.push([fx-1.2,fx+1.2,a,b]);
    for(let i=0;i<(lowTier?70:150);i++){const z=rr(-40,40),s=rand()<.5?-1:1;tuft(fx+s*rr(1.35,2.3),z,rr(.35,.8),[rr(.7,1),rr(.9,1.1),rr(.6,.8)])}
  }
  function gardens(){
    for(let gx=0;gx<3;gx++)for(let gz=0;gz<7;gz++){
      const cx=-26+gx*-5.2,cz=-25+gz*8.2,w=4.3,d=6.6,pg=new T.PlaneGeometry(w,d,6,8);pg.rotateX(-Math.PI/2);
      const green=(gx+gz)%3!==0;B.plain.add(pg,M(cx,.05,cz),(x,y,z)=>{const k=.7+.5*fbm(x*1.3,z*1.3,3);return green?[.2*k,.42*k,.14*k]:[.42*k,.33*k,.22*k]});
      if(green)for(let i=0;i<(lowTier?10:22);i++)tuft(cx+rr(-w/2,w/2),cz+rr(-d/2,d/2),rr(.3,.55),[rr(.6,.9),rr(.95,1.2),rr(.5,.7)]);
      for(const [a,b,c,e] of [[-w/2,-d/2,w/2,-d/2],[-w/2,d/2,w/2,d/2]]){const g=box(w+.3,.2,.28);B.plaster.add(g,M(cx,.1,cz+(b<0?-d/2-.15:d/2+.15)),[.72,.62,.5],'world',3.2)}
    }
    lowWall(-22.4,-30,-22.4,-10.2);lowWall(-22.4,-5.8,-22.4,9.8);lowWall(-22.4,14.2,-22.4,30);
  }
  function well(x,z){
    const pts=[[.75,0],[.95,0],[.98,.75],[.9,.86],[.74,.86],[.72,.1]].map(p=>new T.Vector2(p[0],p[1]));
    B.stone.add(new T.LatheGeometry(pts,18),M(x,0,z),[1,.96,.9],'world',1.4);
    const wd=new T.CircleGeometry(.72,18);wd.rotateX(-Math.PI/2);B.dark.add(wd,M(x,.12,z));
    for(const s of [-1,1])B.wood.add(new T.CylinderGeometry(.07,.09,2.3,7),M(x+s*1.08,1.15,z),[.62,.5,.4]);
    const beam=new T.CylinderGeometry(.07,.07,2.5,7);beam.rotateZ(Math.PI/2);B.wood.add(beam,M(x,2.2,z),[.6,.48,.38]);
    B.wood.add(new T.CylinderGeometry(.012,.012,1.15,5),M(x+.1,1.62,z),[.9,.84,.7]);
    B.wood.add(new T.CylinderGeometry(.17,.13,.28,10),M(x+.1,.98,z),[.7,.56,.42]);
    bounds.push([x-1.25,x+1.25,z-1.1,z+1.1]);
  }
  function signPost(id,loc){
    const x=loc.x+1.55,z=loc.z-.4;
    B.wood.add(new T.CylinderGeometry(.06,.075,2.5,8),M(x,1.25,z),[.58,.46,.36]);
    B.wood.add(box(1.72,.9,.07),M(x,1.95,z+.07),[.6,.48,.38],'world',1);
    const m=new T.Mesh(new T.PlaneGeometry(1.6,.8),new T.MeshStandardMaterial({map:signTex(loc),roughness:.6}));m.position.set(x,1.95,z+.112);scene.add(m);
    const back=m.clone();back.rotation.y=Math.PI;back.position.z=z+.028;scene.add(back);
    labels.push({id,x,y:2.75,z,name:loc.name,pron:loc.pron,en:loc.en});
  }
  function populate(){
    const tints=[[1,.9,.8],[.96,.85,.74],[1.06,.97,.87],[.9,.78,.68],[1.02,.94,.82]],teal=[.42,.72,.7],blue=[.45,.6,.82];
    const H=(x,z,w,d,h,extra={})=>house(Object.assign({x,z,w,d,h,tint:tints[houses.length%5]},extra));
    H(5,2,5,5.1,4.75,{door:teal});H(12,1,6.6,6.3,6.25,{stairs:1});H(-5.6,5.2,5,5,4.4);H(-12,4.4,5.6,6.1,5.6,{door:blue});
    H(-7,-14.2,7.5,7,4.4,{kind:'majlis',tint:[1.04,.95,.84]});H(-15.2,-15,6.4,6.2,5.9);
    H(18,-23.1,8.3,7.4,4.5,{kind:'mosque',tint:[1.36,1.34,1.28],door:[.5,.72,.62]});
    H(5.2,-18,5,6,5.85,{door:teal});H(11,-17.4,6,6.5,4.8);
    H(24,-6,6,6,5.6,{door:blue});H(24.5,2.5,5.5,5.5,4.2);H(6.5,13,5.5,5.5,5.4,{stairs:1});H(-8,15,5.5,5,4.6,{door:teal});
    H(7,21.5,6,5,4);H(-7,23.5,5,5,5.5);H(-4.6,-24.5,5.4,5,5.2);H(-13,22,5,5.5,4.3);
    for(let i=0;i<10;i++)H(-28+i*5.9,-36-(i%3)*2.2,4.9,5.2,3.6+rand()*3.2);
    for(let i=0;i<7;i++)H(-24+i*8.2+rr(-1,1),-45-rr(0,3),5.5,5.5,4+rand()*4);
    ruin(-3.4,15.5,5.5,Math.PI/2,3.4);ruin(-1.2,18.4,4,0,2.2);ruin(28.5,-13,6,Math.PI/2,3.8,[.92,.82,.72]);ruin(26,-16.2,5,0,2.6,[.92,.82,.72]);
    ruin(13,9.5,5,0,1.5);ruin(-15.5,9.2,4.5,.0,2.8);ruin(-17.2,-7.5,3,Math.PI/2,1.4);
    lowWall(8.2,-12.6,13.6,-12.6,.9);lowWall(20.5,10,27,10,.8);lowWall(27,10,27,15,.8);
    for(const v of [[-16,11,7.2],[-11,13.5,8.4],[-17.4,0,7.6],[-17.6,-22,8.4],[12,11.8,8],[17,9,8.8],[21,-11,7.4],[24.5,-30,8.8],[.4,-28.6,7.4],[-10,-28,7.6],[16,20,6.8],[4,27,7.6],[-3.5,29,8.4],[30,4,7.8],[30.5,-22,8],[-16.5,18,8],[12.5,27,8.6],[22,27,7.4],[29,21,8.2],[-12,31,7.8]])palm(...v);
    for(let gx=0;gx<4;gx++)for(let gz=0;gz<9;gz++){if((gx+gz*2)%5===0)continue;palm(-23.4-gx*5.2+rr(-.7,.7),-29+gz*7.2+rr(-1.2,1.2),rr(6.4,9.4))}
    for(let i=0;i<14;i++){const a=rr(0,6.28),r=rr(44,66);palm(Math.cos(a)*r*1.0-8,Math.sin(a)*r+2,rr(6,9))}
    tree(24.5,8);tree(-2.8,-4.2);
    falaj();gardens();well(-12.5,-3.2);
    for(const [id,loc] of Object.entries(locations))signPost(id,loc);
    // everyday objects
    jar(7.7,5.2,1.05);jar(8.45,5.05,.8,[.95,.7,.5]);jar(8.1,5.75,.6);jar(-9.4,-10.2,1.1);jar(-10.1,-10.4,.75,[.9,.68,.5]);jar(14.1,4.7,.9);jar(21.7,-19.0,.9);jar(-2.9,7.2,.8);
    const bench=(x,z,ry)=>{B.plaster.add(box(2.4,.45,.7,3,1,1),M(x,.225,z,ry),plasterTint([1.02,.93,.82],1.2),'world',3.2)};
    bench(2.9,5.0,0);bench(-9.9,-10.25,0);bench(13.2,-19.2,Math.PI/2);bench(-3.4,-3.4,Math.PI/2);
    const rug=(x,z,w,d,ry)=>{const g=new T.PlaneGeometry(w,d);g.rotateX(-Math.PI/2);B.rug.add(g,M(x,.045,z,ry),[1,1,1])};
    rug(-6.2,-8.9,3.4,2,0);rug(22.2,17.6,3,1.8,.3);
    for(let i=0;i<60;i++)B.plain.add(new T.SphereGeometry(.035,5,4),M(22.2+rr(-1.3,1.3),.08,17.6+rr(-.7,.7)),[.62,.3,.1]);
    // firewood stack and ladder
    for(let i=0;i<9;i++){const g=new T.CylinderGeometry(.06,.07,1.3,6);g.rotateZ(Math.PI/2);B.wood.add(g,M(15.6+rr(-.05,.05),.08+(i/3|0)*.13,5+(i%3)*.15),[rr(.5,.7),.45,.34])}
    for(const s of [-1,1])B.wood.add(new T.CylinderGeometry(.035,.035,4.2,6),M(-2.75+s*.22,2.0,3.1,0,-.2,0),[.6,.48,.36]);
    for(let i=0;i<8;i++){const g=new T.CylinderGeometry(.025,.025,.46,5);g.rotateZ(Math.PI/2);B.wood.add(g,M(-2.75,.45+i*.45,3.48-i*.092),[.58,.46,.34])}
    bounds.push([-3.2,-2.3,2.6,3.6]);
    for(let i=0;i<(lowTier?45:95);i++){let x=rr(-40,36),z=rr(-34,36);if(blocked(x,z,.7)||lanes.some(l=>Math.abs(x-l[0])<l[2]/2+.2&&Math.abs(z-l[1])<l[3]/2+.2))continue;rock(x,z,rr(.12,.5))}
    for(let i=0;i<26;i++){const a=rr(0,6.28),r=rr(46,95);rock(Math.cos(a)*r,Math.sin(a)*r,rr(.8,2.6))}
    for(let i=0;i<(lowTier?40:90);i++){let x=rr(-42,38),z=rr(-34,38);if(blocked(x,z,.5)||lanes.some(l=>Math.abs(x-l[0])<l[2]/2&&Math.abs(z-l[1])<l[3]/2))continue;tuft(x,z,rr(.25,.5),[rr(.9,1.1),rr(.85,1),rr(.5,.6)])}
  }
  function propSetup(){
    const metal=new T.MeshStandardMaterial({color:0x2c2622,roughness:.5,metalness:.7}),brass=new T.MeshStandardMaterial({color:0xc79a45,roughness:.3,metalness:.85,envMapIntensity:1.4});
    const cer=new T.MeshStandardMaterial({color:0xf2ead8,roughness:.35}),leather=new T.MeshStandardMaterial({color:0x4a3526,roughness:.7});
    // lantern beside Salim's door
    const lan=new T.Group();lan.position.set(6.02,2.05,4.78);
    const cage=new T.Mesh(new T.CylinderGeometry(.09,.11,.26,6,1,true),new T.MeshStandardMaterial({color:0x2c2622,roughness:.5,metalness:.7,wireframe:true}));lan.add(cage);
    const capm=new T.Mesh(new T.ConeGeometry(.15,.13,6),metal);capm.position.y=.2;lan.add(capm);const arm=new T.Mesh(new T.BoxGeometry(.03,.03,.3),metal);arm.position.set(0,.28,-.12);lan.add(arm);scene.add(lan);
    const glow=new T.Group();const bulb=new T.Mesh(new T.SphereGeometry(.07,10,8),new T.MeshBasicMaterial({color:0xffd27a}));glow.add(bulb);const pl=new T.PointLight(0xffb45a,1.6,9,2);glow.add(pl);glow.position.copy(lan.position);scene.add(glow);
    // coffee tray at the sabla
    B.wood.add(box(1.0,.07,.62),M(-5.5,.4,-9.4),[.7,.56,.42],'world',1);for(const s of [-1,1])B.wood.add(box(.08,.37,.5),M(-5.5+s*.4,.185,-9.4),[.62,.5,.38],'world',1);
    const coffee=new T.Group();const tray=new T.Mesh(new T.CylinderGeometry(.36,.36,.02,24),brass);tray.position.y=.45;coffee.add(tray);
    const dpts=[[0,0],[.08,0],[.11,.06],[.07,.16],[.05,.24],[.075,.27],[.03,.34],[0,.36]].map(p=>new T.Vector2(p[0],p[1]));
    const dallah=new T.Mesh(new T.LatheGeometry(dpts,16),brass);dallah.position.set(-.12,.46,.02);coffee.add(dallah);
    const spout=new T.Mesh(new T.ConeGeometry(.025,.16,8),brass);spout.position.set(-.22,.66,.02);spout.rotation.z=1.1;coffee.add(spout);
    for(let j=0;j<3;j++){const cup=new T.Mesh(new T.CylinderGeometry(.04,.028,.05,12),cer);cup.position.set(.1+(j%2)*.11,.485,-.1+j*.1);coffee.add(cup)}
    coffee.position.set(-5.5,0,-9.4);coffee.traverse(o=>{if(o.isMesh)o.castShadow=true});scene.add(coffee);
    // shoe rack at the mosque
    B.wood.add(box(1.4,.06,.6),M(20.3,.36,-18.96),[.66,.53,.4],'world',1).add(box(1.4,.06,.6),M(20.3,.72,-18.96),[.66,.53,.4],'world',1);
    for(const s of [-1,1])B.wood.add(box(.08,.8,.6),M(20.3+s*.68,.4,-18.96),[.6,.48,.36],'world',1);
    const shoes=new T.Group();for(const sx of [-.11,.11]){const s=new T.Mesh(new T.BoxGeometry(.13,.09,.34),leather);s.position.set(20.1+sx,.435,-18.94);s.castShadow=true;shoes.add(s)}scene.add(shoes);
    bounds.push([19.5,21.1,-19.4,-18.5]);
    props.lane={on:false,mesh:glow};props.majlis={on:false,mesh:coffee};props.mosque={on:false,mesh:shoes};
    for(const p of Object.values(props))p.mesh.visible=false;
  }
  function sky(){
    const frag=`uniform vec3 sunDir;uniform float uTime;varying vec3 vDir;
      float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x),mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x),f.y);}
      float fb(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n2(p);p*=2.03;a*=.5;}return s;}
      void main(){vec3 d=normalize(vDir);float h=max(d.y,0.);
        vec3 zen=vec3(.045,.16,.5),hor=vec3(.5,.62,.78);vec3 col=mix(hor,zen,pow(h,.45));
        float s=max(dot(d,sunDir),0.);col+=vec3(1.,.7,.4)*pow(s,5.)*.3*(1.-h*.5);col+=vec3(1.,.9,.72)*(pow(s,1100.)*18.+pow(s,70.)*.45);
        vec2 uv=d.xz/(d.y+.2)*1.3+uTime*.0035;float c=smoothstep(.6,.92,fb(uv))*smoothstep(.0,.2,d.y);
        vec3 cc=mix(vec3(.74,.74,.78),vec3(1.,.97,.92),smoothstep(.3,.9,fb(uv*1.7+3.)));col=mix(col,cc,c*.7);col=mix(col,vec3(.72,.7,.66),(1.-smoothstep(0.,.16,d.y))*.55);
        if(d.y<0.)col=mix(hor,vec3(.36,.29,.21),smoothstep(0.,-.1,d.y));
        gl_FragColor=vec4(col,1.);
        #include <tonemapping_fragment>
        #include <encodings_fragment>
      }`;
    const mat=new T.ShaderMaterial({uniforms:{sunDir:{value:new T.Vector3(...SUN).normalize()},uTime},side:T.BackSide,depthWrite:false,fog:false,
      vertexShader:'varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position.z=gl_Position.w;}',fragmentShader:frag});
    const dome=new T.Mesh(new T.SphereGeometry(400,32,16),mat);dome.frustumCulled=false;dome.renderOrder=-1;
    try{const es=new T.Scene();es.add(dome);const pm=new T.PMREMGenerator(renderer);scene.environment=pm.fromScene(es,0,.1,1000).texture;pm.dispose()}catch(e){}
    scene.add(dome);return dome;
  }
  function ambientLife(tx){
    const n=lowTier?120:260,pos=new Float32Array(n*3);for(let i=0;i<n*3;i++)pos[i]=rr(-14,14);
    const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(pos,3));
    dust=new T.Points(g,new T.PointsMaterial({map:tx.dot.map,size:.07,transparent:true,opacity:.42,depthWrite:false,color:0xffe9c4,sizeAttenuation:true}));dust.frustumCulled=false;scene.add(dust);
    birds=[];const bm=new T.MeshBasicMaterial({color:0x2a2622,side:T.DoubleSide});
    for(let i=0;i<5;i++){const grp=new T.Group();for(const s of [-1,1]){const wg=new T.BufferGeometry();wg.setAttribute('position',new T.Float32BufferAttribute([0,0,-.12, 0,0,.14, s*.62,.05,-.05],3));const wing=new T.Mesh(wg,bm);grp.add(wing)}
      grp.userData={r:rr(18,46),h:rr(24,40),sp:rr(.12,.22)*(i%2?1:-1),ph:rr(0,6.28)};scene.add(grp);birds.push(grp)}
  }
  function buildWorld(){
    const tx=textures();materials(tx);
    for(const k of ['plaster','stone','paving','wood','bark','door','window','rug','plain','frond','grass','leaves','dark'])B[k]=new Batch();
    mats.dark=new T.MeshStandardMaterial({color:0x0f0c0a,roughness:1,vertexColors:false});
    terrain();populate();propSetup();
    for(const k of Object.keys(B)){if(!B[k].p.length)continue;const m=B[k].mesh(mats[k],k!=='paving'&&k!=='rug'&&k!=='dark'&&k!=='grass');
      if(k==='leaves'){m.customDepthMaterial=swayPatch(new T.MeshDepthMaterial({depthPacking:T.RGBADepthPacking,map:tx.leaves.map,alphaTest:.45}))}
      if(k==='frond')m.customDepthMaterial=mats.frondDepth;scene.add(m)}
    B=null;ambientLife(tx);return tx;
  }
