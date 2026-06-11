'use strict';
/* ================= 悠閒農場 — 掛機種田遊戲 ================= */

// ---- 作物資料:grow=成熟所需秒數, fresh=成熟後保鮮秒數(之後腐爛), seed=種子價, sell=售價 ----
const CROPS = {
  potato:     { name: '馬鈴薯', emoji: '🥔', grow: 45,  fresh: 240, seed: 8,   sell: 14 },
  carrot:     { name: '胡蘿蔔', emoji: '🥕', grow: 75,  fresh: 240, seed: 18,  sell: 34 },
  wheat:      { name: '小麥',   emoji: '🌾', grow: 100, fresh: 360, seed: 25,  sell: 50 },
  tomato:     { name: '番茄',   emoji: '🍅', grow: 150, fresh: 200, seed: 45,  sell: 96 },
  strawberry: { name: '草莓',   emoji: '🍓', grow: 210, fresh: 180, seed: 80,  sell: 185 },
  pumpkin:    { name: '南瓜',   emoji: '🎃', grow: 300, fresh: 420, seed: 130, sell: 310 },
};

// ---- 食譜:need=所需作物, effect=吃下後效果 ----
const RECIPES = {
  baked_potato: { name: '烤馬鈴薯', emoji: '🍠', need: { potato: 2 },
    desc: '體力 +30', effect: { stamina: 30 } },
  bread: { name: '麵包', emoji: '🍞', need: { wheat: 3 },
    desc: '體力 +50', effect: { stamina: 50 } },
  veggie_soup: { name: '蔬菜濃湯', emoji: '🍲', need: { potato: 1, carrot: 2 },
    desc: '生長速度 +30%,持續 3 分鐘', effect: { buff: { type: 'grow', mult: 1.3, dur: 180, name: '生長加速', icon: '🌱' } } },
  tomato_soup: { name: '番茄湯', emoji: '🥫', need: { tomato: 2 },
    desc: '行動體力消耗減半,持續 3 分鐘', effect: { buff: { type: 'save', mult: 0.5, dur: 180, name: '省力', icon: '💪' } } },
  pumpkin_pie: { name: '南瓜派', emoji: '🥧', need: { pumpkin: 1, wheat: 2 },
    desc: '作物售價 +50%,持續 3 分鐘', effect: { buff: { type: 'sell', mult: 1.5, dur: 180, name: '高價出售', icon: '💰' } } },
  strawberry_cake: { name: '草莓蛋糕', emoji: '🍰', need: { strawberry: 2, wheat: 2 },
    desc: '體力全滿 + 生長速度 +50%,持續 2 分鐘', effect: { stamina: 999, buff: { type: 'grow', mult: 1.5, dur: 120, name: '生長爆發', icon: '✨' } } },
};

// ---- 製作項目 ----
const BACKPACK_LEVELS = [ // 基礎容量 20
  { cost: 100, wheat: 0,  cap: 40,  label: '小背包' },
  { cost: 300, wheat: 5,  cap: 70,  label: '大背包' },
  { cost: 800, wheat: 15, cap: 120, label: '冒險家背包' },
];
const PLOT_COUNT = 12;
const PLOT_COSTS = [0, 0, 0, 0, 50, 100, 200, 350, 550, 800, 1200, 1700];
const STAMINA_COST = { plant: 3, harvest: 2, clear: 2, cook: 5, sickle: 5 };

// ================= 狀態 =================
function defaultState() {
  return {
    coins: 0,
    stamina: 100, maxStamina: 100,
    seeds: { potato: 1 },   // 一開始只有一顆馬鈴薯種子
    crops: {},
    foods: {},
    capacity: 20, backpackLv: 0,
    tools: { sickle: false, watering: false },
    buffs: [], // {type, mult, until, name, icon}
    plots: Array.from({ length: PLOT_COUNT }, (_, i) => ({
      unlocked: i < 4, crop: null, progress: 0, warned: false, rotNotified: false,
    })),
  };
}
let S = defaultState();
const sleep = { active: false, idle: false, start: 0 };

// ================= 工具函式 =================
const $ = (id) => document.getElementById(id);
const fmtTime = (sec) => {
  sec = Math.max(0, Math.ceil(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return m > 0 ? `${m}分${String(s).padStart(2, '0')}秒` : `${s}秒`;
};
function toast(msg, type = '') {
  const box = $('toasts');
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => el.remove(), 5000);
  // 掛機/睡覺時也顯示在睡覺畫面上
  if (sleep.active && (type === 'warn' || type === 'good')) {
    const w = document.createElement('div');
    w.className = 'sleep-warning';
    w.textContent = msg;
    const sw = $('sleepWarnings');
    sw.appendChild(w);
    while (sw.children.length > 4) sw.firstChild.remove();
    setTimeout(() => w.remove(), 60000);
  }
}
function buffMult(type) {
  let m = 1;
  for (const b of S.buffs) if (b.type === type) m *= b.mult;
  return m;
}
function idleMult() {
  if (!sleep.idle) return 1;
  const sec = (Date.now() - sleep.start) / 1000;
  return Math.min(10, 2 + Math.floor(sec / 30)); // 2x 起跳,每 30 秒 +1,最高 10x
}
// 目前的生長速度倍率(訪客以房主為準)
function speedMult() {
  if (MP.isGuest()) return MP.hostSpeed;
  return (S.tools.watering ? 1.2 : 1) * buffMult('grow') * idleMult();
}
function bagUsed() {
  let n = 0;
  for (const k in S.crops) n += S.crops[k];
  for (const k in S.foods) n += S.foods[k];
  return n;
}
function bagRoom() { return S.capacity - bagUsed(); }
function spendStamina(cost) {
  cost = Math.ceil(cost * buffMult('save'));
  if (S.stamina < cost) {
    toast('😫 體力不足!去睡一覺或吃點東西吧', 'warn');
    return false;
  }
  S.stamina -= cost;
  return true;
}
function plotStage(p) {
  if (!p.crop) return 'empty';
  const c = CROPS[p.crop];
  if (p.progress < c.grow) return 'growing';
  if (p.progress < c.grow + c.fresh) return 'mature';
  return 'rotten';
}

// ================= 操作(單機直接執行;訪客送給房主) =================
function doAction(a) {
  if (MP.isGuest()) {
    // 體力由各玩家自己負擔
    const cost = STAMINA_COST[a.type] || 0;
    if (cost && !spendStamina(cost)) return;
    if (a.type === 'eat') { // 吃東西的體力效果套用在自己身上
      const r = RECIPES[a.food];
      if (r && r.effect.stamina) S.stamina = Math.min(S.maxStamina, S.stamina + r.effect.stamina);
    }
    a.by = MP.myName;
    MP.sendAction(a);
    return;
  }
  execAction(a, true);
  MP.broadcastState();
  saveGame();
}

// local=true 表示是本機玩家(要扣自己的體力);false 表示是訪客送來的操作
function execAction(a, local) {
  const who = local ? '' : (a.by || '隊友');
  const cost = STAMINA_COST[a.type] || 0;

  switch (a.type) {
    case 'plant': {
      const p = S.plots[a.i];
      const c = CROPS[a.crop];
      if (!p || !p.unlocked || p.crop || !c) return;
      if ((S.seeds[a.crop] || 0) < 1) { if (local) toast('沒有這種種子了!', 'warn'); return; }
      if (local && !spendStamina(cost)) return;
      S.seeds[a.crop]--;
      Object.assign(p, { crop: a.crop, progress: 0, warned: false, rotNotified: false });
      if (!local) toast(`🌱 ${who} 種下了${c.name}`);
      break;
    }
    case 'harvest': {
      const p = S.plots[a.i];
      if (!p || plotStage(p) !== 'mature') return;
      if (bagRoom() < 1) { if (local) toast('🎒 背包滿了!先去賣掉一些作物吧', 'warn'); return; }
      if (local && !spendStamina(cost)) return;
      const c = CROPS[p.crop];
      const got = Math.min(bagRoom(), 2 + (Math.random() < 0.15 ? 1 : 0));
      S.crops[p.crop] = (S.crops[p.crop] || 0) + got;
      toast(`${c.emoji} ${who}採收了 ${c.name} ×${got}`, 'good');
      Object.assign(p, { crop: null, progress: 0, warned: false, rotNotified: false });
      break;
    }
    case 'sickle': { // 鐮刀:一鍵採收全部成熟作物
      if (!S.tools.sickle) return;
      if (local && !spendStamina(cost)) return;
      let total = 0;
      for (const p of S.plots) {
        if (plotStage(p) !== 'mature' || bagRoom() < 1) continue;
        const got = Math.min(bagRoom(), 2 + (Math.random() < 0.15 ? 1 : 0));
        S.crops[p.crop] = (S.crops[p.crop] || 0) + got;
        total += got;
        Object.assign(p, { crop: null, progress: 0, warned: false, rotNotified: false });
      }
      toast(total > 0 ? `🌾 ${who}揮舞鐮刀,一口氣採收了 ${total} 個作物!` : '沒有可採收的作物', total > 0 ? 'good' : '');
      break;
    }
    case 'clear': { // 鏟除腐爛的作物
      const p = S.plots[a.i];
      if (!p || plotStage(p) !== 'rotten') return;
      if (local && !spendStamina(cost)) return;
      Object.assign(p, { crop: null, progress: 0, warned: false, rotNotified: false });
      toast('🧹 清掉了腐爛的作物');
      break;
    }
    case 'unlock': {
      const p = S.plots[a.i];
      const price = PLOT_COSTS[a.i];
      if (!p || p.unlocked) return;
      if (S.coins < price) { if (local) toast('金幣不夠!', 'warn'); return; }
      S.coins -= price;
      p.unlocked = true;
      toast(`🪓 ${who}開墾了新田地!`, 'good');
      break;
    }
    case 'buySeed': {
      const c = CROPS[a.crop];
      const n = a.n || 1;
      if (!c || S.coins < c.seed * n) { if (local) toast('金幣不夠!', 'warn'); return; }
      S.coins -= c.seed * n;
      S.seeds[a.crop] = (S.seeds[a.crop] || 0) + n;
      if (local) toast(`已購買 ${c.name}種子 ×${n}`);
      break;
    }
    case 'sellCrop': {
      const c = CROPS[a.crop];
      const have = S.crops[a.crop] || 0;
      const n = Math.min(a.n === 'all' ? have : (a.n || 1), have);
      if (!c || n < 1) return;
      const gain = Math.floor(c.sell * n * buffMult('sell'));
      S.crops[a.crop] -= n;
      if (S.crops[a.crop] <= 0) delete S.crops[a.crop];
      S.coins += gain;
      toast(`💰 ${who}賣出 ${c.name} ×${n},賺了 ${gain} 金幣!`, 'good');
      break;
    }
    case 'cook': {
      const r = RECIPES[a.recipe];
      if (!r) return;
      for (const k in r.need) if ((S.crops[k] || 0) < r.need[k]) { if (local) toast('食材不夠!', 'warn'); return; }
      if (bagRoom() + Object.values(r.need).reduce((x, y) => x + y, 0) < 1) { if (local) toast('🎒 背包滿了!', 'warn'); return; }
      if (local && !spendStamina(cost)) return;
      for (const k in r.need) {
        S.crops[k] -= r.need[k];
        if (S.crops[k] <= 0) delete S.crops[k];
      }
      S.foods[a.recipe] = (S.foods[a.recipe] || 0) + 1;
      toast(`${r.emoji} ${who}做好了${r.name}!`, 'good');
      break;
    }
    case 'eat': {
      const r = RECIPES[a.food];
      if (!r || (S.foods[a.food] || 0) < 1) return;
      S.foods[a.food]--;
      if (S.foods[a.food] <= 0) delete S.foods[a.food];
      const e = r.effect;
      if (e.stamina && local) S.stamina = Math.min(S.maxStamina, S.stamina + e.stamina);
      if (e.buff) {
        // 同類 buff 直接刷新
        S.buffs = S.buffs.filter(b => !(b.type === e.buff.type && b.name === e.buff.name));
        S.buffs.push({ ...e.buff, until: Date.now() + e.buff.dur * 1000 });
        if (MP.connected()) MP.notifyAll(`${r.emoji} ${local ? MP.myName : who} 吃了${r.name},全隊獲得「${e.buff.name}」效果!`);
      }
      toast(`${r.emoji} ${local ? '' : who}吃了${r.name}!${r.desc}`, 'good');
      break;
    }
    case 'craft': {
      if (a.item === 'backpack') {
        const lv = BACKPACK_LEVELS[S.backpackLv];
        if (!lv) return;
        if (S.coins < lv.cost || (S.crops.wheat || 0) < lv.wheat) { if (local) toast('材料不夠!', 'warn'); return; }
        S.coins -= lv.cost;
        if (lv.wheat) { S.crops.wheat -= lv.wheat; if (S.crops.wheat <= 0) delete S.crops.wheat; }
        S.backpackLv++;
        S.capacity = lv.cap;
        toast(`🎒 ${who}製作了${lv.label}!容量提升到 ${lv.cap}`, 'good');
      } else if (a.item === 'sickle') {
        if (S.tools.sickle) return;
        if (S.coins < 250 || (S.crops.wheat || 0) < 5) { if (local) toast('材料不夠!', 'warn'); return; }
        S.coins -= 250;
        S.crops.wheat -= 5; if (S.crops.wheat <= 0) delete S.crops.wheat;
        S.tools.sickle = true;
        toast(`⚒️ ${who}製作了鐮刀!可以一鍵採收整片田了`, 'good');
      } else if (a.item === 'watering') {
        if (S.tools.watering) return;
        if (S.coins < 150) { if (local) toast('金幣不夠!', 'warn'); return; }
        S.coins -= 150;
        S.tools.watering = true;
        toast(`🚿 ${who}製作了灑水壺!作物永久生長 +20%`, 'good');
      }
      break;
    }
  }
}

// ================= 聯機快照 =================
const SYNC_KEYS = ['coins', 'seeds', 'crops', 'foods', 'capacity', 'backpackLv', 'tools', 'buffs', 'plots'];
function makeSnapshot() {
  const s = { hostSpeed: speedMult() };
  for (const k of SYNC_KEYS) s[k] = S[k];
  return s;
}
function applySnapshot(s) {
  MP.hostSpeed = s.hostSpeed || 1;
  for (const k of SYNC_KEYS) if (s[k] !== undefined) S[k] = s[k];
  render();
}

// ================= 遊戲主迴圈 =================
let lastTick = Date.now();
function tick() {
  const now = Date.now();
  const dt = Math.min(5, (now - lastTick) / 1000);
  lastTick = now;

  // buff 過期
  S.buffs = S.buffs.filter(b => b.until > now);

  // 體力回復:睡覺時快,平常慢
  const regen = sleep.active ? 2.5 : 0.12;
  S.stamina = Math.min(S.maxStamina, S.stamina + regen * dt);

  // 推進作物生長(房主/單機權威;訪客用房主倍率平滑插值)
  const mult = speedMult();
  for (const p of S.plots) {
    if (!p.crop) continue;
    p.progress += dt * mult;
    const c = CROPS[p.crop];
    const stage = plotStage(p);
    if (!MP.isGuest()) {
      // 腐爛前一分鐘提醒(按實際時間估算)
      if (stage === 'mature' && !p.warned) {
        const realLeft = (c.grow + c.fresh - p.progress) / mult;
        if (realLeft <= 60) {
          p.warned = true;
          const msg = `⚠️ 你的${c.name}將在一分鐘後腐爛!快去採收!`;
          toast(msg, 'warn');
          if (MP.isHost()) MP.notifyAll(msg);
        }
      }
      if (stage === 'rotten' && !p.rotNotified) {
        p.rotNotified = true;
        toast(`🤢 ${c.name}腐爛了…點擊田地清理它`, 'warn');
      }
    }
  }

  render();
}
setInterval(tick, 500);

// ================= 畫面渲染 =================
let activeTab = 'farm';

function render() {
  renderTop();
  if (activeTab === 'farm') renderFarm();
  else if (activeTab === 'house') renderHouse();
  else if (activeTab === 'shop') renderShop();
  else if (activeTab === 'craft') renderCraft();
  if (sleep.active) renderSleep();
}

function renderTop() {
  $('coins').textContent = Math.floor(S.coins);
  $('staminaText').textContent = Math.floor(S.stamina);
  $('staminaFill').style.width = (S.stamina / S.maxStamina * 100) + '%';
  $('capText').textContent = `${bagUsed()}/${S.capacity}`;
  const now = Date.now();
  $('buffBar').innerHTML = S.buffs.map(b =>
    `<span class="buff-chip">${b.icon} ${b.name} ${fmtTime((b.until - now) / 1000)}</span>`
  ).join('');
}

function renderFarm() {
  const mult = speedMult();
  // 上方動作列
  let actions = '';
  if (S.tools.sickle) actions += `<button class="act gold" onclick="doAction({type:'sickle'})">⚒️ 鐮刀一鍵採收</button>`;
  if (mult > 1.01) actions += `<span class="buff-chip">⏩ 目前生長速度 ×${mult.toFixed(1)}</span>`;
  $('farmActions').innerHTML = actions;

  $('farmGrid').innerHTML = S.plots.map((p, i) => {
    if (!p.unlocked) {
      return `<div class="plot locked" onclick="onPlotClick(${i})">
        <div class="emoji">🔒</div><div class="label">未開墾</div>
        <div class="sub">💰 ${PLOT_COSTS[i]} 開墾</div></div>`;
    }
    const stage = plotStage(p);
    if (stage === 'empty') {
      return `<div class="plot empty" onclick="onPlotClick(${i})">
        <div class="emoji">🟫</div><div class="label">空地</div><div class="sub">點擊播種</div></div>`;
    }
    const c = CROPS[p.crop];
    if (stage === 'growing') {
      const pct = Math.min(100, p.progress / c.grow * 100);
      const left = (c.grow - p.progress) / mult;
      return `<div class="plot growing" onclick="onPlotClick(${i})">
        <div class="emoji">${pct < 50 ? '🌱' : '🌿'}</div>
        <div class="label">${c.name}</div>
        <div class="pbar"><div class="fill" style="width:${pct}%"></div></div>
        <div class="sub">${fmtTime(left)}後成熟</div></div>`;
    }
    if (stage === 'mature') {
      const rotLeft = (c.grow + c.fresh - p.progress) / mult;
      const danger = rotLeft <= 60;
      return `<div class="plot mature" onclick="onPlotClick(${i})">
        <div class="emoji">${c.emoji}</div>
        <div class="label">${c.name} ✅</div>
        <div class="sub ${danger ? 'danger' : ''}">${danger ? '⚠️ ' : ''}${fmtTime(rotLeft)}後腐爛</div></div>`;
    }
    return `<div class="plot rotten" onclick="onPlotClick(${i})">
      <div class="emoji">🤢</div><div class="label">${c.name}腐爛了</div><div class="sub">點擊清理</div></div>`;
  }).join('');
}

function onPlotClick(i) {
  const p = S.plots[i];
  if (!p.unlocked) { doAction({ type: 'unlock', i }); return; }
  const stage = plotStage(p);
  if (stage === 'empty') openSeedPicker(i);
  else if (stage === 'mature') doAction({ type: 'harvest', i });
  else if (stage === 'rotten') doAction({ type: 'clear', i });
  else toast('🌱 還在生長中,再等等吧…');
}

// ---- 種子選擇 ----
let pickerPlot = -1;
function openSeedPicker(i) {
  pickerPlot = i;
  const rows = Object.entries(S.seeds).filter(([, n]) => n > 0).map(([k, n]) => {
    const c = CROPS[k];
    return `<div class="row"><span class="icon">${c.emoji}</span>
      <div class="info"><b>${c.name}種子 ×${n}</b><small>成熟需 ${fmtTime(c.grow)}</small></div>
      <button class="act" onclick="plantSeed('${k}')">種下</button></div>`;
  }).join('');
  $('seedPickerList').innerHTML = rows || `<p class="hint">沒有任何種子!去「🛒 商人」那裡買一些吧。</p>`;
  $('seedPicker').classList.remove('hidden');
}
function plantSeed(crop) {
  doAction({ type: 'plant', i: pickerPlot, crop });
  closeSeedPicker();
}
function closeSeedPicker() { $('seedPicker').classList.add('hidden'); }

// ---- 房子(廚房 + 床) ----
function renderHouse() {
  $('kitchenRecipes').innerHTML = Object.entries(RECIPES).map(([k, r]) => {
    const needTxt = Object.entries(r.need).map(([c, n]) =>
      `${CROPS[c].emoji}×${n}(有${S.crops[c] || 0})`).join(' ');
    const can = Object.entries(r.need).every(([c, n]) => (S.crops[c] || 0) >= n);
    return `<div class="row"><span class="icon">${r.emoji}</span>
      <div class="info"><b>${r.name}</b><small>${r.desc}<br>需要:${needTxt}</small></div>
      <button class="act" ${can ? '' : 'disabled'} onclick="doAction({type:'cook',recipe:'${k}'})">烹飪</button></div>`;
  }).join('');

  const foods = Object.entries(S.foods).filter(([, n]) => n > 0);
  $('foodList').innerHTML = foods.length ? foods.map(([k, n]) => {
    const r = RECIPES[k];
    return `<div class="row"><span class="icon">${r.emoji}</span>
      <div class="info"><b>${r.name} ×${n}</b><small>${r.desc}</small></div>
      <button class="act gold" onclick="doAction({type:'eat',food:'${k}'})">吃掉</button></div>`;
  }).join('') : `<p class="hint">還沒有食物,先做點飯吧!</p>`;
}

// ---- 商店 ----
function renderShop() {
  const sellMult = buffMult('sell');
  const crops = Object.entries(S.crops).filter(([, n]) => n > 0);
  $('sellList').innerHTML = crops.length ? crops.map(([k, n]) => {
    const c = CROPS[k];
    const price = Math.floor(c.sell * sellMult);
    return `<div class="row"><span class="icon">${c.emoji}</span>
      <div class="info"><b>${c.name} ×${n}</b><small>單價 💰${price}${sellMult > 1 ? '(加成中!)' : ''}</small></div>
      <button class="act" onclick="doAction({type:'sellCrop',crop:'${k}',n:1})">賣 1 個</button>
      <button class="act gold" onclick="doAction({type:'sellCrop',crop:'${k}',n:'all'})">全部賣出</button></div>`;
  }).join('') : `<p class="hint">背包裡沒有作物。去田裡採收一些吧!</p>`;

  $('seedShop').innerHTML = Object.entries(CROPS).map(([k, c]) => {
    return `<div class="row"><span class="icon">${c.emoji}</span>
      <div class="info"><b>${c.name}種子 💰${c.seed}</b>
      <small>成熟 ${fmtTime(c.grow)}|售價 💰${c.sell}|持有 ${S.seeds[k] || 0}</small></div>
      <button class="act" ${S.coins >= c.seed ? '' : 'disabled'} onclick="doAction({type:'buySeed',crop:'${k}',n:1})">買 1</button>
      <button class="act" ${S.coins >= c.seed * 5 ? '' : 'disabled'} onclick="doAction({type:'buySeed',crop:'${k}',n:5})">買 5</button></div>`;
  }).join('');
}

// ---- 製作 ----
function renderCraft() {
  let html = '';
  const lv = BACKPACK_LEVELS[S.backpackLv];
  if (lv) {
    const can = S.coins >= lv.cost && (S.crops.wheat || 0) >= lv.wheat;
    html += `<div class="row"><span class="icon">🎒</span>
      <div class="info"><b>${lv.label}(容量 ${S.capacity} → ${lv.cap})</b>
      <small>需要:💰${lv.cost}${lv.wheat ? ` + 🌾小麥×${lv.wheat}(有${S.crops.wheat || 0})` : ''}</small></div>
      <button class="act" ${can ? '' : 'disabled'} onclick="doAction({type:'craft',item:'backpack'})">製作</button></div>`;
  } else {
    html += `<div class="row"><span class="icon">🎒</span><div class="info"><b>背包已滿級(容量 ${S.capacity})</b></div></div>`;
  }
  html += S.tools.sickle
    ? `<div class="row"><span class="icon">⚒️</span><div class="info"><b>鐮刀(已擁有)</b><small>農場頁面可一鍵採收所有成熟作物</small></div></div>`
    : `<div class="row"><span class="icon">⚒️</span>
      <div class="info"><b>鐮刀</b><small>一鍵採收整片田!需要:💰250 + 🌾小麥×5(有${S.crops.wheat || 0})</small></div>
      <button class="act" ${S.coins >= 250 && (S.crops.wheat || 0) >= 5 ? '' : 'disabled'} onclick="doAction({type:'craft',item:'sickle'})">製作</button></div>`;
  html += S.tools.watering
    ? `<div class="row"><span class="icon">🚿</span><div class="info"><b>灑水壺(已擁有)</b><small>作物永久生長 +20%</small></div></div>`
    : `<div class="row"><span class="icon">🚿</span>
      <div class="info"><b>灑水壺</b><small>作物永久生長 +20%!需要:💰150</small></div>
      <button class="act" ${S.coins >= 150 ? '' : 'disabled'} onclick="doAction({type:'craft',item:'watering'})">製作</button></div>`;
  $('craftList').innerHTML = html;
}

// ---- 聯機 ----
function renderCoop() {
  const connected = MP.connected();
  $('coopPanel').classList.toggle('hidden', connected);
  $('coopStatus').classList.toggle('hidden', !connected);
  if (connected) {
    $('roomCodeShow').textContent = MP.code;
    $('playerListBox').innerHTML = MP.players.map(p =>
      `<span class="player-chip">${p.host ? '👑' : '🧑‍🌾'} ${p.name}</span>`).join('');
  }
}

// ---- 睡覺 / 掛機 ----
function goToBed() {
  sleep.active = true;
  sleep.idle = false;
  sleep.start = Date.now();
  $('sleepWarnings').innerHTML = '';
  $('sleepOverlay').classList.remove('hidden');
  renderSleep();
}
function startIdle() {
  sleep.idle = true;
  sleep.start = Date.now();
  toast('⏩ 開始掛機!睡得越久,植物長得越快', 'good');
  renderSleep();
}
function wakeUp() {
  const slept = (Date.now() - sleep.start) / 1000;
  sleep.active = false;
  sleep.idle = false;
  $('sleepOverlay').classList.add('hidden');
  toast(`🌅 早安!你睡了 ${fmtTime(slept)},體力恢復到 ${Math.floor(S.stamina)}`, 'good');
  saveGame();
}
function renderSleep() {
  const sec = (Date.now() - sleep.start) / 1000;
  $('idleBtn').classList.toggle('hidden', sleep.idle);
  if (sleep.idle) {
    const m = idleMult();
    const nextIn = m >= 10 ? null : 30 - Math.floor(sec % 30);
    const growing = S.plots.filter(p => p.crop && plotStage(p) === 'growing').length;
    const matureN = S.plots.filter(p => p.crop && plotStage(p) === 'mature').length;
    $('sleepEmoji').textContent = '💤';
    $('sleepTitle').textContent = '掛機中…';
    $('sleepInfo').innerHTML =
      `已掛機 ${fmtTime(sec)}<br><span class="mult">⏩ 生長速度 ×${m}</span><br>` +
      (nextIn ? `${nextIn} 秒後提升到 ×${m + 1}<br>` : '已達最高速度!<br>') +
      `🌱 生長中 ${growing} 塊|✅ 待採收 ${matureN} 塊<br>⚡ 體力 ${Math.floor(S.stamina)}/${S.maxStamina}`;
  } else {
    $('sleepEmoji').textContent = '😴';
    $('sleepTitle').textContent = '睡覺中…';
    $('sleepInfo').innerHTML =
      `已睡 ${fmtTime(sec)}<br>⚡ 體力恢復中:${Math.floor(S.stamina)}/${S.maxStamina}<br>` +
      `<small>選擇「開始掛機」可以加速植物生長,但要小心腐爛!</small>`;
  }
}

// ================= 存檔 =================
const SAVE_KEY = 'farm-idle-save';
function saveGame() {
  if (MP.isGuest()) return; // 訪客不存共享狀態,以免覆蓋自己的單機進度
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {}
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    const base = defaultState();
    S = Object.assign(base, d);
    if (!Array.isArray(S.plots) || S.plots.length !== PLOT_COUNT) S.plots = base.plots;
  } catch {}
}
setInterval(saveGame, 10000);
window.addEventListener('beforeunload', saveGame);

// ================= 事件綁定 =================
document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => {
    activeTab = btn.dataset.tab;
    document.querySelectorAll('.tab').forEach(b => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + activeTab));
    if (activeTab === 'coop') renderCoop();
    render();
  });
});
$('bedBtn').addEventListener('click', goToBed);
$('wakeBtn').addEventListener('click', wakeUp);
$('idleBtn').addEventListener('click', startIdle);
$('createRoomBtn').addEventListener('click', () => {
  const name = $('playerName').value.trim() || '農夫' + Math.floor(Math.random() * 99);
  MP.create(name);
});
$('joinRoomBtn').addEventListener('click', () => {
  const code = $('roomCodeInput').value.trim().toUpperCase();
  if (code.length !== 4) return toast('請輸入 4 碼房號', 'warn');
  const name = $('playerName').value.trim() || '農夫' + Math.floor(Math.random() * 99);
  MP.join(code, name);
});
$('leaveRoomBtn').addEventListener('click', () => MP.leave());

// ================= 啟動 =================
loadGame();
render();
toast('🥔 歡迎來到悠閒農場!你有一顆馬鈴薯種子,點擊田地把它種下吧!', 'good');
