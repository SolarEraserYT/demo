/* SolarEraser Store V4 — animated cosmetic previews.
   ADD BELOW the existing Store V2, Glitch Collection and V3.
   Visual previews only. No purchases or account changes.
*/
(() => {
  "use strict";

  const store = document.getElementById("solar-store-screen");
  if (!store || document.getElementById("sv4-style")) return;

  // Generate the golden tree once and reuse it in every preview.
  function random(seed) {
    let value = seed >>> 0;
    return () => (
      (value = (1664525 * value + 1013904223) >>> 0)
      / 4294967296
    );
  }

  const r = random(2067);
  const groups = [
    [176, 119, 79, 38, 215],
    [237, 79, 87, 47, 245],
    [326, 65, 103, 50, 320],
    [414, 85, 88, 48, 275],
    [486, 117, 79, 36, 205],
    [330, 121, 109, 43, 300]
  ];

  const colors = [
    "#ffe75a", "#ffd72d", "#ffb919", "#fff49c",
    "#ff9c12", "#ffca37", "#eb9c14", "#ffdf69"
  ];

  let leaves = "";

  for (const [cx, cy, rx, ry, count] of groups) {
    leaves += `
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"
        fill="#8e4309" opacity=".42"/>
    `;

    for (let i = 0; i < count; i++) {
      const angle = r() * Math.PI * 2;
      const dist = Math.sqrt(r());

      const x = cx + Math.cos(angle) * dist * rx;
      const y = cy + Math.sin(angle) * dist * ry;
      const width = 1.15 + r() * 2.7;
      const height = 1.7 + r() * 3.8;
      const color = colors[Math.floor(r() * colors.length)];

      leaves += `
        <ellipse
          cx="${x.toFixed(1)}"
          cy="${y.toFixed(1)}"
          rx="${width.toFixed(1)}"
          ry="${height.toFixed(1)}"
          fill="${color}"
          opacity="${(.60 + r() * .4).toFixed(2)}"
          transform="rotate(
            ${Math.floor(r() * 130 - 65)}
            ${x.toFixed(1)}
            ${y.toFixed(1)}
          )"
        />
      `;
    }
  }

  const art = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg"
  );

  art.setAttribute("width", "0");
  art.setAttribute("height", "0");
  art.setAttribute("aria-hidden", "true");

  art.style.cssText =
    "position:absolute;width:0;height:0;overflow:hidden;pointer-events:none";

  art.innerHTML = `
    <defs>
      <linearGradient id="sv4-sky" x2="0" y2="1">
        <stop stop-color="#160819"/>
        <stop offset=".63" stop-color="#611a18"/>
        <stop offset="1" stop-color="#a23c15"/>
      </linearGradient>

      <radialGradient id="sv4-halo">
        <stop stop-color="#ffde58" stop-opacity=".78"/>
        <stop offset=".40" stop-color="#ff921e"
          stop-opacity=".23"/>
        <stop offset="1" stop-color="#ff7e16"
          stop-opacity="0"/>
      </radialGradient>

      <linearGradient id="sv4-bark" x2="1" y2="0">
        <stop stop-color="#190f14"/>
        <stop offset=".32" stop-color="#6d3920"/>
        <stop offset=".60" stop-color="#432016"/>
        <stop offset="1" stop-color="#150e12"/>
      </linearGradient>

      <symbol id="sv4-tree-landscape" viewBox="0 0 640 275">
        <rect width="640" height="275" fill="url(#sv4-sky)"/>

        <ellipse cx="327" cy="100" rx="335" ry="225"
          fill="url(#sv4-halo)"/>

        <g stroke="#ffe180" stroke-width="2" opacity=".16">
          <path d="
            M325 95 L80 -30
            M325 95 L0 28
            M325 95 L620 -22
            M325 95 L680 54
            M325 95 L170 0
            M325 95 L480 -10
          "/>
        </g>

        <path d="
          M0 213 L72 179 120 190 196 166 250 189
          313 176 374 188 458 160 527 183
          640 156 V275 H0Z
        " fill="#361018"/>

        <path d="
          M0 228 Q85 194 162 216
          Q235 184 315 212
          Q399 185 481 214
          Q561 191 640 215 V275 H0Z
        " fill="#220e15"/>

        <path d="
          M303 277 Q311 228 306 190
          Q304 149 309 113
          L331 107
          Q323 157 332 196
          Q340 230 344 277 Z
        " fill="url(#sv4-bark)"/>

        <g fill="none" stroke-linecap="round">
          <path d="
            M320 190 Q290 150 245 122 Q200 110 167 103
            M318 170 Q353 134 397 112 Q447 98 485 110
            M316 147 Q307 103 278 75
            M319 138 Q354 104 381 77
            M316 208 Q279 159 222 153
          " stroke="#442013" stroke-width="13"/>

          <path d="
            M320 190 Q291 155 244 123
            M317 169 Q351 137 400 111
            M316 146 Q310 112 277 78
            M319 140 Q352 109 379 80
          " stroke="#be7731" stroke-width="3" opacity=".65"/>
        </g>

        <g>${leaves}</g>

        <path d="
          M0 255 Q170 230 318 241
          Q450 226 640 252 V275 H0Z
        " fill="#120c13"/>

        <path d="
          M315 275 L322 220
          M326 265 L327 201
        " stroke="#df9150" opacity=".3" stroke-width="2"/>
      </symbol>
    </defs>
  `;

  document.body.appendChild(art);

  // Shared styling for every live cosmetic demonstration.
  const css = document.createElement("style");
  css.id = "sv4-style";

  css.textContent = `
    .sv4-stage,
    .sv4-stage * {
      box-sizing: border-box;
    }

    .sv4-stage {
      position: relative;
      isolation: isolate;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-width: 0;
      min-height: 148px;
      padding: 14px;
      border-radius: 8px;
      overflow: hidden;
      background: var(--bg-main);
      color: #edf5ff;
    }

    .sv4-stage::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        145deg,
        #ffffff08,
        transparent 45%,
        #0005
      );
      z-index: 1;
    }

    .sv4-stage > * {
      position: relative;
      z-index: 2;
    }

    .solar-store-feature-art > .sv4-stage {
      min-height: 205px;
      flex: 1;
      height: 100%;
      border-radius: 0;
    }

    .solar-glitch-art > .sv4-stage {
      min-height: 150px;
    }

    .solar-store-banner.svfx-banner > .sv4-stage {
      min-height: 205px;
    }

    .solar-store-item > .sv4-stage {
      min-height: 145px;
      flex: 1 1 auto;
    }

    .solar-store-wallet > div > .sv4-stage {
      min-height: 135px;
      margin: 14px 0;
    }

    /* Shared calling-card frame */
    .sv4-card {
      width: min(96%, 390px);
      min-height: 62px;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 13px;
      border: 1px solid #ffffff85;
      border-radius: 8px;
      background: linear-gradient(
        180deg,
        transparent 30%,
        #05070db9
      );
      box-shadow:
        0 5px 18px #0007,
        inset 0 0 17px #ffffff0a;
      overflow: hidden;
    }

    .sv4-card-name {
      position: relative;
      z-index: 5;
      max-width: 100%;
      font-weight: 900;
      font-size: clamp(14px, 2vw, 24px);
      line-height: 1.1;
      color: white;
      text-shadow:
        0 2px 3px #000,
        0 0 10px #ffffff85;
    }

    /* Standalone username effects */
    .sv4-name {
      display: inline-block;
      font-weight: 950;
      line-height: 1.2;
      font-size: clamp(18px, 2.5vw, 35px);
      white-space: nowrap;
      max-width: 100%;
    }

    /* Realistic chat-message sample */
    .sv4-chat {
      width: min(96%, 440px);
      padding: 13px 14px;
      background: #0b1324c7;
      border: 1px solid #7799d233;
      border-left: 3px solid var(--accent);
      border-radius: 6px;
      box-shadow: 0 5px 25px #0008;
    }

    .sv4-chat-head {
      font: 10px ui-monospace, monospace;
      color: #91a3bf;
      margin-bottom: 6px;
    }

    .sv4-chat-head b {
      color: #dfeaff;
      font-weight: 750;
    }

    .sv4-chat-text {
      font-size: clamp(12px, 1.7vw, 17px);
      font-weight: 750;
      overflow-wrap: anywhere;
    }

    /* EVERGOLD — ANIMATED GOLDEN TREE */

    .sv4-tree {
      background: #210c15;
      padding: 0;
    }

    .sv4-tree-view {
      position: absolute !important;
      inset: 0;
      z-index: 0 !important;
    }

    .sv4-tree-view svg {
      width: 100%;
      height: 100%;
      display: block;
    }

    .sv4-tree .sv4-card {
      position: absolute;
      left: 50%;
      bottom: 10px;
      transform: translateX(-50%);
      width: min(79%, 320px);
      min-height: 45px;
      padding: 8px 12px;
      border-color: #ffdb8970;
      background: linear-gradient(
        180deg,
        #160d1b70,
        #130b16d9
      );
      box-shadow: 0 0 20px #ff9d2730;
    }

    .sv4-tree .sv4-card-name {
      color: #fff8c8;
      text-shadow:
        0 1px 3px #281000,
        0 0 12px #ffcf42;
    }

    .sv4-tree-haze {
      position: absolute !important;
      inset: auto -15% -18%;
      height: 65%;
      z-index: 2 !important;
      background: radial-gradient(
        ellipse at 45% 85%,
        #ffbe4e49,
        transparent 65%
      );
      filter: blur(15px);
      animation: sv4-haze 8s ease-in-out infinite alternate;
    }

    .sv4-petal {
      position: absolute !important;
      z-index: 3 !important;
      left: var(--left);
      top: var(--top);
      width: var(--size);
      height: calc(var(--size) * 1.65);
      border-radius: 75% 0 70% 0;
      background: linear-gradient(
        140deg,
        #fffbc1,
        #ffd52a 58%,
        #d9800b
      );
      box-shadow: 0 0 5px #ffd8449c;
      opacity: 0;
      pointer-events: none;
      animation: sv4-petals var(--speed) linear infinite;
      animation-delay: var(--delay);
    }

    @keyframes sv4-petals {
      0% {
        transform: translate3d(-80px, -25px, 0) rotate(-50deg);
        opacity: 0;
      }

      12% { opacity: 1; }
      80% { opacity: .92; }

      100% {
        transform: translate3d(
          250px,
          var(--drift),
          0
        ) rotate(520deg);
        opacity: 0;
      }
    }

    @keyframes sv4-haze {
      to {
        transform: translateX(50px);
        opacity: .58;
      }
    }

    /* GLITCH — STRONGER RGB SPLITTING */

    .sv4-glitch {
      background: linear-gradient(
        125deg,
        #050d1c,
        #1b1235,
        #09172b
      );
    }

    .sv4-glitch::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      background: repeating-linear-gradient(
        0deg,
        transparent 0 4px,
        #76dcff1f 5px,
        transparent 7px
      );
      animation: sv4-tearing 3.8s steps(1, end) infinite;
    }

    .sv4-broken {
      position: relative;
      display: inline-block;
      font:
        900 clamp(16px, 2.5vw, 31px)/1.2
        ui-monospace, Consolas, monospace;
      letter-spacing: -.06em;
      color: #f7f8ff;
      text-shadow: 0 0 9px #9ce7ff;
      animation: sv4-jump 3s steps(1, end) infinite;
    }

    .sv4-broken::before,
    .sv4-broken::after {
      content: attr(data-t);
      position: absolute;
      inset: 0;
      white-space: nowrap;
      opacity: 0;
      pointer-events: none;
    }

    .sv4-broken::before {
      color: #3dffea;
      text-shadow: -4px 0 #30f5fd;
      animation: sv4-chroma-a 3s steps(1, end) infinite;
    }

    .sv4-broken::after {
      color: #ff3a9d;
      text-shadow: 4px 0 #f56ddd;
      animation: sv4-chroma-b 3s steps(1, end) infinite;
    }

    .sv4-glitch .sv4-card {
      border-color: #8fc2ff;
      background: repeating-linear-gradient(
        0deg,
        #10172d 0 4px,
        #191733 5px 6px
      );
      box-shadow:
        0 0 15px #7c9fff67,
        inset 0 0 16px #a081ff45;
    }

    .sv4-glitch .sv4-card .sv4-broken {
      font-size: clamp(15px, 2vw, 24px);
    }

    .sv4-glitch .sv4-chat {
      border-color: #8ac5ff7c;
      border-left: 3px solid #81dafa;
    }

    .sv4-glitch-stack {
      width: min(100%, 390px);
      display: grid;
      gap: 10px;
    }

    .sv4-glitch-stack .sv4-card,
    .sv4-glitch-stack .sv4-chat {
      width: 100%;
    }

    .sv4-glitch .sv4-chat-text .sv4-broken {
      font-size: clamp(12px, 1.7vw, 17px);
    }

    @keyframes sv4-chroma-a {
      0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
        opacity: 0;
        transform: translate(0);
      }

      9% {
        opacity: 1;
        transform: translate(-11px, -2px);
        clip-path: inset(0 0 66% 0);
      }

      10% {
        opacity: 1;
        transform: translate(8px, 1px);
        clip-path: inset(36% 0 40% 0);
      }

      28% {
        opacity: .95;
        transform: translate(-8px, 0);
        clip-path: inset(72% 0 0 0);
      }

      29% {
        opacity: 1;
        transform: translate(4px, 2px);
        clip-path: inset(22% 0 55% 0);
      }

      49% {
        opacity: 1;
        transform: translate(-7px, -2px);
        clip-path: inset(46% 0 26% 0);
      }

      79%, 80% {
        opacity: 1;
        transform: translate(12px, 0);
        clip-path: inset(7% 0 70% 0);
      }
    }

    @keyframes sv4-chroma-b {
      0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
        opacity: 0;
        transform: translate(0);
      }

      9% {
        opacity: 1;
        transform: translate(9px, 2px);
        clip-path: inset(67% 0 0 0);
      }

      10% {
        opacity: 1;
        transform: translate(-6px, -1px);
        clip-path: inset(10% 0 64% 0);
      }

      28% {
        opacity: .9;
        transform: translate(12px, 1px);
        clip-path: inset(0 0 76% 0);
      }

      29% {
        opacity: 1;
        transform: translate(-6px, -2px);
        clip-path: inset(49% 0 21% 0);
      }

      49% {
        opacity: 1;
        transform: translate(10px, 2px);
        clip-path: inset(80% 0 0 0);
      }

      79%, 80% {
        opacity: 1;
        transform: translate(-12px, 1px);
        clip-path: inset(42% 0 34% 0);
      }
    }

    @keyframes sv4-jump {
      0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
        transform: none;
      }

      9%, 28%, 79% {
        transform: translate(4px, -1px) skewX(-8deg);
      }

      10%, 29%, 49% {
        transform: translate(-4px, 1px) skewX(5deg);
      }
    }

    @keyframes sv4-tearing {
      0%, 8%, 11%, 27%, 31%, 48%, 51%, 78%, 82%, 100% {
        opacity: .24;
        transform: none;
      }

      9%, 28%, 49%, 79% {
        opacity: .95;
        transform: translateY(7px);
      }
    }

    /* ASTRAL DRIFT — COSMIC NAMECARD */

    .sv4-nebula {
      background: #070e25;
    }

    .sv4-cloud {
      position: absolute !important;
      inset: -30%;
      z-index: 0 !important;
      background:
        radial-gradient(
          ellipse at 30% 50%,
          #58bafca8,
          transparent 35%
        ),
        radial-gradient(
          ellipse at 63% 40%,
          #b050f7ad,
          transparent 34%
        ),
        radial-gradient(
          ellipse at 72% 75%,
          #fe80c15c,
          transparent 36%
        );
      filter: blur(19px);
      animation: sv4-space-drift 12s ease-in-out infinite alternate;
    }

    .sv4-stars {
      position: absolute !important;
      inset: 0;
      z-index: 1 !important;
      background:
        radial-gradient(circle, #fff 1px, transparent 2px)
        3px 7px / 41px 37px,
        radial-gradient(circle, #91d8ff 1px, transparent 2px)
        17px 23px / 59px 73px;
      opacity: .7;
      animation: sv4-space-drift 19s linear infinite alternate;
    }

    @keyframes sv4-space-drift {
      to {
        transform: translateX(13%) translateY(-5%) scale(1.1);
      }
    }

    /* FROSTBITE — SNOWING CALLING CARD */

    .sv4-frost {
      background: radial-gradient(
        ellipse,
        #1c5176,
        #081c32 75%
      );
    }

    .sv4-ice {
      position: absolute !important;
      inset: 0;
      z-index: 0 !important;
      background: repeating-conic-gradient(
        from 21deg at 45% 115%,
        #9eeeff32 0 12deg,
        transparent 12deg 27deg
      );
    }

    .sv4-flake {
      position: absolute !important;
      left: var(--left);
      top: -12%;
      z-index: 2 !important;
      color: #e4faff;
      font-size: var(--size);
      animation: sv4-snow var(--speed) linear infinite;
      animation-delay: var(--delay);
    }

    @keyframes sv4-snow {
      to {
        transform: translate(33px, 255px) rotate(240deg);
        opacity: 0;
      }
    }

    /* EMBERFORGE — FIRE AND SPARKS */

    .sv4-ember {
      background: radial-gradient(
        ellipse at 50% 100%,
        #772a1b,
        #170b18 75%
      );
    }

    .sv4-flame {
      position: absolute !important;
      inset: auto -10% -25%;
      height: 90%;
      z-index: 0 !important;
      background:
        radial-gradient(
          ellipse at 30% 90%,
          #ffb13e89,
          transparent 57%
        ),
        radial-gradient(
          ellipse at 75% 95%,
          #fa572a94,
          transparent 60%
        );
      filter: blur(12px);
      animation: sv4-flame 4s ease-in-out infinite alternate;
    }

    .sv4-spark {
      position: absolute !important;
      left: var(--left);
      bottom: -5%;
      z-index: 2 !important;
      width: 3px;
      height: 5px;
      border-radius: 50%;
      background: #ffe7a4;
      box-shadow: 0 0 8px #ff8432;
      animation: sv4-ash var(--speed) linear infinite;
      animation-delay: var(--delay);
    }

    @keyframes sv4-flame {
      to { transform: translateX(8%) scale(1.15); }
    }

    @keyframes sv4-ash {
      to {
        transform: translate(33px, -240px);
        opacity: 0;
      }
    }

    /* VENOM SCRIPT — GREEN ACID CHAT MESSAGES */

    .sv4-acid {
      background: radial-gradient(
        ellipse,
        #154226,
        #071910 80%
      );
    }

    .sv4-acid .sv4-chat {
      border-color: #64e86d8a;
      border-left-color: #93ff43;
      background: #091c0ecf;
    }

    .sv4-acid .sv4-chat-text {
      color: #b3ff6c;
      text-shadow:
        0 0 5px #40ff59,
        0 0 13px #32d915;
      animation: sv4-acid-sheen 3s ease-in-out infinite;
    }

    .sv4-acid .sv4-chat-text::after {
      content: "";
      display: block;
      margin-top: 0;
      width: 75%;
      height: 10px;
      background: repeating-linear-gradient(
        90deg,
        #8cff44 0 3px,
        transparent 4px 17px
      );
      clip-path: polygon(
        0 0, 100% 0, 100% 15%,
        75% 15%, 75% 100%, 71% 100%,
        71% 15%, 40% 15%, 40% 85%,
        35% 85%, 35% 15%, 8% 15%,
        8% 60%, 0 60%
      );
      filter: drop-shadow(0 0 5px #88ff44);
      animation: sv4-drip 2.8s ease-in-out infinite alternate;
    }

    @keyframes sv4-drip {
      to {
        transform: translateY(8px) scaleY(1.3);
        opacity: .5;
      }
    }

    @keyframes sv4-acid-sheen {
      50% {
        filter: hue-rotate(20deg) brightness(1.2);
      }
    }

    /* ECHO RADAR — SCANNING NAMECARD */

    .sv4-radar {
      background: radial-gradient(
        ellipse,
        #144c4b,
        #061b29 80%
      );
    }

    .sv4-radar-disc {
      position: absolute !important;
      width: 170px;
      height: 170px;
      border: 1px solid #70f8d2;
      border-radius: 50%;
      background: repeating-radial-gradient(
        circle,
        transparent 0 20px,
        #6af9d934 22px 23px
      );
      box-shadow:
        inset 0 0 30px #63e9d73b,
        0 0 15px #44f9de43;
    }

    .sv4-radar-disc::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: conic-gradient(
        transparent 0 275deg,
        #51ffd232 335deg,
        #94ffe5 360deg
      );
      animation: sv4-radar-spin 4s linear infinite;
    }

    @keyframes sv4-radar-spin {
      to { transform: rotate(360deg); }
    }

    /* CELESTIAL FRAME — MOONLIGHT */

    .sv4-moon {
      background: radial-gradient(
        ellipse,
        #2e355c,
        #0c1028 75%
      );
    }

    .sv4-moon-disc {
      position: absolute !important;
      width: 100px;
      height: 100px;
      left: 53%;
      top: 7%;
      border-radius: 50%;
      background: radial-gradient(
        circle at 25% 25%,
        white,
        #c0d0ff
      );
      box-shadow:
        0 0 22px #c6ddff85,
        0 0 60px #b4beff3c;
    }

    .sv4-moon-disc::after {
      content: "";
      position: absolute;
      inset: -5px -10px 8px 32px;
      border-radius: 50%;
      background: #1b2144;
    }

    /* NEON OUTLINE — USERNAME EFFECT */

    .sv4-neon {
      background: radial-gradient(
        ellipse,
        #2c205c,
        #0b0c20 85%
      );
    }

    .sv4-neon .sv4-name {
      color: #faf0ff;
      text-shadow:
        0 0 4px white,
        0 0 15px #b181ff,
        0 0 32px #845aff;
      -webkit-text-stroke: .65px #d9bcff;
      animation: sv4-glow 3s ease-in-out infinite;
    }

    @keyframes sv4-glow {
      50% {
        filter: brightness(1.4);
        text-shadow:
          0 0 8px white,
          0 0 24px #af76ff;
      }
    }

    /* PRISM LIGHT — HOLOGRAPHIC USERNAME */

    .sv4-prism {
      background: linear-gradient(
        125deg,
        #1a1746,
        #153153,
        #3e164d
      );
    }

    .sv4-prism .sv4-name {
      background: linear-gradient(
        105deg,
        #5fffe6,
        #fff1fa,
        #f5a0ff,
        #73d8ff,
        #fff1fa
      );
      background-size: 250% 100%;
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      filter: drop-shadow(0 0 9px #b47aff);
      animation: sv4-rainbow 5s linear infinite;
    }

    @keyframes sv4-rainbow {
      to { background-position: 250% 0; }
    }

    /* VOID SIGNATURE — PURPLE VORTEX */

    .sv4-void {
      background: radial-gradient(
        ellipse,
        #3a1658,
        #0b071b 70%
      );
    }

    .sv4-vortex {
      position: absolute !important;
      width: 175px;
      height: 175px;
      border: 2px solid #b06dff;
      border-radius: 50%;
      box-shadow:
        0 0 25px #ac63ffb0,
        inset 0 0 30px #a04bff55;
      background: repeating-conic-gradient(
        from 0deg,
        #6025cf30 0 12deg,
        #070419 19deg 36deg
      );
      animation: sv4-radar-spin 8s linear infinite;
    }

    /* ECLIPSE VEIL — LIMITED EVENT */

    .sv4-eclipse {
      background: radial-gradient(
        ellipse,
        #741e37,
        #160d22 75%
      );
    }

    .sv4-eclipse-disc {
      position: absolute !important;
      width: 123px;
      height: 123px;
      border-radius: 50%;
      background: #ff7349;
      box-shadow:
        0 0 25px #ff4c69,
        0 0 57px #c8385a66;
    }

    .sv4-eclipse-disc::after {
      content: "";
      position: absolute;
      inset: 0;
      border-radius: 50%;
      background: #210e21;
      transform: translate(20px, -12px);
      animation: sv4-eclipse 6s ease-in-out infinite alternate;
    }

    @keyframes sv4-eclipse {
      to { transform: translate(0, -2px); }
    }

    /* CURRENCY PREVIEWS */

    .sv4-currency {
      background: radial-gradient(
        ellipse,
        #463926,
        #121827 80%
      );
    }

    .sv4-currency-label {
      font-size: clamp(16px, 2vw, 23px);
      font-weight: 900;
      letter-spacing: .02em;
      color: #ffd886;
      text-shadow: 0 0 17px #ffab3f87;
    }

    .sv4-gems {
      background: radial-gradient(
        ellipse,
        #183b5c,
        #0c182b 80%
      );
    }

    .sv4-gems .sv4-currency-label {
      color: #9ceeff;
      text-shadow: 0 0 17px #4ecaff8a;
    }

    .sv4-visual-caption {
      position: absolute !important;
      z-index: 5 !important;
      right: 10px;
      top: 10px;
      font: 9px/1.1 ui-monospace, monospace;
      letter-spacing: .11em;
      opacity: .7;
      color: #dceaff;
    }

    /* FULL-SIZE LIVE PREVIEW WINDOW */

    .sv4-overlay[hidden] {
      display: none !important;
    }

    .sv4-overlay {
      position: fixed;
      inset: 0;
      z-index: 15000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: #000c;
      backdrop-filter: blur(5px);
    }

    .sv4-panel {
      width: min(640px, 100%);
      max-height: 95dvh;
      overflow: auto;
      border-radius: 12px;
      border: 1px solid var(--accent);
      background: var(--bg-panel);
      box-shadow: 0 25px 70px #000a;
      padding: 18px;
    }

    .sv4-panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .sv4-panel-title {
      font-weight: 800;
      font-size: 20px;
    }

    .sv4-panel-close {
      min-width: 36px;
      min-height: 36px;
      padding: 0;
      border: 1px solid var(--border-subtle);
      border-radius: 7px;
      background: var(--bg-hover);
      color: var(--text-main);
      font-size: 22px;
    }

    .sv4-panel .sv4-stage {
      min-height: 300px;
      margin: 16px 0;
    }

    .sv4-panel p {
      margin: 0 0 8px;
      font-size: 12px;
      color: var(--text-muted);
    }

    @media (max-width: 760px) {
      .sv4-stage {
        min-height: 125px;
        padding: 10px;
      }

      .solar-store-feature-art > .sv4-stage {
        min-height: 145px;
      }

      .solar-store-banner.svfx-banner > .sv4-stage {
        min-height: 165px;
      }

      .sv4-tree .sv4-card {
        min-height: 38px;
      }

      .sv4-petal:nth-of-type(n+62) {
        display: none;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .sv4-stage *,
      .sv4-stage::before,
      .sv4-stage::after,
      .sv4-stage *::before,
      .sv4-stage *::after {
        animation: none !important;
      }
    }
  `;

  document.head.appendChild(css);

  // Build animated petals and snowflakes.
  const petalRandom = random(339);

  function particles(type, count) {
    let html = "";

    for (let i = 0; i < count; i++) {
      const p = petalRandom();

      const left = type === "petal"
        ? (petalRandom() * 100 - 10)
        : (petalRandom() * 100);

      const top = petalRandom() * 79;
      const speed = (3.2 + petalRandom() * 6.5).toFixed(2);
      const delay = -(petalRandom() * 10).toFixed(2);

      const size = (
        type === "petal"
          ? 2.7 + p * 4
          : 8 + p * 7
      ).toFixed(1);

      const drift = ((petalRandom() - .5) * 130).toFixed(1);

      html += `
        <i
          class="${type === "petal" ? "sv4-petal" : "sv4-flake"}"
          aria-hidden="true"
          style="
            --left:${left.toFixed(1)}%;
            --top:${top.toFixed(1)}%;
            --speed:${speed}s;
            --delay:${delay}s;
            --size:${size}px;
            --drift:${drift}px;
          "
        >${type === "snow" ? "✳" : ""}</i>
      `;
    }

    return html;
  }

  // Generate examples that look like actual chat cosmetics.
  function broken(value) {
    return `
      <span class="sv4-broken" data-t="${value}">
        ${value}
      </span>
    `;
  }

  const clean = `<span class="sv4-card-name">SolarEraser</span>`;
  const glitchName = broken("SolarEraser");

  function card(inner = clean) {
    return `<div class="sv4-card">${inner}</div>`;
  }

  function chat(inner) {
    return `
      <div class="sv4-chat">
        <div class="sv4-chat-head">
          03:36 [XXV] <b>SolarEraser</b>
        </div>
        <div class="sv4-chat-text">${inner}</div>
      </div>
    `;
  }

  // Each cosmetic has its OWN visual demonstration.
  const examples = {
    bundle: [
      "glitch",
      `
        <div class="sv4-glitch-stack">
          ${card(glitchName)}
          ${chat(broken("Connection corrupted..."))}
        </div>
      `,
      "Username + calling card + message glitch"
    ],

    glitchName: [
      "glitch",
      `<span class="sv4-name">${glitchName}</span>`,
      "Username only — RGB split and screen tearing"
    ],

    glitchCard: [
      "glitch",
      card(),
      "Calling card only — animated signal distortion"
    ],

    glitchText: [
      "glitch",
      chat(broken("Connection corrupted...")),
      "Messages only — broken, shifting text"
    ],

    evergold: [
      "tree",
      `
        <div class="sv4-tree-view">
          <svg
            viewBox="0 0 640 275"
            preserveAspectRatio="xMidYMid slice"
          >
            <use href="#sv4-tree-landscape"/>
          </svg>
        </div>
        <i class="sv4-tree-haze"></i>
        ${particles("petal", 110)}
        ${card()}
      `,
      "Evergold — golden anime-style tree and flying petals"
    ],

    nebula: [
      "nebula",
      `
        <i class="sv4-cloud"></i>
        <i class="sv4-stars"></i>
        ${card()}
      `,
      "Astral Drift — living cosmic calling card"
    ],

    frost: [
      "frost",
      `
        <i class="sv4-ice"></i>
        ${particles("snow", 26)}
        ${card()}
      `,
      "Frostbite — crystalline snow calling card"
    ],

    ember: [
      "ember",
      `
        <i class="sv4-flame"></i>
        ${
          Array.from({ length: 16 }, (_, i) => `
            <i class="sv4-spark" style="
              --left:${(i * 17) % 100}%;
              --speed:${3 + i % 4}s;
              --delay:-${i * .38}s;
            "></i>
          `).join("")
        }
        ${card()}
      `,
      "Emberforge — drifting sparks and glowing embers"
    ],

    radar: [
      "radar",
      `<i class="sv4-radar-disc"></i>${card()}`,
      "Echo Radar — sweeping scan calling card"
    ],

    moon: [
      "moon",
      `
        <i class="sv4-stars"></i>
        <i class="sv4-moon-disc"></i>
        ${card()}
      `,
      "Celestial Frame — moonlit calling card"
    ],

    eclipse: [
      "eclipse",
      `
        <i class="sv4-eclipse-disc"></i>
        ${card()}
      `,
      "Eclipse Veil — red eclipse event calling card"
    ],

    neon: [
      "neon",
      `<span class="sv4-name">SolarEraser</span>`,
      "Neon Outline — luminous username only"
    ],

    acid: [
      "acid",
      chat("The venom is spreading..."),
      "Venom Script — flowing poisonous green messages"
    ],

    prism: [
      "prism",
      `<span class="sv4-name">SolarEraser</span>`,
      "Prism Light — moving holographic username"
    ],

    void: [
      "void",
      `<i class="sv4-vortex"></i>${card()}`,
      "Void Signature — spinning dark vortex namecard"
    ],

    coins: [
      "currency",
      `<span class="sv4-currency-label">SolarCoins</span>`,
      "SolarCoins — wallet placeholder, no real balance"
    ],

    gems: [
      "gems",
      `<span class="sv4-currency-label">Premium Currency</span>`,
      "Premium currency — wallet placeholder, no real balance"
    ]
  };

  function stage(key) {
    const item = examples[key];
    if (!item) return "";

    return `
      <div
        class="sv4-stage sv4-${item[0]}"
        role="img"
        aria-label="${item[2]}"
      >
        ${item[1]}
        <span class="sv4-visual-caption">LIVE PREVIEW</span>
      </div>
    `;
  }

  // Update every existing Store V3 display.
  // Names, categories, and overall Store layout stay intact.
  store.querySelectorAll("[data-svfx]").forEach(holder => {
    const key = holder.dataset.svfx;
    const old = holder.querySelector(".svfx-scene");

    if (old && examples[key]) {
      old.outerHTML = stage(key);
    }
  });

  // Enlarged live-preview window.
  const overlay = document.createElement("div");
  overlay.className = "sv4-overlay";
  overlay.hidden = true;

  overlay.innerHTML = `
    <div
      class="sv4-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Store cosmetic preview"
    >
      <div class="sv4-panel-header">
        <strong class="sv4-panel-title"></strong>
        <button
          type="button"
          class="sv4-panel-close"
          aria-label="Close preview"
        >×</button>
      </div>

      <div class="sv4-panel-body"></div>
      <p class="sv4-panel-note"></p>
      <p>
        Visual concept only. Nothing is available
        for purchase or equipping yet.
      </p>
    </div>
  `;

  store.appendChild(overlay);

  const closeButton = overlay.querySelector(
    ".sv4-panel-close"
  );

  let opener = null;

  function close() {
    overlay.hidden = true;

    if (opener && opener.isConnected) {
      opener.focus();
    }

    opener = null;
  }

  function show(key, element) {
    if (!examples[key]) return;

    opener = element;

    const label = element.querySelector(
      ".svfx-banner-title, " +
      ".solar-store-feature-top strong, " +
      ".solar-glitch-product-header strong, " +
      "footer span"
    )?.textContent;

    overlay.querySelector(
      ".sv4-panel-title"
    ).textContent = label || examples[key][2].split(" — ")[0];

    overlay.querySelector(
      ".sv4-panel-body"
    ).innerHTML = stage(key);

    overlay.querySelector(
      ".sv4-panel-note"
    ).textContent = examples[key][2];

    overlay.hidden = false;
    closeButton.focus();
  }

  // Intercept previews before the older Store handlers.
  document.addEventListener("click", event => {
    if (store.hidden || !overlay.hidden) return;

    const target = event.target.closest("[data-svfx]");

    if (
      !target ||
      !store.contains(target) ||
      target.closest("#solar-store-wallet")
    ) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    show(target.dataset.svfx, target);
  }, true);

  closeButton.addEventListener("click", close);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });

  document.addEventListener("keydown", event => {
    if (store.hidden || overlay.hidden) return;

    if (event.key === "Escape") {
      event.preventDefault();
      event.stopImmediatePropagation();
      close();
    }

    if (event.key === "Tab") {
      event.preventDefault();
      closeButton.focus();
    }
  }, true);

  // Support keyboard activation on collection banners.
  document.addEventListener("keydown", event => {
    if (store.hidden || !overlay.hidden) return;

    const target = event.target.closest(
      ".svfx-banner[data-svfx]"
    );

    if (
      !target ||
      !store.contains(target) ||
      !["Enter", " "].includes(event.key)
    ) {
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    show(target.dataset.svfx, target);
  }, true);

  console.log(
    "[SolarEraser] V4 animated cosmetic previews loaded."
  );
})();


