/* No Limitz: "Window light". One fragment shader behind the page.
   - Light chapters: green sunlight through a window lands on the page as crisp
     panes, softer the farther it falls, with mullion shadows and slow clouds.
     In the hero a palm frond's shadow sways through the light.
   - Dark chapters (Work gallery, footer): the same light pours in as hard-edged
     beams with dust drifting through them.
   - The cursor moves the sun (on touch, scrolling does), so every pane and beam
     swings with it. The shade card dims the room while it is on screen.
   Progressive enhancement: without WebGL the CSS fallback styles stay in charge. */
(function () {
  "use strict";
  var doc = document.documentElement;
  var mq = function (q) { return window.matchMedia ? window.matchMedia(q).matches : false; };
  var reduce = mq("(prefers-reduced-motion: reduce)");
  var finePointer = mq("(hover: hover) and (pointer: fine)");
  var small = Math.min(screen.width, screen.height) < 700;

  var canvas = document.createElement("canvas");
  canvas.className = "light";
  canvas.setAttribute("aria-hidden", "true");
  var gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: "low-power" });
  if (!gl) return;

  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "#ifdef GL_FRAGMENT_PRECISION_HIGH",
    "precision highp float;",
    "#else",
    "precision mediump float;",
    "#endif",
    "uniform vec2 uRes,uDark0,uDark1;uniform float uScale,uTime,uScroll,uIntro,uShade,uGrain,uSun;",
    "const vec3 BONE=vec3(.957,.953,.937);const vec3 SAGE=vec3(.80,.835,.805);",
    "const vec3 LIT=vec3(.85,.985,.895);const vec3 HOT=vec3(.95,1.,.965);const vec3 LITDIM=vec3(.69,.80,.725);",
    "const vec3 EMER=vec3(.118,.549,.353);const vec3 MINT=vec3(.56,.92,.71);",
    "const vec3 DEEP=vec3(.018,.05,.036);const vec3 DEEP2=vec3(.034,.092,.066);",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}",
    /* light through a window w (window space, px) of size s split into panes; k = edge softness */
    "float panes(vec2 w,vec2 s,vec2 grid,float bar,float k,inout float halo){",
    " vec2 h=s*.5;vec2 d=abs(w-h)-h;float sd=length(max(d,0.))+min(max(d.x,d.y),0.);",
    " float outer=1.-smoothstep(-k,k,sd);",
    " halo=max(halo,exp(-max(sd,0.)/320.));",
    " vec2 cell=s/grid;vec2 g=abs(fract(w/cell+.5)-.5)*cell;",
    " float glass=.93+.07*noise(w/38.+vec2(0.,uTime*.25));",
    " return outer*smoothstep(bar*.5-k,bar*.5+k,min(g.x,g.y))*mix(1.,.36,smoothstep(0.,1.,w.y/s.y))*glass;}",
    /* one window projected onto the page from anchor a with shear sh (the sun angle) */
    "float project(vec2 P,vec2 a,vec2 s,vec2 grid,float bar,float sh,inout float halo){",
    " vec2 p=P-a;vec2 w=vec2(p.x-p.y*sh,p.y/1.12);",
    " float k=max(.9/uScale,1.1+max(w.y,0.)*.03);",
    " return panes(w,s,grid,bar,k,halo);}",
    "float frond(vec2 p,float len,float t,float seed){",
    " if(p.x<-30.||p.x>len+60.)return 0.;",
    " float c=-.00055;float yr=c*p.x*p.x;float dy=p.y-yr;",
    " float sh=(1.-smoothstep(2.,7.,abs(dy)))*step(0.,p.x)*step(p.x,len);",
    " float s=dy<0.?-1.:1.;float th=.62+.06*s;",
    " float bx=p.x-abs(dy)/tan(th);float sp=15.;float i=floor(bx/sp+.5);float b=i*sp;",
    " if(b<6.||b>len)return sh;",
    " float u=b/len;float Lf=(55.+120.*sin(3.1416*pow(u,.8)))*(.82+.36*hash(vec2(i,s+seed)));",
    " float fl=th+sin(t*2.3+i*.9+seed)*.05;",
    " vec2 dir=vec2(cos(fl),s*sin(fl));vec2 v=p-vec2(b,c*b*b);",
    " float al=dot(v,dir);float pp=abs(v.x*dir.y-v.y*dir.x);",
    " float wd=4.2*(1.-.75*clamp(al/Lf,0.,1.));",
    " float lf=(1.-smoothstep(wd,wd+9.,pp))*smoothstep(-2.,4.,al)*(1.-smoothstep(Lf-14.,Lf,al));",
    " return max(sh,lf);}",
    "float palm(vec2 P,vec2 o,float t){",
    " float sw=sin(t*.55)*.05+sin(t*1.7)*.015;",
    " float a1=3.62+sw;vec2 d=P-o;",
    " vec2 p1=mat2(cos(a1),sin(a1),-sin(a1),cos(a1))*d;",
    " float a2=3.36+sw*1.3;vec2 p2=mat2(cos(a2),sin(a2),-sin(a2),cos(a2))*(d-vec2(-20.,90.));",
    " return max(frond(p1,640.,t,1.),frond(p2,470.,t*1.1,7.)*.9);}",
    "float dust(vec2 p,float cell,float r,float t){",
    " vec2 id=floor(p/cell);vec2 f=fract(p/cell)*cell;float h=hash(id),h2=hash(id+17.3);",
    " vec2 c=(vec2(h,h2)*.6+.2)*cell+vec2(sin(t*.35+h*20.),cos(t*.27+h2*20.))*cell*.12;",
    " float on=step(.5,hash(id+5.1));",
    " return on*(1.-smoothstep(r*.25,r,length(f-c)))*(.35+.65*hash(id+9.2))*(.65+.35*sin(t*1.6+h*30.));}",
    "void main(){",
    " vec2 q=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;",
    " float vw=uRes.x/uScale;bool mob=vw<760.;",
    " float t=uTime;",
    " float sh=(mob?-.36:-.56)-uSun*.17+sin(t*.04)*.035;",
    " float cloud=.84+.16*smoothstep(.25,.75,noise(vec2(t*.035,1.7)));",
    /* light chapter: windows anchored in page space, drifting at 90% of the scroll */
    " vec2 P=vec2(q.x+uSun*34.,q.y+uScroll*.9);",
    " float halo=0.;float L=0.;",
    " vec2 ha=mob?vec2(vw*.42,110.):vec2(vw*.5,72.);vec2 hs=mob?vec2(vw*.56,420.):vec2(min(vw*.36,540.),500.);",
    " L=project(P,ha,hs,vec2(2.,3.),mob?10.:14.,sh,halo);",
    " if(L>0.)L*=1.-.8*palm(P,ha+vec2(hs.x*1.02,-10.),t);",
    " float SP=1300.,Y0=1250.;float n=floor((P.y-Y0)/SP);",
    " for(int j=0;j<2;j++){float m=n-float(j);if(m<0.)continue;",
    "  float ax=mod(m,2.)<1.?(mob?.05:.07):(mob?.3:.5);",
    "  vec2 s=mob?vec2(vw*.62,460.):vec2(min(vw*.4,580.),560.);",
    "  float v=mod(m,3.);vec2 grid=v<1.?vec2(2.,2.):(v<2.?vec2(1.,8.):vec2(3.,2.));",
    "  float bar=v<1.?14.:(v<2.?s.y/8.*.44:12.);",
    "  L=max(L,project(P,vec2(vw*ax,Y0+m*SP+60.),s,grid,bar,sh,halo));}",
    " vec3 wall=mix(BONE,SAGE,uShade*.85)*(1.-.075*halo*uIntro);",
    " vec3 litc=mix(mix(LIT,HOT,smoothstep(.55,1.,L)),LITDIM,uShade);",
    " vec3 lite=mix(wall,litc,L*.95*cloud*uIntro);",
    /* dark chapters: crisp edges, beams from the top edge, dust in the light */
    " float y=q.y;",
    " float d0=smoothstep(uDark0.x-1.,uDark0.x+1.,y)*(1.-smoothstep(uDark0.y-1.,uDark0.y+1.,y));",
    " float d1=smoothstep(uDark1.x-1.,uDark1.x+1.,y)*(1.-smoothstep(uDark1.y-1.,uDark1.y+1.,y));",
    " float dk=max(d0,d1);",
    " vec3 col=lite;",
    " if(dk>0.){",
    "  vec2 r=vec2(q.x,y-(d0>0.?uDark0.x:uDark1.x));",
    "  float u=r.x-r.y*sh+uSun*30.;",
    "  float cb=mob?300.:520.;float bw=cb*.58;float lc=mod(u+140.,cb);",
    "  float k=1.4+r.y*.028;",
    "  float beam=smoothstep(-k,k,lc)*(1.-smoothstep(bw-k,bw+k,lc))*smoothstep(7.-k,7.+k,abs(lc-bw*.5));",
    "  float bloom=smoothstep(-70.,70.,lc)*(1.-smoothstep(bw-70.,bw+70.,lc));",
    "  float fall=exp(-r.y/680.)*(.55+.45*noise(vec2(u/260.,r.y/380.-t*.06)))*cloud*uIntro;",
    "  vec3 dark=mix(DEEP,DEEP2,noise(q/520.+t*.01));",
    "  dark+=mix(EMER,MINT,.45)*beam*fall*.38+EMER*bloom*fall*.07;",
    "  vec2 dp=vec2(q.x,y+uScroll-t*7.);",
    "  float motes=dust(dp,42.,1.5,t)+dust(dp+517.,88.,2.7,t*.8)*.8;",
    "  dark+=MINT*motes*(beam*.85+bloom*.15)*fall*1.15;",
    "  dark*=1.-.22*pow(abs(q.x/vw-.5)*2.,2.);",
    "  col=mix(lite,dark,dk);}",
    " col+=(hash(gl_FragCoord.xy+fract(t*7.1)*61.)-.5)*mix(.008,.026,dk)*uGrain;",
    " gl_FragColor=vec4(col,1.);}"
  ].join("\n");

  function shader(type, src) {
    var s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }
  var vs = shader(gl.VERTEX_SHADER, VS), fs = shader(gl.FRAGMENT_SHADER, FS);
  if (!vs || !fs) return;
  var prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  var buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {};
  ["uRes", "uScale", "uTime", "uScroll", "uIntro", "uShade", "uGrain", "uSun", "uDark0", "uDark1"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  document.body.insertBefore(canvas, document.body.firstChild);
  doc.classList.add("has-light");

  var work = document.getElementById("work"), foot = document.querySelector(".foot"), shades = document.getElementById("shades");
  var scale = small ? 0.62 : 0.8, W = 0, H = 0;
  function resize() {
    var cw = window.innerWidth, ch = window.innerHeight;
    var s = Math.min(scale, Math.sqrt(2400000 / (cw * ch)));
    W = Math.max(1, Math.round(cw * s));
    H = Math.max(1, Math.round(ch * s));
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uScale, W / cw);
  }
  resize();

  /* the shade card dims the room: 70% barely, 5% a lot */
  var ALPHA = { 70: 0.26, 35: 0.58, 20: 0.72, 15: 0.8, 5: 0.9 };
  var shadeTint = 0, shadeUser = false, shadeNow = 0;
  document.addEventListener("nl:shade", function (e) {
    shadeTint = ((ALPHA[e.detail.vlt] || 0.5) - 0.2) / 0.7;
    if (e.detail.user) shadeUser = true;
  });
  var first = document.querySelector('.tile[aria-checked="true"]');
  if (first) shadeTint = ((ALPHA[first.dataset.vlt] || 0.8) - 0.2) / 0.7;

  /* the sun follows the cursor across the screen; on touch it swings as you scroll */
  var sunT = 0, sun = 0;
  if (finePointer && !reduce) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType === "mouse") sunT = (e.clientX / window.innerWidth) * 2 - 1;
    }, { passive: true });
  }

  var start = performance.now(), last = start, time = 40, lastScroll = window.scrollY, vel = 0;
  var slow = 0, frames = 0;
  function bandFor(el) {
    if (!el) return [-1e5, -1e5];
    var r = el.getBoundingClientRect();
    return [r.top, r.bottom];
  }
  function draw(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    var sy = window.scrollY;
    vel += ((sy - lastScroll) - vel) * 0.15;
    lastScroll = sy;
    if (!reduce) time += dt * (1 + Math.min(Math.abs(vel) * 0.01, 1));
    var intro = reduce ? 1 : Math.min(1, (now - start) / 1600);
    intro = 1 - Math.pow(1 - intro, 3);

    var vis = 0;
    if (shades) {
      var r = shades.getBoundingClientRect(), vh = window.innerHeight;
      vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.min(r.height, vh);
    }
    var target = shadeTint * (shadeUser ? 1 : 0.3) * Math.min(1, Math.max(0, (vis - 0.15) / 0.45));
    shadeNow += (target - shadeNow) * (reduce ? 1 : 0.06);

    if (!finePointer) sunT = Math.sin(sy * 0.0009) * 0.6;
    sun += (sunT - sun) * (reduce ? 1 : 0.05);

    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uScroll, sy);
    gl.uniform1f(U.uIntro, intro);
    gl.uniform1f(U.uShade, shadeNow);
    gl.uniform1f(U.uGrain, reduce ? 0 : 1);
    gl.uniform1f(U.uSun, sun);
    var b0 = bandFor(work), b1 = bandFor(foot);
    gl.uniform2f(U.uDark0, b0[0], b0[1]);
    gl.uniform2f(U.uDark1, b1[0], b1[1] + 4000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* adaptive quality: step the resolution down if frames run long */
    frames++;
    if (dt > 0.022) slow++;
    if (frames === 90) {
      if (slow > 45 && scale > 0.35) { scale *= 0.8; resize(); }
      frames = 0; slow = 0;
    }
  }

  var raf = 0, alive = true;
  function loop(now) { draw(now); raf = alive ? requestAnimationFrame(loop) : 0; }
  function kick() { if (!raf && alive) raf = requestAnimationFrame(function (n) { raf = 0; draw(n); }); }
  if (reduce) {
    window.addEventListener("scroll", kick, { passive: true });
    document.addEventListener("nl:shade", kick);
    kick();
  } else {
    raf = requestAnimationFrame(loop);
  }
  var rt = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () { resize(); kick(); }, 120);
  });
  canvas.addEventListener("webglcontextlost", function (e) {
    e.preventDefault();
    alive = false;
    cancelAnimationFrame(raf);
    doc.classList.remove("has-light");
    canvas.remove();
  });
})();
