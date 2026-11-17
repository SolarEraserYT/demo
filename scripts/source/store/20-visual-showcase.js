/* SolarEraser Store — Visual Showcase V3
   APPEND BELOW the existing Store V2 + Glitch Collection code.
   CSS/HTML previews only: no real items, balances or purchases.
*/
(() => {
  "use strict";
  const store = document.getElementById("solar-store-screen");
  if (!store || document.getElementById("svfx-v3-styles")) return;

  const style = document.createElement("style");
  style.id = "svfx-v3-styles";
  style.textContent = `
    .svfx-scene, .svfx-scene * { box-sizing: border-box; }
    .svfx-scene {
      --fx: var(--accent);
      position: relative; isolation: isolate; width: 100%; min-width: 0;
      min-height: 140px; overflow: hidden; display: flex; align-items: center;
      justify-content: center; border-radius: 8px; padding: 14px;
      background: radial-gradient(ellipse at 50% 50%,
        color-mix(in srgb, var(--fx) 16%, var(--bg-main)), var(--bg-main) 78%);
      color: var(--text-main);
    }
    .svfx-scene > * { position: relative; z-index: 1; }
    .svfx-scene::before { content: ''; position: absolute; inset: 0;
      background: repeating-linear-gradient(0deg, transparent 0 5px, #ffffff05 6px 7px);
      z-index: 0; pointer-events: none; }
    .svfx-label { position: absolute; left: 12px; bottom: 10px; z-index: 3;
      color: var(--text-muted); font: 700 9px/1.2 ui-monospace, monospace;
      letter-spacing: .17em; text-transform: uppercase; text-shadow: 0 1px 3px #0009; }
    .svfx-featured { min-height: 176px; border-radius: 0; flex: 1; }
    .svfx-featured.svfx-glitch { min-height: 190px; }
    .svfx-tile { min-height: 125px; padding: 9px; }
    .svfx-wide { min-height: 175px; }
    .svfx-large { min-height: 270px; border: 1px solid var(--border-subtle); }
    .solar-store-feature .solar-store-feature-art { padding: 0; }
    .solar-store-feature .solar-store-feature-art > .svfx-scene { height: 100%; }
    .solar-store-item { padding: 12px; }
    .solar-store-item > .svfx-scene { flex: 1 1 auto; }
    .solar-glitch-product .solar-glitch-art { padding: 0; }
    .solar-glitch-product .solar-glitch-art .svfx-scene { min-height: 140px; }
    .solar-glitch-product.bundle .svfx-scene { min-height: 180px; }
    .solar-store-banner.svfx-banner {
      cursor: pointer; padding: 14px; gap: 8px; min-width: 0;
      text-align: left; color: var(--text-main); transition: border-color .2s, transform .2s;
    }
    .solar-store-banner.svfx-banner:hover,
    .solar-store-banner.svfx-banner:focus-visible {
      border-color: var(--accent); transform: translateY(-2px); outline: 0;
    }
    .solar-store-banner.svfx-banner > .svfx-scene { min-height: 190px; }
    .svfx-banner .svfx-banner-caption { font-size: 11px; color: var(--text-muted); }
    .svfx-banner .svfx-banner-title { font-size: 22px; font-weight: 850; }
    .svfx-scene.svfx-glitch { --fx: #6c9bff;
      background: linear-gradient(120deg, #0b1525, #1e1735 65%, #081727); }
    .svfx-card {
      position: relative; width: min(96%, 320px); min-height: 62px;
      display: flex; align-items: center; justify-content: center;
      padding: 11px; border: 1px solid #6db7ff; border-radius: 8px;
      background: repeating-linear-gradient(0deg, transparent 0 3px, #b694ff15 4px 5px),
                  linear-gradient(125deg, #10182c, #241532, #102033);
      box-shadow: inset 0 0 12px #469bff3e, 0 0 15px #659dff58;
      overflow: hidden; isolation: isolate;
      animation: svfx-card-flicker 4.4s steps(1) infinite;
    }
    .svfx-card::before { content: ''; position: absolute; inset: -35% -10%; z-index: 0;
      background: linear-gradient(180deg, transparent 36%, #7edcff35 49%, #ac66ff35 52%, transparent 64%);
      transform: translateY(-75%); animation: svfx-scan 3.1s linear infinite; }
    .svfx-card::after { content: ''; position: absolute; inset: 2px; z-index: 0;
      border: 1px solid #b287ff2b; border-radius: 5px; pointer-events: none; }
    .svfx-break { position: relative; z-index: 2; display: inline-block;
      font: 900 clamp(15px,2.4vw,24px)/1.25 ui-monospace, Consolas, monospace;
      letter-spacing: -.04em; color: white; text-shadow: 0 0 4px #a8e6ff, 0 0 11px #6e80ff;
      animation: svfx-jolt 4s steps(1) infinite; }
    .svfx-break::before, .svfx-break::after {
      content: attr(data-text); position: absolute; inset: 0;
      width: 100%; white-space: nowrap; pointer-events: none; opacity: 0;
    }
    .svfx-break::before { color: #3dffec; text-shadow: -3px 0 #3dffec;
      animation: svfx-slice-left 2.4s steps(1) infinite; }
    .svfx-break::after { color: #ff4dbd; text-shadow: 3px 0 #ff4dbd;
      animation: svfx-slice-right 2.4s steps(1) infinite; }
    .svfx-noise { position: absolute; inset: 0; z-index: 3; pointer-events: none;
      opacity: .35; mix-blend-mode: screen;
      background: repeating-linear-gradient(0deg, transparent 0 7px, #86e7ff44 8px, transparent 9px),
        repeating-linear-gradient(90deg, transparent 0 31px, #db56ff1c 32px, transparent 34px);
      animation: svfx-static 2.1s steps(2) infinite; }
    .svfx-message { position: relative; display: block; margin-top: 9px; width: 100%;
      background: #101b2a; border-left: 3px solid #6fcaff; border-radius: 4px;
      padding: 9px 10px; color: #b9cadd; font-size: 10px; white-space: normal; }
    .svfx-message .svfx-break { font-size: clamp(10px,1.3vw,15px); }
    .svfx-stack { width: min(94%, 350px); }
    .svfx-microcopy { position: absolute; top: 10px; right: 11px;
      color: #a7b8d2a8; font: 9px ui-monospace,monospace; letter-spacing: .08em; }
    @keyframes svfx-slice-left {
      0%,8%,12%,30%,35%,60%,63%,81%,84%,100% {opacity:0; transform:none;}
      9% {opacity:1; transform:translate(-9px,-2px);clip-path:inset(3% 0 63% 0);}
      10% {opacity:1; transform:translate(5px,2px);clip-path:inset(41% 0 39% 0);}
      31% {opacity:1; transform:translate(-6px,1px);clip-path:inset(70% 0 3% 0);}
      32% {opacity:1; transform:translate(8px,-1px);clip-path:inset(25% 0 52% 0);}
      61%,62% {opacity:.9; transform:translate(-4px,1px);clip-path:inset(6% 0 72% 0);}
      82% {opacity:1;transform:translate(10px,0);clip-path:inset(50% 0 28% 0);}
    }
    @keyframes svfx-slice-right {
      0%,8%,12%,30%,35%,60%,63%,81%,84%,100% {opacity:0; transform:none;}
      9% {opacity:1;transform:translate(7px,2px);clip-path:inset(64% 0 4% 0);}
      11% {opacity:1;transform:translate(-5px,-2px);clip-path:inset(21% 0 59% 0);}
      31% {opacity:1;transform:translate(9px,1px);clip-path:inset(10% 0 61% 0);}
      33% {opacity:1;transform:translate(-7px,0);clip-path:inset(68% 0 8% 0);}
      61% {opacity:1;transform:translate(8px,-1px);clip-path:inset(33% 0 42% 0);}
      82%,83% {opacity:1;transform:translate(-6px,1px);clip-path:inset(76% 0 0 0);}
    }
    @keyframes svfx-jolt {0%,8%,11%,30%,34%,60%,63%,81%,84%,100% {transform:translate(0);filter:none;}
      9% {transform:translate(4px,-1px);filter:contrast(2);}
      10% {transform:translate(-3px,1px);}
      31%,61% {transform:translate(-2px,0);}
      82% {transform:translate(3px,-1px);}}
    @keyframes svfx-card-flicker {0%,30%,32%,60%,62%,100% {filter:none;}
      31%,61% {filter:brightness(1.5) hue-rotate(9deg);}}
    @keyframes svfx-static {0%,100% {transform:translateY(-5%);opacity:.19;}
      10%,32%,61%,82% {transform:translateY(5%);opacity:.66;}}
    @keyframes svfx-scan {to {transform:translateY(75%);}}
    .svfx-frost { --fx: #71cfff; background: radial-gradient(circle at 50% 70%,#16476a,#081c33 72%); }
    .svfx-ice { font-size: clamp(50px,7vw,100px); color:#b1f0ff; text-shadow:0 0 9px #8be8ff,0 0 36px #63b7ff;
      animation:svfx-breathe 3s ease-in-out infinite; }
    .svfx-snow {position:absolute!important;z-index:2!important;top:-12%;left:var(--x);
      color:#c9f4ff;font-size:var(--size,14px);opacity:.8;
      animation:svfx-fall var(--time,5s) linear infinite;animation-delay:var(--delay,0s);}
    @keyframes svfx-fall {to {transform:translate(var(--drift,10px),260px) rotate(120deg);opacity:0;}}
    .svfx-evergold { --fx:#f3ca52; background:radial-gradient(circle at 52% 70%,#5b4420,#141d19 72%); }
    .svfx-tree {width:min(280px,94%);height:160px;filter:drop-shadow(0 0 12px #ffbf4390);}
    .svfx-petal {position:absolute!important;z-index:3!important;left:var(--x);top:-10%;
      width:7px;height:12px;border-radius:85% 0 85% 0;transform:rotate(35deg);
      background:linear-gradient(135deg,#fff3b4,#ffc343 65%,#d8a43c);
      box-shadow:0 0 9px #ffe17b;
      animation:svfx-petals var(--time,5s) ease-in infinite;
      animation-delay:var(--delay,0s);}
    @keyframes svfx-petals {0%{transform:translate(0,0) rotate(0);opacity:0;}
      12%{opacity:1;}90%{opacity:.9;}100%{transform:translate(var(--drift,38px),250px) rotate(540deg);opacity:0;}}
    .svfx-gold-mist {position:absolute!important;inset:auto -10% -10% -10%;height:48%;z-index:2!important;
      background:radial-gradient(ellipse,#f3bb4d45,transparent 68%);filter:blur(13px);
      animation:svfx-drift 7s ease-in-out infinite alternate;}
    .svfx-nebula {--fx:#a567ff;background:radial-gradient(ellipse at 40% 55%,#17194c,#080c23 80%);}
    .svfx-cloud {position:absolute!important;inset:-35%;z-index:0!important;
      background:radial-gradient(ellipse at 35% 52%,#58bafc88,transparent 35%),
        radial-gradient(ellipse at 60% 42%,#9a47dfb0,transparent 34%),
        radial-gradient(ellipse at 70% 70%,#f174ab55,transparent 28%);
      filter:blur(25px);animation:svfx-cloudflow 12s ease-in-out infinite alternate;}
    .svfx-stars {position:absolute!important;inset:0;z-index:1!important;
      background-image:radial-gradient(circle,#fff 1px,transparent 2px),radial-gradient(circle,#8ddfff 1px,transparent 2px);
      background-size:37px 42px,59px 63px;background-position:4px 10px,17px 24px;
      animation:svfx-drift 15s linear infinite alternate;}
    .svfx-nebula::after, .svfx-evergold::after {content:'';position:absolute;inset:10px 12px;z-index:1;
      border:1px solid #a59cff70;border-radius:8px;box-shadow:inset 0 0 12px #9c7cff30,0 0 13px #7ab6ff22;pointer-events:none;}
    .svfx-evergold::after {border-color:#f6d07375;box-shadow:inset 0 0 15px #e8aa3e28,0 0 12px #ffd46f22;}
    .svfx-nebula-word {z-index:2;position:relative;font-weight:900;font-size:clamp(20px,3vw,37px);
      letter-spacing:.16em;color:#fff;text-shadow:0 0 13px #b588ff,0 0 27px #5eaaff;}
    @keyframes svfx-cloudflow {to {transform:translate(19%,-11%) rotate(13deg) scale(1.13);filter:blur(20px);}}
    @keyframes svfx-drift {to {transform:translateX(20px);}}
    @keyframes svfx-breathe {50%{filter:brightness(1.5);transform:scale(1.07);}}
    .svfx-ember {--fx:#ff8b43;background:radial-gradient(circle at 50% 80%,#52271b,#17101b 72%);}
    .svfx-firetext {font:900 clamp(22px,3vw,40px)/1.1 sans-serif;
      color:#ffd69a;text-shadow:0 0 5px #ffcd66,0 0 22px #ff742b;letter-spacing:.08em;}
    .svfx-spark {position:absolute!important;z-index:1!important;left:var(--x);bottom:-10%;width:4px;height:7px;
      border-radius:50%;background:#ffba4c;box-shadow:0 0 10px 3px #ff7c35;
      animation:svfx-sparks var(--time,4s) ease-out infinite;animation-delay:var(--delay,0s);}
    @keyframes svfx-sparks {to {transform:translate(var(--drift,18px),-240px) scale(.25);opacity:0;}}
    .svfx-acid {--fx:#7bff42;background:radial-gradient(ellipse,#163a1b,#08190f 75%);}
    .svfx-acid-text {position:relative;font:900 clamp(19px,3vw,35px)/1.3 system-ui,sans-serif;
      letter-spacing:.06em;color:#b6ff73;text-shadow:0 0 4px #60ff39,0 0 16px #28eb0b,
      0 0 28px #12a922;animation:svfx-corrosion 3.5s ease-in-out infinite;}
    .svfx-drips {position:absolute!important;top:57%;left:25%;width:50%;height:45%;z-index:2!important;
      background:repeating-linear-gradient(90deg,transparent 0 15%,#76ff32 17% 21%,transparent 23% 38%);
      clip-path:polygon(0 0,100% 0,100% 25%,82% 25%,82% 90%,77% 90%,77% 20%,51% 20%,51% 64%,47% 64%,47% 15%,25% 15%,25% 75%,21% 75%,21% 25%,0 25%);
      opacity:.66;filter:drop-shadow(0 0 6px #79ff33);animation:svfx-melt 3s ease-in-out infinite alternate;}
    @keyframes svfx-corrosion {50%{filter:hue-rotate(22deg) brightness(1.35);}}
    @keyframes svfx-melt {to {transform:translateY(13px) scaleY(1.2);opacity:.35;}}
    .svfx-radar {--fx:#61f9cc;background:radial-gradient(circle,#123d3d,#061b24 75%);}
    .svfx-radar-disc {width:118px;height:118px;border:1px solid #75ffe288;border-radius:50%;position:relative;
      box-shadow:inset 0 0 28px #51ecaa27,0 0 13px #51ecaa3d;
      background:repeating-radial-gradient(circle,transparent 0 18px,#68ffd828 19px 20px);}
    .svfx-radar-disc::after {content:'';position:absolute;inset:0;border-radius:50%;
      background:conic-gradient(from 0deg,transparent 0deg 280deg,#70ffe150 345deg,#84fff0 360deg);
      animation:svfx-rotate 3.5s linear infinite;}
    .svfx-radar-dot {position:absolute!important;width:9px;height:9px;border-radius:50%;background:#b1ffe4;top:26%;left:59%;box-shadow:0 0 11px #44ffcc;}
    @keyframes svfx-rotate {to {transform:rotate(360deg);}}
    .svfx-neon {--fx:#a18cff;background:radial-gradient(circle,#2b1b53,#100d27 80%);}
    .svfx-neon-tag {padding:13px 18px;border:2px solid #b8a1ff;border-radius:10px;
      font:900 clamp(16px,2.3vw,27px) ui-monospace,monospace;color:#f0e5ff;
      box-shadow:inset 0 0 12px #8d73ff88,0 0 22px #9c75ff99;
      text-shadow:0 0 12px #d8b8ff;animation:svfx-breathe 3s infinite;}
    .svfx-prism {--fx:#ec8bff;background:linear-gradient(135deg,#141b47,#261445,#0b2e47);}
    .svfx-prism-gem {width:104px;height:118px;clip-path:polygon(50% 0,100% 35%,83% 90%,50% 100%,17% 90%,0 35%);
      background:conic-gradient(from 0deg,#75dcff,#fa7dff,#bd8eff,#78f8d4,#75dcff);
      box-shadow:0 0 20px #c990ff;animation:svfx-prism-shine 6s linear infinite;}
    .svfx-prism-gem::after {content:'';position:absolute;inset:8px;
      clip-path:inherit;background:linear-gradient(130deg,#ffffffb0,#423d9eaa 42%,#bfe7ffcc);}
    @keyframes svfx-prism-shine {to {filter:hue-rotate(360deg);transform:rotate(6deg);}}
    .svfx-void {--fx:#a44dff;background:radial-gradient(circle,#29134e,#090516 70%);}
    .svfx-vortex {width:132px;height:132px;border-radius:50%;position:relative;
      border:2px solid #9a5eff;box-shadow:0 0 22px #9a50ffa3,inset 0 0 25px #9748ff78;
      background:repeating-conic-gradient(from 0deg,#6f37e833 0 12deg,#0a0614 20deg 42deg);
      animation:svfx-rotate 7s linear infinite;}
    .svfx-vortex::after {content:'';position:absolute;inset:23px;border:2px solid #e9a1ff;border-radius:50%;
      box-shadow:0 0 13px #d888ff,inset 0 0 20px #000;}
    .svfx-moon {--fx:#d7ddff;background:radial-gradient(circle,#303653,#101323 75%);}
    .svfx-crescent {width:105px;height:105px;border-radius:50%;background:#e0e4ff;
      box-shadow:0 0 22px #bbccff;
      transform:rotate(-20deg);position:relative;}
    .svfx-crescent::before {content:'';position:absolute;inset:-10px -12px 10px 31px;border-radius:50%;background:#202742;}
    .svfx-crescent::after {content:'✦  ·  ✧';position:absolute;top:-20px;left:105px;font-size:18px;color:#dae6ff;
      text-shadow:0 0 8px #b5cfff;white-space:nowrap;animation:svfx-breathe 3s infinite;}
    .svfx-eclipse {--fx:#f54b62;background:radial-gradient(circle at 50% 55%,#591a2e,#130b1c 70%);}
    .svfx-sun {width:120px;height:120px;border-radius:50%;position:relative;background:#f26057;
      box-shadow:0 0 20px #ef5366,0 0 48px #ef385c8a;}
    .svfx-sun::before {content:'';position:absolute;inset:1px;transform:translate(23px,-13px);border-radius:50%;
      background:#211129;animation:svfx-eclipse-slide 7s ease-in-out infinite alternate;}
    @keyframes svfx-eclipse-slide {to {transform:translate(4px,-3px);}}
    .svfx-wallet-coin {--fx:#ffbe4b;background:radial-gradient(circle,#5c4124,#19181c 75%);}
    .svfx-coins {display:flex;align-items:flex-end;gap:-4px;filter:drop-shadow(0 0 12px #ffcc58a6);}
    .svfx-coin {display:grid;place-items:center;width:55px;height:55px;margin-left:-10px;border-radius:50%;
      border:5px solid #ffda72;background:radial-gradient(circle at 36% 25%,#fff1aa,#f5a31c 60%,#a8670a);
      color:#97530d;font-size:27px;font-weight:900;box-shadow:inset 0 0 0 2px #b47e16,0 4px 10px #0007;}
    .svfx-coin:nth-child(2){transform:translateY(-15px)}
    .svfx-wallet-gem {--fx:#60d9ff;background:radial-gradient(circle,#174f71,#10212a 75%);}
    .svfx-gems {display:flex;align-items:flex-end;gap:4px;filter:drop-shadow(0 0 15px #65d9ff9c);}
    .svfx-gem {width:54px;height:57px;background:linear-gradient(140deg,#fff,#6bf2ff 34%,#2a84c0 78%);
      clip-path:polygon(50% 0,92% 20%,100% 55%,50% 100%,0 55%,8% 20%);
      animation:svfx-breathe 3s infinite;}
    .svfx-gem:nth-child(2){transform:translateY(-16px);animation-delay:-1s;}
    .svfx-gem:nth-child(3){animation-delay:-2s;}
    .svfx-modal-art {margin:15px 0;}
    .svfx-modal-art .svfx-scene {min-height:260px;}
    @media(max-width:760px){.svfx-featured {min-height:125px}.svfx-tile{min-height:110px}
      .solar-store-banner.svfx-banner>.svfx-scene{min-height:140px}}
    @media(prefers-reduced-motion:reduce){
      .svfx-scene *, .svfx-scene::before, .svfx-scene::after,
      .svfx-scene *::before, .svfx-scene *::after{animation:none!important;transition:none!important;}
    }
  `;
  document.head.appendChild(style);

  // All artwork is original HTML/CSS/SVG; no external images or services.
  const shards = (cls, total) => Array.from({length:total},(_,i) =>
    `<i class="${cls}" style="--x:${(i*31+7)%94}%;--delay:-${(i*0.79).toFixed(2)}s;--time:${3.1+(i%5)*.85}s;--drift:${((i%2)?-1:1)*(15+i*2)}px;--size:${9+i%4*3}px">${cls==='svfx-snow'?'✳':''}</i>`).join('');
  const glitch = (value) => `<span class="svfx-break" data-text="${value}">${value}</span>`;
  const card = (glitched) => `<div class="svfx-card">${glitched ? glitch('SolarEraser') : '<span class="svfx-break" style="animation:none">SolarEraser</span>'}<i class="svfx-noise"></i></div>`;
  const message = (glitched) => `<div class="svfx-message">03:36 <span style="color:#89c7ff">[XXV]</span> ${glitched ? glitch('signal compromised') : 'signal stable'}</div>`;
  const tree = `<svg class="svfx-tree" viewBox="0 0 260 160" aria-hidden="true">
    <path d="M130 163 Q127 113 132 87 M132 117 Q91 85 65 71 M131 102 Q157 76 194 60 M131 94 Q110 64 102 48 M134 89 Q148 56 161 40"
      fill="none" stroke="#aa7931" stroke-width="9" stroke-linecap="round"/>
    <path d="M130 161 Q129 129 130 96 M130 114 Q107 89 79 78 M130 100 Q165 75 189 66"
      fill="none" stroke="#f0bf63" stroke-width="2" stroke-linecap="round"/>
    ${Array.from({length:24},(_,i)=>{const a=i*2.399,r=18+Math.sqrt(i/24)*88;
      const x=130+Math.cos(a)*r,y=71+Math.sin(a)*r*.47;
      const color=['#ffd874','#fff0af','#ffb92c','#e8a93b'][i%4];
      return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${6+i%4}" ry="${10+i%3}" fill="${color}" opacity=".89" transform="rotate(${i*31%160} ${x.toFixed(1)} ${y.toFixed(1)})"/>`;
    }).join('')}
  </svg>`;

  const visuals = {
    bundle: `<div class="svfx-stack">${card(true)}${message(true)}<span class="svfx-microcopy">3-IN-1 // GLITCH</span></div>`,
    glitchName: `<div>${glitch('SolarEraser')}</div><i class="svfx-noise"></i>`,
    glitchCard: `<div class="svfx-stack">${card(false)}</div>`,
    glitchText: `<div class="svfx-stack">${message(true)}<i class="svfx-noise"></i></div>`,
    frost: `${shards('svfx-snow',13)}<span class="svfx-ice">❄</span><span class="svfx-label">FROSTBITE</span>`,
    evergold: `<i class="svfx-gold-mist"></i>${tree}${shards('svfx-petal',15)}<span class="svfx-label">EVERGOLD · GOLDEN PETALS</span>`,
    nebula: `<i class="svfx-cloud"></i><i class="svfx-stars"></i><span class="svfx-nebula-word">ASTRAL DRIFT</span><span class="svfx-label">COSMIC NAMECARD</span>`,
    ember: `${shards('svfx-spark',17)}<span class="svfx-firetext">EMBERFORGE</span><span class="svfx-label">LIVING EMBERS</span>`,
    neon: `<span class="svfx-neon-tag">✦ NEON ✦</span><span class="svfx-label">NEON OUTLINE</span>`,
    acid: `<div><span class="svfx-acid-text">VENOM SCRIPT</span><i class="svfx-drips"></i></div><span class="svfx-label">ACID FLOW TEXT EFFECT</span>`,
    radar: `<div class="svfx-radar-disc"><i class="svfx-radar-dot"></i></div><span class="svfx-label">ECHO RADAR</span>`,
    prism: `<div class="svfx-prism-gem"></div><span class="svfx-label">PRISM LIGHT</span>`,
    void: `<div class="svfx-vortex"></div><span class="svfx-label">VOID SIGNATURE</span>`,
    moon: `<div class="svfx-crescent"></div><span class="svfx-label">CELESTIAL FRAME</span>`,
    eclipse: `<div class="svfx-sun"></div><span class="svfx-label">ECLIPSE VEIL · EVENT CONCEPT</span>`,
    coins: `<div class="svfx-coins"><span class="svfx-coin">✦</span><span class="svfx-coin">✦</span><span class="svfx-coin">✦</span></div><span class="svfx-label">SOLARCOINS</span>`,
    gems: `<div class="svfx-gems"><span class="svfx-gem"></span><span class="svfx-gem"></span><span class="svfx-gem"></span></div><span class="svfx-label">PREMIUM CURRENCY</span>`
  };
  const tones = {
    bundle:['glitch','Glitch Bundle','3 COSMETICS'],
    glitchName:['glitch','Glitch Username','USERNAME EFFECT'],
    glitchCard:['glitch','Glitch Calling Card','NAMECARD'],
    glitchText:['glitch','Glitch Text','TEXT EFFECT'],
    frost:['frost','Frostbite','FROST EFFECT'],
    evergold:['evergold','Evergold','GOLDEN TREE NAMECARD'],
    nebula:['nebula','Astral Drift','NEBULA NAMECARD'],
    ember:['ember','Emberforge','FIRE COLLECTION'],
    neon:['neon','Neon Outline','USERNAME OUTLINE'],
    acid:['acid','Venom Script','ACID TEXT EFFECT'],
    radar:['radar','Echo Radar','RADAR NAMECARD'],
    prism:['prism','Prism Light','HOLOGRAPHIC EFFECT'],
    void:['void','Void Signature','VORTEX SIGNATURE'],
    moon:['moon','Celestial Frame','MOONLIT NAMECARD'],
    eclipse:['eclipse','Eclipse Veil','EVENT EXCLUSIVE CONCEPT'],
    coins:['wallet-coin','SolarCoins','EARNABLE CURRENCY'],
    gems:['wallet-gem','Premium Currency','FUTURE PREMIUM CURRENCY']
  };
  function scene(key, size='tile') {
    const effect = tones[key];
    return `<div class="svfx-scene svfx-${effect[0]} svfx-${size}" aria-hidden="true">${visuals[key]}</div>`;
  }
  function decorate(el,key,slot,large=false) {
    if(!el || !tones[key]) return;
    el.dataset.svfx=key;
    const target=el.querySelector(slot);
    if(target) target.innerHTML=scene(key,large?'wide':'tile');
  }
  // Three featured cards: all now show distinct moving artwork.
  const featured=[...store.querySelectorAll('.solar-store-feature')];
  [['bundle','Glitch Bundle','3 EFFECTS'],['frost','Frostbite','FROST EFFECT'],['evergold','Evergold','CALLING CARD']]
    .forEach(([key,name,type],i)=>{
      const el=featured[i];if(!el)return;
      el.dataset.svfx=key;el.dataset.preview=name;
      const heading=el.querySelector('.solar-store-feature-top strong');if(heading)heading.textContent=name;
      const chip=el.querySelector('.solar-store-chip');if(chip)chip.textContent=type;
      const foot=el.querySelector('.solar-store-feature-foot small');if(foot)foot.textContent='Animated visual concept';
      const art=el.querySelector('.solar-store-feature-art');if(art)art.innerHTML=scene(key,'featured');
    });
  // Each Glitch cosmetic has its own, accurate separate preview.
  const glitchProducts=store.querySelectorAll('[data-glitch-product]');
  glitchProducts.forEach(el=>{
    const map={username:'glitchName',card:'glitchCard',text:'glitchText',bundle:'bundle'};
    const key=map[el.dataset.glitchProduct];
    decorate(el,key,'.solar-glitch-art',true);
  });
  // Collection banners: Astral Drift nebula and Emberforge sparks.
  const collections=[...store.querySelectorAll('#solar-store-collections .solar-store-banner')];
  [['nebula','Astral Drift','A nebula flowing across the calling card.'],
   ['ember','Emberforge','Living embers, radiant edges and heat.']].forEach(([key,name,desc],i)=>{
     const el=collections[i];if(!el)return;
     el.classList.add('svfx-banner');el.dataset.svfx=key;
     el.innerHTML=`<div class="svfx-banner-title">${name}</div>${scene(key,'wide')}<div class="svfx-banner-caption">${desc} · Preview</div>`;
     el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label',`Preview ${name}`);
   });
  // Three uniquely animated items in each cosmetic shelf.
  const shelves=[
    ['#solar-store-solarcoins',[['neon','Neon Outline'],['acid','Venom Script'],['radar','Echo Radar']]],
    ['#solar-store-premium',[['prism','Prism Light'],['void','Void Signature'],['moon','Celestial Frame']]]
  ];
  shelves.forEach(([selector,products])=>{
    const cards=store.querySelectorAll(selector+' .solar-store-item');
    products.forEach(([key,name],i)=>{
      const el=cards[i];if(!el)return;
      el.dataset.svfx=key;el.dataset.preview=name;
      el.innerHTML=`<small>${tones[key][2]}</small>${scene(key)}<footer><span>${name}</span><b>VIEW</b></footer>`;
    });
  });
  // Event banner: red eclipse with a slow moving shadow.
  const event=store.querySelector('#solar-store-events .solar-store-banner');
  if(event){event.classList.add('svfx-banner');event.dataset.svfx='eclipse';
    event.innerHTML=`<div class="svfx-banner-title">Eclipse Veil</div>${scene('eclipse','wide')}<div class="svfx-banner-caption">Limited-edition event concept · Not currently for sale</div>`;
    event.tabIndex=0;event.setAttribute('role','button');event.setAttribute('aria-label','Preview Eclipse Veil');}
  // Even the placeholder wallet boxes have different animated artwork.
  const wallets=store.querySelectorAll('#solar-store-wallet .solar-store-wallet > div');
  [['coins','🪙 SolarCoins'],['gems','💎 Premium Currency']].forEach(([key,name],i)=>{
    const el=wallets[i];if(!el)return;el.dataset.svfx=key;
    el.innerHTML=`<strong>${name}</strong>${scene(key)}<p>Concept artwork only — balances and payment systems are not connected.</p>`;
  });
  // One enlarged live preview dialog shared by all visual showcases.
  const modal=store.querySelector('.solar-store-preview');
  const modalCard=store.querySelector('.solar-store-preview-card');
  const title=modalCard?.querySelector('.solar-store-preview-name');
  const desc=modalCard?.querySelector('p');
  const close=modalCard?.querySelector('.solar-store-preview-dismiss');
  if(!modal || !modalCard || !title || !close)return;
  const oldArt=modalCard.querySelector('.solar-glitch-modal-art');
  if(oldArt)oldArt.hidden=true;
  const modalArt=document.createElement('div');modalArt.className='svfx-modal-art';
  title.after(modalArt);
  let opener=null;
  function openPreview(key,el){
    if(!tones[key])return;
    opener=el;title.textContent=tones[key][1];
    modalArt.innerHTML=scene(key,'large');
    if(oldArt)oldArt.hidden=true;
    if(desc)desc.textContent=tones[key][2]+' — animated concept preview only. No purchases or inventory are enabled yet.';
    modal.hidden=false;close.focus();
  }
  // Capture clicks before the earlier V2/Glitch click handlers run.
  store.addEventListener('click',e=>{
    const el=e.target.closest('[data-svfx]');
    if(!el || !store.contains(el) || !modal.hidden)return;
    if(el.closest('.solar-store-wallet'))return; // Wallet is informational.
    e.preventDefault();e.stopPropagation();
    openPreview(el.dataset.svfx,el);
  },true);
  store.querySelectorAll('.svfx-banner').forEach(el=>{
    el.addEventListener('keydown',e=>{
      if(e.key==='Enter'||e.key===' '){e.preventDefault();openPreview(el.dataset.svfx,el);}
    });
  });
  close.addEventListener('click',()=>{if(opener?.isConnected)opener.focus();opener=null;});
  document.addEventListener('keydown',e=>{
    if(e.key==='Escape' && !store.hidden && !modal.hidden){
      e.preventDefault();e.stopImmediatePropagation();modal.hidden=true;
      if(opener?.isConnected)opener.focus();opener=null;
    }
  },true);
  console.log('[SolarEraser] V3 animated visual showcase loaded.');
})();

