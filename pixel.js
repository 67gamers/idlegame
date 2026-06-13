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
const FARMER_COLORS = { h: '#e8c95a', H: '#c9a83f', f: '#f2c9a0', F: '#d9a878', k: '#2b2b2b', r: '#d9533f', R: '#b23c2c', p: '#3f5fa0', b: '#5d4a2f' };
//  h=帽 H=帽影 f=膚 F=膚影 k=眼 r=衣 R=衣影 p=吊帶褲 b=靴
const SPR_FARMER_A = [
'....hhhh....',
'...hhhhhh...',
'..hHHHHHHh..',
'.hhhhhhhhhh.',
'...ffffff...',
'...fkffkf...',
'...fffffF...',
'..rrrrrrrr..',
'.frpRRRpr f.',
'.frpRRRprf..',
'..pppppppp..',
'...pp..pp...',
'...pp..pp...',
'...bb..bb...',
'............',
'............'];
const SPR_FARMER_B = [
'....hhhh....',
'...hhhhhh...',
'..hHHHHHHh..',
'.hhhhhhhhhh.',
'...ffffff...',
'...fkffkf...',
'...fffffF...',
'..rrrrrrrr..',
'.frpRRRpr f.',
'.frpRRRprf..',
'..pppppppp..',
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

// ---- 寵物:每隻獨立造型(8×8);o=外框 b=身體 e=耳/角/特徵 k=眼 d=腳 w=白 ----
const PET_SPRITES = {
  cat: [
'.o....o.',
'.ob..bo.',
'obbbbbbo',
'obkbbkbo',
'obbeebbo',
'obbbbbbo',
'.oddddo.',
'.d....d.'],
  chicken: [
'..ee....',
'.oeeo...',
'obbbbo..',
'obkbboe.',
'obbbbbo.',
'.obbbbo.',
'..d.d...',
'..d.d...'],
  rabbit: [
'.o..o...',
'.oe.oe..',
'.obbbo..',
'obbbbbo.',
'obkbkbo.',
'obbeebo.',
'.obbbo..',
'.d...d..'],
  bee: [
'.k....k.',
'wobbbbow',
'.okkkko.',
'.obbbbo.',
'.okkkko.',
'.obbbbo.',
'.od..do.',
'..d..d..'],
  pig: [
'.o....o.',
'obe..ebo',
'obbbbbbo',
'obkbbkbo',
'obbeebbo',
'obbbbbbo',
'.oddddo.',
'.d....d.'],
  owl: [
'o......o',
'obbbbbbo',
'owwwwwwo',
'owkwwkwo',
'obbeebbo',
'obbbbbbo',
'obbbbbbo',
'.od..do.'],
  dragon: [
'.o....o.',
'.oe..eo.',
'obbbbbbo',
'obkbbkbo',
'obbbbbbw',
'obbbbbbo',
'oeebbeeo',
'.d....d.'],
};

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
    // 帶層次的草地:上方偏亮、中間基底、下方偏深
    PX.rect(ctx, 0, 0, w, h, '#6fbf4a');
    PX.rect(ctx, 0, 0, w, Math.round(h * 0.30), '#79c855');
    PX.rect(ctx, 0, Math.round(h * 0.74), w, Math.round(h * 0.26), '#61af3f');
    // 固定亂數的草叢、亮點、土點(用 hash 維持快取穩定)
    for (let y = 0; y < h; y += 4) {
      for (let x = 0; x < w; x += 4) {
        const v = (x * 7 + y * 13) % 29;
        if (v === 0) { // 三葉草叢
          PX.rect(ctx, x, y + 1, 1, 2, '#4e9636');
          PX.rect(ctx, x + 1, y, 1, 3, '#57a23b');
          PX.rect(ctx, x + 2, y + 1, 1, 2, '#4e9636');
        } else if (v === 7) PX.rect(ctx, x + 2, y + 2, 1, 1, '#8fdb69');
        else if (v === 13) PX.rect(ctx, x + 1, y + 3, 2, 1, '#86d35e');
        else if (v === 22) PX.rect(ctx, x + 1, y + 2, 1, 1, '#9be072');
      }
    }
    // 稀疏的小花點綴(黃 / 粉 / 白)
    const flower = (fx, fy, c) => {
      PX.rect(ctx, fx, fy - 1, 1, 1, c);
      PX.rect(ctx, fx - 1, fy, 3, 1, c);
      PX.rect(ctx, fx, fy + 1, 1, 1, c);
      PX.rect(ctx, fx, fy, 1, 1, '#ffe9a0');
    };
    for (let y = 6; y < h; y += 8) {
      for (let x = 5; x < w; x += 8) {
        const v = (x * 17 + y * 11) % 53;
        if (v === 0) flower(x, y, '#ffd23f');
        else if (v === 17) flower(x, y, '#ff8fc0');
        else if (v === 34) flower(x, y, '#f4f4f4');
      }
    }
  },

  house(ctx, r) {
    const cx = r.x + r.w / 2;
    const wallL = r.x + 4, wallW = r.w - 8, wallT = r.y + 22, wallB = r.y + r.h;
    // 牆身(米黃,帶磚紋與左暗右亮的立體感)
    PX.rect(ctx, wallL, wallT, wallW, wallB - wallT, '#e3c089');
    PX.rect(ctx, wallL, wallT, 3, wallB - wallT, '#cda972'); // 左側陰影
    PX.rect(ctx, wallL + wallW - 2, wallT, 2, wallB - wallT, '#efd3a0'); // 右側受光
    for (let by = wallT + 5; by < wallB - 2; by += 6) PX.rect(ctx, wallL, by, wallW, 1, '#d3b079');
    PX.rect(ctx, wallL, wallT, wallW, 2, '#b8945c'); // 牆頂壓條
    // 屋頂:深紅瓦,帶屋脊亮線與屋簷陰影
    for (let j = 0; j < 22; j++) {
      const half = Math.round((j / 22) * (r.w / 2));
      const shade = j < 3 ? '#d44a3a' : (j % 5 < 2 ? '#be3a2c' : '#a83226');
      PX.rect(ctx, cx - half, r.y + j, half * 2, 1, shade);
    }
    PX.rect(ctx, cx - 1, r.y, 2, 3, '#e85c48'); // 屋脊頂端高光
    PX.rect(ctx, wallL - 3, wallT - 2, wallW + 6, 3, '#7a241a'); // 屋簷
    // 煙囪 + 兩縷煙
    PX.rect(ctx, r.x + r.w - 17, r.y + 2, 8, 14, '#8a6a5a');
    PX.rect(ctx, r.x + r.w - 17, r.y + 2, 2, 14, '#6d4c41');
    PX.rect(ctx, r.x + r.w - 18, r.y, 10, 3, '#5d3f35');
    PX.rect(ctx, r.x + r.w - 14, r.y - 5, 2, 3, '#ffffff66');
    PX.rect(ctx, r.x + r.w - 12, r.y - 9, 2, 3, '#ffffff44');
    // 門(門框 + 兩塊門板 + 門把 + 台階)
    const dx = cx - 9, dy = r.y + r.h - 22;
    PX.rect(ctx, dx, dy, 18, 22, '#5e3414');
    PX.rect(ctx, dx + 2, dy + 2, 14, 20, '#8d5a2b');
    PX.rect(ctx, dx + 2, dy + 2, 6, 9, '#7a4a22');
    PX.rect(ctx, dx + 10, dy + 2, 4, 9, '#7a4a22');
    PX.rect(ctx, dx + 2, dy + 12, 6, 9, '#7a4a22');
    PX.rect(ctx, dx + 10, dy + 12, 4, 9, '#7a4a22');
    PX.rect(ctx, dx + 12, dy + 11, 2, 2, '#ffd23f'); // 門把
    PX.rect(ctx, dx - 2, dy + 21, 22, 2, '#b89a6a'); // 門前石階
    // 窗(窗框 + 玻璃 + 十字櫺 + 窗台 + 花盆)
    const wx = r.x + 9, wy = r.y + 30;
    PX.rect(ctx, wx, wy, 16, 14, '#5e3414');
    PX.rect(ctx, wx + 1, wy + 1, 14, 12, '#a9deff');
    PX.rect(ctx, wx + 1, wy + 1, 7, 6, '#c4e9ff'); // 玻璃反光
    PX.rect(ctx, wx + 7, wy + 1, 2, 12, '#5e3414');
    PX.rect(ctx, wx + 1, wy + 6, 14, 2, '#5e3414');
    PX.rect(ctx, wx - 1, wy + 14, 18, 2, '#cda972'); // 窗台
    PX.rect(ctx, wx + 1, wy + 16, 14, 3, '#8a5a2c'); // 花盆
    PX.rect(ctx, wx + 2, wy + 15, 2, 1, '#ff6b8a'); // 小花
    PX.rect(ctx, wx + 6, wy + 14, 2, 2, '#ffd23f');
    PX.rect(ctx, wx + 11, wy + 15, 2, 1, '#ff6b8a');
  },

  stall(ctx, r) {
    // 木支柱(帶陰影面)
    PX.rect(ctx, r.x + 2, r.y + 12, 4, r.h - 12, '#7a4a22');
    PX.rect(ctx, r.x + 2, r.y + 12, 1, r.h - 12, '#5e3414');
    PX.rect(ctx, r.x + r.w - 6, r.y + 12, 4, r.h - 12, '#7a4a22');
    PX.rect(ctx, r.x + r.w - 6, r.y + 12, 1, r.h - 12, '#5e3414');
    // 遮陽棚(紅白條紋 + 立體感)
    for (let s = 0; s < r.w; s += 8) {
      const red = (s / 8) % 2 === 0;
      PX.rect(ctx, r.x + s, r.y, 8, 11, red ? '#e74c3c' : '#fdf6ec');
      PX.rect(ctx, r.x + s, r.y, 8, 2, red ? '#f4685a' : '#ffffff');
    }
    // 棚邊扇形垂邊
    for (let s = 0; s < r.w; s += 8) {
      const red = (s / 8) % 2 === 0;
      PX.rect(ctx, r.x + s + 1, r.y + 11, 6, 2, red ? '#c0392b' : '#e6ddcf');
      PX.rect(ctx, r.x + s + 2, r.y + 13, 4, 1, red ? '#c0392b' : '#e6ddcf');
      PX.rect(ctx, r.x + s + 3, r.y + 14, 2, 1, red ? '#c0392b' : '#e6ddcf');
    }
    // 櫃台(木紋 + 受光邊)
    const cy = r.y + r.h - 20;
    PX.rect(ctx, r.x + 4, cy, r.w - 8, 20, '#a9743f');
    PX.rect(ctx, r.x + 4, cy, r.w - 8, 3, '#c89a5a');
    PX.rect(ctx, r.x + 4, cy + 10, r.w - 8, 1, '#8a5a2c');
    PX.rect(ctx, r.x + 4, cy + 18, r.w - 8, 2, '#7a4a22');
    // 貨物:木箱 + 蔬果堆
    PX.rect(ctx, r.x + 9, cy - 9, 12, 9, '#b5823f'); // 木箱
    PX.rect(ctx, r.x + 9, cy - 9, 12, 2, '#cf9c5d');
    PX.rect(ctx, r.x + 11, cy - 7, 2, 2, '#ff8c1a'); // 箱裡橘子
    PX.rect(ctx, r.x + 15, cy - 7, 2, 2, '#ff8c1a');
    PX.rect(ctx, r.x + 26, cy - 6, 6, 6, '#ff4f3f'); // 番茄
    PX.rect(ctx, r.x + 27, cy - 6, 2, 2, '#ff8076');
    PX.rect(ctx, r.x + 33, cy - 7, 5, 7, '#5aa83c'); // 西瓜
    PX.rect(ctx, r.x + 33, cy - 7, 5, 2, '#7ec84e');
    PX.rect(ctx, r.x + 42, cy - 6, 5, 6, '#9a5fd0'); // 葡萄
    PX.rect(ctx, r.x + 48, cy - 8, 7, 8, '#ffd23f'); // 金黃果
    PX.rect(ctx, r.x + 48, cy - 8, 7, 2, '#ffe066');
    // 招牌「$」
    PX.rect(ctx, r.x + r.w - 16, r.y + 16, 12, 11, '#fdf6ec');
    PX.rect(ctx, r.x + r.w - 16, r.y + 16, 12, 11, '#fdf6ec');
    PX.rect(ctx, r.x + r.w - 12, r.y + 17, 4, 1, '#3f8f4a');
    PX.rect(ctx, r.x + r.w - 13, r.y + 18, 2, 1, '#3f8f4a');
    PX.rect(ctx, r.x + r.w - 12, r.y + 19, 4, 1, '#3f8f4a');
    PX.rect(ctx, r.x + r.w - 9, r.y + 20, 2, 1, '#3f8f4a');
    PX.rect(ctx, r.x + r.w - 13, r.y + 21, 4, 1, '#3f8f4a');
    PX.rect(ctx, r.x + r.w - 11, r.y + 16, 1, 12, '#3f8f4a');
  },

  bench(ctx, r) {
    // 桌面(木紋)與桌腳(帶陰影)
    PX.rect(ctx, r.x, r.y + 8, r.w, 9, '#b08148');
    PX.rect(ctx, r.x, r.y + 8, r.w, 2, '#cf9c5d');
    PX.rect(ctx, r.x, r.y + 13, r.w, 1, '#9a6e3a');
    PX.rect(ctx, r.x + 2, r.y + 17, 4, 10, '#7a4a22');
    PX.rect(ctx, r.x + 2, r.y + 17, 1, 10, '#5e3414');
    PX.rect(ctx, r.x + r.w - 6, r.y + 17, 4, 10, '#7a4a22');
    PX.rect(ctx, r.x + r.w - 6, r.y + 17, 1, 10, '#5e3414');
    // 鎚子(木柄 + 鐵頭)
    PX.rect(ctx, r.x + 6, r.y + 2, 11, 4, '#b6bcc2');
    PX.rect(ctx, r.x + 6, r.y + 2, 11, 1, '#d6dadf');
    PX.rect(ctx, r.x + 6, r.y + 2, 3, 4, '#8a9097');
    PX.rect(ctx, r.x + 11, r.y + 6, 2, 5, '#8d5a2b');
    // 鋸子
    PX.rect(ctx, r.x + 20, r.y + 4, 9, 2, '#c0c6cc');
    PX.rect(ctx, r.x + 20, r.y + 3, 2, 4, '#8d5a2b');
    for (let t = 0; t < 9; t += 2) PX.rect(ctx, r.x + 21 + t, r.y + 6, 1, 1, '#9aa0a6');
    // 木板與釘子
    PX.rect(ctx, r.x + r.w - 14, r.y + 3, 11, 3, '#c69a5e');
    PX.rect(ctx, r.x + r.w - 13, r.y + 4, 1, 1, '#5e3414');
    PX.rect(ctx, r.x + r.w - 6, r.y + 4, 1, 1, '#5e3414');
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

  // 把十六進位顏色變暗(求陰影色)
  darken(hex, f) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.round(((n >> 16) & 255) * f);
    const g = Math.round(((n >> 8) & 255) * f);
    const b = Math.round((n & 255) * f);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  },

  farmer(ctx, x, y, frame, face, pz = 1, colorOverride = null) {
    let colors = FARMER_COLORS;
    if (colorOverride && Object.keys(colorOverride).length) {
      colors = Object.assign({}, FARMER_COLORS, colorOverride);
      // 換裝後自動推導陰影色,避免帽影/衣影色塊不搭
      if (colorOverride.h) colors.H = PX.darken(colorOverride.h, 0.78);
      if (colorOverride.r) colors.R = PX.darken(colorOverride.r, 0.78);
    }
    PX.spriteFlip(ctx, frame ? SPR_FARMER_B : SPR_FARMER_A, x, y, colors, face, pz);
  },
  scarecrow(ctx, x, y) {
    PX.sprite(ctx, SPR_SCARECROW, x, y, SCARECROW_COLORS);
  },
  dog(ctx, x, y, frame) {
    PX.sprite(ctx, frame ? SPR_DOG_B : SPR_DOG_A, x, y, DOG_COLORS);
  },
  // 寵物:kind=種類(對應 PET_SPRITES),colors={o,b,e,k,d,w};frame 用來做 1px 跳動
  pet(ctx, x, y, kind, colors, face = 1, pz = 1, frame = 0) {
    const spr = PET_SPRITES[kind];
    if (!spr) return;
    PX.spriteFlip(ctx, spr, x, y - (frame ? pz : 0), colors, face, pz);
  },

  // ---- 環境裝飾:樹、灌木(畫在草地上,不碰農田) ----
  // sway:樹冠隨風的水平偏移(樹幹不動)
  tree(ctx, x, y, sway = 0) {
    const D = '#2f6b2a', M = '#3f8a36', Lc = '#5aa83c', H = '#79c855', T = '#7a4a22', Td = '#5e3414';
    PX.rect(ctx, x + 6, y + 18, 4, 8, T); // 樹幹(固定)
    PX.rect(ctx, x + 6, y + 18, 1, 8, Td);
    const sx = x + sway;
    PX.rect(ctx, sx + 2, y + 13, 12, 6, D); // 樹冠(下層,帶陰影)
    PX.rect(ctx, sx + 1, y + 8, 14, 7, M);
    PX.rect(ctx, sx + 3, y + 4, 10, 6, M);
    PX.rect(ctx, sx + 5, y + 1, 6, 5, Lc);
    PX.rect(ctx, sx + 4, y + 9, 4, 3, Lc); // 受光高光
    PX.rect(ctx, sx + 9, y + 11, 3, 3, Lc);
    PX.rect(ctx, sx + 6, y + 3, 3, 2, H);
    PX.rect(ctx, sx + 2, y + 16, 12, 3, D); // 樹冠底部陰影
  },

  // ---- 動態小生物 ----
  butterfly(ctx, x, y, wingUp, color) {
    x = Math.round(x); y = Math.round(y);
    PX.rect(ctx, x, y, 1, 3, '#3a2a1a'); // 身體
    if (wingUp) { // 翅膀張開
      PX.rect(ctx, x - 2, y, 2, 1, color);
      PX.rect(ctx, x - 2, y + 1, 1, 1, color);
      PX.rect(ctx, x + 1, y, 2, 1, color);
      PX.rect(ctx, x + 2, y + 1, 1, 1, color);
    } else { // 翅膀收合
      PX.rect(ctx, x - 1, y, 1, 2, color);
      PX.rect(ctx, x + 1, y, 1, 2, color);
    }
  },
  bird(ctx, x, y, flap) {
    x = Math.round(x); y = Math.round(y);
    const c = '#3f3a33';
    if (flap) { // 翅膀上揚
      PX.rect(ctx, x - 3, y - 1, 2, 1, c);
      PX.rect(ctx, x - 1, y, 1, 1, c);
      PX.rect(ctx, x + 1, y, 1, 1, c);
      PX.rect(ctx, x + 2, y - 1, 2, 1, c);
    } else { // 翅膀放平
      PX.rect(ctx, x - 4, y + 1, 2, 1, c);
      PX.rect(ctx, x - 2, y, 2, 1, c);
      PX.rect(ctx, x + 1, y, 2, 1, c);
      PX.rect(ctx, x + 3, y + 1, 2, 1, c);
    }
  },
  firefly(ctx, x, y, glow) {
    x = Math.round(x); y = Math.round(y);
    PX.rect(ctx, x, y, 1, 1, glow ? '#fff3a0' : '#cfa83a');
    if (glow) { // 發光時周圍微亮
      PX.rect(ctx, x - 1, y, 1, 1, '#9a8a30');
      PX.rect(ctx, x + 1, y, 1, 1, '#9a8a30');
      PX.rect(ctx, x, y - 1, 1, 1, '#9a8a30');
      PX.rect(ctx, x, y + 1, 1, 1, '#9a8a30');
    }
  },
  bush(ctx, x, y) {
    const D = '#2f6b2a', M = '#3f8a36', Lc = '#5aa83c';
    PX.rect(ctx, x + 1, y + 4, 12, 5, D);
    PX.rect(ctx, x, y + 2, 7, 5, M);
    PX.rect(ctx, x + 6, y + 1, 6, 6, M);
    PX.rect(ctx, x + 2, y + 3, 3, 2, Lc);
    PX.rect(ctx, x + 8, y + 2, 3, 2, Lc);
    PX.rect(ctx, x + 1, y + 8, 12, 1, D);
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
      // 彎月(柔邊 + 隕石坑)
      PX.rect(ctx, x + 1, y, 8, 10, '#f2efe4');
      PX.rect(ctx, x, y + 1, 10, 8, '#f2efe4');
      PX.rect(ctx, x + 1, y + 1, 8, 1, '#fffdf5');
      PX.rect(ctx, x + 4, y, 7, 10, '#1a2050'); // 月缺
      PX.rect(ctx, x + 3, y + 1, 7, 8, '#16193f');
      PX.rect(ctx, x + 2, y + 3, 1, 1, '#d8d3c2'); // 坑
      PX.rect(ctx, x + 1, y + 6, 2, 1, '#d8d3c2');
    } else {
      const c = phase === 'day' ? '#ffd23f' : '#ff9a3f';
      const glow = phase === 'day' ? '#ffe57a' : '#ffc06a';
      // 光暈
      PX.rect(ctx, x, y + 1, 10, 8, glow + '');
      PX.rect(ctx, x + 1, y, 8, 10, glow);
      // 本體
      PX.rect(ctx, x + 1, y + 1, 8, 8, c);
      PX.rect(ctx, x + 2, y + 2, 3, 3, '#fff0a8'); // 高光
      // 光芒
      PX.rect(ctx, x + 4, y - 3, 2, 2, c);
      PX.rect(ctx, x + 4, y + 11, 2, 2, c);
      PX.rect(ctx, x - 3, y + 4, 2, 2, c);
      PX.rect(ctx, x + 11, y + 4, 2, 2, c);
    }
  },
  // 夜裡房子的窗戶亮燈(對齊新窗戶位置)
  houseGlow(ctx, r) {
    const wx = r.x + 9, wy = r.y + 30;
    PX.rect(ctx, wx + 1, wy + 1, 14, 12, '#ffe9a0');
    PX.rect(ctx, wx + 1, wy + 1, 14, 4, '#fff3c4'); // 上半更亮
    PX.rect(ctx, wx + 7, wy + 1, 2, 12, '#9a7b3a');
    PX.rect(ctx, wx + 1, wy + 6, 14, 2, '#9a7b3a');
  },

  indoor(ctx, L, day) {
    const { w, h } = L.world;
    // 地板(木板,帶交錯木紋與板縫陰影)
    PX.rect(ctx, 0, 40, w, h - 40, '#c79c64');
    for (let y = 41; y < h; y += 13) {
      PX.rect(ctx, 0, y, w, 13, ((y / 13) | 0) % 2 ? '#c79c64' : '#bd9258');
      PX.rect(ctx, 0, y + 12, w, 1, '#a07c46');
      for (let x = (((y / 13) | 0) % 2) * 36; x < w; x += 72) PX.rect(ctx, x, y, 1, 12, '#a07c46');
    }
    // 牆(上方壁紙 + 護牆板)
    PX.rect(ctx, 0, 0, w, 40, '#ecd9ba');
    PX.rect(ctx, 0, 0, w, 6, '#e1caa6'); // 頂飾
    PX.rect(ctx, 0, 30, w, 4, '#cdb288'); // 護牆板上緣
    PX.rect(ctx, 0, 34, w, 6, '#d8bf95');
    PX.rect(ctx, 0, 39, w, 2, '#9a7b54'); // 牆腳線
    // 窗戶(玻璃隨日夜變色:白天藍天 / 黃昏橘 / 夜晚深藍夜空)
    const dark = day ? day.dark : 0, glow = day ? day.glow : 0;
    const night = dark > 0.6;
    const glass = night ? '#1c2450' : (glow > 0.2 ? '#ff9a52' : '#a9deff');
    PX.rect(ctx, 108, 4, 40, 28, '#6d4c2f'); // 窗框
    PX.rect(ctx, 110, 6, 36, 24, glass);
    if (night) { // 夜空:彎月 + 星星
      PX.rect(ctx, 116, 9, 5, 5, '#f2efe4');
      PX.rect(ctx, 118, 9, 3, 5, '#1c2450');
      PX.rect(ctx, 134, 11, 1, 1, '#fffdf5');
      PX.rect(ctx, 140, 22, 1, 1, '#fffdf5');
      PX.rect(ctx, 122, 25, 1, 1, '#fffdf5');
      PX.rect(ctx, 113, 20, 1, 1, '#cfd2e8');
    } else { // 白天/黃昏的玻璃反光
      PX.rect(ctx, 110, 6, 18, 12, glow > 0.2 ? '#ffc28a' : '#c4e9ff');
    }
    PX.rect(ctx, 126, 6, 3, 24, '#6d4c2f'); // 十字櫺
    PX.rect(ctx, 110, 16, 36, 3, '#6d4c2f');
    PX.rect(ctx, 106, 2, 44, 3, '#8a5a2c'); // 窗簾桿
    PX.rect(ctx, 106, 4, 8, 26, '#d9694f'); // 左窗簾
    PX.rect(ctx, 106, 4, 3, 26, '#c0392b');
    PX.rect(ctx, 142, 4, 8, 26, '#d9694f'); // 右窗簾
    PX.rect(ctx, 147, 4, 3, 26, '#c0392b');
    // 牆上掛畫(小農場風景)
    PX.rect(ctx, 30, 10, 22, 16, '#8a5a2c');
    PX.rect(ctx, 32, 12, 18, 12, '#bfe3f5');
    PX.rect(ctx, 32, 19, 18, 5, '#7ec84e'); // 草地
    PX.rect(ctx, 36, 15, 4, 4, '#ffd23f'); // 太陽
    // 地毯(同心 + 花紋)
    PX.rect(ctx, 94, 108, 68, 44, '#c0563a');
    PX.rect(ctx, 98, 112, 60, 36, '#d97f4a');
    PX.rect(ctx, 104, 118, 48, 24, '#e89a64');
    PX.rect(ctx, 122, 126, 12, 8, '#c0563a');

    // ---- 廚房:爐灶(不鏽鋼 + 旋鈕 + 烤箱玻璃透火光) ----
    const s = L.stove;
    PX.rect(ctx, s.x, s.y, s.w, s.h, '#aeb4ba');
    PX.rect(ctx, s.x, s.y, 2, s.h, '#c8cdd2'); // 受光邊
    PX.rect(ctx, s.x + s.w - 2, s.y, 2, s.h, '#878d93');
    PX.rect(ctx, s.x, s.y, s.w, 8, '#33373b'); // 爐面
    PX.rect(ctx, s.x + 6, s.y + 2, 12, 4, '#111'); // 左爐口
    PX.rect(ctx, s.x + 9, s.y + 3, 6, 2, '#ff7a2f'); // 火光
    PX.rect(ctx, s.x + 28, s.y + 2, 12, 4, '#111'); // 右爐口
    PX.rect(ctx, s.x + 10, s.y + 9, 2, 2, '#5d6166'); // 旋鈕
    PX.rect(ctx, s.x + 16, s.y + 9, 2, 2, '#5d6166');
    PX.rect(ctx, s.x + 8, s.y + 14, s.w - 16, 16, '#3f4347'); // 烤箱門
    PX.rect(ctx, s.x + 10, s.y + 16, s.w - 20, 9, '#ff8c3a'); // 烤箱玻璃(火光)
    PX.rect(ctx, s.x + 10, s.y + 16, s.w - 20, 3, '#ffd27a');
    PX.rect(ctx, s.x + 8, s.y + 12, s.w - 16, 2, '#5d6166'); // 把手
    // 鍋子 + 蒸氣
    PX.rect(ctx, s.x + 4, s.y - 6, 16, 2, '#777');
    PX.rect(ctx, s.x + 6, s.y - 6, 12, 6, '#4a4a4a');
    PX.rect(ctx, s.x + 6, s.y - 6, 12, 2, '#5e5e5e');
    PX.rect(ctx, s.x + 11, s.y - 7, 2, 1, '#999'); // 鍋鈕
    PX.rect(ctx, s.x + 9, s.y - 12, 2, 4, '#ffffff77');
    PX.rect(ctx, s.x + 13, s.y - 15, 2, 5, '#ffffff55');
    PX.rect(ctx, s.x + 8, s.y - 16, 2, 4, '#ffffff44');
    // 流理台 + 砧板 + 蔬果
    const ct = s.x + s.w + 4;
    PX.rect(ctx, ct, s.y + 6, 30, s.h - 6, '#b08148');
    PX.rect(ctx, ct, s.y + 6, 30, 4, '#cf9c5d');
    PX.rect(ctx, ct, s.y + 6, 2, s.h - 6, '#cf9c5d');
    PX.rect(ctx, ct + 6, s.y + 14, 14, 9, '#ead9bf'); // 砧板
    PX.rect(ctx, ct + 9, s.y + 16, 4, 4, '#ff4f3f'); // 番茄
    PX.rect(ctx, ct + 14, s.y + 17, 3, 3, '#7ec84e'); // 菜
    PX.rect(ctx, ct + 22, s.y + 11, 3, 4, '#5aa83c'); // 掛著的菜

    // ---- 床(木床頭板 + 枕頭 + 棉被摺邊) ----
    const b = L.bed;
    PX.rect(ctx, b.x - 3, b.y - 4, b.w + 6, 8, '#7a4a22'); // 床頭板
    PX.rect(ctx, b.x - 3, b.y - 4, b.w + 6, 2, '#9a6e3a');
    PX.rect(ctx, b.x - 2, b.y + 2, b.w + 4, b.h, '#5e3414'); // 床框
    PX.rect(ctx, b.x, b.y + 2, b.w, b.h - 4, '#f7f7f7'); // 床墊
    PX.rect(ctx, b.x, b.y + 2, b.w, b.h - 4, '#f7f7f7');
    PX.rect(ctx, b.x + 5, b.y + 5, b.w - 10, 13, '#ffffff'); // 枕頭
    PX.rect(ctx, b.x + 5, b.y + 5, b.w - 10, 3, '#e4e4e4');
    PX.rect(ctx, b.x + 5, b.y + 16, b.w - 10, 1, '#d4d4d4');
    PX.rect(ctx, b.x, b.y + 24, b.w, b.h - 26, '#4a7fd9'); // 棉被
    PX.rect(ctx, b.x, b.y + 24, b.w, 5, '#6f9ce8'); // 摺邊
    PX.rect(ctx, b.x, b.y + 24, b.w, 2, '#8fb4f0');
    for (let j = b.y + 34; j < b.y + b.h - 4; j += 9) PX.rect(ctx, b.x + 3, j, b.w - 6, 2, '#3d6cc0');
    PX.rect(ctx, b.x + b.w - 4, b.y + 24, 2, b.h - 26, '#3d6cc0'); // 右側陰影

    // ---- 門口地墊(WELCOME 風) ----
    const d = L.door;
    PX.rect(ctx, d.x, d.y, d.w, d.h, '#7a5c43');
    PX.rect(ctx, d.x + 2, d.y + 2, d.w - 4, d.h - 4, '#a9836f');
    PX.rect(ctx, d.x + 4, d.y + 4, d.w - 8, d.h - 8, '#8d6e58');
    PX.rect(ctx, d.x + 6, d.y + d.h / 2 - 1, d.w - 12, 2, '#c9a98c');
  },
};
