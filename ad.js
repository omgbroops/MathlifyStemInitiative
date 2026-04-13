const canvas = document.getElementById("adCanvas");
const ctx = canvas.getContext("2d");
const canvasShell = document.querySelector(".canvas-shell");
const refreshBtn = document.getElementById("refreshBtn");
const downloadBtn = document.getElementById("downloadBtn");
const addTextBtn = document.getElementById("addTextBtn");
const addImageBtn = document.getElementById("addImageBtn");
const layerDownBtn = document.getElementById("layerDownBtn");
const layerUpBtn = document.getElementById("layerUpBtn");
const deleteBtn = document.getElementById("deleteBtn");
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const randomizeBgBtn = document.getElementById("randomizeBgBtn");
const imageInput = document.getElementById("imageInput");
const snapToggle = document.getElementById("snapToggle");

const textPanel = document.getElementById("textPanel");
const panelText = document.getElementById("panelText");
const panelFontSize = document.getElementById("panelFontSize");
const panelFontSizeNumber = document.getElementById("panelFontSizeNumber");
const panelFill = document.getElementById("panelFill");
const panelOutline = document.getElementById("panelOutline");
const panelOutlineOpacity = document.getElementById("panelOutlineOpacity");
const panelOutlineOpacityNumber = document.getElementById("panelOutlineOpacityNumber");
const panelOutlineSize = document.getElementById("panelOutlineSize");
const panelOutlineSizeNumber = document.getElementById("panelOutlineSizeNumber");
const panelOpacity = document.getElementById("panelOpacity");
const panelOpacityNumber = document.getElementById("panelOpacityNumber");
const panelAlign = document.getElementById("panelAlign");
const panelWeight = document.getElementById("panelWeight");
const panelFamily = document.getElementById("panelFamily");

const HANDLE_SIZE = 12;
let nextId = 1;
let nextAssetId = 1;
const objects = [];
const imageAssets = new Map();
const editor = {
  selectedId: null,
  interaction: null,
  guides: []
};
const history = {
  past: [],
  future: [],
  limit: 150,
  lastSignature: "",
  isApplying: false
};

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function createDefaultBackgroundState() {
  return {
    glows: [
      { x: 130, y: 160, r: 310, color: "rgba(28, 167, 157, 0.14)" },
      { x: 850, y: 190, r: 350, color: "rgba(117, 92, 236, 0.18)" },
      { x: 930, y: 1200, r: 340, color: "rgba(214, 83, 125, 0.14)" },
      { x: 180, y: 1040, r: 280, color: "rgba(84, 128, 232, 0.1)" }
    ],
    flows: [
      {
        points: [[40, 280], [150, 240], [280, 300], [420, 258]],
        color: "rgba(43, 136, 206, 0.95)",
        width: 4,
        blur: 4,
        alpha: 0.24,
        rotate: -8,
        ox: 230,
        oy: 280
      },
      {
        points: [[1040, 312], [920, 260], [788, 320], [660, 284]],
        color: "rgba(126, 96, 228, 0.95)",
        width: 4,
        blur: 4,
        alpha: 0.24,
        rotate: 9,
        ox: 860,
        oy: 290
      },
      {
        points: [[20, 1038], [154, 990], [296, 1054], [448, 1012]],
        color: "rgba(214, 81, 128, 0.95)",
        width: 4,
        blur: 5,
        alpha: 0.2,
        rotate: 7,
        ox: 260,
        oy: 1020
      },
      {
        points: [[1060, 980], [918, 930], [768, 998], [624, 956]],
        color: "rgba(36, 172, 165, 0.95)",
        width: 4,
        blur: 5,
        alpha: 0.2,
        rotate: -6,
        ox: 850,
        oy: 970
      }
    ],
    nodes: [[116, 248, 2.4], [228, 276, 2.2], [332, 286, 2.2], [920, 272, 2.5], [854, 304, 2.2], [780, 290, 2.2], [174, 1014, 2.4], [284, 1038, 2.2], [904, 948, 2.4], [808, 978, 2.2]],
    nodeGlow: "rgba(111, 124, 216, 0.2)",
    rings: [
      { x: 890, y: 256, r: 90, color: "rgba(88, 123, 206, 0.34)", width: 1.6, alpha: 0.35 },
      { x: 890, y: 256, r: 138, color: "rgba(88, 123, 206, 0.34)", width: 1.6, alpha: 0.35 },
      { x: 194, y: 1130, r: 110, color: "rgba(204, 99, 141, 0.26)", width: 1.6, alpha: 0.35 }
    ]
  };
}

let backgroundState = createDefaultBackgroundState();

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function randInt(min, max) {
  return Math.floor(rand(min, max + 1));
}

function rgbaString(r, g, b, a) {
  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

function randomSceneColor(type) {
  if (type === "blue") return rgbaString(randInt(28, 70), randInt(110, 165), randInt(200, 245), rand(0.78, 0.98));
  if (type === "purple") return rgbaString(randInt(105, 148), randInt(84, 126), randInt(210, 245), rand(0.78, 0.98));
  if (type === "rose") return rgbaString(randInt(190, 228), randInt(72, 116), randInt(112, 160), rand(0.74, 0.96));
  return rgbaString(randInt(26, 56), randInt(150, 190), randInt(150, 190), rand(0.76, 0.96));
}

function randomGlow(type) {
  const palette = {
    teal: [28, 167, 157],
    purple: [117, 92, 236],
    rose: [214, 83, 125],
    blue: [84, 128, 232]
  };
  const c = palette[type];
  return {
    x: randInt(60, 1020),
    y: randInt(80, 1270),
    r: randInt(220, 390),
    color: `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${rand(0.08, 0.2).toFixed(3)})`
  };
}

function randomFlow(index) {
  const anchors = [
    { ox: 220, oy: 270, type: "blue" },
    { ox: 860, oy: 280, type: "purple" },
    { ox: 280, oy: 1020, type: "rose" },
    { ox: 840, oy: 980, type: "teal" }
  ];
  const a = anchors[index % anchors.length];
  const baseY = a.oy + randInt(-36, 36);
  const baseX = a.ox - 210 + randInt(-30, 30);
  return {
    points: [
      [baseX, baseY],
      [baseX + randInt(95, 130), baseY - randInt(24, 54)],
      [baseX + randInt(238, 298), baseY + randInt(-8, 28)],
      [baseX + randInt(352, 426), baseY - randInt(20, 46)]
    ],
    color: randomSceneColor(a.type),
    width: randInt(3, 5),
    blur: randInt(3, 6),
    alpha: rand(0.16, 0.32),
    rotate: rand(-14, 14),
    ox: a.ox,
    oy: a.oy
  };
}

function createRandomBackgroundState() {
  const nodes = [];
  for (let i = 0; i < 12; i += 1) {
    nodes.push([randInt(60, 1020), randInt(120, 1240), rand(1.8, 2.8)]);
  }

  return {
    glows: [randomGlow("teal"), randomGlow("purple"), randomGlow("rose"), randomGlow("blue")],
    flows: [randomFlow(0), randomFlow(1), randomFlow(2), randomFlow(3)],
    nodes,
    nodeGlow: `rgba(111, 124, 216, ${rand(0.14, 0.25).toFixed(3)})`,
    rings: [
      { x: randInt(740, 980), y: randInt(180, 330), r: randInt(78, 116), color: `rgba(88, 123, 206, ${rand(0.26, 0.42).toFixed(3)})`, width: rand(1.2, 2), alpha: rand(0.25, 0.45) },
      { x: randInt(740, 980), y: randInt(180, 330), r: randInt(120, 162), color: `rgba(88, 123, 206, ${rand(0.2, 0.36).toFixed(3)})`, width: rand(1.2, 2), alpha: rand(0.2, 0.4) },
      { x: randInt(120, 300), y: randInt(1010, 1210), r: randInt(90, 140), color: `rgba(204, 99, 141, ${rand(0.18, 0.34).toFixed(3)})`, width: rand(1.2, 2), alpha: rand(0.2, 0.4) }
    ]
  };
}

const logoImage = new Image();
const isWebProtocol = window.location.protocol === "http:" || window.location.protocol === "https:";
if (isWebProtocol) {
  logoImage.crossOrigin = "anonymous";
}

function makeId(prefix) {
  const id = `${prefix}-${nextId}`;
  nextId += 1;
  return id;
}

function makeAssetId() {
  const id = `asset-${nextAssetId}`;
  nextAssetId += 1;
  return id;
}

function registerImageAsset(img, assetId = null) {
  const id = assetId || makeAssetId();
  imageAssets.set(id, img);
  return id;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function getFontFamilyValue(mode) {
  if (mode === "jakarta") return "'Plus Jakarta Sans', sans-serif";
  if (mode === "mix") return "'Space Grotesk', 'Plus Jakarta Sans', sans-serif";
  return "'Space Grotesk', sans-serif";
}

function getCanvasPoint(evt) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((evt.clientX - rect.left) * canvas.width) / rect.width,
    y: ((evt.clientY - rect.top) * canvas.height) / rect.height
  };
}

function createTextObject(text = "New text", cx = canvas.width / 2, cy = canvas.height / 2 + 30) {
  return {
    id: makeId("text"),
    type: "text",
    cx,
    cy,
    scale: 1,
    baseFontSize: 95,
    baseBoxWidth: canvas.width * 0.8,
    fill: "#2f4aa8",
    outline: "#f0f6ff",
    outlineOpacity: 1,
    outlineSize: 19,
    opacity: 1,
    align: "center",
    fontWeight: 700,
    fontFamily: "space",
    value: text
  };
}

function createImageObject(img, cx, cy, role = "image", assetId = null) {
  const baseWidth = role === "logo" ? 286 : 320;
  const ratio = img.height > 0 ? img.height / img.width : 0.3;
  return {
    id: makeId("image"),
    type: "image",
    role,
    assetId: assetId || registerImageAsset(img),
    image: img,
    cx,
    cy,
    scale: 1,
    baseWidth,
    baseHeight: baseWidth * ratio
  };
}

function getObjectById(id) {
  return objects.find((o) => o.id === id) || null;
}

function bringToFront(id) {
  const index = objects.findIndex((o) => o.id === id);
  if (index < 0) return;
  const [obj] = objects.splice(index, 1);
  objects.push(obj);
}

function moveSelectedLayer(delta) {
  const sel = getSelectedObject();
  if (!sel) return false;
  const idx = objects.findIndex((o) => o.id === sel.id);
  if (idx < 0) return false;
  const newIdx = clamp(idx + delta, 0, objects.length - 1);
  if (newIdx === idx) return false;
  const [obj] = objects.splice(idx, 1);
  objects.splice(newIdx, 0, obj);
  return true;
}

function deleteSelectedObject() {
  const sel = getSelectedObject();
  if (!sel) return false;
  const idx = objects.findIndex((o) => o.id === sel.id);
  if (idx < 0) return false;
  objects.splice(idx, 1);
  editor.selectedId = objects.length ? objects[objects.length - 1].id : null;
  return true;
}

function serializeObject(obj) {
  if (obj.type === "image") {
    return {
      id: obj.id,
      type: "image",
      role: obj.role,
      assetId: obj.assetId,
      cx: obj.cx,
      cy: obj.cy,
      scale: obj.scale,
      baseWidth: obj.baseWidth,
      baseHeight: obj.baseHeight
    };
  }
  return {
    id: obj.id,
    type: "text",
    cx: obj.cx,
    cy: obj.cy,
    scale: obj.scale,
    baseFontSize: obj.baseFontSize,
    baseBoxWidth: obj.baseBoxWidth,
    fill: obj.fill,
    outline: obj.outline,
    outlineOpacity: obj.outlineOpacity,
    outlineSize: obj.outlineSize,
    opacity: obj.opacity,
    align: obj.align,
    fontWeight: obj.fontWeight,
    fontFamily: obj.fontFamily,
    value: obj.value
  };
}

function hydrateObject(data) {
  if (data.type === "image") {
    const img = imageAssets.get(data.assetId);
    if (!img) return null;
    return {
      ...data,
      image: img
    };
  }
  return {
    outlineOpacity: 1,
    outlineSize: 19,
    opacity: 1,
    fontWeight: 700,
    ...data
  };
}

function captureState() {
  return {
    objects: objects.map(serializeObject),
    selectedId: editor.selectedId,
    backgroundState: deepClone(backgroundState)
  };
}

function cloneState(state) {
  return deepClone(state);
}

function updateActionButtons() {
  const selected = getSelectedObject();
  const idx = selected ? objects.findIndex((o) => o.id === selected.id) : -1;
  layerDownBtn.disabled = !selected || idx <= 0;
  layerUpBtn.disabled = !selected || idx < 0 || idx >= objects.length - 1;
  deleteBtn.disabled = !selected;
  undoBtn.disabled = history.past.length <= 1;
  redoBtn.disabled = history.future.length === 0;
}

function recordHistory() {
  if (history.isApplying) return;
  const snap = captureState();
  const sig = JSON.stringify(snap);
  if (sig === history.lastSignature) return;
  history.past.push(cloneState(snap));
  if (history.past.length > history.limit) history.past.shift();
  history.future = [];
  history.lastSignature = sig;
  updateActionButtons();
}

function applyState(state) {
  history.isApplying = true;
  objects.splice(0, objects.length);
  for (const raw of state.objects) {
    const obj = hydrateObject(raw);
    if (obj) objects.push(obj);
  }
  backgroundState = state.backgroundState ? deepClone(state.backgroundState) : createDefaultBackgroundState();
  editor.selectedId = state.selectedId && getObjectById(state.selectedId) ? state.selectedId : objects.length ? objects[objects.length - 1].id : null;
  editor.guides = [];
  editor.interaction = null;
  history.isApplying = false;

  const sel = getSelectedObject();
  if (sel && sel.type === "text") syncTextPanelFromObject(sel);
  else textPanel.hidden = true;
  render();
}

function undo() {
  if (history.past.length <= 1) return;
  const current = history.past.pop();
  history.future.push(current);
  const prev = cloneState(history.past[history.past.length - 1]);
  history.lastSignature = JSON.stringify(prev);
  applyState(prev);
  updateActionButtons();
}

function redo() {
  if (!history.future.length) return;
  const next = history.future.pop();
  history.past.push(cloneState(next));
  history.lastSignature = JSON.stringify(next);
  applyState(cloneState(next));
  updateActionButtons();
}

function drawGrid(gap = 42) {
  ctx.save();
  ctx.strokeStyle = "rgba(90, 127, 178, 0.095)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += gap) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += gap) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGlow(x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlowPath(points, color, width, blur = 0, alpha = 0.3, rotateDeg = 0, ox = 0, oy = 0) {
  if (points.length < 2) return;
  ctx.save();
  if (rotateDeg !== 0) {
    const rad = (rotateDeg * Math.PI) / 180;
    ctx.translate(ox, oy);
    ctx.rotate(rad);
    ctx.translate(-ox, -oy);
  }
  ctx.globalAlpha = alpha;
  if (blur > 0) ctx.filter = `blur(${blur}px)`;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length - 1; i += 1) {
    const mx = (points[i][0] + points[i + 1][0]) / 2;
    const my = (points[i][1] + points[i + 1][1]) / 2;
    ctx.quadraticCurveTo(points[i][0], points[i][1], mx, my);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.stroke();
  ctx.restore();
}

function drawNodeField(nodes, glowColor) {
  for (const [x, y, r] of nodes) {
    drawGlow(x, y, r * 4.6, glowColor);
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawHaloRings(rings) {
  if (!rings || !rings.length) return;
  ctx.save();
  for (const ring of rings) {
    ctx.globalAlpha = ring.alpha ?? 0.35;
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width ?? 1.6;
    ctx.beginPath();
    ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBackground() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#f9fdff");
  bg.addColorStop(1, "#f2f7ff");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const glow of backgroundState.glows) {
    drawGlow(glow.x, glow.y, glow.r, glow.color);
  }
  drawGrid();
  for (const flow of backgroundState.flows) {
    drawFlowPath(flow.points, flow.color, flow.width, flow.blur, flow.alpha, flow.rotate, flow.ox, flow.oy);
  }
  drawNodeField(backgroundState.nodes, backgroundState.nodeGlow);
  drawHaloRings(backgroundState.rings);
}

function wrapLines(text, maxWidth, fontSize, fontFamily, fontWeight) {
  const lines = [];
  const paragraphs = text.split("\n");
  ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  for (const p of paragraphs) {
    if (!p.trim()) {
      lines.push("");
      continue;
    }
    const words = p.trim().split(/\s+/);
    let line = words[0];
    for (let i = 1; i < words.length; i += 1) {
      const next = `${line} ${words[i]}`;
      if (ctx.measureText(next).width <= maxWidth) line = next;
      else {
        lines.push(line);
        line = words[i];
      }
    }
    lines.push(line);
  }
  return lines;
}

function getObjectBounds(obj, override = {}) {
  const cx = override.cx ?? obj.cx;
  const cy = override.cy ?? obj.cy;
  const scale = override.scale ?? obj.scale;

  if (obj.type === "image") {
    const w = obj.baseWidth * scale;
    const h = obj.baseHeight * scale;
    return { x: cx - w / 2, y: cy - h / 2, w, h, cx, cy };
  }

  const fontSize = obj.baseFontSize * scale;
  const lineHeight = Math.round(fontSize * 1.12);
  const boxWidth = obj.baseBoxWidth * scale;
  const fontFamily = getFontFamilyValue(obj.fontFamily);
  const fontWeight = obj.fontWeight || 700;
  const lines = wrapLines(obj.value, boxWidth, fontSize, fontFamily, fontWeight);
  const h = Math.max(lineHeight, lines.length * lineHeight);
  return {
    x: cx - boxWidth / 2,
    y: cy - h / 2,
    w: boxWidth,
    h,
    cx,
    cy,
    lines,
    lineHeight,
    fontSize,
    fontFamily,
    fontWeight
  };
}

function drawImageObject(obj) {
  const b = getObjectBounds(obj);
  if (obj.role === "logo") {
    const vignette = ctx.createRadialGradient(b.x + b.w * 0.22, b.y + b.h * 0.45, 0, b.x + b.w * 0.22, b.y + b.h * 0.45, 248);
    vignette.addColorStop(0, "rgba(255,255,255,0.92)");
    vignette.addColorStop(0.52, "rgba(255,255,255,0.62)");
    vignette.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = vignette;
    ctx.beginPath();
    ctx.arc(b.x + b.w * 0.22, b.y + b.h * 0.45, 248, 0, Math.PI * 2);
    ctx.fill();
  }

  if (obj.image && obj.image.complete) {
    ctx.save();
    ctx.shadowColor = obj.role === "logo" ? "rgba(26, 52, 95, 0.2)" : "rgba(18, 36, 67, 0.16)";
    ctx.shadowBlur = obj.role === "logo" ? 15 : 10;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(obj.image, b.x, b.y, b.w, b.h);
    ctx.restore();
  }
  obj._bounds = b;
}

function drawTextObject(obj) {
  const b = getObjectBounds(obj);
  const drawX = obj.align === "left" ? b.x : obj.align === "right" ? b.x + b.w : b.cx;
  const firstY = b.cy - ((b.lines.length - 1) * b.lineHeight) / 2;
  ctx.save();
  ctx.textAlign = obj.align;
  ctx.textBaseline = "middle";
  ctx.font = `${b.fontWeight} ${b.fontSize}px ${b.fontFamily}`;
  ctx.lineJoin = "round";
  const fillAlpha = clamp(obj.opacity ?? 1, 0, 1);
  const outlineAlpha = clamp((obj.outlineOpacity ?? 1) * fillAlpha, 0, 1);
  for (let i = 0; i < b.lines.length; i += 1) {
    const y = firstY + i * b.lineHeight;
    const line = b.lines[i];
    ctx.globalAlpha = outlineAlpha;
    ctx.shadowColor = "rgba(15, 25, 45, 0.26)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 6;
    ctx.strokeStyle = obj.outline;
    ctx.lineWidth = Math.max(1, Math.round((obj.outlineSize || 19) * obj.scale));
    ctx.strokeText(line, drawX, y);
    ctx.globalAlpha = fillAlpha;
    ctx.shadowColor = "transparent";
    ctx.fillStyle = obj.fill;
    ctx.fillText(line, drawX, y);
  }
  ctx.restore();
  obj._bounds = b;
}

function drawGuides() {
  if (!editor.guides.length) return;
  ctx.save();
  ctx.strokeStyle = "rgba(47, 96, 189, 0.55)";
  ctx.lineWidth = 1.4;
  ctx.setLineDash([6, 6]);
  for (const g of editor.guides) {
    ctx.beginPath();
    if (g.axis === "x") {
      ctx.moveTo(g.value, 0);
      ctx.lineTo(g.value, canvas.height);
    } else {
      ctx.moveTo(0, g.value);
      ctx.lineTo(canvas.width, g.value);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawSelection(obj) {
  if (!obj || !obj._bounds) return;
  const b = obj._bounds;
  ctx.save();
  ctx.setLineDash([8, 6]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(53, 101, 186, 0.72)";
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  ctx.setLineDash([]);
  for (const h of getHandlePoints(b)) {
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "rgba(53, 101, 186, 0.9)";
    ctx.lineWidth = 1.4;
    ctx.fillRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    ctx.strokeRect(h.x - HANDLE_SIZE / 2, h.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
  }
  ctx.restore();
}

function getHandlePoints(b) {
  return [
    { x: b.x, y: b.y },
    { x: b.x + b.w, y: b.y },
    { x: b.x, y: b.y + b.h },
    { x: b.x + b.w, y: b.y + b.h }
  ];
}

function getHandleHit(point, b) {
  for (const h of getHandlePoints(b)) {
    if (
      point.x >= h.x - HANDLE_SIZE &&
      point.x <= h.x + HANDLE_SIZE &&
      point.y >= h.y - HANDLE_SIZE &&
      point.y <= h.y + HANDLE_SIZE
    ) {
      return h;
    }
  }
  return null;
}

function pointInBounds(point, b) {
  return point.x >= b.x && point.x <= b.x + b.w && point.y >= b.y && point.y <= b.y + b.h;
}

function getSelectedObject() {
  return getObjectById(editor.selectedId);
}

function pickObject(point) {
  for (let i = objects.length - 1; i >= 0; i -= 1) {
    const obj = objects[i];
    const b = obj._bounds || getObjectBounds(obj);
    if (pointInBounds(point, b)) return obj;
  }
  return null;
}

function snapPosition(obj, cx, cy) {
  if (!snapToggle.checked) return { cx, cy, guides: [] };
  const b = getObjectBounds(obj, { cx, cy });
  const marginX = 96;
  const marginY = 110;
  const xTargets = [
    { snap: canvas.width / 2, guide: canvas.width / 2 },
    { snap: canvas.width / 3, guide: canvas.width / 3 },
    { snap: (canvas.width * 2) / 3, guide: (canvas.width * 2) / 3 },
    { snap: marginX + b.w / 2, guide: marginX },
    { snap: canvas.width - marginX - b.w / 2, guide: canvas.width - marginX }
  ];
  const yTargets = [
    { snap: canvas.height / 2, guide: canvas.height / 2 },
    { snap: canvas.height / 3, guide: canvas.height / 3 },
    { snap: (canvas.height * 2) / 3, guide: (canvas.height * 2) / 3 },
    { snap: marginY + b.h / 2, guide: marginY },
    { snap: canvas.height - marginY - b.h / 2, guide: canvas.height - marginY }
  ];
  const threshold = 12;

  let snappedX = cx;
  let snappedY = cy;
  let guideX = null;
  let guideY = null;
  let bestDx = threshold + 1;
  let bestDy = threshold + 1;

  for (const t of xTargets) {
    const d = Math.abs(cx - t.snap);
    if (d < bestDx && d <= threshold) {
      bestDx = d;
      snappedX = t.snap;
      guideX = t.guide;
    }
  }
  for (const t of yTargets) {
    const d = Math.abs(cy - t.snap);
    if (d < bestDy && d <= threshold) {
      bestDy = d;
      snappedY = t.snap;
      guideY = t.guide;
    }
  }

  const guides = [];
  if (guideX !== null) guides.push({ axis: "x", value: guideX });
  if (guideY !== null) guides.push({ axis: "y", value: guideY });
  return { cx: snappedX, cy: snappedY, guides };
}

function clampCenterToCanvas(obj, cx, cy) {
  const b = getObjectBounds(obj, { cx, cy });
  return {
    cx: clamp(cx, b.w / 2, canvas.width - b.w / 2),
    cy: clamp(cy, b.h / 2, canvas.height - b.h / 2)
  };
}

function syncTextPanelFromObject(obj) {
  if (!obj || obj.type !== "text") return;
  panelText.value = obj.value;
  const effectiveSize = Math.round(obj.baseFontSize * obj.scale);
  panelFontSize.value = clamp(effectiveSize, Number(panelFontSize.min), Number(panelFontSize.max));
  panelFontSizeNumber.value = panelFontSize.value;
  panelFill.value = obj.fill;
  panelOutline.value = obj.outline;
  panelOutlineOpacity.value = clamp(Math.round((obj.outlineOpacity ?? 1) * 100), Number(panelOutlineOpacity.min), Number(panelOutlineOpacity.max));
  panelOutlineOpacityNumber.value = panelOutlineOpacity.value;
  panelOutlineSize.value = clamp(Math.round(obj.outlineSize || 19), Number(panelOutlineSize.min), Number(panelOutlineSize.max));
  panelOutlineSizeNumber.value = panelOutlineSize.value;
  panelOpacity.value = clamp(Math.round((obj.opacity ?? 1) * 100), Number(panelOpacity.min), Number(panelOpacity.max));
  panelOpacityNumber.value = panelOpacity.value;
  panelAlign.value = obj.align;
  panelWeight.value = String(obj.fontWeight || 700);
  panelFamily.value = obj.fontFamily;
}

function applyPanelToSelectedText() {
  const obj = getSelectedObject();
  if (!obj || obj.type !== "text") return;
  const desired = clamp(Number(panelFontSize.value) || 95, Number(panelFontSize.min), Number(panelFontSize.max));
  const outlineOpacity = clamp(Number(panelOutlineOpacity.value) || 100, Number(panelOutlineOpacity.min), Number(panelOutlineOpacity.max)) / 100;
  const outlineSize = clamp(Number(panelOutlineSize.value) || 19, Number(panelOutlineSize.min), Number(panelOutlineSize.max));
  const opacity = clamp(Number(panelOpacity.value) || 100, Number(panelOpacity.min), Number(panelOpacity.max)) / 100;
  obj.baseFontSize = desired / obj.scale;
  obj.fill = panelFill.value;
  obj.outline = panelOutline.value;
  obj.outlineOpacity = outlineOpacity;
  obj.outlineSize = outlineSize;
  obj.opacity = opacity;
  obj.align = panelAlign.value;
  obj.fontWeight = Number(panelWeight.value) || 700;
  obj.fontFamily = panelFamily.value;
  obj.value = panelText.value;
  panelFontSizeNumber.value = desired;
  panelOutlineOpacityNumber.value = Math.round(outlineOpacity * 100);
  panelOutlineSizeNumber.value = outlineSize;
  panelOpacityNumber.value = Math.round(opacity * 100);
  render();
  recordHistory();
}

function positionTextPanel() {
  const obj = getSelectedObject();
  if (!obj || obj.type !== "text" || !obj._bounds) {
    textPanel.hidden = true;
    return;
  }

  textPanel.hidden = false;
  const b = obj._bounds;
  const shellRect = canvasShell.getBoundingClientRect();
  const canvasRect = canvas.getBoundingClientRect();
  const scale = canvasRect.width / canvas.width;
  const panelW = textPanel.offsetWidth || 320;
  const panelH = textPanel.offsetHeight || 190;

  let x = canvasRect.left - shellRect.left + b.cx * scale;
  let y = canvasRect.top - shellRect.top + b.y * scale - panelH - 10;
  if (y < 8) {
    y = canvasRect.top - shellRect.top + (b.y + b.h) * scale + 10;
  }

  const minX = panelW / 2 + 8;
  const maxX = shellRect.width - panelW / 2 - 8;
  x = clamp(x, minX, maxX);
  y = clamp(y, 6, shellRect.height - panelH - 6);

  textPanel.style.left = `${x}px`;
  textPanel.style.top = `${y}px`;
}

function render({ showUI = true, hideImages = false, hiddenRoles = [] } = {}) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBackground();
  for (const obj of objects) {
    if (obj.type === "image") {
      if (hideImages) continue;
      if (hiddenRoles.includes(obj.role)) continue;
      drawImageObject(obj);
    }
    else drawTextObject(obj);
  }

  if (showUI) {
    drawGuides();
    drawSelection(getSelectedObject());
    positionTextPanel();
  }
  updateActionButtons();
}

function isCanvasSecurityError(error) {
  return Boolean(error) && (error.name === "SecurityError" || String(error).toLowerCase().includes("tainted"));
}

function downloadCanvasPng(filename) {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas export returned an empty blob."));
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1200);
        resolve();
      }, "image/png");
    } catch (error) {
      reject(error);
    }
  });
}

function onPointerDown(evt) {
  const p = getCanvasPoint(evt);
  const selected = getSelectedObject();

  if (selected && selected._bounds && getHandleHit(p, selected._bounds)) {
    editor.interaction = {
      mode: "resize",
      id: selected.id,
      center: { x: selected._bounds.cx, y: selected._bounds.cy },
      startDist: Math.max(1, distance(p, { x: selected._bounds.cx, y: selected._bounds.cy })),
      startScale: selected.scale,
      changed: false
    };
    canvas.setPointerCapture(evt.pointerId);
    return;
  }

  const hit = pickObject(p);
  if (hit) {
    editor.selectedId = hit.id;
    if (hit.type === "text") syncTextPanelFromObject(hit);
    else textPanel.hidden = true;
    editor.interaction = {
      mode: "drag",
      id: hit.id,
      startPoint: p,
      startCx: hit.cx,
      startCy: hit.cy,
      changed: false
    };
    canvas.setPointerCapture(evt.pointerId);
  } else {
    editor.selectedId = null;
    editor.interaction = null;
    textPanel.hidden = true;
  }
  updateActionButtons();
  render();
}

function onPointerMove(evt) {
  const p = getCanvasPoint(evt);

  if (!editor.interaction) {
    const selected = getSelectedObject();
    if (selected && selected._bounds && getHandleHit(p, selected._bounds)) canvas.style.cursor = "nwse-resize";
    else if (pickObject(p)) canvas.style.cursor = "move";
    else canvas.style.cursor = "default";
    return;
  }

  const interaction = editor.interaction;
  const obj = getObjectById(interaction.id);
  if (!obj) return;

  if (interaction.mode === "drag") {
    const dx = p.x - interaction.startPoint.x;
    const dy = p.y - interaction.startPoint.y;
    let cx = interaction.startCx + dx;
    let cy = interaction.startCy + dy;

    const clamped = clampCenterToCanvas(obj, cx, cy);
    cx = clamped.cx;
    cy = clamped.cy;

    const snapped = snapPosition(obj, cx, cy);
    obj.cx = snapped.cx;
    obj.cy = snapped.cy;
    editor.guides = snapped.guides;
    if (Math.abs(dx) > 0 || Math.abs(dy) > 0) interaction.changed = true;
  } else {
    const d = Math.max(1, distance(p, interaction.center));
    const factor = d / interaction.startDist;
    const minScale = obj.type === "image" ? 0.2 : 0.35;
    const maxScale = obj.type === "image" ? 4 : 3.5;
    const newScale = clamp(interaction.startScale * factor, minScale, maxScale);
    if (Math.abs(newScale - obj.scale) > 0.0001) interaction.changed = true;
    obj.scale = newScale;
    editor.guides = [];
  }

  render();
}

function onPointerUp(evt) {
  const changed = Boolean(editor.interaction && editor.interaction.changed);
  if (editor.interaction) {
    canvas.releasePointerCapture(evt.pointerId);
  }
  editor.interaction = null;
  editor.guides = [];
  const selected = getSelectedObject();
  if (selected && selected.type === "text") syncTextPanelFromObject(selected);
  render();
  if (changed) recordHistory();
}

function addTextObject() {
  const textObj = createTextObject("New text", canvas.width / 2, canvas.height / 2);
  objects.push(textObj);
  editor.selectedId = textObj.id;
  syncTextPanelFromObject(textObj);
  updateActionButtons();
  render();
  recordHistory();
}

function addImageFiles(files) {
  if (!files.length) return;
  let addedCount = 0;
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const offset = addedCount * 24;
      const assetId = registerImageAsset(img);
      const obj = createImageObject(img, canvas.width / 2 + offset, canvas.height / 2 + offset, "image", assetId);
      objects.push(obj);
      editor.selectedId = obj.id;
      addedCount += 1;
      updateActionButtons();
      render();
      recordHistory();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }
}

addTextBtn.addEventListener("click", addTextObject);
addImageBtn.addEventListener("click", () => imageInput.click());
imageInput.addEventListener("change", (evt) => {
  addImageFiles(Array.from(evt.target.files || []));
  imageInput.value = "";
});

refreshBtn.addEventListener("click", render);
snapToggle.addEventListener("change", render);
randomizeBgBtn.addEventListener("click", () => {
  backgroundState = createRandomBackgroundState();
  render();
  recordHistory();
});
layerUpBtn.addEventListener("click", () => {
  if (moveSelectedLayer(1)) {
    render();
    recordHistory();
  }
});
layerDownBtn.addEventListener("click", () => {
  if (moveSelectedLayer(-1)) {
    render();
    recordHistory();
  }
});
deleteBtn.addEventListener("click", () => {
  if (deleteSelectedObject()) {
    const selected = getSelectedObject();
    if (selected && selected.type === "text") syncTextPanelFromObject(selected);
    else textPanel.hidden = true;
    updateActionButtons();
    render();
    recordHistory();
  }
});
undoBtn.addEventListener("click", undo);
redoBtn.addEventListener("click", redo);

panelText.addEventListener("input", applyPanelToSelectedText);
panelFill.addEventListener("input", applyPanelToSelectedText);
panelOutline.addEventListener("input", applyPanelToSelectedText);
panelOutlineOpacity.addEventListener("input", () => {
  panelOutlineOpacityNumber.value = panelOutlineOpacity.value;
  applyPanelToSelectedText();
});
panelOutlineOpacityNumber.addEventListener("input", () => {
  const v = clamp(Number(panelOutlineOpacityNumber.value) || 100, Number(panelOutlineOpacity.min), Number(panelOutlineOpacity.max));
  panelOutlineOpacityNumber.value = v;
  panelOutlineOpacity.value = v;
  applyPanelToSelectedText();
});
panelWeight.addEventListener("change", applyPanelToSelectedText);
panelAlign.addEventListener("change", applyPanelToSelectedText);
panelFamily.addEventListener("change", applyPanelToSelectedText);
panelFontSize.addEventListener("input", () => {
  panelFontSizeNumber.value = panelFontSize.value;
  applyPanelToSelectedText();
});
panelFontSizeNumber.addEventListener("input", () => {
  const v = clamp(Number(panelFontSizeNumber.value) || 95, Number(panelFontSize.min), Number(panelFontSize.max));
  panelFontSizeNumber.value = v;
  panelFontSize.value = v;
  applyPanelToSelectedText();
});
panelOutlineSize.addEventListener("input", () => {
  panelOutlineSizeNumber.value = panelOutlineSize.value;
  applyPanelToSelectedText();
});
panelOutlineSizeNumber.addEventListener("input", () => {
  const v = clamp(Number(panelOutlineSizeNumber.value) || 19, Number(panelOutlineSize.min), Number(panelOutlineSize.max));
  panelOutlineSizeNumber.value = v;
  panelOutlineSize.value = v;
  applyPanelToSelectedText();
});
panelOpacity.addEventListener("input", () => {
  panelOpacityNumber.value = panelOpacity.value;
  applyPanelToSelectedText();
});
panelOpacityNumber.addEventListener("input", () => {
  const v = clamp(Number(panelOpacityNumber.value) || 100, Number(panelOpacity.min), Number(panelOpacity.max));
  panelOpacityNumber.value = v;
  panelOpacity.value = v;
  applyPanelToSelectedText();
});

canvas.addEventListener("pointerdown", onPointerDown);
canvas.addEventListener("pointermove", onPointerMove);
canvas.addEventListener("pointerup", onPointerUp);
canvas.addEventListener("pointerleave", () => {
  if (!editor.interaction) canvas.style.cursor = "default";
});

window.addEventListener("resize", () => {
  if (!textPanel.hidden) positionTextPanel();
});

window.addEventListener("keydown", (evt) => {
  const target = evt.target;
  const tag = target && target.tagName ? target.tagName.toUpperCase() : "";
  const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (target && target.isContentEditable);
  const modifier = evt.ctrlKey || evt.metaKey;

  if (modifier && !evt.altKey && !typing) {
    const key = evt.key.toLowerCase();
    if (key === "z" && evt.shiftKey) {
      evt.preventDefault();
      redo();
      return;
    }
    if (key === "z") {
      evt.preventDefault();
      undo();
      return;
    }
    if (key === "y") {
      evt.preventDefault();
      redo();
      return;
    }
  }

  if (!typing && (evt.key === "Delete" || evt.key === "Backspace")) {
    if (deleteSelectedObject()) {
      const selected = getSelectedObject();
      if (selected && selected.type === "text") syncTextPanelFromObject(selected);
      else textPanel.hidden = true;
      updateActionButtons();
      render();
      recordHistory();
      evt.preventDefault();
    }
  }
});

downloadBtn.addEventListener("click", async () => {
  const stamp = Date.now();
  try {
    render({ showUI: false });
    await downloadCanvasPng(`mathlify-ad-${stamp}.png`);
  } catch (error) {
    if (!isCanvasSecurityError(error)) throw error;

    // First fallback: keep built-in logo, hide user-added image layers.
    try {
      render({ showUI: false, hiddenRoles: ["image"] });
      await downloadCanvasPng(`mathlify-ad-${stamp}-no-user-images.png`);
      window.alert(
        "Export used fallback mode (logo kept, user-added images removed) because at least one image is cross-origin. " +
        "Use local uploads or same-origin assets to export the full composition."
      );
    } catch (fallbackError) {
      if (!isCanvasSecurityError(fallbackError)) throw fallbackError;

      // Final fallback: remove all images if logo itself is cross-origin in this environment.
      render({ showUI: false, hideImages: true });
      await downloadCanvasPng(`mathlify-ad-${stamp}-no-images.png`);
      window.alert(
        "Export used strict fallback mode (without images) because the canvas is still tainted. " +
        "If you opened this from file://, run it via a local server for full-image export."
      );
    }
  } finally {
    render();
  }
});

const initialText = createTextObject("Affordable STEM kits for schools and youth programs");
objects.push(initialText);
editor.selectedId = initialText.id;
syncTextPanelFromObject(initialText);
recordHistory();

logoImage.src = "res/logo.png";
logoImage.onload = () => {
  const logoObj = createImageObject(logoImage, 203, 95, "logo");
  objects.unshift(logoObj);
  render();
  recordHistory();
};
logoImage.onerror = () => {
  render();
  recordHistory();
};

render();
