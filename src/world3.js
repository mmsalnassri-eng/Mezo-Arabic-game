
  /* ---------- characters ---------- */
  function limb(parent,x,y,z,rTop,rBot,len,mat){
    const grp=new T.Group();grp.position.set(x,y,z);const g=new T.CylinderGeometry(rTop,rBot,len,12);g.translate(0,-len/2,0);
    const m=new T.Mesh(g,mat);m.castShadow=true;grp.add(m);const j=new T.Mesh(new T.SphereGeometry(rTop*1.02,12,8),mat);j.castShadow=true;grp.add(j);parent.add(grp);return grp;
  }
  function lathe(points,mat,sz=.74,seg=22){const g=new T.LatheGeometry(points.map(p=>new T.Vector2(p[0],p[1])),seg);g.scale(1,1,sz);g.computeVertexNormals();const m=new T.Mesh(g,mat);m.castShadow=true;return m}
  function headOf(o,tx){
    const head=new T.Group(),skin=new T.MeshStandardMaterial({color:o.skin,roughness:.62,envMapIntensity:.4});
    const face=new T.Mesh(new T.SphereGeometry(.112,26,20),new T.MeshStandardMaterial({map:faceTex(o.skin,o.hair||'#1c1512',o.beard).map,roughness:.6,envMapIntensity:.4}));face.scale.set(.9,1.14,1);face.castShadow=true;head.add(face);
    const nose=new T.Mesh(new T.SphereGeometry(.021,10,8),skin);nose.scale.set(.9,1.5,1.1);nose.position.set(0,-.012,.106);head.add(nose);
    for(const s of [-1,1]){const ear=new T.Mesh(new T.SphereGeometry(.024,8,8),skin);ear.scale.set(.5,1.2,.8);ear.position.set(s*.1,0,.0);head.add(ear)}
    if(o.head==='kumma'){const km=tx.kumma.map.clone();km.needsUpdate=true;km.repeat.set(3,1);km.wrapS=T.RepeatWrapping;
      const band=new T.Mesh(new T.CylinderGeometry(.104,.108,.085,24,1,true),new T.MeshStandardMaterial({map:km,roughness:.9,color:o.cap||'#ffffff'}));band.position.y=.098;band.castShadow=true;head.add(band);
      const topc=new T.Mesh(new T.SphereGeometry(.105,20,8,0,6.2832,0,Math.PI/2),new T.MeshStandardMaterial({color:o.cap||'#f1eadb',roughness:.9}));topc.scale.y=.18;topc.position.y=.138;head.add(topc);
    }else if(o.head==='massar'){const mm=tx.massar.map.clone();mm.needsUpdate=true;mm.repeat.set(6,1);const mat=new T.MeshStandardMaterial({map:mm,roughness:.95,color:o.cap||'#ffffff'});
      for(let i=0;i<3;i++){const tr=new T.Mesh(new T.TorusGeometry(.098-i*.008,.036,10,24),mat);tr.rotation.set(Math.PI/2+(i-1)*.12,0,i*.5);tr.position.y=.075+i*.034;tr.castShadow=true;head.add(tr)}
      const topc=new T.Mesh(new T.SphereGeometry(.085,14,8,0,6.2832,0,Math.PI/2),mat);topc.scale.y=.4;topc.position.y=.15;head.add(topc);
    }else{const hair=new T.Mesh(new T.SphereGeometry(.118,20,12,0,6.2832,0,Math.PI*.52),new T.MeshStandardMaterial({color:o.hair||'#1c1512',roughness:.9}));hair.scale.set(.92,1.1,1.02);hair.position.set(0,.012,-.012);hair.rotation.x=-.25;head.add(hair);
      const straw=new T.MeshStandardMaterial({color:0xd8bf8a,roughness:.85});const brim=new T.Mesh(new T.CylinderGeometry(.215,.225,.014,26),straw);brim.position.y=.085;brim.castShadow=true;head.add(brim);
      const crown=new T.Mesh(new T.CylinderGeometry(.098,.112,.085,22),straw);crown.position.y=.13;head.add(crown);const rib=new T.Mesh(new T.CylinderGeometry(.114,.114,.022,22),new T.MeshStandardMaterial({color:0x7a3b2a,roughness:.8}));rib.position.y=.1;head.add(rib)}
    return {head,skin};
  }
  function arms(root,rig,y,x,sleeve,skin,r=.076){
    for(const s of [-1,1]){
      const up=limb(root,s*x,y,0,r,r*.86,.29,sleeve);up.rotation.z=s*.09;const lo=limb(up,0,-.29,0,r*.84,r*.68,.26,sleeve);lo.rotation.x=-.18;
      const hand=new T.Mesh(new T.SphereGeometry(.047,10,8),skin);hand.scale.set(.8,1.2,.55);hand.position.y=-.3;hand.castShadow=true;lo.add(hand);
      rig[s<0?'armL':'armR']=up;rig[s<0?'elbowL':'elbowR']=lo;
    }
  }
  function robed(o,tx){
    const root=new T.Group(),rig={},cloth=new T.MeshStandardMaterial({color:o.robe,roughness:.88,envMapIntensity:.45});
    const body=lathe([[0,.07],[.265,.07],[.258,.3],[.232,.75],[.204,1.08],[.214,1.28],[.226,1.37],[.19,1.44],[.1,1.49],[.062,1.525],[0,1.525]],cloth);root.add(body);rig.torso=body;
    const {head,skin}=headOf(o,tx);head.position.y=1.69;root.add(head);rig.head=head;
    const neck=new T.Mesh(new T.CylinderGeometry(.05,.056,.11,12),skin);neck.position.y=1.565;root.add(neck);
    arms(root,rig,1.4,.236,cloth,skin);
    const tas=new T.Mesh(new T.CylinderGeometry(.011,.014,.11,6),new T.MeshStandardMaterial({color:o.tassel||0x8a3b2e,roughness:.8}));tas.position.set(.05,1.36,.158);root.add(tas);
    const leather=new T.MeshStandardMaterial({color:0x3d2b1e,roughness:.7});
    for(const s of [-1,1]){const f=new T.Group();f.position.set(s*.095,0,0);const sole=new T.Mesh(new T.BoxGeometry(.088,.03,.25),leather);sole.position.set(0,.018,.04);sole.castShadow=true;f.add(sole);
      const toe=new T.Mesh(new T.SphereGeometry(.045,10,8),skin);toe.scale.set(.9,.6,2.2);toe.position.set(0,.055,.05);f.add(toe);root.add(f);rig[s<0?'footL':'footR']=f}
    rig.robed=true;return {root,rig};
  }
  function visitor(o,tx){
    const root=new T.Group(),rig={},shirt=new T.MeshStandardMaterial({color:o.shirt,roughness:.85,envMapIntensity:.45}),trousers=new T.MeshStandardMaterial({color:o.trousers,roughness:.9}),shoe=new T.MeshStandardMaterial({color:0x4a3626,roughness:.75});
    const hips=new T.Group();root.add(hips);rig.hips=hips;
    const body=lathe([[0,.86],[.166,.86],[.182,.95],[.166,1.1],[.19,1.3],[.206,1.39],[.172,1.45],[.09,1.5],[.058,1.535],[0,1.535]],shirt,.68);hips.add(body);rig.torso=body;
    const belt=new T.Mesh(new T.CylinderGeometry(.172,.178,.05,18),shoe);belt.scale.z=.68;belt.position.y=.93;hips.add(belt);
    const pel=lathe([[0,.78],[.15,.8],[.176,.9],[0,.9]],trousers,.7);hips.add(pel);
    const {head,skin}=headOf(o,tx);head.position.y=1.7;hips.add(head);rig.head=head;
    const neck=new T.Mesh(new T.CylinderGeometry(.048,.054,.11,12),skin);neck.position.y=1.575;hips.add(neck);
    arms(hips,rig,1.4,.222,shirt,skin,.07);
    const pack=new T.Mesh(new T.BoxGeometry(.27,.36,.14),new T.MeshStandardMaterial({color:o.pack||0x7a4b2c,roughness:.8}));pack.position.set(0,1.2,-.2);pack.castShadow=true;hips.add(pack);
    const flap=new T.Mesh(new T.BoxGeometry(.28,.13,.15),new T.MeshStandardMaterial({color:0x5e3920,roughness:.8}));flap.position.set(0,1.33,-.2);hips.add(flap);
    for(const s of [-1,1]){const st=new T.Mesh(new T.BoxGeometry(.04,.36,.012),shoe);st.position.set(s*.11,1.3,.135);st.rotation.x=.08;hips.add(st);
      const hip=limb(root,s*.092,.9,0,.08,.064,.42,trousers),knee=limb(hip,0,-.42,0,.062,.048,.4,trousers);
      const foot=new T.Mesh(new T.BoxGeometry(.09,.075,.25),shoe);foot.position.set(0,-.43,.055);foot.castShadow=true;knee.add(foot);
      rig[s<0?'hipL':'hipR']=hip;rig[s<0?'kneeL':'kneeR']=knee}
    return {root,rig};
  }
  function actorsSetup(tx){
    const add=(pos,built)=>{scene.add(built.root);actors.push({pos,root:built.root,rig:built.rig,walk:0,phase:rand()*6})};
    add(player,visitor({skin:'#b98a66',hair:'#2a1c14',shirt:0x5d8a86,trousers:0x8b7a5c},tx));
    add(salem,robed({robe:0xf2ece0,skin:'#a87251',hair:'#17110e',beard:true,head:'kumma'},tx));
    const looks=[{robe:0xd9cdb8,skin:'#9e6b4c',hair:'#3a3a3a',beard:true,head:'massar'},{robe:0xefe6d2,skin:'#8f5f43',hair:'#e8e4dc',beard:true,head:'massar',cap:'#f4d9a6'},{robe:0xc9d6cd,skin:'#a5714f',hair:'#191210',beard:false,head:'kumma',cap:'#dbe7f2'}];
    Object.values(locations).forEach((p,i)=>add({x:p.x-.72,z:p.z-.5,yaw:.35},robed(looks[i],tx)));
    add({x:-2,z:-7,yaw:0},robed({robe:0xb9a585,skin:'#936748',hair:'#17110e',beard:true,head:'kumma',cap:'#f0e2c0'},tx));
  }
  function animate(a,dt,walking,i){
    const r=a.rig,w=a.walk+=(walking-a.walk)*Math.min(1,dt*9);a.phase+=dt*(i===0?8.2:7.4)*Math.max(.25,w);
    const p=a.phase,s=Math.sin(p),c=Math.cos(p),idle=Math.sin(t*1.5+i)*.012;
    a.root.position.set(a.pos.x,Math.abs(s)*.035*w,a.pos.z);a.root.rotation.y=a.pos.yaw;
    if(r.hipL){r.hipL.rotation.x=-s*.62*w;r.hipR.rotation.x=s*.62*w;r.kneeL.rotation.x=Math.max(0,c)*.95*w+.04;r.kneeR.rotation.x=Math.max(0,-c)*.95*w+.04;r.hips.rotation.x=.06*w;r.hips.rotation.y=s*.07*w}
    else{r.footL.position.z=s*.17*w;r.footR.position.z=-s*.17*w;r.footL.position.y=Math.max(0,c)*.05*w;r.footR.position.y=Math.max(0,-c)*.05*w;r.torso.rotation.z=s*.018*w;r.torso.scale.y=1+idle*.4}
    const sw=.5*w;r.armL.rotation.x=s*sw;r.armR.rotation.x=-s*sw;r.elbowL.rotation.x=-.18-.35*w*Math.max(0,s);r.elbowR.rotation.x=-.18-.35*w*Math.max(0,-s);
    r.head.rotation.x=idle*2;r.head.rotation.y=Math.sin(t*.4+i*2)*.12*(1-w);
    if(i===1&&talk){const g=Math.sin(talkTime*3.2);r.head.rotation.x=.05*Math.sin(talkTime*8.5);r.head.rotation.y=.05*Math.sin(talkTime*1.7);r.armR.rotation.x=-.55-.12*g;r.elbowR.rotation.x=-1.25+.25*g;r.armL.rotation.x=-.1;r.elbowL.rotation.x=-.5}
  }

  /* ---------- renderer ---------- */
  function webgl(){
    T=window.THREE;if(!T)return false;
    try{renderer=new T.WebGLRenderer({antialias:!lowTier,alpha:false,powerPreference:'high-performance',stencil:false})}catch(e){renderer=null;return false}
    canvas=renderer.domElement;host.appendChild(canvas);
    ratio=Math.min(window.devicePixelRatio||1,lowTier?1.5:2);renderer.setPixelRatio(ratio);
    renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
    scene=new T.Scene();scene.fog=new T.FogExp2(new T.Color(.6,.62,.64),.0042);
    camera=new T.PerspectiveCamera(58,1,.15,900);vec=new T.Vector3();
    scene.add(new T.HemisphereLight(0xbcd4ff,0x8a6a48,.3));
    sun=new T.DirectionalLight(0xffdfb4,2.5);sun.castShadow=true;const sm=lowTier?1024:2048;sun.shadow.mapSize.set(sm,sm);
    Object.assign(sun.shadow.camera,{left:-34,right:34,top:34,bottom:-34,near:1,far:170});sun.shadow.bias=-.0005;sun.shadow.normalBias=.05;scene.add(sun);scene.add(sun.target);
    const dome=sky();const tx=buildWorld();actorsSetup(tx);scene.userData.dome=dome;
    canvas.addEventListener('webglcontextlost',e=>{e.preventDefault()});
    canvas.addEventListener('webglcontextrestored',()=>{dirty=true});
    return true;
  }
  const hit=(list,x,z,r)=>{for(let i=0;i<list.length;i++){const b=list[i];if(x>b[0]-r&&x<b[1]+r&&z>b[2]-r&&z<b[3]+r)return true}return false};
  function blocked(x,z,r=.22){return hit(bounds,x,z,r)}
  function move(pos,dx,dz){const x=clamp(pos.x+dx,-41,36),z=clamp(pos.z+dz,-33.5,36);if(!blocked(x,pos.z))pos.x=x;if(!blocked(pos.x,z))pos.z=z}
  function positionCamera(dt){
    const sx=Math.sin(yaw),cz=Math.cos(yaw),rx=cz,rz=-sx,side=.42,px=player.x+rx*side,pz=player.z+rz*side;
    const cp=Math.cos(pitch),sp=Math.sin(pitch);let dist=zoom;
    for(let q=.5;q<=zoom;q+=.22){if(hit(camBounds,px+sx*q*cp,pz+cz*q*cp,.25)){dist=Math.max(.55,q-.3);break}}
    const target={x:px+sx*dist*cp,y:Math.max(.35,1.62+dist*sp),z:pz+cz*dist*cp};
    if(!camSmooth)camSmooth={...target};const k=1-Math.exp(-dt*14);
    camSmooth.x+=(target.x-camSmooth.x)*k;camSmooth.y+=(target.y-camSmooth.y)*k;camSmooth.z+=(target.z-camSmooth.z)*k;
    cam=camSmooth;aim={x:px-sx*2.4,y:1.5-sp*1.6,z:pz-cz*2.4};
    if(doorQuest){cam={x:11,y:30,z:26};aim={x:11,y:0,z:-9}}
    if(renderer){camera.position.set(cam.x,cam.y,cam.z);camera.lookAt(aim.x,aim.y,aim.z);camera.updateMatrixWorld()}
  }
  function resize(){
    dirty=true;W=host.clientWidth||window.innerWidth;H=host.clientHeight||window.innerHeight;
    if(renderer){renderer.setPixelRatio(ratio);renderer.setSize(W,H,false);camera.aspect=W/H;camera.fov=W<H?68:58;camera.updateProjectionMatrix()}
  }
  function checkNear(force=false){
    const sorted=Object.entries(locations).map(([id,l])=>[id,Math.hypot(l.x-player.x,l.z-player.z)]).sort((a,b)=>a[1]-b[1]);
    const id=sorted[0][1]<4.7?sorted[0][0]:null;
    if(force||id!==nearest){nearest=id;window.nearPlace?.(id)}
  }
  function screen(x,y,z){vec.set(x,y,z).project(camera);return vec.z>1||vec.z<-1?null:[(vec.x*.5+.5)*W,(-vec.y*.5+.5)*H]}
  function drawMini(){
    if(!miniCtx)return;const g=miniCtx,S=mini.width,k=S/72;g.clearRect(0,0,S,S);g.save();g.beginPath();g.arc(S/2,S/2,S/2,0,7);g.clip();g.fillStyle='#d9c39cdd';g.fillRect(0,0,S,S);
    g.translate(S/2,S/2);g.rotate(yaw);g.scale(k,k);g.translate(-player.x,-player.z);
    g.fillStyle='#6f9a6acc';g.fillRect(-41,-31,19.5,62);g.fillStyle='#f0e1c2';for(const l of lanes)g.fillRect(l[0]-l[2]/2,l[1]-l[3]/2,l[2],l[3]);
    g.fillStyle='#3f8f96';g.fillRect(-20.8,-46,1.6,92);g.fillStyle='#9a6f4c';for(const h of houses)g.fillRect(h.x-h.w/2,h.z-h.d/2,h.w,h.d);
    g.fillStyle='#3d7a45';for(const p of palmsList){g.beginPath();g.arc(p[0],p[1],.9,0,7);g.fill()}
    for(const l of Object.values(locations)){g.fillStyle='#c8442f';g.beginPath();g.arc(l.x,l.z,1.5,0,7);g.fill();g.strokeStyle='#fff';g.lineWidth=.4;g.stroke()}
    g.fillStyle='#fff';g.beginPath();g.arc(salem.x,salem.z,1.1,0,7);g.fill();g.restore();
    g.fillStyle='#1d4a40';g.beginPath();g.moveTo(S/2,S/2-7);g.lineTo(S/2+5,S/2+5);g.lineTo(S/2,S/2+2);g.lineTo(S/2-5,S/2+5);g.fill();
    g.save();g.translate(S/2,S/2);g.rotate(yaw);g.fillStyle='#b3261e';g.font='700 '+Math.round(S*.12)+'px Arial';g.textAlign='center';g.fillText('N',0,-S/2+S*.14);g.restore();
  }
  function frame(ms){
    requestAnimationFrame(frame);
    if(paused&&!dirty&&!talk)return;
    const raw=(ms-last)/1000;last=ms;const dt=clamp(raw,0,.075);dirty=false;
    if(talk){talkTime+=dt;salem.yaw=Math.atan2(player.x-salem.x,player.z-salem.z)}
    let moving=0,guideWalking=0;
    if(!paused&&!doorQuest){
      t+=dt;
      const turn=Number(keys.has('KeyQ'))-Number(keys.has('KeyE'));yaw+=turn*dt*1.8;
      let dx=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'))+stick.x;
      let forward=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'))-stick.y;
      const len=Math.hypot(dx,forward);
      if(len>.08){const run=keys.has('ShiftLeft')||keys.has('ShiftRight')||len>1.15,factor=(run?5.4:3.5)*Math.min(1,len)*dt/len;
        const vx=dx*Math.cos(yaw)-forward*Math.sin(yaw),vz=-dx*Math.sin(yaw)-forward*Math.cos(yaw);
        const px=player.x,pz=player.z;move(player,vx*factor,vz*factor);moving=Math.min(1.4,Math.hypot(player.x-px,player.z-pz)/Math.max(dt*3.5,.001));
        if(moving>.01){let d=Math.atan2(vx,vz)-player.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));player.yaw+=d*Math.min(1,dt*12)}step+=moving*dt*9;
      }
      const tx=player.x-1.35*Math.cos(yaw)-.35*Math.sin(yaw),tz=player.z+1.35*Math.sin(yaw)-.35*Math.cos(yaw);
      const dxs=tx-salem.x,dzs=tz-salem.z,distance=Math.hypot(dxs,dzs);
      if(distance>.45){const s=Math.min(1,dt*4.1/distance);move(salem,dxs*s,dzs*s);guideWalking=Math.min(1,distance);
        if(distance>7&&!blocked(tx,tz)){salem.x=tx;salem.z=tz}
        let d=Math.atan2(dxs,dzs)-salem.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));salem.yaw+=d*Math.min(1,dt*10)}
      else{let d=Math.atan2(player.x-salem.x,player.z-salem.z)-salem.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));salem.yaw+=d*Math.min(1,dt*4)}
      if(actors[5]){const w=actors[5].pos;w.x=-3+2.6*Math.sin(t*.22);w.z=-7.2;w.yaw=Math.cos(t*.22)>0?Math.PI/2:-Math.PI/2}
      envTime+=dt;if(envTime>.15){
        envTime=0;const paved=lanes.some(l=>Math.abs(player.x-l[0])<l[2]/2&&Math.abs(player.z-l[1])<l[3]/2);
        window.environmentTick?.({x:player.x,z:player.z,water:clamp(1-Math.abs(player.x+20)/14,0,1),surface:paved?'stone':'dirt',moving:moving>.05});checkNear();
      }
    }
    positionCamera(raw>0&&raw<1?dt:1);
    if(renderer){
      uTime.value=t;if(waterTex)waterTex.offset.y=-t*.05;
      actors.forEach((a,i)=>animate(a,dt,i===0?moving:i===1?guideWalking:i===5&&!paused?.7:0,i));
      const gx=Math.round(player.x),gz=Math.round(player.z);sun.position.set(gx+SUN[0]*80,SUN[1]*80,gz+SUN[2]*80);sun.target.position.set(gx,0,gz);sun.target.updateMatrixWorld();
      scene.userData.dome.position.copy(camera.position);
      if(dust){dust.position.set(camera.position.x,2+Math.sin(t*.3)*.4,camera.position.z);dust.rotation.y=t*.02}
      if(birds)for(const b of birds){const u=b.userData,a=u.ph+t*u.sp;b.position.set(Math.cos(a)*u.r,u.h+Math.sin(a*3)*1.5,Math.sin(a)*u.r-6);b.rotation.y=-a+(u.sp>0?Math.PI:0);const f=Math.sin(t*7+u.ph)*.5;b.children[0].rotation.z=f;b.children[1].rotation.z=-f}
      renderer.render(scene,camera);
      // adaptive resolution keeps the frame rate steady on phones and tablets
      if(!paused&&raw<.2){slow=slow*.95+raw*.05;if(slow>.03&&ratio>.7){ratio=Math.max(.7,ratio*.86);slow=.02;resize()}}
      for(const L of labels){const p=doorQuest?null:screen(L.x,L.y,L.z),dist=Math.hypot(L.x-player.x,L.z-player.z),vis=p&&dist<26&&p[0]>40&&p[0]<W-40&&p[1]>52&&p[1]<H-50;
        L.el.style.display=vis?'block':'none';if(vis)L.el.style.transform='translate(-50%,-100%) translate('+p[0].toFixed(1)+'px,'+p[1].toFixed(1)+'px)'}
      for(const C of chips){const dist=Math.hypot(C.x-player.x,C.z-player.z),p=doorQuest||dist>11?null:screen(C.x,C.y,C.z),vis=p&&p[0]>30&&p[0]<W-30&&p[1]>52&&p[1]<H-60;
        C.el.style.display=vis?'block':'none';if(vis)C.el.style.transform='translate(-50%,-100%) translate('+p[0].toFixed(1)+'px,'+p[1].toFixed(1)+'px)';if(!vis&&C.open){C.open=false;C.render()}}
      if(doorQuest)for(const [i,k] of ['lane','mosque'].entries()){const loc=locations[k],pt=screen(loc.x,2,loc.z-1.4)||[W/2,H/2],btn=doorQuest.buttons[i];
        btn.style.left=clamp(pt[0],80,W-80)+'px';btn.style.top=clamp(pt[1],70,H-48)+'px'}
      miniTime+=dt;if(miniTime>.12){miniTime=0;drawMini()}
    }
  }
  function controls(){
    const clear=()=>{keys.clear();stick.x=stick.y=0;const knob=document.querySelector('#knob');if(knob)knob.style.transform='translate(0,0)'};
    window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
    window.addEventListener('keydown',e=>{
      if(paused||e.altKey||e.ctrlKey||e.metaKey||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
      if(['KeyW','KeyA','KeyS','KeyD','KeyQ','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight','KeyE'].includes(e.code)){e.preventDefault();keys.add(e.code)}
      if((e.code==='KeyF'||e.code==='Enter')&&!e.repeat){e.preventDefault();interact()}
    });
    window.addEventListener('keyup',e=>keys.delete(e.code));
    if(!canvas)return;
    // look: one finger / mouse drag; zoom: wheel or two-finger pinch
    const ptrs=new Map();let pinch=0;
    canvas.addEventListener('pointerdown',e=>{if(paused)return;ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{canvas.setPointerCapture(e.pointerId)}catch{}});
    canvas.addEventListener('pointermove',e=>{const p=ptrs.get(e.pointerId);if(!p||paused)return;
      if(ptrs.size===1){const k=e.pointerType==='touch'?.0075:.0055;yaw-=(e.clientX-p.x)*k;pitch=clamp(pitch+(e.clientY-p.y)*k*.6,-.1,1.05)}
      p.x=e.clientX;p.y=e.clientY;
      if(ptrs.size===2){const [a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)zoom=clamp(zoom*pinch/d,2.4,10);pinch=d}});
    const up=e=>{ptrs.delete(e.pointerId);pinch=0};canvas.addEventListener('pointerup',up);canvas.addEventListener('pointercancel',up);canvas.addEventListener('lostpointercapture',up);
    canvas.addEventListener('wheel',e=>{if(paused)return;e.preventDefault();zoom=clamp(zoom*(e.deltaY>0?1.1:.9),2.4,10)},{passive:false});
    canvas.addEventListener('contextmenu',e=>e.preventDefault());
    for(const ev of ['gesturestart','gesturechange'])document.addEventListener(ev,e=>{if(!paused)e.preventDefault()},{passive:false});
    const pad=document.querySelector('#stick'),knob=document.querySelector('#knob');if(!pad)return;
    let finger=null;
    function update(e){
      const r=pad.getBoundingClientRect(),cap=Math.max(10,Math.min(r.width,r.height)*.36),x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
      const k=Math.max(cap,Math.hypot(x,y));stick.x=x/k*1.25;stick.y=y/k*1.25;if(knob)knob.style.transform='translate('+x/k*cap+'px,'+y/k*cap+'px)';
    }
    pad.style.touchAction='none';
    pad.addEventListener('pointerdown',e=>{if(paused)return;e.preventDefault();finger=e.pointerId;try{pad.setPointerCapture(finger)}catch{}update(e)});
    pad.addEventListener('pointermove',e=>{if(finger===e.pointerId)update(e)});
    const end=e=>{if(finger===e.pointerId){finger=null;clear()}};pad.addEventListener('pointerup',end);pad.addEventListener('pointercancel',end);pad.addEventListener('lostpointercapture',end);
  }
  function ui(){
    overlay=document.createElement('div');Object.assign(overlay.style,{position:'absolute',inset:'0',pointerEvents:'none',overflow:'hidden'});host.appendChild(overlay);
    const vg=document.createElement('div');Object.assign(vg.style,{position:'absolute',inset:'0',pointerEvents:'none',background:'radial-gradient(ellipse at center,rgba(0,0,0,0) 58%,rgba(20,12,4,.34) 100%)'});overlay.appendChild(vg);
    for(const L of labels){const b=document.createElement('button');b.type='button';b.className='wlabel';b.title='انتقل إلى '+L.name;
      const set=extra=>{b.innerHTML='';const a=document.createElement('b');a.textContent=L.name+(extra||'');const s=document.createElement('small');s.dir='ltr';s.textContent=L.pron+' · '+L.en;b.append(a,s)};set('');L.set=set;
      b.onclick=()=>{if(!paused){go(L.id);interact()}};overlay.appendChild(b);L.el=b}
    for(const w of worldWords){const b=document.createElement('button');b.type='button';b.className='wchip';const C={...w,el:b,open:false};
      C.render=()=>{b.classList.toggle('open',C.open);b.innerHTML='';const a=document.createElement('b');a.textContent='🔊 '+w.ar;b.append(a);if(C.open){const s=document.createElement('small');s.dir='ltr';s.textContent=w.pron+' · '+w.en;b.append(s)}};
      b.onclick=()=>{if(paused)return;C.open=true;C.render();window.wordFound?.(w)};C.render();b.style.display='none';overlay.appendChild(b);chips.push(C)}
    mini=document.createElement('canvas');mini.className='minimap';mini.width=mini.height=220;mini.setAttribute('aria-hidden','true');miniCtx=mini.getContext('2d');overlay.appendChild(mini);
  }
  function init(){
    if(ready)return;host=document.querySelector('#scene');if(!host)return;ready=true;
    lowTier=!!(window.matchMedia?.('(pointer:coarse)').matches||Math.min(screen0().w,screen0().h)<700||(navigator.deviceMemory&&navigator.deviceMemory<=4));TS=lowTier?256:512;
    if(!webgl()){noGL=true;
      const note=document.createElement('div');note.className='nogl';note.innerHTML='<b>العرض الثلاثي الأبعاد غير متاح على هذا المتصفح</b><span>يمكنك متابعة الدروس من زر «المحطّات». · 3D view is unavailable here; lessons still work from “المحطّات”.</span>';host.appendChild(note);
      for(const [id,l] of Object.entries(locations))labels.push({id,x:l.x,y:2,z:l.z,name:l.name,pron:l.pron,en:l.en});
    }else{
      Object.assign(canvas.style,{position:'absolute',inset:'0',width:'100%',height:'100%',touchAction:'none',display:'block'});
      canvas.setAttribute('aria-label','الحارة القديمة في الحمراء، عالم قابل للاستكشاف');ui();
    }
    resize();if(window.ResizeObserver)new ResizeObserver(resize).observe(host);window.addEventListener('resize',resize);window.addEventListener('orientationchange',()=>setTimeout(resize,250));
    controls();checkNear(true);last=performance.now();
    for(const [id,c] of pendingOutcome)outcome(id,c);pendingOutcome=[];
    requestAnimationFrame(frame);
  }
  function screen0(){return {w:window.screen?.width||window.innerWidth,h:window.screen?.height||window.innerHeight}}
  function go(id){const p=locations[id];if(!p||!ready)return;dirty=true;player.x=p.x;player.z=p.z+.9;player.yaw=Math.PI;salem.x=p.x-1.5;salem.z=p.z+.9;salem.yaw=Math.PI;yaw=0;pitch=.16;camSmooth=null;checkNear(true)}
  function cancelFindDoor(){
    if(!doorQuest)return;
    clearTimeout(feedbackTimer);
    doorQuest.group.remove();doorQuest=null;dirty=true;camSmooth=null;
  }
  function findDoor(onSuccess){
    if(!ready)return;cancelFindDoor();dirty=true;
    if(noGL){outcome('lane',true);if(typeof onSuccess==='function')onSuccess('lane');return}
    const group=document.createElement('div');
    Object.assign(group.style,{position:'absolute',inset:'0',pointerEvents:'none'});
    const note=document.createElement('div');note.setAttribute('role','status');note.textContent='اقرأ اللافتتين. أين باب بيت سالم؟ · Where is Salim’s door?';
    Object.assign(note.style,{position:'absolute',left:'50%',top:'16%',transform:'translateX(-50%)',padding:'8px 14px',borderRadius:'12px',background:'#163d38ee',color:'#fff5e0',whiteSpace:'normal',textAlign:'center',maxWidth:'86%',lineHeight:'1.6'});
    group.appendChild(note);
    const buttons=[['باب بيت سالم','BAAB BAYT SAA-LIM · Salim’s door'],['باب المسجد','BAAB AL-MAS-JID · mosque door']].map(([name,sub],i)=>{
      const b=document.createElement('button');b.type='button';b.className='wlabel quest';const a=document.createElement('b');a.textContent=name;const s=document.createElement('small');s.dir='ltr';s.textContent=sub;b.append(a,s);
      Object.assign(b.style,{position:'absolute',transform:'translate(-50%,-100%)',pointerEvents:'auto'});
      b.onclick=()=>{
        if(i===1){note.textContent='هذه لافتة المسجد. ابحث عن كلمتي «بيت سالم».';
          clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>{if(doorQuest)note.textContent='أيّ اللافتتين تدلّ على بيت سالم؟';},5000);return}
        cancelFindDoor();go('lane');outcome('lane',true);if(typeof onSuccess==='function')onSuccess('lane');
      };
      group.appendChild(b);return b;
    });
    overlay.appendChild(group);doorQuest={group,buttons};buttons[0].focus({preventScroll:true});
  }
  function outcome(id,choice){
    if(!ready){pendingOutcome.push([id,choice]);return}
    const p=props[id];
    if(p){p.on=id==='majlis'?choice==='accept':Boolean(choice);if(p.mesh)p.mesh.visible=p.on}
    const on=p?p.on:id==='majlis'?choice==='accept':Boolean(choice);
    const l=labels.find(item=>item.id===id);
    l?.set?.(id==='majlis'?(on?' · قُدِّمت القهوة':' · شكرًا للزيارة'):id==='mosque'&&on?' · الحذاء على الرف':on?' · أهلًا بك':'');
    dirty=true;
  }
  function interact(){if(!paused&&!doorQuest&&nearest)window.openPlace?.(nearest)}
  function setPaused(value){dirty=true;paused=!!value;keys.clear();stick.x=stick.y=0;const k=document.querySelector('#knob');if(k)k.style.transform='translate(0,0)';if(paused)window.environmentTick?.({x:player.x,z:player.z,water:0,surface:'dirt',moving:false});if(ready)checkNear(true)}
  return {init,setPaused,go,interact,findDoor,cancelFindDoor,outcome,speaking(value){dirty=true;talk=!!value;if(!talk)talkTime=0},words:worldWords,locations,view(x,z,yw,pt,zm){player.x=x;player.z=z;salem.x=x-1.2;salem.z=z-.4;if(yw!=null)yaw=yw;if(pt!=null)pitch=pt;if(zm)zoom=zm;camSmooth=null;dirty=true}};
})();
