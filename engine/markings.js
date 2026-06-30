/*
 * text-markings — hand-drawn Precept-style key-word marking engine
 * Repo: ang-kl/Text_Markings
 *
 * Usage:
 *   <div id="passage">
 *     For <span data-m="god">God</span> so <span data-m="love">loved</span> the world ...
 *   </div>
 *   <script src="markings.js"></script>
 *   <script>TextMarkings.apply('#passage');</script>
 *
 * Every element carrying a data-m attribute is marked with the symbol whose id
 * matches the value (ids match symbols/assets/manifest.json). Marks are drawn
 * onto an SVG overlay sized to each word, so they reflow and print correctly.
 * No external dependencies; the hand-drawn wobble is generated procedurally.
 */
(function (global) {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";
  var PAL = {
    purple: "#6a3d9a", red: "#c0392b", gold: "#c69500", amber: "#dd7d00",
    green: "#2e8b3d", brown: "#8a5a2b", grey: "#6d6d6d", yellow: "#f0d24f",
    blue: "#2f6fb0", orange: "#e07b1a", lgreen: "#bfe39a", lorange: "#f6c48f",
    lyellow: "#f6e6a0", lbrown: "#d9b38c"
  };
  var ALIAS = { christ: "jesus", death: "die", eternal: "eternal_life", tent: "tabernacle", god_love: "gods_love" };

  function rnd(a) { return (Math.random() * 2 - 1) * a; }
  function roughD(pts, closed, amp) {
    var p = closed ? pts.concat([pts[0]]) : pts, out = [];
    for (var i = 0; i < p.length - 1; i++) {
      var x1 = p[i][0], y1 = p[i][1], x2 = p[i + 1][0], y2 = p[i + 1][1];
      var dx = x2 - x1, dy = y2 - y1, ln = Math.hypot(dx, dy) || 1;
      var seg = Math.max(2, Math.round(ln / 12)), nx = -dy / ln, ny = dx / ln;
      for (var s = (i ? 1 : 0); s <= seg; s++) { var t = s / seg, o = rnd(amp); out.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]); }
    }
    var d = "M" + out[0][0].toFixed(1) + " " + out[0][1].toFixed(1);
    for (var j = 1; j < out.length; j++) d += "L" + out[j][0].toFixed(1) + " " + out[j][1].toFixed(1);
    return d;
  }
  function pathEl(svg, d, o) {
    var pa = document.createElementNS(NS, "path");
    pa.setAttribute("d", d); pa.setAttribute("fill", o.fill || "none");
    if (o.stroke) { pa.setAttribute("stroke", o.stroke); pa.setAttribute("stroke-width", o.sw || 1.7); pa.setAttribute("stroke-linecap", "round"); pa.setAttribute("stroke-linejoin", "round"); }
    if (o.op != null) pa.setAttribute("opacity", o.op);
    svg.appendChild(pa);
  }
  function strokeS(svg, pts, closed, o) {
    if (o.fillColor) pathEl(svg, roughD(pts, true, o.amp || 1.2), { fill: o.fillColor, op: o.fillOp || 0.45 });
    for (var k = 0; k < (o.passes || 2); k++) pathEl(svg, roughD(pts, closed, o.amp || 1.2), { stroke: o.stroke, sw: o.sw || 1.7 });
  }
  function dotS(svg, x, y, r, c) {
    var pts = [];
    for (var i = 0; i < 10; i++) { var t = Math.PI * 2 * i / 10; pts.push([x + Math.cos(t) * (r + rnd(0.4)), y + Math.sin(t) * (r + rnd(0.4))]); }
    pathEl(svg, roughD(pts, true, 0.3), { fill: c, stroke: c, sw: 0.8 });
  }
  function rectpts(x, y, w, h) { return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]; }
  function cloudpts(b) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, rx = b.w / 2 + 10, ry = b.h / 2 + 11;
    var lobes = Math.max(6, Math.min(11, Math.round((b.w + b.h) / 24))), steps = lobes * 7, p = [];
    for (var i = 0; i < steps; i++) { var t = Math.PI * 2 * i / steps, bump = 0.5 - 0.5 * Math.cos(lobes * t), r = 1 + 0.26 * bump; p.push([cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r]); }
    return p;
  }
  function gpos(b) { var s = Math.max(10, Math.min(15, b.h * 0.95)); return { cx: b.x + b.w / 2, cy: b.y - s - 4, s: s }; }

  function enc_triangle(svg, b, c) { var p = 6; strokeS(svg, [[b.x + b.w / 2, b.y - p - 4], [b.x - p, b.y + b.h + p], [b.x + b.w + p, b.y + b.h + p]], true, { stroke: c, sw: 1.8 }); }
  function rising(svg, b, c) { strokeS(svg, [[b.x - 2, b.y + b.h + 5], [b.x + b.w + 8, b.y + b.h - 7]], false, { stroke: c, sw: 2.2, amp: 1.0 }); }
  function cloud(svg, b, c, fill, fop) { strokeS(svg, cloudpts(b), true, { stroke: c, sw: 1.5, fillColor: fill, fillOp: fop || 0.28 }); }
  function spirit(svg, b, c, hl) {
    pathEl(svg, roughD(rectpts(b.x - 2, b.y - 2, b.w + 4, b.h + 4), true, 1.0), { fill: hl, op: 0.30 });
    var apexX = b.x + b.w * 0.24, apexY = b.y - 16, endX = b.x + b.w + 4, endY = b.y + b.h * 0.30, nb = 2.0, amp = 7.0;
    var pts = [[b.x - 3, b.y + b.h * 0.45], [apexX, apexY]];
    for (var s = 1; s <= 26; s++) { var t = s / 26, px = apexX + (endX - apexX) * t, base = apexY + (endY - apexY) * t; pts.push([px, base - amp * (0.5 - 0.5 * Math.cos(2 * Math.PI * nb * t))]); }
    strokeS(svg, pts, false, { stroke: c, sw: 1.6, amp: 0.5 });
  }
  function box(svg, b, c, fill, fop) { strokeS(svg, rectpts(b.x - 4, b.y - 4, b.w + 8, b.h + 8), true, { stroke: c, sw: 1.7, fillColor: fill, fillOp: fop || 0.3 }); }
  function underline(svg, b, c, dbl) { strokeS(svg, [[b.x - 2, b.y + b.h + 5], [b.x + b.w + 4, b.y + b.h + 5]], false, { stroke: c, sw: 1.8 }); if (dbl) strokeS(svg, [[b.x - 2, b.y + b.h + 9], [b.x + b.w + 4, b.y + b.h + 9]], false, { stroke: c, sw: 1.6 }); }
  function wavy(svg, b, c) { var pts = [], n = 30; for (var i = 0; i <= n; i++) pts.push([b.x - 2 + (b.w + 6) * i / n, b.y + b.h + 6 + Math.sin(i / n * Math.PI * 5) * 2.5]); strokeS(svg, pts, false, { stroke: c, sw: 1.7, amp: 0.5 }); }
  function slash(svg, b, c) { strokeS(svg, [[b.x - 4, b.y + b.h + 7], [b.x + b.w + 6, b.y - 7]], false, { stroke: c, sw: 1.8 }); }
  function hatch(svg, b, c) { for (var i = 0; i < 4; i++) { var sx = b.x + 6 + i * (b.w - 8) / 4; strokeS(svg, [[sx, b.y + b.h + 3], [sx + 9, b.y - 4]], false, { stroke: c, sw: 1.6 }); } }
  function droplets(svg, b, c) { var cx = b.x + b.w / 2; for (var i = 0; i < 3; i++) dotS(svg, cx - 7 + i * 7, b.y - 3 + (i % 2 ? 3 : 0), 2.6, c); }
  function parallelogram(svg, b, c) { var sk = 7; strokeS(svg, [[b.x - 4 + sk, b.y - 4], [b.x + b.w + 4 + sk, b.y - 4], [b.x + b.w + 4 - sk, b.y + b.h + 4], [b.x - 4 - sk, b.y + b.h + 4]], true, { stroke: c, sw: 1.6 }); }
  function highlight_underline(svg, b, c, hl) { pathEl(svg, roughD(rectpts(b.x - 3, b.y - 3, b.w + 6, b.h + 6), true, 1.0), { fill: hl, op: 0.5 }); strokeS(svg, [[b.x - 2, b.y + b.h + 5], [b.x + b.w + 4, b.y + b.h + 5]], false, { stroke: c, sw: 1.7 }); }
  function tent(svg, b, c) { strokeS(svg, [[b.x - 4, b.y + b.h + 2], [b.x + b.w / 2, b.y - 14], [b.x + b.w + 4, b.y + b.h + 2]], false, { stroke: c, sw: 1.8 }); }
  function tombstone(svg, b, c) { var pad = 5, X = b.x - pad, Y = b.y - pad - 1, W = b.w + pad * 2, H = b.h + pad * 2, arch = Math.min(13, W * 0.4), pts = [[X, Y + H], [X, Y + arch]]; for (var i = 0; i <= 12; i++) { var a = Math.PI * (1 - i / 12); pts.push([X + W / 2 + Math.cos(a) * (W / 2), (Y + arch) - Math.sin(a) * arch]); } pts.push([X + W, Y + H]); strokeS(svg, pts, false, { stroke: c, sw: 1.8 }); }
  function arch_over(svg, b, c) { var pts = [], n = 12; for (var i = 0; i <= n; i++) { var t = i / n; pts.push([b.x - 2 + (b.w + 4) * t, (b.y + 1) - Math.sin(Math.PI * t) * 13]); } strokeS(svg, pts, false, { stroke: c, sw: 1.8 }); }
  function atonement(svg, b, c) { pathEl(svg, roughD(rectpts(b.x - 3, b.y - 2, b.w + 6, b.h + 5), true, 1.0), { fill: PAL.lyellow, op: 0.5 }); arch_over(svg, b, c); }
  function pray(svg, b, c) { var pts = [], n = 5, base = b.y + b.h + 7; for (var i = 0; i <= n * 6; i++) { var t = i / (n * 6); pts.push([b.x - 2 + (b.w + 6) * t, base - Math.abs(Math.sin(t * Math.PI * n)) * 3]); } strokeS(svg, pts, false, { stroke: c, sw: 1.7, amp: 0.4 }); }
  function heart(svg, b, c, fill) {
    var cx = b.x + b.w / 2, cy = b.y + b.h / 2, W = b.w + 18, H = b.h + 22, raw = [];
    for (var i = 0; i <= 60; i++) { var t = Math.PI * 2 * i / 60; raw.push([16 * Math.pow(Math.sin(t), 3), -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
    var xs = raw.map(function (p) { return p[0]; }), ys = raw.map(function (p) { return p[1]; });
    var mnx = Math.min.apply(0, xs), mxx = Math.max.apply(0, xs), mny = Math.min.apply(0, ys), mxy = Math.max.apply(0, ys);
    var sx = W / (mxx - mnx), sy = H / (mxy - mny);
    var pts = raw.map(function (p) { return [cx + (p[0] - (mnx + mxx) / 2) * sx, cy + (p[1] - (mny + mxy) / 2) * sy]; });
    strokeS(svg, pts, true, { stroke: c, sw: 1.8, fillColor: fill, fillOp: 0.5, amp: 1.0 });
  }
  function star6(svg, cx, cy, R, c) { function tri(rot) { var a = [90, 210, 330], o = []; for (var i = 0; i < 3; i++) { var ang = (a[i] + rot) * Math.PI / 180; o.push([cx + R * Math.cos(ang), cy + R * Math.sin(ang)]); } return o; } strokeS(svg, tri(0), true, { stroke: c, sw: 1.6 }); strokeS(svg, tri(60), true, { stroke: c, sw: 1.6 }); }
  function octagon(svg, cx, cy, R, c) { var p = []; for (var i = 0; i < 8; i++) { var a = Math.PI / 8 + Math.PI * 2 * i / 8; p.push([cx + R * Math.cos(a), cy + R * Math.sin(a)]); } strokeS(svg, p, true, { stroke: c, sw: 1.7 }); }
  function crown(svg, cx, cy, s, c) { var w = s * 2, h = s * 1.3; strokeS(svg, [[cx - w / 2, cy + h / 2], [cx - w / 2, cy - h / 2 + 4], [cx - w / 4, cy + 2], [cx, cy - h / 2], [cx + w / 4, cy + 2], [cx + w / 2, cy - h / 2 + 4], [cx + w / 2, cy + h / 2]], true, { stroke: c, sw: 1.7 }); }
  function letterW(svg, cx, cy, s, c) { var u = s * 0.55, top = cy - s, bot = cy + s; strokeS(svg, [[cx - 2 * u, top], [cx - u, bot], [cx, top + s * 0.4], [cx + u, bot], [cx + 2 * u, top]], false, { stroke: c, sw: 2.0, amp: 0.8 }); }
  function letterR(svg, cx, cy, s, c, sl) { var top = cy - s, bot = cy + s, left = cx - s * 0.5; strokeS(svg, [[left, bot], [left, top]], false, { stroke: c, sw: 1.9, amp: 0.6 }); strokeS(svg, [[left, top], [left + s, top + 1], [left + s + 1, cy - 2], [left, cy - 1]], false, { stroke: c, sw: 1.8, amp: 0.6 }); strokeS(svg, [[left, cy - 1], [left + s + 1, bot]], false, { stroke: c, sw: 1.9, amp: 0.6 }); if (sl) strokeS(svg, [[cx - s - 2, bot + 2], [cx + s + 2, top - 2]], false, { stroke: c, sw: 1.8 }); }
  function megaphone(svg, cx, cy, s, c) { strokeS(svg, [[cx - s, cy - s * 0.4], [cx + s * 0.6, cy - s * 0.8], [cx + s * 0.6, cy + s * 0.8], [cx - s, cy + s * 0.4]], true, { stroke: c, sw: 1.8 }); strokeS(svg, [[cx + s * 0.6, cy - s * 0.8], [cx + s, cy - s * 0.8], [cx + s, cy + s * 0.8], [cx + s * 0.6, cy + s * 0.8]], true, { stroke: PAL.green, sw: 1.6, fillColor: PAL.lgreen, fillOp: 0.5 }); strokeS(svg, [[cx - s * 0.6, cy + s * 0.5], [cx - s * 0.6, cy + s]], false, { stroke: c, sw: 1.8 }); }
  function clock(svg, cx, cy, s, c) { var circ = []; for (var i = 0; i < 16; i++) { var a = Math.PI * 2 * i / 16; circ.push([cx + s * Math.cos(a), cy + s * Math.sin(a)]); } strokeS(svg, circ, true, { stroke: c, sw: 1.6 }); strokeS(svg, [[cx, cy], [cx, cy - s * 0.6]], false, { stroke: c, sw: 1.5 }); strokeS(svg, [[cx, cy], [cx + s * 0.45, cy + s * 0.2]], false, { stroke: c, sw: 1.5 }); strokeS(svg, [[cx - s * 0.85, cy - s * 0.65], [cx - s * 0.5, cy - s]], false, { stroke: c, sw: 1.5 }); strokeS(svg, [[cx + s * 0.85, cy - s * 0.65], [cx + s * 0.5, cy - s]], false, { stroke: c, sw: 1.5 }); }
  function ear(svg, cx, cy, s, c) { strokeS(svg, [[cx + s * 0.55, cy - s * 0.85], [cx - s * 0.4, cy - s * 0.85], [cx - s * 0.85, cy - s * 0.3], [cx - s * 0.6, cy + s * 0.4], [cx - s * 0.15, cy + s * 0.8], [cx + s * 0.4, cy + s * 0.7]], false, { stroke: c, sw: 1.8 }); strokeS(svg, [[cx + s * 0.15, cy - s * 0.35], [cx - s * 0.25, cy - s * 0.2], [cx - s * 0.2, cy + s * 0.2], [cx + s * 0.15, cy + s * 0.3]], false, { stroke: c, sw: 1.5 }); }
  function pitchfork(svg, cx, cy, s, c) { strokeS(svg, [[cx, cy + s], [cx, cy - s * 0.45]], false, { stroke: c, sw: 1.9 }); strokeS(svg, [[cx - s * 0.7, cy - s], [cx - s * 0.7, cy - s * 0.25]], false, { stroke: c, sw: 1.7 }); strokeS(svg, [[cx, cy - s * 1.15], [cx, cy - s * 0.25]], false, { stroke: c, sw: 1.7 }); strokeS(svg, [[cx + s * 0.7, cy - s], [cx + s * 0.7, cy - s * 0.25]], false, { stroke: c, sw: 1.7 }); strokeS(svg, [[cx - s * 0.7, cy - s * 0.25], [cx + s * 0.7, cy - s * 0.25]], false, { stroke: c, sw: 1.7 }); }
  function repent_arrow(svg, cx, cy, s, c) { strokeS(svg, [[cx + s, cy - s * 0.45], [cx + s, cy + s * 0.6], [cx - s * 0.45, cy + s * 0.6], [cx - s * 0.45, cy - s * 0.45]], false, { stroke: c, sw: 1.9 }); strokeS(svg, [[cx - s * 0.45, cy - s * 0.45], [cx - s * 0.85, cy + s * 0.08]], false, { stroke: c, sw: 1.8 }); strokeS(svg, [[cx - s * 0.45, cy - s * 0.45], [cx - s * 0.05, cy + s * 0.08]], false, { stroke: c, sw: 1.8 }); }
  function book(svg, cx, cy, s, c) { strokeS(svg, [[cx, cy - s * 0.8], [cx - s * 1.25, cy - s * 0.35], [cx - s * 1.25, cy + s * 0.6], [cx, cy + s * 0.35]], true, { stroke: c, sw: 1.5 }); strokeS(svg, [[cx, cy - s * 0.8], [cx + s * 1.25, cy - s * 0.35], [cx + s * 1.25, cy + s * 0.6], [cx, cy + s * 0.35]], true, { stroke: c, sw: 1.5 }); }
  function swoosh(svg, cx, cy, s, c) { strokeS(svg, [[cx + s * 0.55, cy - s * 0.7], [cx - s * 0.3, cy - s * 0.55], [cx - s * 0.6, cy + s * 0.08], [cx - s * 0.2, cy + s * 0.65], [cx + s * 0.3, cy + s * 0.45]], false, { stroke: c, sw: 2.0, amp: 0.9 }); }

  function draw(svg, type, b) {
    type = ALIAS[type] || type;
    var g = gpos(b);
    switch (type) {
      case "god": return enc_triangle(svg, b, PAL.purple);
      case "jesus": return rising(svg, b, PAL.purple);
      case "spirit": return spirit(svg, b, PAL.purple, PAL.yellow);
      case "holy": return cloud(svg, b, PAL.gold, PAL.yellow);
      case "unholy": cloud(svg, b, PAL.gold, PAL.yellow); return slash(svg, b, PAL.red);
      case "covenant": return box(svg, b, PAL.red, PAL.yellow);
      case "bless": return cloud(svg, b, PAL.blue);
      case "curse": return cloud(svg, b, PAL.brown, PAL.lbrown, 0.35);
      case "circumcised": return wavy(svg, b, PAL.red);
      case "die": return tombstone(svg, b, PAL.grey);
      case "israel": return star6(svg, g.cx, g.cy, g.s, PAL.blue);
      case "sin": return cloud(svg, b, PAL.brown);
      case "remnant": return parallelogram(svg, b, PAL.blue);
      case "eternal_life": return box(svg, b, PAL.green);
      case "devil": return pitchfork(svg, g.cx, g.cy, g.s, PAL.red);
      case "land": return underline(svg, b, PAL.green);
      case "sign": return octagon(svg, g.cx, g.cy, g.s, PAL.red);
      case "law": return tablets(svg, g.cx, g.cy, g.s, PAL.grey);
      case "tabernacle": return tent(svg, b, PAL.brown);
      case "nations": return highlight_underline(svg, b, PAL.green, PAL.lgreen);
      case "blood": return droplets(svg, b, PAL.red);
      case "righteous": return letterR(svg, g.cx, g.cy, g.s, PAL.blue, false);
      case "unrighteous": return letterR(svg, g.cx, g.cy, g.s, PAL.blue, true);
      case "atonement": return atonement(svg, b, PAL.red);
      case "wrath": return letterW(svg, g.cx, g.cy, g.s, PAL.red);
      case "redeem": return cloud(svg, b, PAL.red);
      case "coming": return cloud(svg, b, PAL.blue);
      case "cry": return swoosh(svg, g.cx, g.cy, g.s, PAL.orange);
      case "pray": return pray(svg, b, PAL.purple);
      case "listen": return ear(svg, g.cx, g.cy, g.s, PAL.green);
      case "love": return heart(svg, b, PAL.red, null);
      case "gods_love": return heart(svg, b, PAL.red, PAL.yellow);
      case "grace": return box(svg, b, PAL.gold, PAL.lyellow);
      case "suffer": return hatch(svg, b, PAL.red);
      case "repent": return repent_arrow(svg, g.cx, g.cy, g.s, PAL.red);
      case "kingdom": return crown(svg, g.cx, g.cy, g.s, PAL.purple);
      case "believe": return book(svg, g.cx, g.cy, g.s, PAL.green);
      case "gospel": return megaphone(svg, g.cx, g.cy, g.s, PAL.orange);
      case "day_of_the_lord": return box(svg, b, PAL.orange, PAL.lorange);
      case "time": return clock(svg, g.cx, g.cy, g.s, PAL.green);
      case "geography": return underline(svg, b, PAL.green, true);
      default: return;
    }
  }
  function tablets(svg, cx, cy, s, c) {
    strokeS(svg, [[cx - s * 1.05, cy + s * 0.85], [cx - s * 1.05, cy - s * 0.45], [cx - s * 0.9, cy - s * 0.8], [cx - s * 0.55, cy - s * 0.85], [cx - s * 0.15, cy - s * 0.8], [cx - s * 0.07, cy - s * 0.45], [cx - s * 0.07, cy + s * 0.85]], false, { stroke: c, sw: 1.5 });
    strokeS(svg, [[cx + s * 0.07, cy + s * 0.85], [cx + s * 0.07, cy - s * 0.45], [cx + s * 0.15, cy - s * 0.8], [cx + s * 0.55, cy - s * 0.85], [cx + s * 0.9, cy - s * 0.8], [cx + s * 1.05, cy - s * 0.45], [cx + s * 1.05, cy + s * 0.85]], false, { stroke: c, sw: 1.5 });
    strokeS(svg, [[cx - s * 1.05, cy + s * 0.85], [cx - s * 0.07, cy + s * 0.85]], false, { stroke: c, sw: 1.4 });
    strokeS(svg, [[cx + s * 0.07, cy + s * 0.85], [cx + s * 1.05, cy + s * 0.85]], false, { stroke: c, sw: 1.4 });
  }

  function apply(root, opts) {
    opts = opts || {};
    root = typeof root === "string" ? document.querySelector(root) : root;
    if (!root) return null;
    if (getComputedStyle(root).position === "static") root.style.position = "relative";
    var svg = root.querySelector("svg.tm-overlay");
    if (!svg) {
      svg = document.createElementNS(NS, "svg");
      svg.setAttribute("class", "tm-overlay"); svg.setAttribute("aria-hidden", "true");
      svg.style.position = "absolute"; svg.style.left = "0"; svg.style.top = "0";
      svg.style.pointerEvents = "none"; svg.style.overflow = "visible";
      svg.style.zIndex = opts.z || 5; if (opts.opacity != null) svg.style.opacity = opts.opacity;
      root.appendChild(svg);
    }
    root.querySelectorAll("[data-m]").forEach(function (el) { el.style.whiteSpace = "nowrap"; });
    function redraw() {
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute("width", root.clientWidth); svg.setAttribute("height", root.clientHeight);
      var cr = root.getBoundingClientRect();
      root.querySelectorAll("[data-m]").forEach(function (el) {
        var r = el.getBoundingClientRect();
        draw(svg, el.getAttribute("data-m"), { x: r.left - cr.left, y: r.top - cr.top, w: r.width, h: r.height });
      });
    }
    redraw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    var to; window.addEventListener("resize", function () { clearTimeout(to); to = setTimeout(redraw, 150); });
    window.addEventListener("beforeprint", redraw); window.addEventListener("afterprint", redraw);
    root.__tmRedraw = redraw;
    return { redraw: redraw, svg: svg };
  }

  global.TextMarkings = { apply: apply, draw: draw, PALETTE: PAL, ALIAS: ALIAS };
})(typeof window !== "undefined" ? window : this);
