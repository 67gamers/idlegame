'use strict';
/* ================= 像素繪圖模組 =================
   世界邏輯解析度 256×216,CSS 放大 + image-rendering: pixelated 呈現像素風 */

// ---- 場景物件配置(遊戲邏輯與點擊判定共用) ----
const LAYOUT = {
  world: { w: 256, h: 216 },
  // 農場(室外)
  house: { x: 8,   y: 6,  w: 64, h: 58 },
  bench: { x: 88,  y: 32, w: 32, h: 26 },
  stall: { x: 160, y: 8,  w: 80, h: 54 },
  plots: { x0: 12, y0: 80, w: 44, h: 30, gx: 48, gy: 33, cols: 5 },
  // 房子(室內)
  stove: { x: 24,  y: 52,  w: 52, h: 40 },
  bed:   { x: 176, y: 48,  w: 48, h: 66 },
  door:  { x: 108, y: 178, w: 40, h: 28 },
};

// ---- 像素小精靈圖(16×16 字元矩陣) ----
const SPR_SPROUT = [
'................',
'................',
'................',
'................',
'................',
'................',
'.....L..........',
'....Ll...L......',
'.....l..Ll......',
'.....l.ll.......',
'......ll........',
'......l.........',
'......l.........',
'................',
'................',
'................'];
const SPR_BUSH = [
'................',
'................',
'................',
'....L...L.......',
'...LlL.LlL......',
'..LllLLllL......',
'..Lll.lll.L.....',
'...l.lll.lL.....',
'..Ll.lll.l......',
'...lllllll......',
'....lllll.......',
'.....lll........',
'......l.........',
'......l.........',
'................',
'................'];
const SPR_MATURE = [
'................',
'................',
'....L...L.......',
'...LlL.LlL......',
'..LllLLllLL.....',
'..Lll.lll.L.....',
'..Fl.lll.lF.....',
'..FF.lll.FF.....',
'...lllllll......',
'...Flllll.......',
'...FFlllF.......',
'.....ll.........',
'......l.........',
'......l.........',
'................',
'................'];
const SPR_FLOWER = [
'................',
'................',
'.....FF.........',
'....FYYF........',
'....FYYF........',
'.....FF.........',
'......s.........',
'...L..s..L......',
'....Ll.s.lL.....',
'.....l.sl.......',
'......ss........',
'......s.........',
'......s.........',
'................',
'................',
'................'];
const SPR_ROTTEN = [
'................',
'................',
'................',
'................',
'................',
'................',
'................',
'....g..g........',
'...ggggggg......',
'..ggGGgGgg......',
'..gGgggGgg......',
'...gggggg.......',
'................',
'................',
'................',
'................'];

const PLANT_COLORS = { s: '#3c6e2f', l: '#4f9a3a', L: '#67b94e', d: '#2f5526', g: '#6e6253', G: '#857762', Y: '#f6c93f' };

// ---- 小農夫(12×16,兩格走路動畫) ----
const FARMER_COLORS = { h: '#e8c95a', f: '#f2c9a0', k: '#222222', r: '#d9533f', p: '#3f5fa0', b: '#5d4a2f' };
const SPR_FARMER_A = [
'....hhhh....',
'...hhhhhh...',
'.hhhhhhhhhh.',
'...ffffff...',
'...fkffkf...',
'...ffffff...',
'..rrrrrrrr..',
'.frrrrrrrrf.',
'.f.rrrrrr.f.',
'...rrrrrr...',
'...pppppp...',
'...pp..pp...',
'...pp..pp...',
'...bb..bb...',
'............',
'............'];
const SPR_FARMER_B = [
'....hhhh....',
'...hhhhhh...',
'.hhhhhhhhhh.',
'...ffffff...',
'...fkffkf...',
'...ffffff...',
'..rrrrrrrr..',
'.frrrrrrrrf.',
'.f.rrrrrr.f.',
'...rrrrrr...',
'...pppppp...',
'...pp..pp...',
'..pp....pp..',
'..bb....bb..',
'............',
'............'];

// ---- 稻草人(14×16) ----
const SCARECROW_COLORS = { A: '#c9a44a', h: '#e8c95a', k: '#222222', w: '#8d5a2b', W: '#7a4a22', y: '#e8c95a' };
const SPR_SCARECROW = [
'.....AAAA.....',
'....AAAAAA....',
'..AAAAAAAAAA..',
'.....hhhh.....',
'....hkhhkh....',
'....hhhhhh....',
'wwwwwWWWWwwwww',
'..y..WWWW..y..',
'.....WWWW.....',
'....yWWWWy....',
'.....WWWW.....',
'.....WWWW.....',
'.....WWWW.....',
'.....WWWW.....',
'.....WWWW.....',
'....WWWWWW....'];

// ---- 看門狗(14×10,兩格搖尾巴) ----
const DOG_COLORS = { b: '#a9743f', d: '#8d5a2b', k: '#222222', n: '#3b2a18', t: '#f2c9a0' };
const SPR_DOG_A = [
'.dd...........',
'.ddd..........',
'.bbbb.........',
'.bkbb.bbbbbb..',
'.bbbnbbbbbbbd.',
'..bbbbbbbbbdd.',
'..bbbbbbbbb...',
'..dd.....dd...',
'..dd.....dd...',
'..............'];
const SPR_DOG_B = [
'.dd...........',
'.ddd.......dd.',
'.bbbb......dd.',
'.bkbb.bbbbbbd.',
'.bbbnbbbbbbb..',
'..bbbbbbbbb...',
'..bbbbbbbbb...',
'..dd.....dd...',
'..dd.....dd...',
'..............'];

const PX = {
  // 縮放倍率:canvas 以螢幕原生解析度繪製(由 game.js 的 fitCanvas 設定),
  // 邏輯座標仍是 256×216,繪製時換算,讓像素方塊銳利、文字以高解析度渲染
  S: 1,

  rect(ctx, x, y, w, h, color) {
    const s = PX.S;
    const x1 = Math.round(x * s), y1 = Math.round(y * s);
    ctx.fillStyle = color;
    ctx.fillRect(x1, y1, Math.round((x + w) * s) - x1, Math.round((y + h) * s) - y1);
  },

  sprite(ctx, spr, x, y, extra = {}) {
    for (let r = 0; r < spr.length; r++) {
      const row = spr[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.') continue;
        const color = extra[ch] || PLANT_COLORS[ch];
        if (!color) continue;
        PX.rect(ctx, x + c, y + r, 1, 1, color);
      }
    }
  },

  // 高解析度文字(帶陰影,確保草地上看得清)
  label(ctx, text, cx, y, color = '#fff', size = 7) {
    const s = PX.S;
    const off = Math.max(1, Math.round(s / 3));
    ctx.font = `bold ${Math.round(size * s)}px "PingFang TC", "Microsoft JhengHei", monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = 'rgba(20,15,5,.75)';
    ctx.fillText(text, cx * s + off, y * s + off);
    ctx.fillStyle = color;
    ctx.fillText(text, cx * s, y * s);
  },

  grass(ctx, w, h) {
    PX.rect(ctx, 0, 0, w, h, '#6fbf4a');
    // 固定亂數草點,維持像素質感
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const v = (x * 7 + y * 13) % 23;
        if (v === 0) PX.rect(ctx, x, y, 2, 1, '#82d15c');
        else if (v === 7) PX.rect(ctx, x + 2, y + 2, 1, 2, '#5da93c');
        else if (v === 15) PX.rect(ctx, x + 1, y + 3, 1, 1, '#8fdb69');
      }
    }
  },

  house(ctx, r) {
    const cx = r.x + r.w / 2;
    // 牆
    PX.rect(ctx, r.x + 4, r.y + 24, r.w - 8, r.h - 24, '#d9b378');
    PX.rect(ctx, r.x + 4, r.y + 24, r.w - 8, 2, '#b08a52');
    // 屋頂(階梯三角形)
    for (let j = 0; j < 24; j++) {
      const half = Math.round((j / 24) * (r.w / 2));
      PX.rect(ctx, cx - half, r.y + j, half * 2, 1, j % 6 < 3 ? '#c0392b' : '#a93226');
    }
    // 煙囪
    PX.rect(ctx, r.x + r.w - 16, r.y + 2, 8, 14, '#8d6e63');
    PX.rect(ctx, r.x + r.w - 17, r.y, 10, 3, '#6d4c41');
    // 門
    PX.rect(ctx, cx - 8, r.y + r.h - 20, 16, 20, '#7a4a22');
    PX.rect(ctx, cx - 7, r.y + r.h - 19, 14, 18, '#8d5a2b');
    PX.rect(ctx, cx + 3, r.y + r.h - 11, 2, 2, '#f6c93f'); // 門把
    // 窗
    PX.rect(ctx, r.x + 10, r.y + 32, 14, 12, '#5d4a2f');
    PX.rect(ctx, r.x + 11, r.y + 33, 12, 10, '#9fd8ff');
    PX.rect(ctx, r.x + 16, r.y + 33, 2, 10, '#5d4a2f');
    PX.rect(ctx, r.x + 11, r.y + 37, 12, 2, '#5d4a2f');
  },

  stall(ctx, r) {
    // 支柱
    PX.rect(ctx, r.x + 2, r.y + 12, 4, r.h - 12, '#7a4a22');
    PX.rect(ctx, r.x + r.w - 6, r.y + 12, 4, r.h - 12, '#7a4a22');
    // 遮陽棚(紅白條紋)
    for (let s = 0; s < r.w; s += 8) {
      PX.rect(ctx, r.x + s, r.y, 8, 12, (s / 8) % 2 === 0 ? '#e74c3c' : '#fdf6ec');
    }
    PX.rect(ctx, r.x, r.y + 12, r.w, 2, '#b03a2e');
    // 櫃台
    PX.rect(ctx, r.x + 4, r.y + r.h - 20, r.w - 8, 20, '#a9743f');
    PX.rect(ctx, r.x + 4, r.y + r.h - 20, r.w - 8, 3, '#c08a4f');
    // 櫃台上的貨物(小箱子和蔬果)
    PX.rect(ctx, r.x + 10, r.y + r.h - 26, 10, 8, '#c9a44a');
    PX.rect(ctx, r.x + 26, r.y + r.h - 25, 8, 7, '#ff8c1a');
    PX.rect(ctx, r.x + 40, r.y + r.h - 26, 9, 8, '#ff4f3f');
    PX.rect(ctx, r.x + 56, r.y + r.h - 24, 8, 6, '#9a5fd0');
  },

  bench(ctx, r) {
    // 桌面與桌腳
    PX.rect(ctx, r.x, r.y + 8, r.w, 8, '#b08148');
    PX.rect(ctx, r.x, r.y + 8, r.w, 2, '#cf9c5d');
    PX.rect(ctx, r.x + 2, r.y + 16, 4, 10, '#7a4a22');
    PX.rect(ctx, r.x + r.w - 6, r.y + 16, 4, 10, '#7a4a22');
    // 鎚子
    PX.rect(ctx, r.x + 8, r.y + 2, 10, 4, '#9aa0a6');
    PX.rect(ctx, r.x + 12, r.y + 6, 2, 6, '#8d5a2b');
    // 鋸子刀刃
    PX.rect(ctx, r.x + 22, r.y + 4, 8, 2, '#c0c6cc');
  },

  soil(ctx, r, locked) {
    const base = locked ? '#9a8d77' : '#8d6748';
    const line = locked ? '#857a66' : '#76563a';
    PX.rect(ctx, r.x - 1, r.y - 1, r.w + 2, r.h + 2, locked ? '#6e6253' : '#5d4226');
    PX.rect(ctx, r.x, r.y, r.w, r.h, base);
    for (let j = 5; j < r.h; j += 7) PX.rect(ctx, r.x + 2, r.y + j, r.w - 4, 2, line);
  },

  lock(ctx, r, cost) {
    const cx = r.x + r.w / 2;
    // 鎖頭
    PX.rect(ctx, cx - 4, r.y + 6, 8, 7, '#f6c93f');
    PX.rect(ctx, cx - 3, r.y + 2, 6, 4, '#d9ab28');
    PX.rect(ctx, cx - 2, r.y + 3, 4, 3, '#9a8d77');
    PX.rect(ctx, cx - 1, r.y + 9, 2, 3, '#7a5c14');
    PX.label(ctx, '$' + cost, cx, r.y + 16, '#ffe9a0');
  },

  crop(ctx, r, stage, cropDef, growPct) {
    const x = Math.round(r.x + (r.w - 16) / 2);
    const y = r.y + r.h - 17;
    const F = { F: cropDef.color || '#ff4f3f' };
    if (stage === 'rotten') PX.sprite(ctx, SPR_ROTTEN, x, y);
    else if (stage === 'mature') PX.sprite(ctx, cropDef.cat === 'flower' ? SPR_FLOWER : SPR_MATURE, x, y, F);
    else PX.sprite(ctx, growPct < 0.5 ? SPR_SPROUT : SPR_BUSH, x, y, F);
  },

  bar(ctx, r, pct) {
    PX.rect(ctx, r.x, r.y - 6, r.w, 4, '#3b2a18');
    PX.rect(ctx, r.x + 1, r.y - 5, Math.max(1, (r.w - 2) * Math.min(1, pct)), 2, '#8fdb69');
  },

  // 成熟/快腐爛的驚嘆號標記
  mark(ctx, r, color) {
    const x = r.x + r.w - 6, y = r.y - 8;
    PX.rect(ctx, x, y, 2, 5, color);
    PX.rect(ctx, x, y + 6, 2, 2, color);
  },

  time(ctx, r, sec, color) {
    sec = Math.max(0, Math.ceil(sec));
    const m = Math.floor(sec / 60), s = sec % 60;
    PX.label(ctx, `${m}:${String(s).padStart(2, '0')}`, r.x + r.w / 2, r.y + 2, color, 7);
  },

  // 可左右翻轉的精靈(face=-1 朝左;pz=每個像素的世界尺寸,放大用)
  spriteFlip(ctx, spr, x, y, colors, face, pz = 1) {
    for (let r = 0; r < spr.length; r++) {
      const row = spr[r];
      const len = row.length;
      for (let c = 0; c < len; c++) {
        const ch = row[face < 0 ? len - 1 - c : c];
        if (ch === '.') continue;
        const color = colors[ch];
        if (!color) continue;
        PX.rect(ctx, x + c * pz, y + r * pz, pz, pz, color);
      }
    }
  },

  farmer(ctx, x, y, frame, face, pz = 1, colorOverride = null) {
    const colors = colorOverride ? Object.assign({}, FARMER_COLORS, colorOverride) : FARMER_COLORS;
    PX.spriteFlip(ctx, frame ? SPR_FARMER_B : SPR_FARMER_A, x, y, colors, face, pz);
  },
  scarecrow(ctx, x, y) {
    PX.sprite(ctx, SPR_SCARECROW, x, y, SCARECROW_COLORS);
  },
  dog(ctx, x, y, frame) {
    PX.sprite(ctx, frame ? SPR_DOG_B : SPR_DOG_A, x, y, DOG_COLORS);
  },

  // ---- 日夜效果 ----
  // dark: 0(白天)~1(深夜);glow: 黃昏/黎明的暖色程度 0~1
  nightTint(ctx, w, h, dark, glow) {
    if (glow > 0.01) {
      ctx.fillStyle = `rgba(255,130,40,${(glow * 0.18).toFixed(3)})`;
      ctx.fillRect(0, 0, Math.round(w * PX.S), Math.round(h * PX.S));
    }
    if (dark > 0.01) {
      ctx.fillStyle = `rgba(12,18,64,${(dark * 0.42).toFixed(3)})`;
      ctx.fillRect(0, 0, Math.round(w * PX.S), Math.round(h * PX.S));
    }
  },
  stars(ctx, w) {
    for (let i = 0; i < 28; i++) {
      const x = (i * 37 + 11) % w;
      const y = (i * 23 + 5) % 56;
      PX.rect(ctx, x, y, 1, 1, i % 3 ? '#ffffffcc' : '#ffe9a0cc');
    }
  },
  sunMoon(ctx, x, y, phase) {
    if (phase === 'night') {
      PX.rect(ctx, x + 1, y, 8, 10, '#e8e4da');
      PX.rect(ctx, x, y + 1, 10, 8, '#e8e4da');
      PX.rect(ctx, x + 4, y + 1, 7, 8, '#1a2050'); // 月缺
      PX.rect(ctx, x + 1, y + 1, 2, 2, '#fffdf5');
    } else {
      const c = phase === 'day' ? '#ffd23f' : '#ff9a3f';
      PX.rect(ctx, x + 1, y + 1, 8, 8, c);
      PX.rect(ctx, x + 4, y - 2, 2, 2, c);
      PX.rect(ctx, x + 4, y + 10, 2, 2, c);
      PX.rect(ctx, x - 2, y + 4, 2, 2, c);
      PX.rect(ctx, x + 10, y + 4, 2, 2, c);
    }
  },
  // 夜裡房子的窗戶亮燈
  houseGlow(ctx, r) {
    PX.rect(ctx, r.x + 11, r.y + 33, 12, 10, '#ffe9a0');
    PX.rect(ctx, r.x + 16, r.y + 33, 2, 10, '#5d4a2f');
    PX.rect(ctx, r.x + 11, r.y + 37, 12, 2, '#5d4a2f');
  },

  indoor(ctx, L) {
    const { w, h } = L.world;
    // 地板(木板)
    PX.rect(ctx, 0, 0, w, h, '#caa06a');
    for (let y = 0; y < h; y += 14) {
      PX.rect(ctx, 0, y, w, 1, '#b08a52');
      for (let x = ((y / 14) % 2) * 32; x < w; x += 64) PX.rect(ctx, x, y + 7, 1, 7, '#b08a52');
    }
    // 牆
    PX.rect(ctx, 0, 0, w, 40, '#e6d2b0');
    PX.rect(ctx, 0, 38, w, 3, '#8d6e63');
    // 窗戶
    PX.rect(ctx, 110, 6, 36, 26, '#5d4a2f');
    PX.rect(ctx, 112, 8, 32, 22, '#9fd8ff');
    PX.rect(ctx, 126, 8, 3, 22, '#5d4a2f');
    PX.rect(ctx, 112, 17, 32, 3, '#5d4a2f');
    // 地毯
    PX.rect(ctx, 96, 110, 64, 40, '#d97f4a');
    PX.rect(ctx, 100, 114, 56, 32, '#e89a64');

    // ---- 廚房:爐灶 ----
    const s = L.stove;
    PX.rect(ctx, s.x, s.y, s.w, s.h, '#9aa0a6');
    PX.rect(ctx, s.x, s.y, s.w, 8, '#2f3337');
    PX.rect(ctx, s.x + 6, s.y + 2, 12, 4, '#111');
    PX.rect(ctx, s.x + 28, s.y + 2, 12, 4, '#111');
    PX.rect(ctx, s.x + 8, s.y + 14, s.w - 16, 16, '#5d6166'); // 烤箱門
    PX.rect(ctx, s.x + 10, s.y + 16, s.w - 20, 2, '#caa06a');
    // 鍋子和蒸氣
    PX.rect(ctx, s.x + 6, s.y - 6, 12, 6, '#444');
    PX.rect(ctx, s.x + 4, s.y - 6, 16, 2, '#666');
    PX.rect(ctx, s.x + 9, s.y - 12, 2, 4, '#ffffff88');
    PX.rect(ctx, s.x + 13, s.y - 15, 2, 5, '#ffffff66');
    // 流理台
    PX.rect(ctx, s.x + s.w + 4, s.y + 6, 30, s.h - 6, '#b08148');
    PX.rect(ctx, s.x + s.w + 4, s.y + 6, 30, 4, '#cf9c5d');
    PX.rect(ctx, s.x + s.w + 10, s.y + 14, 12, 8, '#e8e4da'); // 砧板

    // ---- 床 ----
    const b = L.bed;
    PX.rect(ctx, b.x - 2, b.y - 2, b.w + 4, b.h + 4, '#7a4a22'); // 床框
    PX.rect(ctx, b.x, b.y, b.w, b.h, '#f5f5f5');                 // 床墊
    PX.rect(ctx, b.x + 6, b.y + 4, b.w - 12, 12, '#ffffff');     // 枕頭
    PX.rect(ctx, b.x + 6, b.y + 4, b.w - 12, 2, '#dcdcdc');
    PX.rect(ctx, b.x, b.y + 22, b.w, b.h - 22, '#4a7fd9');       // 被子
    PX.rect(ctx, b.x, b.y + 22, b.w, 4, '#6f9ce8');
    for (let j = b.y + 32; j < b.y + b.h - 4; j += 10) PX.rect(ctx, b.x + 4, j, b.w - 8, 2, '#3d6cc0');

    // ---- 門口地墊 ----
    const d = L.door;
    PX.rect(ctx, d.x, d.y, d.w, d.h, '#8d6e63');
    PX.rect(ctx, d.x + 3, d.y + 3, d.w - 6, d.h - 6, '#a9836f');
  },
};
