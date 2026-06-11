'use strict';
// 聯機模組:房主權威制 —— 訪客把操作送給房主,房主執行後廣播完整狀態
const MP = {
  ws: null,
  code: null,
  isHostFlag: true,
  players: [],
  hostSpeed: 1, // 訪客用:房主目前的生長倍率(用來在快照之間平滑推進進度條)
  myName: '玩家',

  connected() { return !!this.ws && this.ws.readyState === 1 && !!this.code; },
  isGuest() { return this.connected() && !this.isHostFlag; },
  isHost() { return this.connected() && this.isHostFlag; },

  open(then) {
    if (this.ws && this.ws.readyState <= 1) { then && then(); return; }
    const proto = location.protocol === 'https:' ? 'wss://' : 'ws://';
    this.ws = new WebSocket(proto + location.host);
    this.ws.onopen = () => then && then();
    this.ws.onmessage = (ev) => this.onMessage(JSON.parse(ev.data));
    this.ws.onclose = () => {
      if (this.code) toast('⚠️ 與伺服器斷線了', 'warn');
      this.code = null; this.isHostFlag = true; this.players = [];
      renderCoop();
    };
    this.ws.onerror = () => {};
  },

  send(obj) { if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(obj)); },

  create(name) {
    this.myName = name;
    this.open(() => this.send({ t: 'create', name }));
  },
  join(code, name) {
    this.myName = name;
    this.open(() => this.send({ t: 'join', code, name }));
  },
  leave() {
    this.send({ t: 'leave' });
    this.code = null; this.isHostFlag = true; this.players = [];
    toast('已離開房間');
    renderCoop();
  },

  sendAction(a) { this.send({ t: 'action', a }); },
  notifyAll(msg) { if (this.connected()) this.send({ t: 'notify', msg }); },

  broadcastState() {
    if (!this.isHost()) return;
    this.send({ t: 'state', s: makeSnapshot() });
  },

  onMessage(msg) {
    switch (msg.t) {
      case 'created':
        this.code = msg.code; this.isHostFlag = true;
        toast(`🏡 房間建立成功!房號:${msg.code}`, 'good');
        renderCoop();
        break;
      case 'joined':
        this.code = msg.code; this.isHostFlag = false;
        toast(`🔑 已加入房間 ${msg.code}`, 'good');
        renderCoop();
        break;
      case 'error':
        toast('❌ ' + msg.msg, 'warn');
        break;
      case 'players':
        this.players = msg.list;
        renderCoop();
        break;
      case 'syncRequest':
        this.broadcastState();
        break;
      case 'state': // 訪客收到房主的完整狀態
        if (this.isGuest()) applySnapshot(msg.s);
        break;
      case 'action': // 房主收到訪客的操作
        if (this.isHost()) {
          execAction(msg.a, false);
          this.broadcastState();
        }
        break;
      case 'youAreHost':
        this.isHostFlag = true;
        toast('👑 原房主離開,你成為新房主!', 'good');
        renderCoop();
        break;
      case 'notify':
        toast(msg.msg);
        break;
    }
  },
};

// 房主每 2 秒同步一次狀態(操作後也會即時同步)
setInterval(() => MP.broadcastState(), 2000);
