// Chấm điểm và viết lời nhận xét cho từng nước đi từ kết quả phân tích của engine.
(function () {
  'use strict';
  var C = window.Chess, Game = C.Game, T = window.I18N.t;
  var PIECE = ['', 'Tốt', 'Mã', 'Tượng', 'Xe', 'Hậu', 'Vua'];
  var SIDE = ['Trắng', 'Đen'];
  var PV = [0, 1, 3, 3, 5, 9, 0];

  var CLASSES = {
    brilliant: { label: 'Thiên tài', sym: '!!', color: '#1baca6' },
    best: { label: 'Tốt nhất', sym: '★', color: '#81b64c' },
    excellent: { label: 'Xuất sắc', sym: '✓', color: '#81b64c' },
    good: { label: 'Ổn', sym: '•', color: '#8aa37b' },
    book: { label: 'Lý thuyết', sym: '≡', color: '#b08a5e' },
    forced: { label: 'Bắt buộc', sym: '→', color: '#8b8987' },
    inaccuracy: { label: 'Thiếu chính xác', sym: '?!', color: '#f0c33c' },
    mistake: { label: 'Sai lầm', sym: '?', color: '#ff9f43' },
    blunder: { label: 'Sai lầm nghiêm trọng', sym: '??', color: '#f2513b' }
  };
  var ORDER = ['brilliant', 'best', 'excellent', 'good', 'book', 'forced', 'inaccuracy', 'mistake', 'blunder'];


  // ----- quy đổi đánh giá -----
  function whiteWin(a) {
    if (a.terminal === 'mate') return a.winner === 0 ? 100 : 0;
    if (a.terminal) return 50;
    if (a.mate !== null && a.mate !== undefined) return a.mate > 0 ? 100 : 0;
    return 50 + 50 * (2 / (1 + Math.exp(-0.00368208 * a.cp)) - 1);
  }
  function cpEq(a) {
    if (a.terminal === 'mate') return a.winner === 0 ? 2000 : -2000;
    if (a.terminal) return 0;
    if (a.mate !== null && a.mate !== undefined) return a.mate > 0 ? 2000 : -2000;
    return Math.max(-2000, Math.min(2000, a.cp));
  }
  function evalText(a) {
    if (a.terminal === 'mate') return a.winner === 0 ? '1-0' : '0-1';
    if (a.terminal) return '½-½';
    if (a.mate !== null && a.mate !== undefined) return (a.mate > 0 ? '+' : '−') + 'M' + Math.abs(a.mate);
    var v = a.cp / 100;
    return (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(1);
  }
  function mateFor(a) {
    if (a.terminal === 'mate') return { color: a.winner, n: 0 };
    if (!a.terminal && a.mate !== null && a.mate !== undefined) return { color: a.mate > 0 ? 0 : 1, n: Math.abs(a.mate) };
    return null;
  }

  // ----- công cụ soi thế cờ -----
  function balance(g) {
    var s = 0;
    for (var i = 0; i < 64; i++) { var p = g.b[i]; if (p) s += p < 8 ? PV[p & 7] : -PV[p & 7]; }
    return s;
  }
  function hanging(g, sq) {
    var p = g.b[sq];
    if (!p || (p & 7) === C.K) return false;
    var c = p >> 3, att = g.attackers(sq, c ^ 1);
    if (!att.length) return false;
    if (!g.attackers(sq, c).length) return true;
    var min = 99;
    att.forEach(function (a) { var v = (g.b[a] & 7) === C.K ? 10 : PV[g.b[a] & 7]; if (v < min) min = v; });
    return min < PV[p & 7];
  }
  function playLine(fen, ucis, max) {
    var g = new Game(fen), steps = [], bal0 = balance(g);
    for (var k = 0; k < ucis.length && k < max; k++) {
      var m = g.fromUci(ucis[k]);
      if (!m) break;
      var inf = g.info(m);
      g.make(m);
      steps.push({ san: inf.san, info: inf, bal: balance(g) });
    }
    return { fen: fen, steps: steps, bal0: bal0 };
  }
  // Chỉ số kết thúc của chuỗi cưỡng bức (tối đa 8 nước, kéo dài thêm nếu còn đang ăn quân qua lại)
  function settleEnd(L) {
    var n = L.steps.length, end = Math.min(n, 8);
    while (end < n && L.steps[end].info.captured) end++;
    return end;
  }
  function settled(L, color) {
    var end = settleEnd(L);
    return end ? (L.steps[end - 1].bal - L.bal0) * (color === 0 ? 1 : -1) : 0;
  }
  function fmtLine(L, count) {
    var t = L.fen.split(' '), white = t[1] === 'w', num = +t[5] || 1, out = [];
    for (var k = 0; k < L.steps.length && k < count; k++) {
      if (white) out.push(num + '.');
      else if (k === 0) out.push(num + '...');
      out.push(L.steps[k].san);
      if (!white) num++;
      white = !white;
    }
    return out.join(' ');
  }
  function matText(n) { return T('mat', Math.round(n)); }
  function b(s) { return '<b>' + s + '</b>'; }
  function capSq(inf) { return C.sqName(inf.flag === 1 ? inf.to + (inf.color === 0 ? 8 : -8) : inf.to); }
  function isDevelop(inf, ply) {
    var ty = inf.piece & 7;
    return ply < 24 && (ty === C.N || ty === C.B) && (inf.from >> 3) === (inf.color === 0 ? 7 : 0);
  }

  // ----- nhận diện đòn chiến thuật -----
  var RAYDIRS = [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];
  function valueOf(p) { return (p & 7) === C.K ? 100 : PV[p & 7]; }
  function sliderDirs(ty) { return ty === C.B ? [0, 1, 2, 3] : ty === C.R ? [4, 5, 6, 7] : ty === C.Q ? [0, 1, 2, 3, 4, 5, 6, 7] : []; }
  // Hai quân đầu tiên gặp trên một hướng
  function rayScan(g, from, d) {
    var r = (from >> 3) + RAYDIRS[d][0], f = (from & 7) + RAYDIRS[d][1], out = [];
    while (r >= 0 && r < 8 && f >= 0 && f < 8) {
      if (g.b[r * 8 + f]) { out.push(r * 8 + f); if (out.length === 2) break; }
      r += RAYDIRS[d][0]; f += RAYDIRS[d][1];
    }
    return out;
  }
  // Quân ở sq (của bên đang tới lượt) bị dồn: mọi nước đi của nó đều đến ô không an toàn
  function trapped(g, sq) {
    var p = g.b[sq];
    if (!p || (p >> 3) !== g.turn) return false;
    var ms = g.legal().filter(function (m) { return C.mFrom(m) === sq; });
    for (var i = 0; i < ms.length; i++) {
      g.make(ms[i]);
      var bad = hanging(g, C.mTo(ms[i]));
      g.unmake();
      if (!bad) return false;
    }
    return true;
  }
  function pc(g, sq) { return { sq: sq, ty: g.b[sq] & 7, color: g.b[sq] >> 3 }; }

  // Các đòn chiến thuật mà nước inf tạo ra, xếp theo mức quan trọng
  function tacticsOf(gB, inf) {
    var c = inf.color, opp = c ^ 1, gA = new Game(gB.fen());
    gA.make(inf.m);
    var out = [], to = inf.to, ty = gA.b[to] & 7, check = /[+#]/.test(inf.san), t, p;
    if (/#/.test(inf.san)) return [{ kind: 'mate' }];
    var selfSafe = !hanging(gA, to);
    // bắt chết quân
    for (t = 0; t < 64; t++) {
      p = gA.b[t];
      if (!p || (p >> 3) !== opp || PV[p & 7] < 3) continue;
      if (gA.attackers(t, c).indexOf(to) >= 0 && hanging(gA, t) && trapped(gA, t)) out.push({ kind: 'trap', rank: 1, v: PV[p & 7], items: [pc(gA, t)] });
    }
    // chĩa đôi
    if (selfSafe || check) {
      var targets = [];
      for (t = 0; t < 64; t++) {
        p = gA.b[t];
        if (!p || (p >> 3) !== opp || gA.attackers(t, c).indexOf(to) < 0) continue;
        if ((p & 7) === C.K || valueOf(p) > valueOf(gA.b[to]) || hanging(gA, t)) targets.push(pc(gA, t));
      }
      if (targets.length >= 2) out.push({ kind: 'fork', rank: 2, mover: ty, items: targets });
    }
    // tấn công mở / chiếu mở
    for (var s = 0; s < 64; s++) {
      p = gA.b[s];
      if (!p || (p >> 3) !== c || s === to) continue;
      sliderDirs(p & 7).forEach(function (d) {
        var before = rayScan(gB, s, d)[0], now = rayScan(gA, s, d)[0];
        if (before !== inf.from || now === undefined) return;
        var q = gA.b[now];
        if ((q >> 3) !== opp) return;
        if ((q & 7) === C.K || (PV[q & 7] >= 3 && (valueOf(q) > valueOf(p) || hanging(gA, now))))
          out.push({ kind: 'disc', rank: 3, check: (q & 7) === C.K, slider: pc(gA, s), items: [pc(gA, now)] });
      });
    }
    // ghim và xiên bằng chính quân vừa đi
    if (selfSafe || check) sliderDirs(ty).forEach(function (d) {
      var sc = rayScan(gA, to, d);
      if (sc.length < 2) return;
      var a = gA.b[sc[0]], z = gA.b[sc[1]];
      if ((a >> 3) !== opp || (z >> 3) !== opp) return;
      if ((a & 7) !== C.K && valueOf(z) > valueOf(a))
        out.push({ kind: 'pin', rank: (z & 7) === C.K ? 4 : 5, items: [pc(gA, sc[0]), pc(gA, sc[1])] });
      else if (((a & 7) === C.K || (a & 7) === C.Q) && valueOf(a) > valueOf(z) && PV[z & 7] >= 3)
        out.push({ kind: 'skewer', rank: 4, items: [pc(gA, sc[0]), pc(gA, sc[1])] });
    });
    out.sort(function (x, y) { return x.rank - y.rank || (y.v || 0) - (x.v || 0); });
    return out;
  }
  // Ưu tiên đòn liên quan tới quân thực sự bị ăn trong biến (vicTy)
  function pickTactic(list, vicTy) {
    for (var i = 0; i < list.length; i++)
      if (list[i].items && list[i].items.some(function (x) { return x.ty === vicTy; })) return list[i];
    return null;
  }
  function tgt(x) { return T('target', PIECE[x.ty], C.sqName(x.sq)); }
  function phrase(tk) {
    var it = tk.items;
    if (tk.kind === 'trap') return T('tk_trap', PIECE[it[0].ty], SIDE[it[0].color], C.sqName(it[0].sq));
    if (tk.kind === 'fork') return T('tk_fork', PIECE[tk.mover], it.slice(0, 2).map(tgt).join(T('and')));
    if (tk.kind === 'disc') return tk.check ? T('tk_discCheck', tgt(tk.slider)) : T('tk_disc', tgt(tk.slider), tgt(it[0]));
    if (tk.kind === 'pin') return it[1].ty === C.K ? T('tk_pinK', tgt(it[0])) : T('tk_pin', tgt(it[0]), tgt(it[1]));
    if (tk.kind === 'skewer') return T('tk_skewer', tgt(it[0]), tgt(it[1]));
    return '';
  }
  // Đòn mạnh đầu tiên do bên đi trước tạo ra trong vài nước đầu của biến
  function lineTactic(L, maxK) {
    var g = new Game(L.fen);
    for (var k = 0; k < L.steps.length && k < maxK; k++) {
      if (k % 2 === 0) {
        var tk = tacticsOf(g, L.steps[k].info).filter(function (z) { return /trap|fork|disc|skewer/.test(z.kind); })[0];
        if (tk) return { k: k, tk: tk };
      }
      g.make(L.steps[k].info.m);
    }
    return null;
  }
  function cap1(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  // Lần ăn quân đầu tiên của bên đi trước trong biến (chỉ xét các nước chẵn)
  function firstGain(L, end) {
    for (var k = 0; k < end; k += 2) if (L.steps[k].info.captured) return { k: k, step: L.steps[k], ty: L.steps[k].info.captured & 7 };
    return null;
  }
  function evalWords(a, c) {
    var m = mateFor(a);
    if (m) return m.color === c ? T('ev_mating') : T('ev_mated');
    var v = cpEq(a) * (c === 0 ? 1 : -1);
    return T(v >= 300 ? 'ev_win' : v >= 150 ? 'ev_better2' : v >= 60 ? 'ev_better' : v > -60 ? 'ev_equal' :
      v > -150 ? 'ev_worse' : v > -300 ? 'ev_worse2' : 'ev_lose');
  }

  // Nước đi này làm được gì (dùng cho cả nước đã đi lẫn nước tốt nhất)
  // gain: chênh lệch chất của bên đi sau khi chuỗi đổi quân lắng xuống
  function motifs(gB, inf, ply, gain, prev) {
    var out = [], ty = inf.piece & 7, name = PIECE[ty];
    var gA = new Game(gB.fen());
    gA.make(inf.m);
    var check = /[+#]/.test(inf.san);
    if (/#/.test(inf.san)) return [T('m_mate')];
    var tk = tacticsOf(gB, inf).filter(function (x) { return x.kind !== 'pin' || gain >= 1 || x.items[1].ty === C.K; })[0];
    if (tk) out.push(T('m_tac', cap1(phrase(tk))));
    if (inf.flag === 2) out.push(T('m_castle'));
    if (inf.promo) out.push(T('m_promo', PIECE[inf.promo]));
    if (inf.captured) {
      var cv = PV[inf.captured & 7], mv = PV[ty], cn = PIECE[inf.captured & 7], cs = capSq(inf);
      if (prev && prev.captured && prev.to === inf.to && gain <= cv) out.push(T('m_recapture', cn, cs));
      else if (gain > cv) out.push(T('m_capMore', cn, cs));
      else if (gain >= 1) out.push(T('m_capWin', cn, cs, matText(gain)));
      else if (gain === 0 && cv === mv) out.push(ty === C.P ? T('m_tradePawn') : T('m_trade', name, cn));
      else out.push(T('m_cap', cn, cs));
    }
    if (!tk && !hanging(gA, inf.to)) {
      var targets = [];
      for (var t = 0; t < 64; t++) {
        var p = gA.b[t];
        if (!p || (p >> 3) === inf.color || (p & 7) === C.K) continue;
        if (gA.attackers(t, inf.color).indexOf(inf.to) < 0) continue;
        if (PV[p & 7] > PV[gA.b[inf.to] & 7] || hanging(gA, t)) targets.push(T('target', PIECE[p & 7], C.sqName(t)));
      }
      if (targets.length && check) out.push(T('m_checkAttack', targets[0]));
      else if (targets.length) out.push(T('m_threat', targets[0]));
      else if (check) out.push(T('m_checkForce'));
    } else if (!tk && check) out.push(T('m_check'));
    if (!inf.captured && inf.flag !== 2 && hanging(gB, inf.from) && !hanging(gA, inf.to)) out.push(T('m_rescue', name));
    if (!out.length) {
      if (isDevelop(inf, ply)) out.push(T('m_develop', name));
      else if (ty === C.P && ply < 12 && [27, 28, 35, 36].indexOf(inf.to) >= 0) out.push(T('m_center'));
    }
    return out.slice(0, 3);
  }

  // Giải thích một nước kém. Trả về {text, kind}; kind là loại lỗi dùng cho mẹo và tổng kết bài học.
  function whyBad(x) {
    var c = x.c, me = SIDE[c], opp = SIDE[c ^ 1], h = x.h, sgn = c === 0 ? 1 : -1, san = b(h.san);
    var mB = mateFor(x.before), mA = mateFor(x.after), parts = [], kMiss = null, kAllow = null, kPos = null;
    var shift = T('e_shift', me, evalWords(x.before, c), evalText(x.before), evalWords(x.after, c), evalText(x.after));
    if (x.after.terminal === 'draw' && x.wpB > 70) return { text: T('b_stalemate', opp) + ' ' + shift, kind: 'stalemate' };
    if (mA && mA.color !== c && !(mB && mB.color !== c))
      return { text: T('b_allowMate', opp, mA.n, b(fmtLine(x.replyL, mA.n * 2 - 1)), san) + ' ' + shift, kind: 'mateAllow' };
    if (mB && mB.color === c && !(mA && mA.color === c))
      return { text: T('b_missMate', mB.n, b(fmtLine(x.bestL, mB.n * 2 - 1)), san) + ' ' + shift, kind: 'mateMiss' };

    var cpLoss = (cpEq(x.before) - cpEq(x.after)) * sgn;
    var replyDelta = settled(x.replyL, c);
    var dPlayed = (balance(x.gA) - balance(x.gB)) * sgn + replyDelta;
    var dBest = settled(x.bestL, c);
    var best = x.bestL.steps[0], reply = x.replyL.steps[0], end, fg, tk, lt;

    // 1) Cơ hội bị bỏ lỡ: nước tốt nhất thắng được chất
    var canAllow = reply && replyDelta <= -1 && cpLoss >= 80;
    if (best && dBest >= 1 && dBest - dPlayed >= (canAllow ? 2 : 1) && cpLoss >= 80) {
      end = settleEnd(x.bestL);
      fg = firstGain(x.bestL, end);
      tk = fg && pickTactic(tacticsOf(x.gB, best.info), fg.ty);
      var winTxt = T('win_mat', me, matText(dBest));
      kMiss = 'miss';
      if (tk) parts.push(T('b_missTac', san, phrase(tk), b(best.san), b(fmtLine(x.bestL, Math.min(end, 7))), winTxt));
      else if (fg && fg.k === 0)
        parts.push(T('b_missCapture', PIECE[fg.ty], capSq(fg.step.info), b(fg.step.san), san, Math.round(dBest) !== PV[fg.ty] ? winTxt : ''));
      else if (fg && (lt = lineTactic(x.bestL, Math.min(end, 5))))
        parts.push(T('b_missTacLine', san, phrase(lt.tk), b(fmtLine(x.bestL, Math.min(end, 7))), winTxt));
      else if (fg && PV[fg.ty] - dBest >= 2) parts.push(T('b_missGainLine', b(fmtLine(x.bestL, end)), me, matText(dBest), san));
      else if (fg) parts.push(T('b_missTactic', b(best.san), b(fmtLine(x.bestL, fg.k + 1)), me, PIECE[fg.ty], san));
      else kMiss = null;
    }

    // 2) Đòn mà đối phương có được sau nước vừa đi
    if (canAllow && (dPlayed < 0 || dBest < 1 || !parts.length)) {
      end = settleEnd(x.replyL);
      fg = firstGain(x.replyL, end);
      tk = fg && pickTactic(tacticsOf(x.gA, reply.info), fg.ty);
      if (fg) {
        // thiệt hại ròng: tính cả quân mà chính nước vừa đi đã ăn
        var vic = fg.ty, s = fg.step, loss = dPlayed < 0 ? -dPlayed : -replyDelta;
        kAllow = 'allow';
        if (tk) parts.push(T('b_oppTac', san, opp, phrase(tk), b(fmtLine(x.replyL, Math.min(end, 7))), T('lose_mat', me, matText(loss))));
        else if (fg.k === 0 && s.info.to === h.to) {
          kAllow = 'hang';
          parts.push(T('b_movedCaptured', PIECE[vic], C.sqName(h.to), b(s.san), me, loss >= PV[vic], matText(loss),
            h.captured ? PIECE[h.captured & 7] : ''));
        } else if (fg.k === 0 && PV[vic] - loss < 2) {
          kAllow = 'hang';
          parts.push(T(hanging(x.gB, s.info.to) ? 'b_leftHanging' : 'b_undefended', PIECE[vic], capSq(s.info), opp, b(s.san)));
        } else if ((lt = lineTactic(x.replyL, Math.min(end, 5))))
          parts.push(T('b_oppTacLine', san, opp, phrase(lt.tk), b(fmtLine(x.replyL, Math.min(end, 7))), T('lose_mat', me, matText(loss))));
        else if (PV[vic] - loss >= 2) parts.push(T('b_lineLoss', b(fmtLine(x.replyL, end)), me, matText(loss)));
        else if (loss - PV[vic] >= 2)
          parts.push(T('b_allowLine', b(reply.san), b(fmtLine(x.replyL, Math.min(end, 5))), me, matText(loss)));
        else parts.push(T('b_allowTactic', b(reply.san), b(fmtLine(x.replyL, fg.k + 1)), me, PIECE[vic]));
      }
    }

    // 3) Không có chuyện mất/được chất: lý do thuộc về thế trận
    if (!parts.length) {
      var ty = h.piece & 7, rights = c === 0 ? 3 : 12;
      kPos = 'positional';
      if (ty === C.K && h.flag !== 2 && (x.gB.castling & rights) && x.ply < 40) { parts.push(T('p_kingMove', me)); kPos = 'king'; }
      else if (ty === C.Q && x.ply < 12) { parts.push(T('p_earlyQueen')); kPos = 'queen'; }
      else if (reply && /\+/.test(reply.san)) parts.push(T('p_allowCheck', opp, b(reply.san)));
      if (reply && !/\+/.test(reply.san)) {
        var rt = tacticsOf(x.gA, reply.info).filter(function (z) { return z.kind !== 'pin'; })[0];
        if (rt) parts.push(T('p_oppIdea', opp, b(reply.san), phrase(rt)));
      }
      if (best) {
        var bm = motifs(x.gB, best.info, x.ply, dBest);
        if (best.info.flag === 2) { parts.push(T('p_castleBetter', b(best.san))); if (kPos === 'positional') kPos = 'castle'; }
        else if (isDevelop(best.info, x.ply) && !isDevelop(h, x.ply) && !bm.length) {
          parts.push(T('p_develop', b(best.san))); if (kPos === 'positional') kPos = 'develop';
        } else if (bm.length) parts.push(T('p_stronger', b(best.san), bm.join(' ').replace(/^./, function (ch) { return ch.toLowerCase(); })));
        // So sánh thế trận sau nước đã đi với sau nước tốt nhất
        var gBest = new Game(x.gB.fen());
        gBest.make(best.info.m);
        var f0 = features(x.gB, c), fA = features(x.gA, c), fBst = features(gBest, c);
        var oA = features(x.gA, c ^ 1).mob, oBst = features(gBest, c ^ 1).mob, pos = [];
        if (fA.shield < f0.shield && fBst.shield >= f0.shield) pos.push(T('p_shield', me));
        if (fA.weak > f0.weak && fBst.weak <= f0.weak) pos.push(T('p_pawns'));
        if (fBst.dev < fA.dev && kPos !== 'develop' && x.ply < 30) pos.push(T('p_devLag', b(best.san)));
        if (fBst.ctr - fA.ctr >= 2) pos.push(T('p_center', b(best.san)));
        if (fBst.mob - fA.mob >= 4) pos.push(T('p_activity', b(best.san), fBst.mob - fA.mob));
        if (oA - oBst >= 5) pos.push(T('p_oppActive', opp));
        parts = parts.concat(pos.slice(0, 2));
        if (parts.length < 2 && x.bestL.steps.length > 2) parts.push(T('p_plan', b(fmtLine(x.bestL, 5))));
      }
      if (!parts.length) parts.push(T('p_generic', opp));
    }
    parts.push(shift);
    return { text: parts.join(' '), kind: kAllow || kMiss || kPos };
  }

  // Đặc điểm thế trận của bên c: kiểm soát trung tâm, độ hoạt động, quân chưa phát triển, Tốt yếu, lá chắn Vua
  function features(g, c) {
    var f = { ctr: 0, mob: 0, dev: 0, weak: 0, shield: 0 }, files = [0, 0, 0, 0, 0, 0, 0, 0], sq, p;
    for (sq = 0; sq < 64; sq++) {
      var att = g.attackers(sq, c);
      if (sq === 27 || sq === 28 || sq === 35 || sq === 36) f.ctr += att.length + (g.b[sq] && (g.b[sq] >> 3) === c ? 1 : 0);
      for (var i = 0; i < att.length; i++) { var t = g.b[att[i]] & 7; if (t !== C.P && t !== C.K) f.mob++; }
      p = g.b[sq];
      if (p && (p >> 3) === c && (p & 7) === C.P) files[sq & 7]++;
    }
    (c === 0 ? [57, 58, 61, 62] : [1, 2, 5, 6]).forEach(function (s) {
      var t = g.b[s] & 7;
      if (g.b[s] && (g.b[s] >> 3) === c && (t === C.N || t === C.B)) f.dev++;
    });
    for (var fl = 0; fl < 8; fl++) {
      if (files[fl] > 1) f.weak += files[fl] - 1;
      if (files[fl] && !(fl > 0 && files[fl - 1]) && !(fl < 7 && files[fl + 1])) f.weak += files[fl];
    }
    var k = g.king[c], kf = k & 7, dir = c === 0 ? -1 : 1;
    if (kf <= 2 || kf >= 5) for (var df = -1; df <= 1; df++) for (var dr = 1; dr <= 2; dr++) {
      var r = (k >> 3) + dir * dr, ff = kf + df;
      if (r >= 0 && r < 8 && ff >= 0 && ff < 8 && g.b[r * 8 + ff] === (C.P | c << 3)) f.shield++;
    }
    return f;
  }

  function phaseOf(g, ply) {
    var npm = 0;
    for (var i = 0; i < 64; i++) { var ty = g.b[i] & 7; if (ty && ty !== C.P && ty !== C.K) npm += PV[ty]; }
    return ply < 20 && npm >= 50 ? 'opening' : npm <= 26 ? 'endgame' : 'middlegame';
  }

  // A[i] = phân tích thế cờ trước nước thứ i (góc nhìn Trắng); A[n] = thế cờ cuối
  function build(startFen, hist, A) {
    var fens = [startFen].concat(hist.map(function (h) { return h.fen; }));
    var recs = [], acc = [[], []], counts = [{}, {}], phAcc = [{}, {}];
    var OP = window.Openings, fromStart = startFen === C.START && !!OP, inBook = fromStart, sans = [];
    PIECE = T('pieces'); SIDE = T('sides');
    for (var i = 0; i < hist.length; i++) {
      var h = hist[i].info, c = h.color, before = A[i], after = A[i + 1];
      var wB = whiteWin(before), wA = whiteWin(after);
      var wpB = c === 0 ? wB : 100 - wB, wpA = c === 0 ? wA : 100 - wA;
      var gB = new Game(fens[i]), gA = new Game(fens[i + 1]);
      var nLegal = gB.legal().length;
      var bestL = playLine(fens[i], before.pv, 14), replyL = playLine(fens[i + 1], after.pv || [], 14);
      var isBest = before.pv[0] === h.uci;
      var loss = isBest ? 0 : Math.max(0, wpB - wpA);
      var cls = nLegal === 1 ? 'forced' : isBest ? 'best' : loss <= 2.5 ? 'excellent' : loss <= 6 ? 'good' :
        loss <= 12 ? 'inaccuracy' : loss <= 22 ? 'mistake' : 'blunder';

      // Mấy nước đầu engine đánh giá còn dao động: không quy là "sai lầm" nếu chưa mất gì đáng kể
      if (i < 10 && cls === 'mistake' && (cpEq(before) - cpEq(after)) * (c === 0 ? 1 : -1) < 150) cls = 'inaccuracy';
      var ty = h.piece & 7;
      if ((cls === 'best' || (cls === 'excellent' && loss <= 1)) && !h.promo && ty !== C.P && ty !== C.K &&
        PV[ty] - PV[h.captured & 7] >= 2 && wpA >= 50 && wpB <= 97 && hanging(gA, h.to) &&
        gA.legal().some(function (m) { return C.mTo(m) === h.to; })) cls = 'brilliant';

      // Đang thua/thắng sẵn thì % thắng gần như không đổi, nhưng để bị chiếu hết hay bỏ lỡ chiếu hết vẫn đáng nêu ra
      var mB = mateFor(before), mA = mateFor(after), okCls = /best|excellent|good/.test(cls);
      if (okCls && !isBest && mA && mA.color !== c && mA.n <= 3 && !(mB && mB.color !== c)) cls = 'mistake';
      else if (okCls && !isBest && mB && mB.color === c && mB.n <= 3 && !(mA && mA.color === c)) cls = 'inaccuracy';

      // Lý thuyết khai cuộc: nước nằm trong sách thì không chấm điểm, dù engine có ưa hay không
      var prevSans = sans.slice(), theory = null;
      sans.push(h.san);
      if (inBook) {
        if (OP.known(sans)) { cls = 'book'; loss = 0; }
        else {
          inBook = false;
          // chỉ ghi tên biến khi nó khác tên khai cuộc hiện tại, tránh lặp lại
          var cur = OP.name(prevSans);
          theory = OP.continuations(prevSans).filter(function (t) { return t.san !== h.san; }).slice(0, 4)
            .map(function (t) { return { san: t.san, name: cur && t.name === cur.name ? '' : t.name }; });
        }
      }
      var opening = fromStart ? OP.name(sans) : null;

      var gain = (balance(gA) - balance(gB)) * (c === 0 ? 1 : -1) + settled(replyL, c);
      var text, kind = null, good = motifs(gB, h, i, gain, i ? hist[i - 1].info : null);
      var bestSan = bestL.steps[0] ? bestL.steps[0].san : '';
      var lead = good.length ? good.join(' ') + ' ' : '';
      if (cls === 'forced') text = T('t_forced');
      else if (cls === 'book') text = T('t_book') + ' ' + good.join(' ');
      else if (cls === 'brilliant') text = T('t_brilliant', PIECE[ty], C.sqName(h.to), SIDE[c ^ 1]) + ' ' + good.join(' ');
      else if (cls === 'best') text = lead + T('t_best');
      else if (cls === 'excellent') text = lead + T('t_excellent', b(bestSan));
      else if (cls === 'good') text = lead + T('t_good', b(bestSan));
      else {
        var wb = whyBad({ c: c, h: h, ply: i, before: before, after: after, gB: gB, gA: gA, bestL: bestL, replyL: replyL, wpB: wpB });
        text = wb.text; kind = wb.kind;
      }

      var phase = phaseOf(gB, i), acv = Math.max(0, Math.min(100, 103.1668 * Math.exp(-0.04354 * loss) - 3.1669));
      recs.push({
        cls: cls, loss: loss, text: text, kind: kind, color: c, phase: phase,
        evalB: evalText(before), evalA: evalText(after), w: wA,
        bestUci: isBest ? null : before.pv[0], bestSan: bestSan, bestLine: fmtLine(bestL, 6),
        bestPv: before.pv.slice(0, 10), replyPv: (after.pv || []).slice(0, 8), replySan: replyL.steps[0] ? replyL.steps[0].san : '',
        opening: opening, theory: theory
      });
      acc[c].push(acv);
      (phAcc[c][phase] = phAcc[c][phase] || []).push(acv);
      counts[c][cls] = (counts[c][cls] || 0) + 1;
    }
    var mean = function (a) { return a && a.length ? a.reduce(function (s, v) { return s + v; }, 0) / a.length : null; };
    var phases = [0, 1].map(function (c) {
      return { opening: mean(phAcc[c].opening), middlegame: mean(phAcc[c].middlegame), endgame: mean(phAcc[c].endgame) };
    });
    var lastOpening = null;
    recs.forEach(function (r) { if (r.opening) lastOpening = r.opening; });
    return {
      recs: recs, accuracy: [mean(acc[0]) || 0, mean(acc[1]) || 0], counts: counts, phases: phases,
      opening: lastOpening, w0: whiteWin(A[0]), eval0: evalText(A[0])
    };
  }

  var BAD = { inaccuracy: 1, mistake: 1, blunder: 1 };
  // Những nước đánh mất nhiều lợi thế nhất của các bên trong `colors`
  function keyMoments(rv, colors, n) {
    return rv.recs.map(function (r, i) { return { r: r, ply: i + 1 }; })
      .filter(function (x) { return colors.indexOf(x.r.color) >= 0 && BAD[x.r.cls]; })
      .sort(function (a, b2) { return b2.r.loss - a.r.loss; }).slice(0, n);
  }
  // Bài học rút ra từ các loại lỗi lặp lại
  function lessons(rv, colors) {
    var K = {}, out = [], openingErr = 0;
    rv.recs.forEach(function (r) {
      if (colors.indexOf(r.color) < 0 || !BAD[r.cls]) return;
      var k = r.kind || 'positional';
      if (k === 'castle' || k === 'develop' || k === 'queen' || k === 'king') k = 'opening';
      K[k] = (K[k] || 0) + 1;
      if (r.phase === 'opening') openingErr++;
    });
    Object.keys(K).sort(function (a, b2) { return K[b2] - K[a]; }).forEach(function (k) {
      if (k !== 'opening') out.push(T('ls_' + k, K[k]));
    });
    if (openingErr || K.opening) out.push(T('ls_opening', openingErr || K.opening, rv.opening ? rv.opening.name : ''));
    if (!out.length) out.push(T('ls_clean'));
    return out;
  }

  window.Review = {
    build: build, keyMoments: keyMoments, lessons: lessons,
    CLASSES: CLASSES, ORDER: ORDER, whiteWin: whiteWin, evalText: evalText
  };
})();
