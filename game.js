'use strict';
/* ================= 悠閒農場 — 2D 像素掛機種田遊戲 ================= */

// ---- 作物資料:grow=成熟秒數, fresh=保鮮秒數, seed=種子價, sell=售價, color=像素果實色 ----
const CROPS = {
  potato:     { name: '馬鈴薯', emoji: '🥔', grow: 90,   fresh: 300, seed: 8,   sell: 14,  color: '#c9a44a' },
  carrot:     { name: '胡蘿蔔', emoji: '🥕', grow: 150,  fresh: 300, seed: 18,  sell: 34,  color: '#ff8c1a' },
  wheat:      { name: '小麥',   emoji: '🌾', grow: 210,  fresh: 420, seed: 25,  sell: 52,  color: '#e8c95a' },
  corn:       { name: '玉米',   emoji: '🌽', grow: 280,  fresh: 360, seed: 35,  sell: 76,  color: '#ffd23f' },
  tomato:     { name: '番茄',   emoji: '🍅', grow: 360,  fresh: 280, seed: 45,  sell: 100, color: '#ff4f3f' },
  eggplant:   { name: '茄子',   emoji: '🍆', grow: 450,  fresh: 320, seed: 60,  sell: 142, color: '#8a3fc0' },
  strawberry: { name: '草莓',   emoji: '🍓', grow: 540,  fresh: 240, seed: 80,  sell: 195, color: '#ff4f6e' },
  watermelon: { name: '西瓜',   emoji: '🍉', grow: 660,  fresh: 420, seed: 110, sell: 272, color: '#3fae5a' },
  pumpkin:    { name: '南瓜',   emoji: '🎃', grow: 780,  fresh: 480, seed: 130, sell: 335, color: '#ff8b1f' },
  grape:      { name: '葡萄',   emoji: '🍇', grow: 900,  fresh: 300, seed: 170, sell: 455, color: '#9a5fd0' },
  pineapple:  { name: '鳳梨',   emoji: '🍍', grow: 1200, fresh: 540, seed: 250, sell: 700, color: '#e8b830' },
  goldfruit:  { name: '金果實', emoji: '✨', grow: 1800, fresh: 600, seed: 4000, sell: 10000, color: '#ffd700' },
  // ---- 花卉 ----
  sunflower:  { name: '向日葵', emoji: '🌻', grow: 320,  fresh: 400, seed: 40,  sell: 88,  color: '#ffd700', cat: 'flower' },
  tulip:      { name: '鬱金香', emoji: '🌷', grow: 500,  fresh: 300, seed: 70,  sell: 165, color: '#ff5fa0', cat: 'flower' },
  rose:       { name: '玫瑰',   emoji: '🌹', grow: 720,  fresh: 260, seed: 120, sell: 300, color: '#e0314b', cat: 'flower' },
  lavender:   { name: '薰衣草', emoji: '🪻', grow: 1000, fresh: 360, seed: 200, sell: 560, color: '#9f7fe8', cat: 'flower' },
};

// ---- 食譜 ----
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

// ---- 服裝:用金幣購買,穿上有不同效果(顏色會反映在小農夫身上) ----
const OUTFITS = {
  default: { name: '樸素農夫裝', icon: '🧑‍🌾', cost: 0,
    desc: '最初的裝備,沒有特殊效果', colors: {} },
  cowboy:  { name: '牛仔裝', icon: '🤠', cost: 20000,
    desc: '行動體力消耗 -25%', colors: { h: '#8d5a2b', r: '#c9883f', p: '#6b4d33' }, fx: { staminaSave: 0.75 } },
  chef:    { name: '廚師服', icon: '👨‍🍳', cost: 35000,
    desc: '體力回復速度 ×2', colors: { h: '#f5f5f5', r: '#ffffff', p: '#9aa0a6' }, fx: { regen: 2 } },
  pro:     { name: '專業農作服', icon: '🥬', cost: 60000,
    desc: '作物生長速度 +15%', colors: { h: '#e8c95a', r: '#3f8f4a', p: '#2f5526' }, fx: { grow: 1.15 } },
  ninja:   { name: '忍者裝', icon: '🥷', cost: 120000,
    desc: '偷菜被稻草人嚇跑時,偷菜券退還', colors: { h: '#2c2c3a', r: '#3a3a4d', p: '#23232f' }, fx: { ninja: true } },
  tycoon:  { name: '富商西裝', icon: '🤵', cost: 200000,
    desc: '賣作物收入 +25%', colors: { h: '#2c3e50', r: '#34495e', p: '#1d2731' }, fx: { sell: 1.25 } },
};

// ---- 寵物:金幣購買,一次帶一隻出門(會跟著小農夫走),各有不同效果 ----
//  col=世界裡的身體色, ear=耳/角色
const PETS = {
  cat:     { name: '貓咪',   emoji: '🐱', cost: 12000,  desc: '賣作物收入 +15%',
    fx: { sell: 1.15 }, col: '#9aa6ad', ear: '#7d878d' },
  chicken: { name: '母雞',   emoji: '🐔', cost: 25000,  desc: '採收時 35% 機率多收 1 個',
    fx: { harvestBonus: 0.35 }, col: '#f5efe0', ear: '#ff5a2c' },
  rabbit:  { name: '兔子',   emoji: '🐰', cost: 45000,  desc: '作物生長速度 +12%',
    fx: { grow: 1.12 }, col: '#f0f0f0', ear: '#ffb6c8' },
  bee:     { name: '蜜蜂',   emoji: '🐝', cost: 70000,  desc: '花卉售價 +40%',
    fx: { flowerSell: 1.4 }, col: '#ffce3a', ear: '#3a2a1a' },
  pig:     { name: '小豬',   emoji: '🐷', cost: 100000, desc: '每 30 秒自動撿到金幣',
    fx: { passiveCoin: true }, col: '#ff9fc0', ear: '#f47faa' },
  owl:     { name: '貓頭鷹', emoji: '🦉', cost: 150000, desc: '掛機時生長加速更快、上限更高',
    fx: { idleBoost: true }, col: '#9a7448', ear: '#c89a5a' },
  dragon:  { name: '小龍',   emoji: '🐲', cost: 300000, desc: '生長 +15% 且 賣作物收入 +15%',
    fx: { grow: 1.15, sell: 1.15 }, col: '#54b55a', ear: '#2e7d32' },
};

// ---- 製作 ----
const BACKPACK_LEVELS = [
  { cost: 100, wheat: 0,  cap: 40,  label: '小背包' },
  { cost: 300, wheat: 5,  cap: 70,  label: '大背包' },
  { cost: 800, wheat: 15, cap: 120, label: '冒險家背包' },
];
const PLOT_COUNT = 30;
const PLOT_COSTS = [0, 0, 0, 0, 50, 100, 200, 350, 550, 800, 1200, 1700,
  2400, 3200, 4200, 5500, 7000, 9000, 12000, 15000,
  19000, 24000, 30000, 38000, 48000, 60000, 75000, 95000, 120000, 150000];
const STAMINA_COST = { plant: 3, harvest: 2, clear: 2, cook: 5, sickle: 5 };

// ================= 狀態 =================
function defaultState() {
  return {
    coins: 0,
    stamina: 100, maxStamina: 100,
    seeds: { potato: 1 },
    crops: {},
    foods: {},
    capacity: 20, backpackLv: 0,
    stealTickets: 0,
    rebirthTokens: 0,
    outfit: 'default',
    outfitsOwned: ['default'],
    pets: [],          // 出門中的寵物 id(最多 MAX_ACTIVE_PETS 隻)
    petsOwned: [],     // 已領養的寵物 id
    petLevels: {},     // id -> 等級(1~5)
    petExp: {},        // id -> 目前等級的親密度進度
    tools: { sickle: false, watering: false, scarecrow: false, watchdog: false },
    buffs: [],
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
  // 貓頭鷹:等級越高,加速越快、上限越高
  const owlLv = petFx('idleBoost', 0); // 0=無, 1~5=貓頭鷹等級
  if (owlLv) {
    const cap = 10 + owlLv;                    // Lv1→11 … Lv5→15
    const per = Math.max(12, 22 - owlLv * 2);  // Lv1→20秒/級 … Lv5→12秒/級
    return Math.min(cap, 3 + Math.floor(sec / per));
  }
  return Math.min(10, 2 + Math.floor(sec / 30));
}
// 目前穿著的服裝效果(key 不存在時回傳預設值)
function outfitFx(key, def) {
  const o = OUTFITS[S.outfit];
  return (o && o.fx && o.fx[key] !== undefined) ? o.fx[key] : def;
}
function outfitColors() {
  const o = OUTFITS[S.outfit];
  return o ? o.colors : null;
}
// ---- 寵物等級 / 出戰 ----
const MAX_ACTIVE_PETS = 3;   // 一次最多帶幾隻出門
const PET_MAX_LVL = 5;
const PET_FEED_GAIN = 25;     // 每餵一次增加的親密度
const lvlUpCost = (lv) => 75 + lv * 50; // 升到下一級所需親密度
function activePets() { return (S.pets || []).filter(id => PETS[id]); }
function petLevel(id) { return (S.petLevels && S.petLevels[id]) || 1; }
function petLvlFactor(id) { return 1 + (petLevel(id) - 1) * 0.25; } // Lv1=1.0 … Lv5=2.0

// 各效果的聚合方式
const PET_FX_KIND = { grow: 'mult', sell: 'mult', flowerSell: 'mult', harvestBonus: 'add', passiveCoin: 'bool', idleBoost: 'max' };
// 聚合所有出門寵物的某種效果(隨各自等級放大)
function petFx(key, def) {
  const kind = PET_FX_KIND[key];
  let acc = kind === 'mult' ? 1 : (kind === 'add' ? 0 : (kind === 'bool' ? false : 0));
  let found = false;
  for (const id of activePets()) {
    const v = PETS[id].fx[key];
    if (v === undefined) continue;
    found = true;
    const lf = petLvlFactor(id);
    if (kind === 'mult') acc *= 1 + (v - 1) * lf;
    else if (kind === 'add') acc += v * lf;
    else if (kind === 'bool') acc = true;
    else if (kind === 'max') acc = Math.max(acc, petLevel(id));
  }
  return found ? acc : def;
}
function speedMult() {
  if (MP.isGuest()) return MP.hostSpeed;
  return (S.tools.watering ? 1.2 : 1) * buffMult('grow') * idleMult() * outfitFx('grow', 1) * petFx('grow', 1);
}
// 某作物的最終售價倍率(含 buff/重生/服裝/寵物;蜜蜂另加花卉加成)
function cropSellMult(key) {
  let m = buffMult('sell') * rebirthMult() * outfitFx('sell', 1) * petFx('sell', 1);
  if (CROPS[key] && CROPS[key].cat === 'flower') m *= petFx('flowerSell', 1);
  return m;
}
function bagUsed() {
  let n = 0;
  for (const k in S.crops) n += S.crops[k];
  for (const k in S.foods) n += S.foods[k];
  return n;
}
function bagRoom() { return S.capacity - bagUsed(); }
function spendStamina(cost) {
  cost = Math.max(1, Math.floor(cost * buffMult('save') * outfitFx('staminaSave', 1)));
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

// ---- 重生系統 ----
const REBIRTH_BASE_COST = 100000; // 第 n 次重生 = n × 10 萬
function rebirthCost() { return ((S.rebirthTokens || 0) + 1) * REBIRTH_BASE_COST; }
function rebirthMult() { return Math.pow(2, S.rebirthTokens || 0); } // 每枚代幣讓賣價翻倍

// ================= 操作(單機直接執行;訪客送給房主) =================
function doAction(a) {
  if (MP.isGuest()) {
    const cost = STAMINA_COST[a.type] || 0;
    if (cost && !spendStamina(cost)) return;
    if (a.type === 'eat') {
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
      const got = Math.min(bagRoom(), 2 + (Math.random() < 0.15 ? 1 : 0) + (Math.random() < petFx('harvestBonus', 0) ? 1 : 0));
      S.crops[p.crop] = (S.crops[p.crop] || 0) + got;
      toast(`${c.emoji} ${who}採收了 ${c.name} ×${got}`, 'good');
      Object.assign(p, { crop: null, progress: 0, warned: false, rotNotified: false });
      break;
    }
    case 'sickle': {
      if (!S.tools.sickle) return;
      if (local && !spendStamina(cost)) return;
      let total = 0;
      for (const p of S.plots) {
        if (plotStage(p) !== 'mature' || bagRoom() < 1) continue;
        const got = Math.min(bagRoom(), 2 + (Math.random() < 0.15 ? 1 : 0) + (Math.random() < petFx('harvestBonus', 0) ? 1 : 0));
        S.crops[p.crop] = (S.crops[p.crop] || 0) + got;
        total += got;
        Object.assign(p, { crop: null, progress: 0, warned: false, rotNotified: false });
      }
      toast(total > 0 ? `🌾 ${who}揮舞鐮刀,一口氣採收了 ${total} 個作物!` : '沒有可採收的作物', total > 0 ? 'good' : '');
      break;
    }
    case 'clear': {
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
      const gain = Math.floor(c.sell * n * cropSellMult(a.crop));
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
        S.buffs = S.buffs.filter(b => !(b.type === e.buff.type && b.name === e.buff.name));
        S.buffs.push({ ...e.buff, until: Date.now() + e.buff.dur * 1000 });
        if (MP.connected()) MP.notifyAll(`${r.emoji} ${local ? MP.myName : who} 吃了${r.name},全隊獲得「${e.buff.name}」效果!`);
      }
      toast(`${r.emoji} ${local ? '' : who}吃了${r.name}!${r.desc}`, 'good');
      break;
    }
    case 'spend': { // 訪客在聯機時購買個人物品(如服裝),由房主扣共享金幣
      const amount = Math.max(0, a.amount || 0);
      if (S.coins < amount) return;
      S.coins -= amount;
      if (!local) toast(`🛍️ ${who}花了 💰${amount.toLocaleString()} 購買${a.what || '物品'}`);
      break;
    }
    case 'rebirth': {
      const cost = rebirthCost();
      if (S.coins < cost) { if (local) toast(`金幣不夠!重生需要 💰${cost.toLocaleString()}`, 'warn'); return; }
      // 金幣和種子全部消失,換一枚重生代幣;只留一顆馬鈴薯種子重新開始
      S.coins = 0;
      S.seeds = { potato: 1 };
      S.rebirthTokens = (S.rebirthTokens || 0) + 1;
      toast(`✨ ${who}重生成功!獲得重生代幣 ×1,現在賣作物收入 ×${rebirthMult()}!`, 'good');
      if (MP.connected()) MP.notifyAll(`✨ 農場重生了!賣作物收入 ×${rebirthMult()}`);
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
      } else if (a.item === 'scarecrow') {
        if (S.tools.scarecrow) return;
        if (S.coins < 300 || (S.crops.wheat || 0) < 10) { if (local) toast('材料不夠!', 'warn'); return; }
        S.coins -= 300;
        S.crops.wheat -= 10; if (S.crops.wheat <= 0) delete S.crops.wheat;
        S.tools.scarecrow = true;
        toast(`🎃 ${who}立起了稻草人!有 50% 機率嚇跑小偷`, 'good');
      } else if (a.item === 'watchdog') {
        if (S.tools.watchdog) return;
        if (S.coins < 600 || (S.foods.bread || 0) < 2) { if (local) toast('材料不夠!', 'warn'); return; }
        S.coins -= 600;
        S.foods.bread -= 2; if (S.foods.bread <= 0) delete S.foods.bread;
        S.tools.watchdog = true;
        toast(`🐕 ${who}用麵包收編了一隻看門狗!小偷最多只能偷走 1 個作物`, 'good');
      }
      break;
    }
  }
}

// ================= 聯機快照 =================
const SYNC_KEYS = ['coins', 'seeds', 'crops', 'foods', 'capacity', 'backpackLv', 'tools', 'buffs', 'plots', 'rebirthTokens'];
// 註:服裝/寵物是個人的,不放進共享快照(各玩家自己的裝扮)
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

// ================= 偷菜系統 =================
let stealTimer = null;
function buyStealTicket() {
  S.stealTickets = (S.stealTickets || 0) + 1;
  toast('🎟️ 模擬購買成功!獲得偷菜券 ×1(正式版將以真錢購買)', 'good');
  saveGame();
  renderSteal();
  renderTop();
}
function startSteal() {
  const code = $('stealCode').value.trim().toUpperCase();
  if (code.length !== 4) return toast('請輸入 4 碼目標房號', 'warn');
  if (MP.isGuest()) return toast('聯機中的隊員不能偷菜,請先離開房間', 'warn');
  if (MP.connected() && code === MP.code) return toast('不能偷自己的農場!', 'warn');
  if ((S.stealTickets || 0) < 1) return toast('沒有偷菜券!先買一張吧', 'warn');
  if (stealTimer) return toast('偷菜行動進行中…', 'warn');
  S.stealTickets--;
  renderSteal(); renderTop();
  stealTimer = setTimeout(() => {
    stealTimer = null;
    S.stealTickets++;
    toast('⌛ 偷菜逾時(對方可能離線了),偷菜券已退還', 'warn');
    renderSteal(); renderTop();
  }, 6000);
  MP.open(() => MP.send({ t: 'steal', code, name: MP.myName || '神秘小偷' }));
  toast('🥷 潛入目標農場中…');
}
function onStealLoot(loot, scared) {
  clearTimeout(stealTimer); stealTimer = null;
  if (scared) {
    if (outfitFx('ninja', false)) {
      S.stealTickets++;
      toast('🥷 被稻草人嚇跑了…但忍者裝讓你全身而退,偷菜券退還!', 'good');
    } else {
      toast('🎃 被對方的稻草人嚇跑了!偷菜券沒收…', 'warn');
    }
  } else if (!loot || !loot.length) {
    S.stealTickets++;
    toast('😅 對方田裡沒有成熟的作物,偷菜券退還');
  } else {
    const got = [];
    for (const it of loot) {
      const n = Math.min(it.n, Math.max(0, bagRoom()));
      if (n > 0) { S.crops[it.crop] = (S.crops[it.crop] || 0) + n; got.push(`${CROPS[it.crop].emoji}${CROPS[it.crop].name}×${n}`); }
    }
    toast(got.length ? '🥷 偷菜成功!帶走了 ' + got.join('、') : '🎒 背包滿了,什麼都帶不走…', got.length ? 'good' : 'warn');
  }
  saveGame(); renderSteal(); renderTop();
}
function onStealError(msg) {
  clearTimeout(stealTimer); stealTimer = null;
  S.stealTickets++;
  toast('❌ ' + msg + '(偷菜券已退還)', 'warn');
  renderSteal(); renderTop();
}
// 房主端:有人來偷菜(最多偷走 3 塊成熟田,每塊 1 個作物;有防護裝置時更安全)
function hostHandleSteal(msg) {
  // 稻草人:50% 機率直接嚇跑小偷
  if (S.tools.scarecrow && Math.random() < 0.5) {
    MP.send({ t: 'stealResult', sid: msg.sid, loot: [], scared: true });
    toast(`🎃 稻草人嚇跑了想偷菜的 ${msg.name}!`, 'good');
    MP.notifyAll(`🎃 稻草人嚇跑了想偷菜的 ${msg.name}!`);
    return;
  }
  const maxSteal = S.tools.watchdog ? 1 : 3; // 看門狗:最多只能被偷 1 個
  const mature = S.plots.map((p, i) => ({ p, i })).filter(o => plotStage(o.p) === 'mature');
  const loot = [];
  for (const o of mature.slice(0, maxSteal)) {
    loot.push({ crop: o.p.crop, n: 1 });
    Object.assign(o.p, { crop: null, progress: 0, warned: false, rotNotified: false });
  }
  MP.send({ t: 'stealResult', sid: msg.sid, loot });
  if (loot.length) {
    const txt = loot.map(l => CROPS[l.crop].emoji + CROPS[l.crop].name).join('、');
    const guard = S.tools.watchdog ? '(看門狗狂吠,小偷只偷到一個就跑了)' : '';
    toast(`🥷 ${msg.name} 偷走了你的 ${txt}!${guard}`, 'warn');
    MP.notifyAll(`🥷 ${msg.name} 偷走了農場的 ${txt}!${guard}`);
    MP.broadcastState();
    saveGame();
  }
}

// ================= 遊戲主迴圈 =================
let lastTick = Date.now();
let petCoinTimer = 0;
function tick() {
  const now = Date.now();
  // 不設上限:瀏覽器在背景分頁會節流計時器,回到前景時要補回真實流逝的時間,掛機才有效
  const dt = Math.max(0, (now - lastTick) / 1000);
  lastTick = now;

  S.buffs = S.buffs.filter(b => b.until > now);

  const regen = (sleep.active ? 2.5 : 0.12) * outfitFx('regen', 1);
  S.stamina = Math.min(S.maxStamina, S.stamina + regen * dt);

  // 小豬:每 30 秒自動撿到金幣(房主/單機才計算)
  if (!MP.isGuest() && petFx('passiveCoin', false)) {
    petCoinTimer += dt;
    if (petCoinTimer >= 30) {
      const times = Math.min(8, Math.floor(petCoinTimer / 30)); // 背景補時間時最多一次補 8 回
      petCoinTimer -= times * 30;
      const found = times * Math.floor(120 * petLvlFactor('pig') * rebirthMult());
      S.coins += found;
      toast(`🐷 小豬幫你撿到了 ${found} 金幣!`, 'good');
      saveGame();
    }
  }

  const mult = speedMult();
  for (const p of S.plots) {
    if (!p.crop) continue;
    p.progress += dt * mult;
    const c = CROPS[p.crop];
    const stage = plotStage(p);
    if (!MP.isGuest()) {
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

// ================= 像素世界渲染 =================
const cv = $('world');
const ctx = cv.getContext('2d');
const L = LAYOUT;
let scene = 'farm'; // 'farm' | 'house'
let openDlg = null;

// 農場(室外)比室內高,做成可往下捲動的大地圖;室內維持原本大小
const FARM_H = 286;
function worldH() { return scene === 'house' ? L.world.h : FARM_H; }

// 以螢幕原生解析度(含 Retina)繪製,文字才不會糊
function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round((cv.clientWidth || 768) * dpr));
  const h = Math.round(w * worldH() / L.world.w);
  if (w === cv.width && h === cv.height) return;
  cv.width = w;
  cv.height = h;
  PX.S = cv.width / L.world.w;
  grassKey = ''; // 背景快取作廢
}
window.addEventListener('resize', () => { fitCanvas(); drawWorld(); });

// 草地背景快取(每幀重畫太花,只在尺寸改變時重生成)
let grassCache = null, grassKey = '';
function drawGrassCached() {
  const key = cv.width + 'x' + cv.height;
  if (grassKey !== key) {
    grassCache = document.createElement('canvas');
    grassCache.width = cv.width;
    grassCache.height = cv.height;
    PX.grass(grassCache.getContext('2d'), L.world.w, worldH());
    grassKey = key;
  }
  ctx.drawImage(grassCache, 0, 0);
}

// ---- 日夜變化(一天 = 10 分鐘:白天5分 → 黃昏1分 → 夜晚3分 → 黎明1分) ----
const DAY_LEN = 600;
function dayInfo() {
  const t = (Date.now() / 1000) % DAY_LEN;
  if (t < 300) return { phase: 'day', dark: 0, glow: 0 };
  if (t < 360) { const k = (t - 300) / 60; return { phase: 'dusk', dark: k, glow: Math.sin(k * Math.PI) }; }
  if (t < 540) return { phase: 'night', dark: 1, glow: 0 };
  const k = (t - 540) / 60;
  return { phase: 'dawn', dark: 1 - k, glow: Math.sin(k * Math.PI) };
}

// ---- 小農夫:在地圖上走動,點哪裡就走去哪裡 ----
const farmer = { x: 128, y: 130, tx: 128, ty: 130, face: 1, frame: 0, frameT: 0, wanderT: 2 };
const petPositions = {}; // id -> {x,y,frame,frameT,face}
function updatePet(dt) {
  const active = S.pets || [];
  active.forEach((id, idx) => {
    if (!petPositions[id]) petPositions[id] = { x: farmer.x, y: farmer.y, frame: 0, frameT: 0, face: 1 };
    const pp = petPositions[id];
    const off = (idx + 1) * 11; // 排成一列跟在農夫身後
    const tx = farmer.x + farmer.face * off, ty = farmer.y + 3 + (idx % 2) * 3;
    const dx = tx - pp.x, dy = ty - pp.y, d = Math.hypot(dx, dy);
    if (d > 2) {
      pp.x += dx / d * Math.min(d, 62 * dt);
      pp.y += dy / d * Math.min(d, 62 * dt);
      if (Math.abs(dx) > 1) pp.face = dx < 0 ? -1 : 1;
      pp.frameT += dt;
      if (pp.frameT > 0.16) { pp.frame ^= 1; pp.frameT = 0; }
    } else pp.frame = 0;
  });
}
const WALK_AREA = {
  farm:  { x1: 10, y1: 68, x2: 246, y2: 282 },
  house: { x1: 16, y1: 96, x2: 238, y2: 172 },
};
// ---- 手動操控:電腦 WASD/方向鍵,手機虛擬按鍵 ----
const keys = new Set();
const dpad = { up: false, down: false, left: false, right: false };
const isTyping = () => {
  const t = document.activeElement;
  return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA');
};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k) && !isTyping()) {
    keys.add(k);
    e.preventDefault();
  }
});
window.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());
function moveDir() {
  let dx = 0, dy = 0;
  if (keys.has('w') || keys.has('arrowup') || dpad.up) dy -= 1;
  if (keys.has('s') || keys.has('arrowdown') || dpad.down) dy += 1;
  if (keys.has('a') || keys.has('arrowleft') || dpad.left) dx -= 1;
  if (keys.has('d') || keys.has('arrowright') || dpad.right) dx += 1;
  return { dx, dy };
}

function updateFarmer(dt) {
  // 手動操控優先(WASD / 虛擬按鍵)
  const mv = moveDir();
  if (mv.dx || mv.dy) {
    const len = Math.hypot(mv.dx, mv.dy);
    const a = WALK_AREA[scene];
    farmer.x = Math.max(a.x1, Math.min(a.x2, farmer.x + mv.dx / len * 55 * dt));
    farmer.y = Math.max(a.y1, Math.min(a.y2, farmer.y + mv.dy / len * 55 * dt));
    farmer.tx = farmer.x; farmer.ty = farmer.y; // 取消自動走路目標
    if (mv.dx) farmer.face = mv.dx < 0 ? -1 : 1;
    farmer.frameT += dt;
    if (farmer.frameT > 0.14) { farmer.frame ^= 1; farmer.frameT = 0; }
    farmer.wanderT = 4;
    return;
  }
  const dx = farmer.tx - farmer.x, dy = farmer.ty - farmer.y;
  const d = Math.hypot(dx, dy);
  if (d > 1.5) {
    const step = Math.min(d, 42 * dt);
    farmer.x += dx / d * step;
    farmer.y += dy / d * step;
    if (Math.abs(dx) > 1) farmer.face = dx < 0 ? -1 : 1;
    farmer.frameT += dt;
    if (farmer.frameT > 0.16) { farmer.frame ^= 1; farmer.frameT = 0; }
  } else {
    farmer.frame = 0;
    farmer.wanderT -= dt;
    if (farmer.wanderT <= 0) { // 沒事做就隨便晃晃
      farmer.wanderT = 2.5 + Math.random() * 4;
      const a = WALK_AREA[scene];
      farmer.tx = a.x1 + Math.random() * (a.x2 - a.x1);
      farmer.ty = a.y1 + Math.random() * (a.y2 - a.y1);
    }
  }
}
function sendFarmerTo(x, y) {
  const a = WALK_AREA[scene];
  farmer.tx = Math.max(a.x1, Math.min(a.x2, x));
  farmer.ty = Math.max(a.y1, Math.min(a.y2, y));
  farmer.wanderT = 5;
}

function plotRect(i) {
  const col = i % L.plots.cols, row = Math.floor(i / L.plots.cols);
  return { x: L.plots.x0 + col * L.plots.gx, y: L.plots.y0 + row * L.plots.gy, w: L.plots.w, h: L.plots.h };
}

function drawWorld() {
  fitCanvas();
  ctx.imageSmoothingEnabled = false;
  const day = dayInfo();
  if (scene === 'farm') {
    drawGrassCached();
    // 環境裝飾:樹木與灌木(框住場景,不碰農田)
    const sway1 = Math.round(Math.sin(windT * 1.1));
    const sway2 = Math.round(Math.sin(windT * 1.1 + 1.7));
    PX.tree(ctx, 74, 6, sway1);
    PX.tree(ctx, 238, 28, sway2);
    PX.bush(ctx, 0, 96);
    PX.bush(ctx, 0, 156);
    PX.bush(ctx, 0, 216);
    PX.bush(ctx, 0, 262);
    PX.house(ctx, L.house);
    PX.bench(ctx, L.bench);
    PX.stall(ctx, L.stall);
    if (S.tools.scarecrow) PX.scarecrow(ctx, 132, 50);
    if (S.tools.watchdog) PX.dog(ctx, 76, 52, Math.floor(Date.now() / 400) % 2);
    PX.label(ctx, '我的家', L.house.x + L.house.w / 2, L.house.y + L.house.h + 3, '#fff', 9);
    PX.label(ctx, '工作台', L.bench.x + L.bench.w / 2, L.bench.y + L.bench.h + 3, '#fff', 9);
    PX.label(ctx, '商人', L.stall.x + L.stall.w / 2, L.stall.y + L.stall.h + 3, '#fff', 9);
    const mult = speedMult();
    S.plots.forEach((p, i) => {
      const r = plotRect(i);
      PX.soil(ctx, r, !p.unlocked);
      if (!p.unlocked) { PX.lock(ctx, r, PLOT_COSTS[i]); return; }
      if (!p.crop) return;
      const c = CROPS[p.crop];
      const stage = plotStage(p);
      PX.crop(ctx, r, stage, c, p.progress / c.grow);
      if (stage === 'growing') {
        PX.bar(ctx, r, p.progress / c.grow);
        PX.time(ctx, r, (c.grow - p.progress) / mult, '#fff');
      } else if (stage === 'mature') {
        const left = (c.grow + c.fresh - p.progress) / mult;
        PX.mark(ctx, r, left <= 60 ? '#ff5040' : '#ffd23f');
        PX.time(ctx, r, left, left <= 60 ? '#ff9a8a' : '#ffe9a0');
      } else if (stage === 'rotten') {
        PX.label(ctx, '清理', r.x + r.w / 2, r.y + 2, '#ddd', 9);
      }
    });
    for (const id of (S.pets || [])) { const pp = petPositions[id]; if (pp) PX.pet(ctx, pp.x - 4, pp.y - 7, id, petColors(id), pp.face, 1, pp.frame); }
    PX.farmer(ctx, farmer.x - 6, farmer.y - 15, farmer.frame, farmer.face, 1, outfitColors());
    // 白天小鳥飛過天空
    if (bird) PX.bird(ctx, bird.x, bird.y, Math.floor(windT * 6) % 2 === 0);
    // 白天蝴蝶 / 夜裡螢火蟲
    if (day.dark < 0.5) {
      for (const b of butterflies) PX.butterfly(ctx, b.x, b.y, b.wing, b.color);
    }
    PX.nightTint(ctx, L.world.w, worldH(), day.dark, day.glow);
    if (day.dark > 0.6) {
      PX.stars(ctx, L.world.w);
      for (const f of fireflies) PX.firefly(ctx, f.x, f.y, Math.floor(windT * 2 + f.t) % 2 === 0);
    }
    if (day.dark > 0.5) PX.houseGlow(ctx, L.house); // 夜裡窗戶亮燈(畫在夜色之上才會發光)
    PX.sunMoon(ctx, 240, 6, day.phase);
  } else {
    PX.indoor(ctx, L, day);
    PX.label(ctx, '廚房', L.stove.x + L.stove.w / 2, L.stove.y + L.stove.h + 3, '#5d4a2f', 9);
    PX.label(ctx, '床', L.bed.x + L.bed.w / 2, L.bed.y + L.bed.h + 5, '#5d4a2f', 9);
    PX.label(ctx, '出去', L.door.x + L.door.w / 2, L.door.y + L.door.h + 1, '#5d4a2f', 9);
    // 在家裡時農夫比較大隻(近景)
    for (const id of (S.pets || [])) { const pp = petPositions[id]; if (pp) PX.pet(ctx, pp.x - 8, pp.y - 14, id, petColors(id), pp.face, 2, pp.frame); }
    PX.farmer(ctx, farmer.x - 12, farmer.y - 30, farmer.frame, farmer.face, 2, outfitColors());
    // 夜裡屋內微暗,有種點著油燈的氣氛
    PX.nightTint(ctx, L.world.w, worldH(), day.dark * 0.35, 0);
  }
}

// ---- 環境氛圍:風、蝴蝶、小鳥、螢火蟲 ----
let windT = 0;
const FARM_BOUND = { x1: 6, y1: 70, x2: 250, y2: 282 };
const butterflies = Array.from({ length: 3 }, (_, i) => ({
  x: 50 + i * 70, y: 96 + i * 28, ang: Math.random() * 6.28, t: Math.random() * 9,
  wing: 0, wingT: 0, color: ['#ff8fc0', '#ffd23f', '#a9deff'][i],
}));
const fireflies = Array.from({ length: 7 }, (_, i) => ({
  x: 20 + i * 32, y: 80 + (i * 53) % 110, ang: Math.random() * 6.28, t: Math.random() * 6,
}));
let bird = null, birdTimer = 5;

function updateAmbient(dt) {
  windT += dt;
  // 蝴蝶:緩緩飄移轉向 + 拍翅
  for (const b of butterflies) {
    b.t += dt;
    b.ang += Math.sin(b.t * 1.3) * dt * 2.2;
    b.x += Math.cos(b.ang) * 17 * dt;
    b.y += Math.sin(b.ang) * 9 * dt + Math.sin(b.t * 5) * 4 * dt;
    if (b.x < FARM_BOUND.x1) b.x = FARM_BOUND.x2; else if (b.x > FARM_BOUND.x2) b.x = FARM_BOUND.x1;
    if (b.y < FARM_BOUND.y1) b.y = FARM_BOUND.y1 + 2; else if (b.y > FARM_BOUND.y2) b.y = FARM_BOUND.y2 - 2;
    b.wingT += dt; if (b.wingT > 0.12) { b.wing ^= 1; b.wingT = 0; }
  }
  // 螢火蟲:夜裡飄動
  for (const f of fireflies) {
    f.t += dt;
    f.ang += Math.sin(f.t) * dt * 2;
    f.x += Math.cos(f.ang) * 8 * dt;
    f.y += Math.sin(f.ang * 1.3) * 6 * dt;
    if (f.x < FARM_BOUND.x1) f.x = FARM_BOUND.x2; else if (f.x > FARM_BOUND.x2) f.x = FARM_BOUND.x1;
    if (f.y < 74) f.y = 74; else if (f.y > FARM_BOUND.y2) f.y = FARM_BOUND.y2;
  }
  // 小鳥:白天偶爾飛過天空
  if (bird) {
    bird.t += dt;
    bird.x += bird.dir * 42 * dt;
    bird.y += Math.sin(bird.t * 2) * 5 * dt;
    if (bird.x < -12 || bird.x > 268) bird = null;
  } else if (dayInfo().dark < 0.4) {
    birdTimer -= dt;
    if (birdTimer <= 0) {
      birdTimer = 9 + Math.random() * 12;
      const dir = Math.random() < 0.5 ? 1 : -1;
      bird = { x: dir > 0 ? -10 : 266, y: 14 + Math.random() * 22, dir, t: 0 };
    }
  }
}

// 走路動畫用的順暢繪製迴圈(遊戲邏輯仍由 500ms 的 tick 處理)
let lastFrameT = performance.now();
function frameLoop(now) {
  const fdt = Math.min(0.1, (now - lastFrameT) / 1000);
  lastFrameT = now;
  updateFarmer(fdt);
  updatePet(fdt);
  updateAmbient(fdt);
  drawWorld();
  requestAnimationFrame(frameLoop);
}
requestAnimationFrame(frameLoop);

const hit = (r, x, y) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
cv.addEventListener('click', (e) => {
  const rect = cv.getBoundingClientRect();
  const x = (e.clientX - rect.left) * L.world.w / rect.width;
  const y = (e.clientY - rect.top) * worldH() / rect.height;
  sendFarmerTo(x, y); // 小農夫走向你點的地方
  if (scene === 'farm') {
    if (hit(L.house, x, y)) { setScene('house'); return; }
    if (hit(L.bench, x, y)) { openDialog('craft'); return; }
    if (hit(L.stall, x, y)) { openDialog('shop'); return; }
    for (let i = 0; i < PLOT_COUNT; i++) {
      if (hit(plotRect(i), x, y)) { onPlotClick(i); return; }
    }
  } else {
    if (hit(L.stove, x, y)) { openDialog('kitchen'); return; }
    if (hit(L.bed, x, y)) { goToBed(); return; }
    if (hit(L.door, x, y)) { setScene('farm'); return; }
  }
});

function setScene(s) {
  scene = s;
  // 小農夫出現在門口
  if (s === 'house') { farmer.x = farmer.tx = L.door.x + L.door.w / 2; farmer.y = farmer.ty = L.door.y - 4; }
  else { farmer.x = farmer.tx = L.house.x + L.house.w / 2; farmer.y = farmer.ty = L.house.y + L.house.h + 6; }
  farmer.wanderT = 2;
  $('sceneBtn').textContent = scene === 'farm' ? '🏠 進屋' : '🌾 出門';
  $('worldHint').textContent = scene === 'farm'
    ? '點擊田地播種/採收;點房子進屋(廚房+床);點攤位找商人;點工作台製作道具。'
    : '點爐灶做飯;點床睡覺(可掛機);點門口地墊出去。';
  render();
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

// ================= 對話框管理 =================
function openDialog(name) {
  closeDialogs();
  openDlg = name;
  $('dlg-' + name).classList.remove('hidden');
  renderOpenDialog();
}
function closeDialogs() {
  openDlg = null;
  document.querySelectorAll('.dlg').forEach(d => d.classList.add('hidden'));
}
// 點對話框外面也能關閉
document.querySelectorAll('.dlg').forEach(d => {
  d.addEventListener('click', (e) => { if (e.target === d) closeDialogs(); });
});

function renderOpenDialog() {
  if (openDlg === 'shop') renderShop();
  else if (openDlg === 'kitchen') renderKitchen();
  else if (openDlg === 'craft') renderCraft();
  else if (openDlg === 'coop') renderCoop();
  else if (openDlg === 'steal') renderSteal();
  else if (openDlg === 'rebirth') renderRebirth();
  else if (openDlg === 'outfit') renderOutfit();
  else if (openDlg === 'pet') renderPet();
}

// ---- 寵物 ----
function petColors(id) {
  const p = PETS[id];
  return { b: p.col, e: p.ear, k: '#2b2b2b', d: '#5e4a33', o: '#33291e', w: '#fffdf5' };
}
// 顯示某隻寵物在指定等級時的效果文字
function petDescAt(id, lv) {
  const fx = PETS[id].fx, lf = 1 + (lv - 1) * 0.25;
  const pct = (v) => Math.round((v - 1) * lf * 100);
  if (fx.grow && fx.sell) return `生長 +${pct(fx.grow)}% 且 賣作物收入 +${pct(fx.sell)}%`;
  if (fx.sell) return `賣作物收入 +${pct(fx.sell)}%`;
  if (fx.grow) return `作物生長速度 +${pct(fx.grow)}%`;
  if (fx.flowerSell) return `花卉售價 +${pct(fx.flowerSell)}%`;
  if (fx.harvestBonus) return `採收時 ${Math.round(fx.harvestBonus * lf * 100)}% 機率多收 1 個`;
  if (fx.passiveCoin) return `每 30 秒自動撿到金幣(約 ${Math.floor(120 * lf)}×重生倍率)`;
  if (fx.idleBoost) return `掛機加速上限 ×${10 + lv}、間隔更短`;
  return PETS[id].desc;
}
function buyPet(id) {
  const p = PETS[id];
  if (!p) return;
  S.pets = S.pets || [];
  if (S.pets.includes(id)) { // 出門中 → 送回家
    S.pets = S.pets.filter(x => x !== id);
    toast(`${p.emoji} ${p.name}回家休息了`, 'good');
    saveGame(); renderPet(); renderTop(); return;
  }
  if (!S.petsOwned.includes(id)) { // 尚未擁有 → 領養
    if (S.coins < p.cost) return toast(`金幣不夠!${p.name}需要 💰${p.cost.toLocaleString()}`, 'warn');
    if (MP.isGuest()) MP.sendAction({ type: 'spend', amount: p.cost, what: p.name, by: MP.myName });
    else { S.coins -= p.cost; MP.broadcastState(); }
    S.petsOwned.push(id);
    (S.petLevels = S.petLevels || {})[id] = 1;
    (S.petExp = S.petExp || {})[id] = 0;
    toast(`${p.emoji} 領養了${p.name}!`, 'good');
  }
  if (S.pets.length >= MAX_ACTIVE_PETS) { // 出戰滿了
    toast(`出戰寵物已滿(最多 ${MAX_ACTIVE_PETS} 隻),先送一隻回家`, 'warn');
    saveGame(); renderPet(); renderTop(); return;
  }
  S.pets.push(id);
  toast(`${p.emoji} ${p.name}跟你出門了!`, 'good');
  saveGame(); renderPet(); renderTop();
}
function feedPet(id) {
  if (!S.petsOwned.includes(id)) return;
  if (petLevel(id) >= PET_MAX_LVL) return toast(`${PETS[id].name}已經是最高等級了!`, 'warn');
  const foodKeys = Object.keys(S.foods).filter(k => S.foods[k] > 0);
  if (!foodKeys.length) return toast('沒有食物可以餵!先去廚房做點料理吧', 'warn');
  const fk = foodKeys[0];
  S.foods[fk]--; if (S.foods[fk] <= 0) delete S.foods[fk];
  S.petExp = S.petExp || {};
  S.petExp[id] = (S.petExp[id] || 0) + PET_FEED_GAIN;
  let leveled = false;
  while (petLevel(id) < PET_MAX_LVL && S.petExp[id] >= lvlUpCost(petLevel(id))) {
    S.petExp[id] -= lvlUpCost(petLevel(id));
    S.petLevels[id] = petLevel(id) + 1;
    leveled = true;
  }
  toast(leveled ? `🎉 ${PETS[id].emoji} ${PETS[id].name} 升到 Lv.${petLevel(id)},效果更強了!`
                : `🍖 餵食了${PETS[id].name}(${RECIPES[fk].name}),親密度提升`, 'good');
  saveGame(); renderPet(); renderTop();
}
function renderPet() {
  const slotInfo = `<p class="hint">🎒 出戰中 ${(S.pets || []).length} / ${MAX_ACTIVE_PETS} 隻。餵食(消耗 1 個料理)可提升等級,效果更強!</p>`;
  $('petList').innerHTML = slotInfo + Object.entries(PETS).map(([id, p]) => {
    const owned = S.petsOwned.includes(id);
    const active = (S.pets || []).includes(id);
    const lv = petLevel(id);
    const tag = active ? '(出門中)' : owned ? '(已擁有)' : '';
    const lvTag = owned ? ` <span class="pet-lv">Lv.${lv}</span>` : '';
    let actBtn, feedBtn = '';
    if (!owned) actBtn = `<button class="act gold" ${S.coins >= p.cost ? '' : 'disabled'} onclick="buyPet('${id}')">💰${p.cost.toLocaleString()} 領養</button>`;
    else {
      actBtn = `<button class="act" onclick="buyPet('${id}')">${active ? '送回家' : '帶出門'}</button>`;
      feedBtn = lv >= PET_MAX_LVL ? `<button class="act" disabled>滿級</button>`
        : `<button class="act gold" onclick="feedPet('${id}')">🍖 餵食</button>`;
    }
    const exp = owned && lv < PET_MAX_LVL
      ? `<div class="pet-exp"><div style="width:${Math.round(100 * (S.petExp[id] || 0) / lvlUpCost(lv))}%"></div></div>` : '';
    return `<div class="row${active ? ' wearing' : ''}">
      <canvas class="pet-prev" data-pid="${id}" width="40" height="40"></canvas>
      <div class="info"><b>${p.emoji} ${p.name}${lvTag} ${tag}</b>
      <small>${petDescAt(id, owned ? lv : 1)}</small>${exp}</div>
      <div class="pet-btns">${feedBtn}${actBtn}</div></div>`;
  }).join('');
  const savedScale = PX.S;
  PX.S = 1;
  document.querySelectorAll('.pet-prev').forEach(c => {
    const pctx = c.getContext('2d');
    pctx.clearRect(0, 0, c.width, c.height);
    PX.pet(pctx, 4, 2, c.dataset.pid, petColors(c.dataset.pid), 1, 4, 0);
  });
  PX.S = savedScale;
}

// ---- 服裝 ----
function buyOutfit(id) {
  const o = OUTFITS[id];
  if (!o) return;
  if (S.outfitsOwned.includes(id)) { // 已擁有 → 直接穿上
    S.outfit = id;
    toast(`${o.icon} 換上了${o.name}!`, 'good');
    saveGame(); renderOutfit(); renderTop();
    return;
  }
  if (S.coins < o.cost) return toast(`金幣不夠!${o.name}需要 💰${o.cost.toLocaleString()}`, 'warn');
  if (MP.isGuest()) MP.sendAction({ type: 'spend', amount: o.cost, what: o.name, by: MP.myName });
  else { S.coins -= o.cost; MP.broadcastState(); }
  S.outfitsOwned.push(id);
  S.outfit = id;
  toast(`${o.icon} 購買並穿上了${o.name}!${o.desc}`, 'good');
  saveGame(); renderOutfit(); renderTop();
}
function renderOutfit() {
  $('outfitList').innerHTML = Object.entries(OUTFITS).map(([id, o]) => {
    const owned = S.outfitsOwned.includes(id);
    const wearing = S.outfit === id;
    const btn = wearing ? `<button class="act" disabled>穿著中</button>`
      : owned ? `<button class="act" onclick="buyOutfit('${id}')">穿上</button>`
      : `<button class="act gold" ${S.coins >= o.cost ? '' : 'disabled'} onclick="buyOutfit('${id}')">💰${o.cost.toLocaleString()} 購買</button>`;
    return `<div class="row${wearing ? ' wearing' : ''}">
      <canvas class="outfit-prev" data-oid="${id}" width="48" height="64"></canvas>
      <div class="info"><b>${o.icon} ${o.name}${wearing ? '(穿著中)' : owned ? '(已擁有)' : ''}</b>
      <small>${o.desc}</small></div>${btn}</div>`;
  }).join('');
  // 畫出每套服裝的小農夫預覽
  const savedScale = PX.S;
  PX.S = 1;
  document.querySelectorAll('.outfit-prev').forEach(c => {
    const pctx = c.getContext('2d');
    pctx.clearRect(0, 0, c.width, c.height);
    PX.farmer(pctx, 0, 0, 0, 1, 4, OUTFITS[c.dataset.oid].colors);
  });
  PX.S = savedScale;
}

// ---- 重生 ----
function renderRebirth() {
  const n = (S.rebirthTokens || 0);
  $('rebirthTokenCount').textContent = n;
  $('rebirthMultNow').textContent = rebirthMult();
  $('rebirthNth').textContent = n + 1;
  $('rebirthCostShow').textContent = rebirthCost().toLocaleString();
  $('rebirthCoinsShow').textContent = Math.floor(S.coins).toLocaleString();
  $('rebirthMultNext').textContent = Math.pow(2, n + 1);
  $('doRebirthBtn').disabled = S.coins < rebirthCost();
}

// ================= 各畫面渲染 =================
function render() {
  renderTop();
  // 畫面由 frameLoop 以 60fps 繪製,這裡只更新 DOM
  $('sickleBtn').classList.toggle('hidden', !S.tools.sickle);
  if (openDlg) renderOpenDialog();
  if (sleep.active) renderSleep();
}

function renderTop() {
  $('coins').textContent = Math.floor(S.coins);
  $('staminaText').textContent = Math.floor(S.stamina);
  $('staminaFill').style.width = (S.stamina / S.maxStamina * 100) + '%';
  $('capText').textContent = `${bagUsed()}/${S.capacity}`;
  $('ticketText').textContent = S.stealTickets || 0;
  const now = Date.now();
  const rebirthChip = (S.rebirthTokens || 0) > 0
    ? `<span class="buff-chip">✨ 重生×${S.rebirthTokens} 收入×${rebirthMult()}</span>` : '';
  $('buffBar').innerHTML = rebirthChip + S.buffs.map(b =>
    `<span class="buff-chip">${b.icon} ${b.name} ${fmtTime((b.until - now) / 1000)}</span>`
  ).join('');
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
  $('seedPickerList').innerHTML = rows || `<p class="hint">沒有任何種子!去找商人(草地右上的攤位)買一些吧。</p>`;
  $('seedPicker').classList.remove('hidden');
}
function plantSeed(crop) {
  doAction({ type: 'plant', i: pickerPlot, crop });
  closeSeedPicker();
}
function closeSeedPicker() { $('seedPicker').classList.add('hidden'); }

// ---- 廚房 ----
function renderKitchen() {
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
  const crops = Object.entries(S.crops).filter(([, n]) => n > 0);
  $('sellList').innerHTML = crops.length ? crops.map(([k, n]) => {
    const c = CROPS[k];
    const m = cropSellMult(k);
    const price = Math.floor(c.sell * m);
    return `<div class="row"><span class="icon">${c.emoji}</span>
      <div class="info"><b>${c.name} ×${n}</b><small>單價 💰${price}${m > 1 ? '(加成中!)' : ''}</small></div>
      <button class="act" onclick="doAction({type:'sellCrop',crop:'${k}',n:1})">賣 1 個</button>
      <button class="act gold" onclick="doAction({type:'sellCrop',crop:'${k}',n:'all'})">全部賣出</button></div>`;
  }).join('') : `<p class="hint">背包裡沒有作物。去田裡採收一些吧!</p>`;

  const seedRow = ([k, c]) => `<div class="row"><span class="icon">${c.emoji}</span>
      <div class="info"><b>${c.name}種子 💰${c.seed}</b>
      <small>成熟 ${fmtTime(c.grow)}|售價 💰${c.sell}|持有 ${S.seeds[k] || 0}</small></div>
      <button class="act" ${S.coins >= c.seed ? '' : 'disabled'} onclick="doAction({type:'buySeed',crop:'${k}',n:1})">買 1</button>
      <button class="act" ${S.coins >= c.seed * 5 ? '' : 'disabled'} onclick="doAction({type:'buySeed',crop:'${k}',n:5})">買 5</button></div>`;
  const entries = Object.entries(CROPS);
  $('seedShop').innerHTML =
    `<h4 class="seed-cat">🥬 蔬果種子</h4>` +
    entries.filter(([, c]) => c.cat !== 'flower').map(seedRow).join('') +
    `<h4 class="seed-cat">🌸 花卉種子</h4>` +
    entries.filter(([, c]) => c.cat === 'flower').map(seedRow).join('');
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
    ? `<div class="row"><span class="icon">⚒️</span><div class="info"><b>鐮刀(已擁有)</b><small>畫面上方有「鐮刀採收」按鈕,可一鍵採收所有成熟作物</small></div></div>`
    : `<div class="row"><span class="icon">⚒️</span>
      <div class="info"><b>鐮刀</b><small>一鍵採收整片田!需要:💰250 + 🌾小麥×5(有${S.crops.wheat || 0})</small></div>
      <button class="act" ${S.coins >= 250 && (S.crops.wheat || 0) >= 5 ? '' : 'disabled'} onclick="doAction({type:'craft',item:'sickle'})">製作</button></div>`;
  html += S.tools.watering
    ? `<div class="row"><span class="icon">🚿</span><div class="info"><b>灑水壺(已擁有)</b><small>作物永久生長 +20%</small></div></div>`
    : `<div class="row"><span class="icon">🚿</span>
      <div class="info"><b>灑水壺</b><small>作物永久生長 +20%!需要:💰150</small></div>
      <button class="act" ${S.coins >= 150 ? '' : 'disabled'} onclick="doAction({type:'craft',item:'watering'})">製作</button></div>`;
  html += S.tools.scarecrow
    ? `<div class="row"><span class="icon">🎃</span><div class="info"><b>稻草人(已擁有)</b><small>50% 機率嚇跑來偷菜的小偷</small></div></div>`
    : `<div class="row"><span class="icon">🎃</span>
      <div class="info"><b>稻草人</b><small>偷菜防護:50% 機率嚇跑小偷(嚇跑時對方偷菜券不退)!需要:💰300 + 🌾小麥×10(有${S.crops.wheat || 0})</small></div>
      <button class="act" ${S.coins >= 300 && (S.crops.wheat || 0) >= 10 ? '' : 'disabled'} onclick="doAction({type:'craft',item:'scarecrow'})">製作</button></div>`;
  html += S.tools.watchdog
    ? `<div class="row"><span class="icon">🐕</span><div class="info"><b>看門狗(已擁有)</b><small>小偷最多只能偷走 1 個作物</small></div></div>`
    : `<div class="row"><span class="icon">🐕</span>
      <div class="info"><b>看門狗</b><small>偷菜防護:小偷最多只能偷 1 個作物(原本 3 個)!需要:💰600 + 🍞麵包×2(有${S.foods.bread || 0},在廚房烤)</small></div>
      <button class="act" ${S.coins >= 600 && (S.foods.bread || 0) >= 2 ? '' : 'disabled'} onclick="doAction({type:'craft',item:'watchdog'})">製作</button></div>`;
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

// ---- 偷菜 ----
function renderSteal() {
  $('stealTicketCount').textContent = S.stealTickets || 0;
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
// 把一份存檔物件套用到目前狀態 S(含欄位補齊)
function applySave(d) {
  const base = defaultState();
  S = Object.assign(base, d || {});
  if (!Array.isArray(S.plots)) S.plots = base.plots;
  while (S.plots.length < PLOT_COUNT) {
    S.plots.push({ unlocked: false, crop: null, progress: 0, warned: false, rotNotified: false });
  }
  S.plots = S.plots.slice(0, PLOT_COUNT);
  // 相容舊存檔:單隻 pet → pets 陣列;補齊等級欄位
  if (S.pet !== undefined) { if (!Array.isArray(S.pets)) S.pets = S.pet ? [S.pet] : []; delete S.pet; }
  if (!Array.isArray(S.pets)) S.pets = [];
  if (!S.petLevels) S.petLevels = {};
  if (!S.petExp) S.petExp = {};
  for (const id of S.petsOwned || []) if (!S.petLevels[id]) S.petLevels[id] = 1;
}
function saveGame() {
  if (MP.isGuest()) return;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch {} // 存在瀏覽器本機
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    applySave(JSON.parse(raw));
    return true;
  } catch { return false; }
}
setInterval(saveGame, 10000);
window.addEventListener('beforeunload', saveGame);

// ================= 事件綁定 =================
$('sceneBtn').addEventListener('click', () => setScene(scene === 'farm' ? 'house' : 'farm'));
$('sickleBtn').addEventListener('click', () => doAction({ type: 'sickle' }));
$('coopBtn').addEventListener('click', () => openDialog('coop'));
$('stealBtn').addEventListener('click', () => openDialog('steal'));
$('rebirthBtn').addEventListener('click', () => openDialog('rebirth'));
$('outfitBtn').addEventListener('click', () => openDialog('outfit'));
$('petBtn').addEventListener('click', () => openDialog('pet'));

// ---- 背景音樂:morning-mood,循環播放 ----
const bgm = new Audio('bgm.m4a');
bgm.loop = true;
bgm.volume = 0.35;
let bgmAvailable = true;
bgm.addEventListener('error', () => { bgmAvailable = false; });
function updateBgmBtn() {
  $('bgmBtn').textContent = !bgm.paused ? '🎵 音樂' : '🔇 音樂';
}
$('bgmBtn').addEventListener('click', () => {
  if (!bgmAvailable) {
    toast('🎵 音樂檔載入失敗!確認 farm-game/public/bgm.m4a 存在後重新整理', 'warn');
    return;
  }
  if (bgm.paused) {
    bgm.play().then(() => {
      localStorage.setItem('farm-bgm', 'on');
      updateBgmBtn();
    }).catch(() => toast('🎵 播放失敗,請再點一次', 'warn'));
  } else {
    bgm.pause();
    localStorage.setItem('farm-bgm', 'off');
    updateBgmBtn();
  }
});
// 上次開著音樂的話,第一次點擊畫面時自動續播(瀏覽器限制:需要使用者互動才能播放)
if (localStorage.getItem('farm-bgm') === 'on') {
  const resume = () => {
    if (bgmAvailable) bgm.play().then(updateBgmBtn).catch(() => {});
    document.removeEventListener('pointerdown', resume);
  };
  document.addEventListener('pointerdown', resume);
}
$('doRebirthBtn').addEventListener('click', () => {
  if (S.coins < rebirthCost()) return toast(`金幣不夠!重生需要 💰${rebirthCost().toLocaleString()}`, 'warn');
  doAction({ type: 'rebirth' });
  renderRebirth();
});
$('buyTicketBtn').addEventListener('click', buyStealTicket);
$('startStealBtn').addEventListener('click', startSteal);
$('bedBtn')?.addEventListener('click', goToBed);
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

// 虛擬方向鍵:只在觸控裝置顯示,按住移動、放開停止
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (isTouchDevice) {
  $('dpad').classList.remove('hidden');
  $('moveHint').textContent = '🎮 按住畫面右下的方向按鍵移動小農夫';
}
document.querySelectorAll('.dpad-btn').forEach(btn => {
  const dir = btn.dataset.dir;
  const on = (e) => { e.preventDefault(); dpad[dir] = true; };
  const off = (e) => { e.preventDefault(); dpad[dir] = false; };
  btn.addEventListener('pointerdown', on);
  btn.addEventListener('pointerup', off);
  btn.addEventListener('pointercancel', off);
  btn.addEventListener('pointerleave', off);
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
});

// ================= 啟動(直接用本機存檔,不需登入) =================
const hadSave = loadGame();
setScene('farm');
render();
if (!hadSave) toast('🥔 歡迎來到悠閒農場!你有一顆馬鈴薯種子,點擊棕色田地把它種下吧!', 'good');
