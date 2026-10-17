(function () {
  'use strict';
  var C = window.Chess, Game = C.Game, R = window.Review, T = window.I18N.t;
  var $ = function (id) { return document.getElementById(id); };
  // lớp CSS chứa hình quân: wP, bQ... (chỉ số theo mã quân trong chess.js)
  function pieceCls(code) { return 'wb'[code >> 3] + ' PNBRQK'[code & 7]; }
  // [phút, giây cộng thêm]; null = không tính giờ
  var TCS = [null, [1, 0], [3, 0], [3, 2], [5, 0], [10, 0], [15, 10], [30, 0]];
  var REVIEW_OPTS = { stockfish: { depth: 16, movetime: 1200 }, builtin: { depth: 6, movetime: 700 } };

  var boardEl = $('board'), squaresEl = $('squares'), piecesEl = $('pieces'), arrowsEl = $('arrows');
  var badgeEl = $('badge'), promoEl = $('promo'), movesEl = $('moves');

  var prefs = { opp: 'ai', side: '0', elo: 1000, tc: 0 };
  try { var saved = JSON.parse(localStorage.getItem('chess.prefs')); if (saved) for (var k in prefs) if (k in saved) prefs[k] = saved[k]; }
  catch (e) { /* dùng mặc định */ }

  var S = {
    game: new Game(), hist: [], keys: {}, opp: 'ai', human: 0, elo: 1000, orient: 0,
    over: null, mode: 'play', gameId: 0, thinking: false, sound: true,
    sel: -1, targets: [], review: null, analysis: null, fens: null, ply: 0,
    tc: null, clock: [0, 0], tickAt: null // tickAt: thời điểm đồng hồ của bên đang đi bắt đầu chạy
  };
  var view = S.game;   // thế cờ đang hiển thị
  var last = null;     // nước vừa đi (để tô sáng)
  var pieces = [];     // {el, sq, code}
  var sqEls = [];
  var drag = null;

  var engine = new Engine();
  var engineReady = engine.init().then(renderEngineTag);
  window.Openings.init().then(function () { renderStatus(); });
  // Bàn cờ đang nhận nước đi: ván chính, hoặc thế cờ luyện tập khi đang "tự tìm nước tốt hơn"
  function curGame() { return S.mode === 'retry' && S.retry ? S.retry.g : S.game; }
  function renderEngineTag() {
    $('engineTag').textContent = !engine.kind ? T('engine_loading') : engine.kind === 'stockfish' ? 'Stockfish 10' : T('engine_builtin');
  }

  // ---------- âm thanh ----------
  var sfxVol = 70;
  try { var sv = localStorage.getItem('chess.sfx'); if (sv !== null) sfxVol = +sv; } catch (e) { /* bỏ qua */ }
  function sound(kind) {
    if (!S.sound || !sfxVol) return;
    try {
      var actx = window.Music.ctx(), k = Math.pow(sfxVol / 70, 2); // 70 = mức mặc định, giữ âm lượng như trước
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      var f = kind === 'capture' ? 150 : kind === 'check' ? 330 : kind === 'end' ? 440 : 215;
      o.type = 'triangle';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f / 2, t + (kind === 'end' ? 0.35 : 0.09));
      g.gain.setValueAtTime((kind === 'capture' ? 0.34 : 0.22) * k, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + (kind === 'end' ? 0.4 : 0.11));
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + 0.45);
    } catch (e) { /* trình duyệt chặn âm thanh: bỏ qua */ }
  }
  function moveSound(inf) {
    sound(/#/.test(inf.san) ? 'end' : /\+/.test(inf.san) ? 'check' : inf.captured ? 'capture' : 'move');
  }

  // ---------- bàn cờ ----------
  function pos(sq) { var f = sq & 7, r = sq >> 3; return S.orient ? [7 - f, 7 - r] : [f, r]; }
  function place(el, sq) { var p = pos(sq); el.style.transform = 'translate(' + p[0] * 100 + '%,' + p[1] * 100 + '%)'; }

  function buildSquares() {
    squaresEl.innerHTML = '';
    for (var row = 0; row < 8; row++) for (var col = 0; col < 8; col++) {
      var sq = S.orient ? (7 - row) * 8 + (7 - col) : row * 8 + col;
      var d = document.createElement('div');
      d.className = 'sq ' + ((((sq >> 3) + (sq & 7)) & 1) ? 'dark' : 'light');
      if (col === 0) d.innerHTML += '<span class="coord rank">' + (8 - (sq >> 3)) + '</span>';
      if (row === 7) d.innerHTML += '<span class="coord file">' + 'abcdefgh'[sq & 7] + '</span>';
      squaresEl.appendChild(d);
      sqEls[sq] = d;
    }
  }

  function makePieceEl(code) {
    var el = document.createElement('div');
    el.className = 'piece ' + pieceCls(code);
    return el;
  }

  // Đưa các quân trên màn hình về đúng mảng `target`, tái sử dụng phần tử để chuyển động liền mạch
  function syncPieces(target, animate) {
    var keep = [], rest = [], next = [], i;
    pieces.forEach(function (p) {
      if (target[p.sq] === p.code && !keep[p.sq]) keep[p.sq] = p; else rest.push(p);
    });
    for (var sq = 0; sq < 64; sq++) {
      var code = target[sq];
      if (!code) continue;
      if (keep[sq]) { next.push(keep[sq]); continue; }
      var bi = -1, bd = 99;
      for (i = 0; i < rest.length; i++) {
        if (rest[i].code !== code) continue;
        var d = Math.max(Math.abs((rest[i].sq >> 3) - (sq >> 3)), Math.abs((rest[i].sq & 7) - (sq & 7)));
        if (d < bd) { bd = d; bi = i; }
      }
      var p;
      if (bi >= 0) {
        p = rest.splice(bi, 1)[0];
        p.sq = sq;
        if (!animate) snap(p.el, sq); else { raise(p.el); place(p.el, sq); }
      } else {
        p = { el: makePieceEl(code), sq: sq, code: code };
        snap(p.el, sq);
        piecesEl.appendChild(p.el);
      }
      next.push(p);
    }
    rest.forEach(function (p) {
      var el = p.el;
      if (!animate) { el.remove(); return; }
      el.classList.add('gone');
      setTimeout(function () { el.remove(); }, 150);
    });
    pieces = next;
  }
  function snap(el, sq) {
    el.classList.add('notrans');
    place(el, sq);
    void el.offsetWidth;
    el.classList.remove('notrans');
  }
  function raise(el) {
    el.classList.add('top');
    setTimeout(function () { el.classList.remove('top'); }, 200);
  }
  function pieceAt(sq) {
    for (var i = 0; i < pieces.length; i++) if (pieces[i].sq === sq) return pieces[i];
    return null;
  }

  function paint() {
    var i, checkSq = view.inCheck() ? view.king[view.turn] : -1;
    for (i = 0; i < 64; i++) {
      var cl = sqEls[i].classList;
      cl.toggle('last', !!last && (last.from === i || last.to === i));
      cl.toggle('sel', S.sel === i);
      cl.toggle('check', checkSq === i);
      cl.toggle('hint', S.mode === 'retry' && !!S.retry && S.retry.hint === i);
      cl.remove('target', 'capture', 'hover');
    }
    S.targets.forEach(function (m) {
      var t = C.mTo(m);
      sqEls[t].classList.add(view.b[t] || C.mFlag(m) === 1 ? 'capture' : 'target');
    });
    boardEl.classList.toggle('can-move', canInteract());
  }

  function canInteract() {
    if (S.mode === 'retry') return !!S.retry && S.retry.state === 'await' && promoEl.hidden;
    return S.mode === 'play' && !S.over && promoEl.hidden && (S.opp === 'human' || S.game.turn === S.human);
  }

  function select(sq) {
    S.sel = sq;
    S.targets = sq < 0 ? [] : curGame().legal().filter(function (m) { return C.mFrom(m) === sq; });
    paint();
  }

  // ---------- thao tác chuột / chạm ----------
  function sqAt(x, y) {
    var r = boardEl.getBoundingClientRect();
    var col = Math.floor((x - r.left) / r.width * 8), row = Math.floor((y - r.top) / r.height * 8);
    if (col < 0 || col > 7 || row < 0 || row > 7) return -1;
    return S.orient ? (7 - row) * 8 + (7 - col) : row * 8 + col;
  }
  function isTarget(sq) { return S.targets.some(function (m) { return C.mTo(m) === sq; }); }

  boardEl.addEventListener('pointerdown', function (e) {
    if (e.button || !canInteract()) return;
    var sq = sqAt(e.clientX, e.clientY);
    if (sq < 0) return;
    e.preventDefault();
    if (S.sel >= 0 && S.sel !== sq && isTarget(sq)) { commit(S.sel, sq, true); return; }
    var p = curGame().b[sq];
    if (p && (p >> 3) === curGame().turn) {
      var wasSel = S.sel === sq;
      select(sq);
      drag = { sq: sq, piece: pieceAt(sq), x: e.clientX, y: e.clientY, moved: false, wasSel: wasSel, hover: -1 };
      try { boardEl.setPointerCapture(e.pointerId); } catch (err) { /* không sao */ }
    } else select(-1);
  });

  boardEl.addEventListener('pointermove', function (e) {
    if (!drag || !drag.piece) return;
    if (!drag.moved) {
      if (Math.abs(e.clientX - drag.x) + Math.abs(e.clientY - drag.y) < 5) return;
      drag.moved = true;
      drag.piece.el.classList.add('dragging');
      boardEl.classList.add('grabbing');
    }
    var r = boardEl.getBoundingClientRect(), size = r.width / 8;
    var x = Math.max(0, Math.min(r.width, e.clientX - r.left)) - size / 2;
    var y = Math.max(0, Math.min(r.height, e.clientY - r.top)) - size / 2;
    drag.piece.el.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    var h = sqAt(e.clientX, e.clientY);
    if (h !== drag.hover) {
      if (drag.hover >= 0) sqEls[drag.hover].classList.remove('hover');
      if (h >= 0 && isTarget(h)) { sqEls[h].classList.add('hover'); drag.hover = h; } else drag.hover = -1;
    }
  });

  function endDrag(e, cancelled) {
    if (!drag) return;
    var d = drag;
    drag = null;
    boardEl.classList.remove('grabbing');
    if (d.hover >= 0) sqEls[d.hover].classList.remove('hover');
    if (!d.moved) { if (d.wasSel) select(-1); return; }
    d.piece.el.classList.remove('dragging');
    var sq = cancelled || !canInteract() ? -1 : sqAt(e.clientX, e.clientY);
    if (sq >= 0 && sq !== d.sq && isTarget(sq)) commit(d.sq, sq, false);
    else { raise(d.piece.el); place(d.piece.el, d.sq); }
  }
  boardEl.addEventListener('pointerup', function (e) { endDrag(e, false); });
  boardEl.addEventListener('pointercancel', function (e) { endDrag(e, true); });
  boardEl.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function commit(from, to, animate) {
    var opts = S.targets.filter(function (m) { return C.mTo(m) === to; });
    if (!opts.length || !canInteract()) return;
    var play = S.mode === 'retry' ? retryMove : doMove;
    if (opts.length === 1) { play(opts[0], animate); return; }
    var p = pieceAt(from);
    if (p) place(p.el, from);
    askPromo(to, curGame().turn, function (ty) {
      if (!ty || !canInteract()) { select(-1); return; }
      play(opts.filter(function (m) { return C.mPromo(m) === ty; })[0], true);
    });
  }

  function askPromo(sq, color, cb) {
    var p = pos(sq), col = document.createElement('div');
    col.className = 'promo-col' + (p[1] === 7 ? ' up' : '');
    col.style.left = p[0] * 12.5 + '%';
    col.style[p[1] === 7 ? 'bottom' : 'top'] = '0';
    [C.Q, C.N, C.R, C.B].forEach(function (ty) {
      var bt = document.createElement('button');
      bt.type = 'button';
      bt.appendChild(makePieceEl(ty | color << 3));
      bt.onclick = function (e) { e.stopPropagation(); done(ty); };
      col.appendChild(bt);
    });
    promoEl.innerHTML = '';
    promoEl.appendChild(col);
    promoEl.hidden = false;
    promoEl.onpointerdown = function (e) { e.stopPropagation(); };
    promoEl.onclick = function () { done(0); };
    function done(ty) { promoEl.hidden = true; cb(ty); }
  }

  // ---------- đồng hồ ----------
  function remaining(c) {
    var v = S.clock[c];
    if (S.tickAt !== null && S.game.turn === c) v -= performance.now() - S.tickAt;
    return v;
  }
  function stopClock() {
    if (S.tickAt === null) return;
    S.clock[S.game.turn] = Math.max(0, remaining(S.game.turn));
    S.tickAt = null;
  }
  function fmtClock(ms) {
    ms = Math.max(0, ms);
    if (ms < 10000) return (Math.floor(ms / 100) / 10).toFixed(1);
    var s = Math.ceil(ms / 1000), m = Math.floor(s / 60);
    return m + ':' + ('0' + s % 60).slice(-2);
  }
  // times: [trắng, đen] cố định (khi xem lại); bỏ trống thì lấy đồng hồ đang chạy
  function renderClocks(times) {
    [['playerBottom', S.orient], ['playerTop', S.orient ^ 1]].forEach(function (x) {
      var el = $(x[0]).querySelector('.clock'), c = x[1];
      el.hidden = !S.tc;
      if (!S.tc) return;
      var ms = times ? times[c] : remaining(c), txt = fmtClock(ms);
      if (el.textContent !== txt) el.textContent = txt;
      el.classList.toggle('low', ms < 20000);
      el.classList.toggle('run', !times && S.tickAt !== null && S.game.turn === c);
    });
  }
  function clockAt(ply) { return ply ? S.hist[ply - 1].clock : [S.tc.base, S.tc.base]; }

  function hasMatingMaterial(c) {
    for (var i = 0, minors = 0; i < 64; i++) {
      var p = S.game.b[i];
      if (!p || (p >> 3) !== c) continue;
      var ty = p & 7;
      if (ty === C.P || ty === C.R || ty === C.Q) return true;
      if (ty !== C.K && ++minors > 1) return true;
    }
    return false;
  }

  function flagFall() {
    var loser = S.game.turn;
    S.clock[loser] = 0;
    S.tickAt = null;
    engine.cancel();
    S.gameId++;
    S.over = { key: hasMatingMaterial(loser ^ 1) ? 'over_time' : 'over_time_draw', a: loser ^ 1, b: loser };
    S.thinking = false;
    promoEl.hidden = true;
    if (drag && drag.moved) { drag.piece.el.classList.remove('dragging'); place(drag.piece.el, drag.sq); }
    drag = null;
    boardEl.classList.remove('grabbing');
    sound('end');
    select(-1);
    renderStatus(); renderPlayers();
  }

  setInterval(function () {
    if (S.tickAt === null) return;
    if (remaining(S.game.turn) <= 0) flagFall();
    renderClocks();
  }, 100);

  // ---------- diễn biến ván cờ ----------
  function doMove(m, animate) {
    var g = S.game, inf = g.info(m), mover = g.turn;
    if (S.tc && S.tickAt !== null) S.clock[mover] = Math.max(0, remaining(mover)) + S.tc.inc;
    g.make(m);
    if (S.tc) S.tickAt = performance.now(); // đồng hồ chỉ bắt đầu chạy sau nước đầu tiên
    var key = g.key();
    S.keys[key] = (S.keys[key] || 0) + 1;
    S.hist.push({ info: inf, fen: g.fen(), clock: S.clock.slice() });
    S.sel = -1; S.targets = [];

    var p = pieceAt(inf.from);
    if (p) {
      p.sq = inf.to;
      if (inf.promo) { p.code = inf.promo | inf.color << 3; p.el.className = 'piece ' + pieceCls(p.code); }
      if (animate) { raise(p.el); place(p.el, inf.to); } else snap(p.el, inf.to);
    }
    syncPieces(g.b, true);
    last = inf;
    checkOver();
    moveSound(inf);
    paint(); renderMoves(); renderStatus(); renderPlayers();
    if (!S.over) requestAI();
  }

  function checkOver() {
    var g = S.game;
    if (!g.legal().length) S.over = g.inCheck() ? { key: 'over_mate', a: g.turn ^ 1 } : { key: 'over_stalemate' };
    else if (g.insufficient()) S.over = { key: 'over_material' };
    else if (S.keys[g.key()] >= 3) S.over = { key: 'over_rep' };
    else if (g.half >= 100) S.over = { key: 'over_50' };
    if (S.over) { S.thinking = false; S.tickAt = null; }
  }
  function overText() {
    var o = S.over, sides = T('sides');
    return o ? T(o.key, sides[o.a], sides[o.b]) : '';
  }

  // ---------- máy chơi theo Elo ----------
  // Engine tìm vài nước ứng viên ở độ sâu giới hạn, rồi chọn theo xác suất: Elo càng thấp càng dễ chọn nước kém.
  function eloParams(elo) {
    if (elo >= 3200) return { depth: 18, multipv: 1, temp: 0, blunder: 0, movetime: 1000 };
    return {
      depth: Math.max(1, Math.min(14, Math.round(1 + (elo - 250) / 220))),
      multipv: elo >= 2400 ? 3 : elo >= 1600 ? 5 : 8,
      temp: 300 * Math.exp(-(elo - 250) / 600),                 // "độ nhiễu" tính bằng centipawn
      blunder: elo >= 2000 ? 0 : 0.3 * Math.exp(-(elo - 250) / 450), // xác suất đi bừa một nước trong danh sách
      movetime: 1500
    };
  }
  function pickMove(r, p, turn, elo) {
    var lines = r.lines.filter(Boolean);
    if (p.multipv === 1 || lines.length < 2) return r.best;
    var sign = turn === 0 ? 1 : -1, best = -Infinity, i;
    var sc = lines.map(function (l) {
      var v = l.mate !== null ? (l.mate > 0 ? 1 : -1) * (10000 - Math.abs(l.mate) * 100) : l.cp;
      return v * sign;
    });
    for (i = 0; i < sc.length; i++) {
      if (elo >= 600 && lines[i].mate === sign) return lines[i].move; // không bỏ lỡ chiếu hết 1 nước
      if (sc[i] > best) best = sc[i];
    }
    if (Math.random() < p.blunder) return lines[Math.floor(Math.random() * lines.length)].move;
    var w = sc.map(function (s) { return Math.exp(-(best - s) / p.temp); });
    var x = Math.random() * w.reduce(function (a, v) { return a + v; }, 0);
    for (i = 0; i < w.length; i++) { x -= w[i]; if (x <= 0) return lines[i].move; }
    return lines[0].move;
  }

  function requestAI() {
    if (S.over || S.opp !== 'ai' || S.game.turn === S.human) return;
    var id = S.gameId, t0 = performance.now(), fen = S.game.fen(), turn = S.game.turn, elo = S.elo, p = eloParams(elo);
    var left = S.tc ? remaining(turn) : Infinity;
    var opts = { depth: p.depth, multipv: p.multipv, movetime: Math.max(40, Math.min(p.movetime, left / 25)) };
    // nghỉ một nhịp như người thật, nhưng không tiêu quá nhiều giờ khi còn ít thời gian
    var delay = Math.min(450 + Math.random() * 1100, left / 30);
    S.thinking = true;
    renderStatus();
    engineReady.then(function () {
      return id === S.gameId ? engine.analyze(fen, opts) : null;
    }).then(function (r) {
      if (!r || id !== S.gameId) return;
      var mv = pickMove(r, p, turn, elo);
      setTimeout(function () {
        if (id !== S.gameId || S.over) return;
        var m = S.game.fromUci(mv) || S.game.fromUci(r.best) || S.game.legal()[0];
        S.thinking = false;
        if (m) doMove(m, true);
      }, Math.max(0, delay - (performance.now() - t0)));
    });
  }

  function newGame(opts) {
    engine.cancel();
    S.gameId++;
    S.opp = opts.opp; S.elo = opts.elo;
    S.human = opts.opp === 'ai' ? opts.side : 0;
    var flipped = S.orient !== S.human;
    S.orient = S.human;
    var tc = TCS[opts.tc];
    S.tc = tc ? { base: tc[0] * 60000, inc: tc[1] * 1000 } : null;
    S.clock = S.tc ? [S.tc.base, S.tc.base] : [0, 0];
    S.tickAt = null;
    S.game = new Game(); S.hist = []; S.keys = {}; S.over = null; S.mode = 'play'; S.thinking = false;
    S.keys[S.game.key()] = 1;
    S.sel = -1; S.targets = []; S.review = null; S.analysis = null; S.ply = 0;
    view = S.game; last = null;
    promoEl.hidden = true;
    setReviewUI(false);
    buildSquares();
    syncPieces(S.game.b, !flipped);
    if (flipped) pieces.forEach(function (p) { snap(p.el, p.sq); });
    paint(); renderMoves(); renderStatus(); renderPlayers();
    requestAI();
  }

  function undo() {
    if (S.mode !== 'play' || !S.hist.length) return;
    engine.cancel();
    S.gameId++;
    var n = S.opp === 'ai' && S.game.turn === S.human ? 2 : 1;
    n = Math.min(n, S.hist.length);
    while (n--) {
      S.keys[S.game.key()]--;
      S.game.unmake();
      S.hist.pop();
    }
    S.over = null; S.thinking = false; S.sel = -1; S.targets = [];
    promoEl.hidden = true;
    if (S.tc) {
      S.clock = clockAt(S.hist.length).slice();
      S.tickAt = S.hist.length ? performance.now() : null;
    }
    last = S.hist.length ? S.hist[S.hist.length - 1].info : null;
    syncPieces(S.game.b, true);
    paint(); renderMoves(); renderStatus(); renderPlayers();
    requestAI();
  }

  function resign() {
    if (S.mode !== 'play' || S.over) return;
    engine.cancel();
    S.gameId++;
    stopClock();
    var loser = S.opp === 'ai' ? S.human : S.game.turn;
    S.over = { key: 'over_resign', a: loser ^ 1, b: loser };
    S.thinking = false; S.sel = -1; S.targets = [];
    sound('end');
    paint(); renderStatus(); renderPlayers();
  }

  // ---------- hiển thị bảng bên phải ----------
  function renderStatus() {
    var st = $('status'), g = S.game, op = window.Openings.name(S.hist.map(function (h) { return h.info.san; }));
    if (S.mode === 'review' || S.mode === 'retry') st.innerHTML = T('st_review') + '<small>' + overText() + '</small>';
    else {
      st.textContent = S.over ? overText() : S.thinking ? T('st_thinking') : T('st_turn', T('sides')[g.turn], g.inCheck());
      // tên khai cuộc đang đi, giúp người chơi nhận ra mình đang ở biến nào
      if (op) st.innerHTML += '<small class="opening">📖 ' + T('opening_live', op.name) + ' · ' + op.eco + '</small>';
    }
    $('btnReview').hidden = !(S.mode === 'play' && S.over && S.hist.length);
    $('btnUndo').disabled = S.mode !== 'play' || !S.hist.length;
    $('btnResign').disabled = S.mode !== 'play' || !!S.over;
  }

  // Quân mỗi bên đã ăn được (suy ra từ số quân còn trên bàn, nên phong cấp cũng được tính đúng về vật chất)
  function captures() {
    var counts = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0]], val = [0, 1, 3, 3, 5, 9, 0], init = [0, 8, 2, 2, 2, 1, 1];
    var mat = [0, 0], i;
    for (i = 0; i < 64; i++) { var p = view.b[i]; if (p) { counts[p >> 3][p & 7]++; mat[p >> 3] += val[p & 7]; } }
    return [0, 1].map(function (c) {
      var html = '', n = 0;
      for (var ty = 1; ty <= 5; ty++) {
        var k = Math.max(0, init[ty] - counts[c ^ 1][ty]);
        if (!k) continue;
        html += '<span class="cap-grp">';
        for (var j = 0; j < k; j++) html += '<i class="pi ' + pieceCls(ty | (c ^ 1) << 3) + '"></i>';
        html += '</span>';
        n += k;
      }
      return { html: html, n: n, diff: mat[c] - mat[c ^ 1] };
    });
  }

  function renderPlayers() {
    var sides = T('sides'), cap = captures();
    [['playerBottom', S.orient], ['playerTop', S.orient ^ 1]].forEach(function (x) {
      var el = $(x[0]), c = x[1], name = sides[c];
      if (S.opp === 'ai') name = c === S.human ? T('you', sides[c]) : T('bot', S.elo);
      var pn = el.querySelector('.pname');
      pn.textContent = name;
      pn.classList.toggle('turn', view.turn === c && !(S.over && S.mode === 'play'));
      el.querySelector('.pcap').innerHTML = cap[c].html + (cap[c].diff > 0 ? '<em>+' + cap[c].diff + '</em>' : '');
    });
    // khung "quân đã ăn" trong bảng bên phải, bên đang ở dưới bàn cờ đứng sau
    $('captures').innerHTML = [S.orient ^ 1, S.orient].map(function (c) {
      var who = S.opp === 'ai' ? (c === S.human ? T('you', sides[c]) : T('bot', S.elo)) : sides[c];
      return '<div class="cap-row"><span class="cap-who"><i class="pi ' + pieceCls(6 | c << 3) + '"></i>' + who + '</span>' +
        '<span class="cap-pcs">' + (cap[c].n ? cap[c].html : '<span class="cap-none">' + T('cap_none') + '</span>') + '</span>' +
        (cap[c].diff > 0 ? '<em>+' + cap[c].diff + '</em>' : '') + '</div>';
    }).join('');
    renderClocks(S.mode === 'review' && S.tc ? clockAt(S.ply) : null);
  }

  function renderMoves() {
    var html = '', rv = S.review, review = S.mode === 'review';
    if (!S.hist.length) html = '<div class="empty">' + T('moves_empty') + '</div>';
    S.hist.forEach(function (h, i) {
      if (i % 2 === 0) html += '<div class="num">' + (i / 2 + 1) + '.</div>';
      var dot = '';
      if (rv) dot = '<i class="dot" style="background:' + R.CLASSES[rv.recs[i].cls].color + '" title="' + T('cls_' + rv.recs[i].cls) + '"></i>';
      html += '<div class="mv' + (review && S.ply === i + 1 ? ' active' : '') + '" data-ply="' + (i + 1) + '">' + dot + h.info.san + '</div>';
    });
    movesEl.innerHTML = html;
    movesEl.classList.toggle('clickable', !!rv);
    var act = movesEl.querySelector('.active');
    if (act) act.scrollIntoView({ block: 'nearest' });
    else if (!review) movesEl.scrollTop = movesEl.scrollHeight;
  }
  movesEl.addEventListener('click', function (e) {
    var mv = e.target.closest('.mv');
    if (mv && S.review) goPly(+mv.dataset.ply);
  });

  // ---------- phân tích sau ván ----------
  var prog = [0, 0];
  function setReviewUI(on) {
    stopExplore();
    S.retry = null;
    $('review').hidden = !on;
    // khi phân tích, bảng bên phải giữ chiều cao cố định để nút tiến/lùi không nhảy theo độ dài lời nhận xét
    document.querySelector('.panel').classList.toggle('reviewing', on);
    $('nav').hidden = true;
    $('reviewBody').hidden = true;
    $('progress').hidden = false;
    $('evalbar').hidden = true;
    document.querySelector('.board-area').classList.remove('with-eval');
    badgeEl.hidden = true;
    arrowsEl.innerHTML = '';
  }

  function startReview() {
    if (!S.over || !S.hist.length) return;
    engine.cancel();
    var id = ++S.gameId, n = S.hist.length;
    S.mode = 'review'; S.sel = -1; S.targets = [];
    S.fens = [C.START].concat(S.hist.map(function (h) { return h.fen; }));
    setReviewUI(true);
    paint(); renderStatus();
    var A = new Array(n + 1), end = new Game(S.fens[n]);
    if (!end.legal().length) A[n] = end.inCheck() ? { terminal: 'mate', winner: end.turn ^ 1, pv: [] } : { terminal: 'draw', pv: [] };
    var done = 0, total = A[n] ? n : n + 1;
    progress(0, total);

    engineReady.then(function () {
      var opts = REVIEW_OPTS[engine.kind], chain = Promise.resolve(true);
      // đi lùi từ cuối ván để tận dụng bảng băm của engine
      for (var i = n; i >= 0; i--) (function (i) {
        if (A[i]) return;
        chain = chain.then(function (ok) {
          if (!ok || id !== S.gameId) return false;
          return engine.analyze(S.fens[i], opts).then(function (r) {
            if (!r || id !== S.gameId) return false;
            A[i] = r;
            progress(++done, total);
            return true;
          });
        });
      })(i);
      return chain;
    }).then(function (ok) {
      if (!ok || id !== S.gameId) return;
      S.analysis = A;
      S.review = R.build(C.START, S.hist, A);
      showReview(0);
    });
  }

  function progress(done, total) {
    prog = [done, total];
    $('progressFill').style.width = (total ? done / total * 100 : 0) + '%';
    $('progressText').textContent = T('progress', done, total);
  }

  function showReview(ply) {
    var rv = S.review, n = S.hist.length, i, sides = T('sides');
    $('progress').hidden = true;
    $('reviewBody').hidden = false;
    $('nav').hidden = false;
    $('evalbar').hidden = false;
    document.querySelector('.board-area').classList.add('with-eval');

    // tóm tắt
    var rows = '';
    R.ORDER.forEach(function (k) {
      var a = rv.counts[0][k] || 0, bq = rv.counts[1][k] || 0, c = R.CLASSES[k];
      if (!a && !bq) return;
      rows += '<div class="l cnt" style="color:' + c.color + '">' + a + '</div><div class="mid">' + T('cls_' + k) +
        '</div><div class="cnt" style="color:' + c.color + '">' + bq + '</div>';
    });
    $('summary').innerHTML =
      (rv.opening ? '<div class="op-name">📖 ' + rv.opening.name + ' · ' + rv.opening.eco + '</div>' : '') +
      '<div class="l"><div class="who">' + sides[0] + '</div><div class="acc">' + rv.accuracy[0].toFixed(1) + '%</div></div>' +
      '<div class="mid">' + T('sum_accuracy') + '</div>' +
      '<div><div class="who">' + sides[1] + '</div><div class="acc">' + rv.accuracy[1].toFixed(1) + '%</div></div>' +
      '<details><summary>' + T('sum_stats') + '</summary><div class="rows">' + rows + '</div></details>';
    renderLessons();

    // biểu đồ lợi thế
    var pts = ['0,100', '0,' + (100 - rv.w0).toFixed(1)], dots = '';
    for (i = 0; i < n; i++) {
      var x = (i + 1) / n * 100, rec = rv.recs[i];
      pts.push(x.toFixed(2) + ',' + (100 - rec.w).toFixed(1));
      if (/brilliant|inaccuracy|mistake|blunder/.test(rec.cls))
        dots += '<i class="gdot" style="left:' + x + '%;top:' + Math.max(6, Math.min(94, 100 - rec.w)) + '%;background:' + R.CLASSES[rec.cls].color + '"></i>';
    }
    pts.push('100,100');
    $('graph').innerHTML = '<svg viewBox="0 0 100 100" preserveAspectRatio="none"><polygon fill="#f2f2ef" points="' + pts.join(' ') +
      '"/></svg><div class="mid"></div>' + dots + '<div class="cursor" id="gcursor"></div>';

    renderMoves();
    goPly(ply);
  }

  // Bài học: độ chính xác theo giai đoạn, khoảnh khắc quyết định, lỗi lặp lại (của người chơi khi đánh với máy)
  function renderLessons() {
    var rv = S.review, sides = T('sides'), colors = S.opp === 'ai' ? [S.human] : [0, 1];
    var html = '<summary>' + T('ls_title') + '</summary><div class="ls-body">';
    html += '<div class="ls-h">' + T('ls_phases') + '</div><table class="phases"><tr><th></th>' +
      ['opening', 'middlegame', 'endgame'].map(function (p) { return '<th>' + T('ph_' + p) + '</th>'; }).join('') + '</tr>';
    [0, 1].forEach(function (c) {
      html += '<tr><td>' + sides[c] + '</td>' + ['opening', 'middlegame', 'endgame'].map(function (p) {
        var v = rv.phases[c][p];
        return '<td>' + (v === null ? '—' : '<span class="' + (v >= 80 ? 'hi' : v >= 60 ? 'mid' : 'lo') + '">' + v.toFixed(0) + '%</span>') + '</td>';
      }).join('') + '</tr>';
    });
    html += '</table>';
    var km = R.keyMoments(rv, colors, 3);
    if (km.length) {
      html += '<div class="ls-h">' + T('ls_moments') + '</div><ul class="moments">';
      km.forEach(function (x) {
        var h = S.hist[x.ply - 1].info, cl = R.CLASSES[x.r.cls];
        html += '<li data-ply="' + x.ply + '"><i style="background:' + cl.color + '">' + cl.sym + '</i>' +
          (Math.floor((x.ply - 1) / 2) + 1) + (h.color ? '... ' : '. ') + h.san + ' <span>' + x.r.evalB + ' → ' + x.r.evalA + '</span></li>';
      });
      html += '</ul>';
    }
    html += '<ul class="lessons-list">' + R.lessons(rv, colors).map(function (s) { return '<li>' + s + '</li>'; }).join('') + '</ul></div>';
    $('lessons').innerHTML = html;
  }
  $('lessons').addEventListener('click', function (e) {
    var li = e.target.closest('[data-ply]');
    if (li) goPly(+li.dataset.ply);
  });

  $('graph').addEventListener('click', function (e) {
    if (!S.review) return;
    var r = this.getBoundingClientRect();
    goPly(Math.round((e.clientX - r.left) / r.width * S.hist.length));
  });

  function setEvalBar(w, txt) {
    var bar = $('evalbar');
    bar.classList.toggle('flip', !!S.orient);
    bar.querySelector('.evalbar-white').style.height = w + '%';
    var tx = bar.querySelector('.evalbar-text');
    tx.textContent = txt.replace(/^[+−]/, '');
    tx.className = 'evalbar-text ' + (w >= 50 ? 'w' : 'b');
  }

  function goPly(k) {
    if (!S.review) return;
    stopExplore();
    if (S.mode === 'retry') { S.mode = 'review'; S.retry = null; S.sel = -1; S.targets = []; renderStatus(); }
    var n = S.hist.length, prev = S.ply;
    k = Math.max(0, Math.min(n, k));
    S.ply = k;
    view = new Game(S.fens[k]);
    last = k ? S.hist[k - 1].info : null;
    syncPieces(view.b, true);
    paint();
    if (k === prev + 1) moveSound(last);

    var rv = S.review, rec = k ? rv.recs[k - 1] : null;
    setEvalBar(rec ? rec.w : rv.w0, rec ? rec.evalA : rv.eval0);
    $('gcursor').style.left = (n ? k / n * 100 : 0) + '%';

    // mũi tên: xanh = nước tốt nhất lẽ ra nên đi, đỏ = đòn đáp trả của đối phương sau nước kém
    var arrows = [];
    badgeEl.hidden = !rec;
    if (rec) {
      var c = R.CLASSES[rec.cls];
      place(badgeEl, last.to);
      badgeEl.innerHTML = '<i style="background:' + c.color + '">' + c.sym + '</i>';
      if (rec.bestUci && rec.cls !== 'excellent') arrows.push([rec.bestUci, '#5fae2e']);
      if (isBad(rec) && rec.replyPv[0]) arrows.push([rec.replyPv[0], '#e5533d']);
    }
    drawArrows(arrows);
    renderComment(k, rec);
    renderPlayers();
    var old = movesEl.querySelector('.active');
    if (old) old.classList.remove('active');
    var cur = movesEl.querySelector('[data-ply="' + k + '"]');
    if (cur) { cur.classList.add('active'); cur.scrollIntoView({ block: 'nearest' }); }
    else movesEl.scrollTop = 0;
  }
  function isBad(rec) { return /inaccuracy|mistake|blunder/.test(rec.cls); }

  // list: [[uci, màu], ...]
  function drawArrows(list) {
    arrowsEl.innerHTML = list.map(function (a) {
      var from = C.sqFromName(a[0].slice(0, 2)), to = C.sqFromName(a[0].slice(2, 4)), col = a[1];
      var p = pos(from), z = pos(to), x1 = p[0] + .5, y1 = p[1] + .5, x2 = z[0] + .5, y2 = z[1] + .5;
      var dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy), ux = dx / len, uy = dy / len;
      var hx = x2 - ux * .42, hy = y2 - uy * .42; // gốc đầu mũi tên
      return '<g fill="' + col + '" stroke="' + col + '" opacity=".82"><line x1="' + (x1 + ux * .3) + '" y1="' + (y1 + uy * .3) +
        '" x2="' + hx + '" y2="' + hy + '" stroke-width=".17" stroke-linecap="round"/><polygon stroke="none" points="' +
        x2 + ',' + y2 + ' ' + (hx - uy * .24) + ',' + (hy + ux * .24) + ' ' + (hx + uy * .24) + ',' + (hy - ux * .24) + '"/></g>';
    }).join('');
  }

  function renderComment(k, rec) {
    var el = $('comment');
    if (!rec) {
      el.innerHTML = '<div class="head">' + T('c_start_title') + '</div><p>' + T('c_start_text') + '</p>';
      return;
    }
    var c = R.CLASSES[rec.cls], h = S.hist[k - 1].info, num = Math.floor((k - 1) / 2) + 1 + (h.color ? '...' : '.');
    var html = '<div class="head"><span class="tagdot" style="background:' + c.color + '">' + c.sym + '</span>' +
      '<span>' + num + ' ' + h.san + ' — <span style="color:' + c.color + '">' + T('cls_' + rec.cls) + '</span></span>' +
      '<span class="ev">' + rec.evalB + ' → ' + rec.evalA + '</span></div>';
    if (rec.opening && (rec.cls === 'book' || rec.theory)) html += '<p class="op">📖 ' + T('c_opening', rec.opening.name + ' · ' + rec.opening.eco) + '</p>';
    html += '<p>' + rec.text + '</p>';
    if (rec.theory && rec.theory.length)
      html += '<p class="theory">' + T('c_theory', rec.theory.map(function (t) {
        return '<b>' + t.san + '</b>' + (t.name ? ' <span>(' + t.name + ')</span>' : '');
      }).join(', ')) + '</p>';
    if (rec.bestUci && rec.bestSan)
      html += '<p class="bestline">' + T('c_best') + ' <b>' + rec.bestSan + '</b>' + (rec.bestLine ? ' &nbsp;(' + rec.bestLine + ')' : '') + '</p>';
    if (rec.kind && isBad(rec)) html += '<p class="tip">' + T('tip_' + rec.kind) + '</p>';
    var btns = '';
    if (rec.bestUci && rec.bestPv.length) btns += '<button class="btn sm" data-act="best">' + T('a_showBest') + '</button>';
    if (isBad(rec) && rec.replyPv.length) btns += '<button class="btn sm" data-act="threat">' + T('a_showThreat') + '</button>';
    if (isBad(rec)) btns += '<button class="btn sm" data-act="retry">' + T('a_retry') + '</button>';
    if (btns) html += '<div class="cbtns">' + btns + '</div>';
    el.innerHTML = html;
  }

  $('comment').addEventListener('click', function (e) {
    var bt = e.target.closest('[data-act]');
    if (!bt || !S.review) return;
    var act = bt.dataset.act, k = S.ply, rec = S.review.recs[k - 1];
    if (act === 'best') explore(S.fens[k - 1], rec.bestPv, T('ex_best'));
    else if (act === 'threat') explore(S.fens[k], rec.replyPv, T('ex_threat'));
    else if (act === 'retry') startRetry(k);
    else if (act === 'hint') retryHint();
    else if (act === 'solution') retrySolution();
    else if (act === 'exit') goPly(S.ply);
  });

  // ---------- xem biến trên bàn cờ ----------
  function explore(fen, ucis, title) {
    stopExplore();
    var g = new Game(fen), steps = [];
    ucis.forEach(function (u) { var m = g.fromUci(u); if (!m) return; var inf = g.info(m); steps.push(inf); g.make(m); });
    if (!steps.length) return;
    S.explore = { fen: fen, steps: steps, i: 0, title: title, timer: null };
    view = new Game(fen);
    last = null;
    badgeEl.hidden = true;
    drawArrows([]);
    syncPieces(view.b, true);
    paint();
    renderExploreBar();
    S.explore.timer = setTimeout(exploreStep, 450);
  }
  function exploreStep() {
    var ex = S.explore;
    if (!ex || ex.i >= ex.steps.length) return;
    var inf = ex.steps[ex.i++];
    view.make(inf.m);
    last = inf;
    syncPieces(view.b, true);
    paint();
    moveSound(inf);
    renderExploreBar();
    if (ex.i < ex.steps.length) ex.timer = setTimeout(exploreStep, 850);
  }
  function renderExploreBar() {
    var ex = S.explore, bar = $('explore');
    if (!ex) { bar.hidden = true; return; }
    var t = ex.fen.split(' '), white = t[1] === 'w', num = +t[5] || 1, out = [];
    ex.steps.forEach(function (s, k) {
      if (white) out.push('<span class="n">' + num + '.</span>');
      else if (k === 0) out.push('<span class="n">' + num + '...</span>');
      out.push('<span class="' + (k === ex.i - 1 ? 'cur' : k < ex.i ? 'done' : '') + '">' + s.san + '</span>');
      if (!white) num++;
      white = !white;
    });
    bar.hidden = false;
    bar.innerHTML = '<div class="ex-title">' + ex.title + '</div><div class="ex-line">' + out.join(' ') + '</div>' +
      '<div class="cbtns"><button class="btn sm" data-ex="replay">' + T('ex_replay') + '</button>' +
      '<button class="btn sm" data-ex="back">' + T('ex_back') + '</button></div>';
  }
  function stopExplore() {
    if (S.explore) clearTimeout(S.explore.timer);
    S.explore = null;
    $('explore').hidden = true;
  }
  $('explore').addEventListener('click', function (e) {
    var bt = e.target.closest('[data-ex]');
    if (!bt || !S.explore) return;
    if (bt.dataset.ex === 'back') goPly(S.ply);
    else { var ex = S.explore; explore(ex.fen, ex.steps.map(function (s) { return s.uci; }), ex.title); }
  });

  // ---------- luyện tập: tự tìm nước tốt hơn ----------
  function startRetry(k) {
    stopExplore();
    var rec = S.review.recs[k - 1], h = S.hist[k - 1].info;
    S.mode = 'retry';
    S.retry = { k: k, g: new Game(S.fens[k - 1]), color: h.color, best: rec.bestUci, pv: rec.bestPv,
      wBefore: R.whiteWin(S.analysis[k - 1]), state: 'await', tries: 0, hint: -1, msg: '' };
    view = S.retry.g;
    last = k > 1 ? S.hist[k - 2].info : null;
    badgeEl.hidden = true;
    drawArrows([]);
    syncPieces(view.b, true);
    setEvalBar(S.retry.wBefore, R.evalText(S.analysis[k - 1]));
    paint(); renderStatus(); renderRetry();
  }
  function renderRetry() {
    var r = S.retry, sides = T('sides'), h = S.hist[r.k - 1].info, num = Math.floor((r.k - 1) / 2) + 1 + (h.color ? '...' : '.');
    var html = '<div class="head">🎯 ' + T('rt_title', sides[r.color]) + '</div>' +
      '<p>' + T('rt_prompt', '<b>' + num + ' ' + h.san + '</b>', sides[r.color]) + '</p>';
    if (r.msg) html += '<p class="rt-msg">' + r.msg + '</p>';
    var btns = '';
    if (r.state !== 'done') {
      btns += '<button class="btn sm" data-act="hint">' + T('rt_hint') + '</button>';
      btns += '<button class="btn sm" data-act="solution">' + T('rt_solution') + '</button>';
    } else btns += '<button class="btn sm" data-act="best">' + T('a_showBest') + '</button>';
    btns += '<button class="btn sm" data-act="exit">' + T('rt_exit') + '</button>';
    $('comment').innerHTML = html + '<div class="cbtns">' + btns + '</div>';
  }
  function retryMove(m) {
    var r = S.retry, g = r.g, inf = g.info(m), id = S.gameId;
    g.make(m);
    S.sel = -1; S.targets = [];
    var p = pieceAt(inf.from);
    if (p) { p.sq = inf.to; place(p.el, inf.to); }
    syncPieces(g.b, true);
    last = inf;
    moveSound(inf);
    r.state = 'checking';
    r.msg = T('rt_checking', '<b>' + inf.san + '</b>');
    paint(); renderRetry();
    var finish = function (ok, alt, res) {
      if (S.retry !== r) return;
      if (ok) {
        r.state = 'done';
        r.hint = -1;
        r.msg = alt ? T('rt_alt', '<b>' + inf.san + '</b>', '<b>' + uciToSan(S.fens[r.k - 1], r.best) + '</b>') : T('rt_right', '<b>' + inf.san + '</b>');
        drawArrows([[inf.uci, '#5fae2e']]);
        sound('check');
        paint(); renderRetry();
        return;
      }
      r.tries++;
      r.msg = T('rt_wrong', '<b>' + inf.san + '</b>', '<b>' + (uciToSan(g.fen(), res.pv[0]) || '?') + '</b>', R.evalText(res));
      if (res.pv[0]) drawArrows([[res.pv[0], '#e5533d']]);
      renderRetry();
      // trả quân về để thử lại
      setTimeout(function () {
        if (S.retry !== r) return;
        g.unmake();
        last = r.k > 1 ? S.hist[r.k - 2].info : null;
        syncPieces(g.b, true);
        drawArrows([]);
        r.state = 'await';
        if (r.tries >= 2 && r.hint < 0) retryHint();
        paint(); renderRetry();
      }, 1600);
    };
    if (inf.uci === r.best) { finish(true, false); return; }
    engine.analyze(g.fen(), { depth: 14, movetime: 900 }).then(function (res) {
      if (!res || id !== S.gameId) return;
      var w = R.whiteWin(res), mine = r.color === 0 ? w : 100 - w, before = r.color === 0 ? r.wBefore : 100 - r.wBefore;
      finish(before - mine <= 3, true, res);
    });
  }
  function retryHint() {
    var r = S.retry;
    if (!r || !r.best) return;
    r.hint = C.sqFromName(r.best.slice(0, 2));
    var ty = r.g.b[r.hint] & 7;
    r.msg = T('rt_hintText', T('pieces')[ty], r.best.slice(0, 2));
    paint(); renderRetry();
  }
  function retrySolution() {
    var r = S.retry;
    if (!r || r.state === 'checking') return;
    var san = uciToSan(S.fens[r.k - 1], r.best);
    r.state = 'done';
    r.hint = -1;
    r.msg = T('rt_solText', '<b>' + san + '</b>', S.review.recs[r.k - 1].bestLine);
    drawArrows([[r.best, '#5fae2e']]);
    paint(); renderRetry();
  }
  function uciToSan(fen, uci) {
    if (!uci) return '';
    var g = new Game(fen), m = g.fromUci(uci);
    return m ? g.san(m) : '';
  }

  // ---------- nút bấm ----------
  $('btnReview').onclick = startReview;
  $('btnUndo').onclick = undo;
  $('btnResign').onclick = resign;
  $('btnFlip').onclick = function () {
    S.orient ^= 1;
    buildSquares();
    pieces.forEach(function (p) { place(p.el, p.sq); });
    paint(); renderPlayers();
    if (S.review) goPly(S.ply);
  };
  $('btnSound').onclick = function () { S.sound = !S.sound; this.textContent = S.sound ? '🔊' : '🔇'; };
  // bảng nhạc nền
  var M = window.Music, musicPanel = $('musicPanel');
  function renderMusic() {
    var st = M.state();
    $('muOn').checked = st.on;
    $('muVol').value = st.vol;
    $('sfxVol').value = sfxVol;
    $('btnMusic').classList.toggle('on', st.on);
    $('muList').innerHTML = T('mu_tracks').map(function (tr, i) {
      var cur = i === st.track;
      return '<li data-i="' + i + '" class="' + (cur ? 'on' : '') + '"><i>' + (cur && st.on ? '♪' : i + 1) + '</i>' +
        tr[0] + '<small>' + tr[1] + '</small></li>';
    }).join('');
  }
  M.onChange(renderMusic);
  $('btnMusic').onclick = function (e) { e.stopPropagation(); musicPanel.hidden = !musicPanel.hidden; };
  document.addEventListener('pointerdown', function (e) {
    if (!musicPanel.hidden && !musicPanel.contains(e.target) && e.target !== $('btnMusic')) musicPanel.hidden = true;
  });
  $('muOn').onchange = function () { M.setOn(this.checked); };
  $('muList').onclick = function (e) {
    var li = e.target.closest('li');
    if (!li) return;
    var i = +li.dataset.i;
    if (i === M.state().track && M.state().on) return;
    M.setTrack(i);
    if (!M.state().on) M.setOn(true);
  };
  $('muVol').oninput = function () { M.setVolume(this.value); };
  $('sfxVol').oninput = function () { sfxVol = +this.value; };
  $('sfxVol').onchange = function () {
    try { localStorage.setItem('chess.sfx', sfxVol); } catch (e) { /* bỏ qua */ }
    sound('move');
  };

  $('btnLang').onclick = function () {
    window.I18N.set(window.I18N.get() === 'vi' ? 'en' : 'vi');
    renderEngineTag(); renderEloLabel(); renderStatus(); renderPlayers(); renderMusic();
    $('progressText').textContent = T('progress', prog[0], prog[1]);
    if (S.review) {
      // lời nhận xét được sinh theo ngôn ngữ nên phải dựng lại từ kết quả phân tích đã lưu
      S.review = R.build(C.START, S.hist, S.analysis);
      showReview(S.ply);
    } else renderMoves();
  };
  $('nav').addEventListener('click', function (e) {
    var bt = e.target.closest('[data-nav]');
    if (!bt) return;
    var a = bt.dataset.nav;
    goPly(a === 'first' ? 0 : a === 'prev' ? S.ply - 1 : a === 'next' ? S.ply + 1 : S.hist.length);
  });
  document.addEventListener('keydown', function (e) {
    if (!S.review || $('dlgNew').open || S.mode === 'retry') return;
    var k = e.key;
    if (k === 'ArrowLeft') goPly(S.ply - 1);
    else if (k === 'ArrowRight') goPly(S.ply + 1);
    else if (k === 'Home') goPly(0);
    else if (k === 'End') goPly(S.hist.length);
    else return;
    e.preventDefault();
  });

  // hộp thoại ván mới
  var dlg = $('dlgNew'), eloRange = $('eloRange');
  function renderEloLabel() { $('eloValue').textContent = eloRange.value + ' — ' + T('tier', +eloRange.value); }
  function syncDialog() {
    [].forEach.call(dlg.querySelectorAll('.seg'), function (seg) {
      [].forEach.call(seg.children, function (x) { x.classList.toggle('on', x.dataset.v === String(prefs[seg.dataset.name])); });
    });
    eloRange.value = prefs.elo;
    $('fieldSide').hidden = $('fieldElo').hidden = prefs.opp !== 'ai';
    renderEloLabel();
  }
  dlg.addEventListener('click', function (e) {
    var bt = e.target.closest('.seg button');
    if (!bt) return;
    prefs[bt.parentNode.dataset.name] = bt.dataset.v;
    syncDialog();
  });
  eloRange.addEventListener('input', function () { prefs.elo = +eloRange.value; renderEloLabel(); });
  dlg.addEventListener('close', function () {
    if (dlg.returnValue !== 'ok') return;
    try { localStorage.setItem('chess.prefs', JSON.stringify(prefs)); } catch (e) { /* bỏ qua */ }
    startFromPrefs();
  });
  $('btnNew').onclick = function () { dlg.returnValue = ''; syncDialog(); dlg.showModal(); };

  function startFromPrefs() {
    newGame({
      opp: prefs.opp, elo: +prefs.elo, tc: +prefs.tc,
      side: prefs.side === 'r' ? (Math.random() < 0.5 ? 0 : 1) : +prefs.side
    });
  }

  window.I18N.apply();
  renderMusic();
  renderEngineTag();
  syncDialog();
  startFromPrefs();

  window.__chess = { S: S, doMove: doMove, goPly: goPly, engine: engine, eloParams: eloParams, pickMove: pickMove }; // tiện gỡ lỗi từ console
})();
