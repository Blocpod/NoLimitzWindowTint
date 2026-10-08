/* No Limitz: "Tinted light". One fragment shader behind the page renders slow
   caustic light (sun through water and tinted glass) in emerald green.
   - The cursor is a lens: the light bends toward it and burns a little greener.
   - The shade card dims the room while it is on screen.
   - The Work gallery and the footer are dark chapters where the light runs full.
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
    "#define ITER " + (small ? 4 : 5),
    "uniform vec2 uRes;uniform float uScale,uTime,uScroll,uIntro,uShade,uPaneA,uPaneRot,uGrain;",
    "uniform vec2 uMouse,uDark0,uDark1,uFeather;",
    "const vec3 BONE=vec3(.957,.953,.937);const vec3 SAGE=vec3(.735,.79,.75);",
    "const vec3 EMER=vec3(.118,.549,.353);const vec3 MINT=vec3(.49,.80,.62);",
    "const vec3 DEEP=vec3(.024,.063,.045);const vec3 DEEP2=vec3(.043,.118,.082);const vec3 SUN=vec3(1.,.42,.16);",
    "float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}",
    "float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);",
    " return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}",
    "float fbm(vec2 p){return .6*noise(p)+.3*noise(p*2.03+7.1)+.1*noise(p*4.1+3.7);}",
    /* tileable caustic network: bright filaments where refracted light gathers */
    "float caustic(vec2 uv,float t){",
    " vec2 p=mod(uv*6.2831853,6.2831853)-250.;vec2 i=p;float c=1.;",
    " for(int n=0;n<ITER;n++){float tt=t*(1.-(3.5/float(n+1)));",
    "  i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));",
    "  c+=1./length(vec2(p.x/(sin(i.x+tt)/.005),p.y/(cos(i.y+tt)/.005)));}",
    " c/=float(ITER);c=1.17-pow(c,1.4);return clamp(pow(abs(c),7.),0.,1.);}",
    /* dark band with a waterline: the edge glows where the light meets the surface */
    "float band(vec2 b,float y,float f,inout float ln,inout float sh){float a=y-b.x,z=b.y-y;",
    " ln=max(ln,exp(-pow((a-f*.5)/3.,2.))+exp(-pow((z-f*.5)/3.,2.)));",
    " sh=max(sh,smoothstep(0.,f*.5,a)*smoothstep(0.,f*.5,z));",
    " return smoothstep(f*.44,f*.56,a)*smoothstep(f*.44,f*.56,z);}",
    "void main(){",
    " vec2 q=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;",
    /* the cursor is a lens: light gathers and bends toward it, plus a faint wake when it moves */
    " vec2 d=q-uMouse;float r=length(d);",
    " float inside=(1.-smoothstep(0.,300.,r))*uPaneA;",
    " float wake=sin(r*.045-uTime*3.)*exp(-r/220.)*uPaneRot*uPaneA;",
    /* world space: light sits behind the page and drifts at half the scroll speed */
    " vec2 w=vec2(q.x,q.y+uScroll*.5)-d*.22*inside*inside+normalize(d+.001)*wake*26.;",
    " float ca=cos(-.35),sa=sin(-.35);vec2 uv=mat2(ca,-sa,sa,ca)*w/vec2(760.,600.);",
    " float t=uTime*.16;",
    " float c=caustic(uv,t);",
    " float pool=smoothstep(.28,.82,fbm(w/950.+vec2(t*.05,-t*.03)));",
    /* dark chapters with a liquid edge */
    " float wob=(fbm(vec2(q.x/260.,t*.5))-.5)*34.+(c-.4)*5.;",
    " float y=q.y+wob;",
    " float ln=0.,sh=0.;float dk=max(band(uDark0,y,uFeather.x,ln,sh),band(uDark1,y,uFeather.y,ln,sh));",
    /* light chapter: a shaft of window light falls across the hero from the top right */
    " vec2 P=vec2(q.x,q.y+uScroll);vec2 O=vec2(uRes.x/uScale*.82,-140.);vec2 D=normalize(vec2(-.62,1.));",
    " vec2 rl=P-O;float al=dot(rl,D);float pp=abs(rl.x*D.y-rl.y*D.x);float sw=200.+al*.38;",
    " float shaft=(1.-smoothstep(sw*.3,sw,pp))*smoothstep(-60.,180.,al)*(1.-smoothstep(650.,1500.,al));",
    " float amt=(.09+.24*pool+.2*shaft)*uIntro*(1.+uShade*.9)*(1.+inside*.9);",
    " vec3 lite=mix(BONE,SAGE,uShade*.8);",
    " lite=mix(lite,EMER,c*amt);",
    " lite=mix(lite,MINT,(pool*.05+shaft*.09)*uIntro);",
    /* dark chapter: deep water, emerald filaments, faint sun glints, slow rays */
    " float rays=pow(max(0.,sin(q.x*.0045+uScroll*.0007+fbm(vec2(q.x*.003,t*.4))*2.6)),10.)*.5;",
    " vec3 dark=mix(DEEP,DEEP2,pool);",
    " float glow=c*(.55+.45*pool)*uIntro*(1.+inside*.7);",
    " dark+=EMER*glow*.38+MINT*pow(glow,3.)*.1+SUN*pow(c,12.)*.07*uIntro;",
    " dark+=vec3(.05,.16,.11)*rays*uIntro;",
    " dark*=1.-.25*pow(abs(q.x/(uRes.x/uScale)-.5)*2.,2.);",
    " vec3 col=mix(lite*(1.-.1*sh),dark,dk);",
    " float glint=clamp(ln,0.,1.)*smoothstep(.35,.85,noise(vec2(q.x/70.+t*1.3,t*.5)));",
    " col=mix(col,vec3(.80,.96,.87),glint*.5*uIntro);",
    " col+=(hash(gl_FragCoord.xy+fract(uTime*7.1)*61.)-.5)*mix(.012,.03,dk)*uGrain;",
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
  ["uRes", "uScale", "uTime", "uScroll", "uIntro", "uShade", "uPaneA", "uPaneRot", "uGrain", "uMouse", "uDark0", "uDark1", "uFeather"].forEach(function (n) {
    U[n] = gl.getUniformLocation(prog, n);
  });

  document.body.insertBefore(canvas, document.body.firstChild);
  doc.classList.add("has-light");

  var work = document.getElementById("work"), foot = document.querySelector(".foot"), shades = document.getElementById("shades");
  var scale = small ? 0.5 : 0.62, W = 0, H = 0;
  function resize() {
    var cw = window.innerWidth, ch = window.innerHeight;
    var s = Math.min(scale, Math.sqrt(1600000 / (cw * ch)));
    W = Math.max(1, Math.round(cw * s));
    H = Math.max(1, Math.round(ch * s));
    canvas.width = W;
    canvas.height = H;
    gl.viewport(0, 0, W, H);
    gl.uniform2f(U.uRes, W, H);
    gl.uniform1f(U.uScale, W / cw);
  }
  resize();

  /* state */
  var ALPHA = { 70: 0.26, 35: 0.58, 20: 0.72, 15: 0.8, 5: 0.9 };
  var shadeTint = 0, shadeUser = false, shadeNow = 0;
  document.addEventListener("nl:shade", function (e) {
    var a = ALPHA[e.detail.vlt] || 0.5;
    shadeTint = (a - 0.2) / 0.7;
    if (e.detail.user) shadeUser = true;
  });
  var first = document.querySelector('.tile[aria-checked="true"]');
  if (first) shadeTint = ((ALPHA[first.dataset.vlt] || 0.8) - 0.2) / 0.7;
  var mx = window.innerWidth * 0.62, my = window.innerHeight * 0.4, tx = mx, ty = my, paneA = 0, paneOn = false, rot = 0;
  if (finePointer && !reduce) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX; ty = e.clientY; paneOn = true;
    }, { passive: true });
    document.addEventListener("mouseleave", function () { paneOn = false; });
    window.addEventListener("blur", function () { paneOn = false; });
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
    if (!reduce) time += dt * (1 + Math.min(Math.abs(vel) * 0.03, 2.5));
    var intro = reduce ? 1 : Math.min(1, (now - start) / 1800);
    intro = 1 - Math.pow(1 - intro, 3);

    var vis = 0;
    if (shades) {
      var r = shades.getBoundingClientRect(), vh = window.innerHeight;
      vis = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.min(r.height, vh);
    }
    var target = shadeTint * (shadeUser ? 1 : 0.3) * Math.min(1, Math.max(0, (vis - 0.15) / 0.45));
    shadeNow += (target - shadeNow) * (reduce ? 1 : 0.06);

    var k = reduce ? 1 : 0.14;
    var ox = mx, oy = my;
    mx += (tx - mx) * k;
    my += (ty - my) * k;
    rot += (Math.min(1, Math.hypot(mx - ox, my - oy) * 0.03) - rot) * 0.08;
    paneA += ((paneOn ? 1 : 0) - paneA) * 0.08;

    var mobile = window.innerWidth < 760;
    gl.uniform1f(U.uTime, time);
    gl.uniform1f(U.uScroll, sy);
    gl.uniform1f(U.uIntro, intro);
    gl.uniform1f(U.uShade, shadeNow);
    gl.uniform1f(U.uPaneA, paneA);
    gl.uniform1f(U.uPaneRot, rot);
    gl.uniform1f(U.uGrain, reduce ? 0 : 1);
    gl.uniform2f(U.uMouse, mx, my);
    var b0 = bandFor(work), b1 = bandFor(foot);
    gl.uniform2f(U.uDark0, b0[0], b0[1]);
    gl.uniform2f(U.uDark1, b1[0], b1[1] + 4000);
    gl.uniform2f(U.uFeather, mobile ? 44 : 72, mobile ? 32 : 48);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    /* adaptive quality: step the resolution down if frames run long */
    frames++;
    if (dt > 0.022) slow++;
    if (frames === 90) {
      if (slow > 45 && scale > 0.3) { scale *= 0.8; resize(); }
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
