// Cơ sở dữ liệu khai cuộc. Dùng bộ dữ liệu mở của Lichess (~3.900 biến có tên và mã ECO), tải một lần rồi lưu
// trong trình duyệt; khi không có mạng thì dùng danh sách dự phòng nhỏ bên dưới.
(function () {
  'use strict';
  var BASE = 'https://cdn.jsdelivr.net/gh/lichess-org/chess-openings@master/', CACHE = 'chess.openings.v1';
  var named, next, sub, count, source = 'builtin';

  var FALLBACK = [
    ['B00', "King's Pawn Game", 'e4'], ['A40', "Queen's Pawn Game", 'd4'], ['A10', 'English Opening', 'c4'],
    ['A04', 'Zukertort Opening', 'Nf3'], ['C20', "King's Pawn Game", 'e4 e5'], ['C40', "King's Knight Opening", 'e4 e5 Nf3'],
    ['C60', 'Ruy Lopez', 'e4 e5 Nf3 Nc6 Bb5'], ['C78', 'Ruy Lopez: Morphy Defense', 'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3'],
    ['C67', 'Ruy Lopez: Berlin Defense', 'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4'], ['C50', 'Italian Game', 'e4 e5 Nf3 Nc6 Bc4'],
    ['C54', 'Italian Game: Giuoco Piano', 'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+'], ['C50', 'Italian Game: Giuoco Pianissimo', 'e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 O-O d6 c3'],
    ['C55', 'Italian Game: Two Knights Defense', 'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5'], ['C57', 'Italian Game: Two Knights Defense, Knight Attack', 'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5'],
    ['C45', 'Scotch Game', 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6'], ['C45', 'Scotch Game: Classical Variation', 'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5'],
    ['C48', 'Four Knights Game', 'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4'], ['C47', 'Four Knights Game: Scotch Variation', 'e4 e5 Nf3 Nc6 Nc3 Nf6 d4 exd4 Nxd4'],
    ['C42', "Petrov's Defense", 'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5'], ['C41', 'Philidor Defense', 'e4 e5 Nf3 d6 d4 exd4 Nxd4 Nf6 Nc3'],
    ['C25', 'Vienna Game', 'e4 e5 Nc3 Nf6 f4 d5'], ['C24', "Bishop's Opening", 'e4 e5 Bc4 Nf6 d3 Nc6'], ['C33', "King's Gambit Accepted", 'e4 e5 f4 exf4 Nf3 g5'],
    ['C22', 'Center Game', 'e4 e5 d4 exd4 Qxd4 Nc6 Qe3'], ['B20', 'Sicilian Defense', 'e4 c5'],
    ['B90', 'Sicilian Defense: Najdorf Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5'], ['B70', 'Sicilian Defense: Dragon Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3'],
    ['B56', 'Sicilian Defense: Classical Variation', 'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6'], ['B33', 'Sicilian Defense: Sveshnikov Variation', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6'],
    ['B34', 'Sicilian Defense: Accelerated Dragon', 'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6'], ['B31', 'Sicilian Defense: Rossolimo Variation', 'e4 c5 Nf3 Nc6 Bb5 g6'],
    ['B48', 'Sicilian Defense: Taimanov Variation', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7'], ['B42', 'Sicilian Defense: Kan Variation', 'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6'],
    ['B25', 'Sicilian Defense: Closed', 'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7'], ['B22', 'Sicilian Defense: Alapin Variation', 'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4'],
    ['B22', 'Sicilian Defense: Alapin Variation', 'e4 c5 c3 d5 exd5 Qxd5 d4'], ['B21', 'Sicilian Defense: Smith-Morra Gambit', 'e4 c5 d4 cxd4 c3'],
    ['C00', 'French Defense', 'e4 e6'], ['C15', 'French Defense: Winawer Variation', 'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3'],
    ['C13', 'French Defense: Classical Variation', 'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7'], ['C05', 'French Defense: Tarrasch Variation', 'e4 e6 d4 d5 Nd2 Nf6 e5 Nfd7'],
    ['C02', 'French Defense: Advance Variation', 'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6'], ['C01', 'French Defense: Exchange Variation', 'e4 e6 d4 d5 exd5 exd5 Nf3'],
    ['B10', 'Caro-Kann Defense', 'e4 c6'], ['B18', 'Caro-Kann Defense: Classical Variation', 'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6'],
    ['B12', 'Caro-Kann Defense: Advance Variation', 'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2'], ['B13', 'Caro-Kann Defense: Panov Attack', 'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3'],
    ['B01', 'Scandinavian Defense', 'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6'], ['B01', 'Scandinavian Defense: Modern Variation', 'e4 d5 exd5 Nf6 d4 Nxd5'],
    ['B07', 'Pirc Defense', 'e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7'], ['B06', 'Modern Defense', 'e4 g6 d4 Bg7 Nc3 d6'], ['B02', "Alekhine's Defense", 'e4 Nf6 e5 Nd5 d4 d6 Nf3'],
    ['D06', "Queen's Gambit", 'd4 d5 c4'], ['D53', "Queen's Gambit Declined", 'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3'],
    ['D35', "Queen's Gambit Declined: Exchange Variation", 'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5'], ['D37', "Queen's Gambit Declined: Harrwitz Attack", 'd4 d5 c4 e6 Nf3 Nf6 Nc3 Be7 Bf4'],
    ['D10', 'Slav Defense', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5'], ['D45', 'Semi-Slav Defense', 'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7'],
    ['D20', "Queen's Gambit Accepted", 'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5'], ['D02', 'London System', 'd4 d5 Bf4 Nf6 e3 c5 c3 Nc6'],
    ['D02', "Queen's Pawn Game: London System", 'd4 d5 Nf3 Nf6 Bf4 e6 e3'], ['E32', 'Nimzo-Indian Defense', 'd4 Nf6 c4 e6 Nc3 Bb4 Qc2'],
    ['E41', 'Nimzo-Indian Defense: Rubinstein System', 'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O'], ['E15', "Queen's Indian Defense", 'd4 Nf6 c4 e6 Nf3 b6 g3 Bb7 Bg2'],
    ['E06', 'Catalan Opening', 'd4 Nf6 c4 e6 g3 d5 Bg2'], ['E92', "King's Indian Defense: Classical Variation", 'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5'],
    ['D85', 'Grünfeld Defense: Exchange Variation', 'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7'], ['A60', 'Benoni Defense', 'd4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6'],
    ['A57', 'Benko Gambit', 'd4 Nf6 c4 c5 d5 b5'], ['A48', 'Indian Defense', 'd4 Nf6 Nf3 g6 c4 Bg7 Nc3'], ['A45', 'Trompowsky Attack', 'd4 Nf6 Bg5'],
    ['A80', 'Dutch Defense', 'd4 f5 g3 Nf6 Bg2'], ['A29', 'English Opening: King\'s English', 'c4 e5 Nc3 Nf6 Nf3 Nc6 g3'],
    ['A34', 'English Opening: Symmetrical Variation', 'c4 c5 Nf3 Nf6 Nc3 Nc6'], ['A07', "King's Indian Attack", 'Nf3 d5 g3 Nf6 Bg2'],
    ['A00', 'Hungarian Opening', 'g3 d5 Bg2'], ['A01', 'Nimzo-Larsen Attack', 'b3 e5 Bb2 Nc6'], ['A02', "Bird's Opening", 'f4 d5 Nf3']
  ];

  function reset() { named = {}; next = {}; sub = {}; count = 0; }
  function add(eco, name, sans) {
    var key = '';
    for (var i = 0; i < sans.length; i++) {
      var prev = key;
      key = key ? key + ' ' + sans[i] : sans[i];
      (next[prev] = next[prev] || {})[sans[i]] = 1;
      sub[key] = (sub[key] || 0) + 1;
    }
    if (name && !named[key]) named[key] = { eco: eco, name: name };
    count++;
  }
  function parseTsv(text) {
    text.split('\n').forEach(function (line) {
      var c = line.split('\t');
      if (c.length < 3 || c[0] === 'eco') return;
      add(c[0], c[1], c[2].replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/));
    });
  }

  reset();
  FALLBACK.forEach(function (o) { add(o[0], o[1], o[2].split(' ')); });

  function init() {
    try {
      var cached = localStorage.getItem(CACHE);
      if (cached) { reset(); parseTsv(cached); source = 'lichess'; return Promise.resolve(); }
    } catch (e) { /* không có bộ nhớ cục bộ */ }
    return Promise.all('abcde'.split('').map(function (f) {
      return fetch(BASE + f + '.tsv').then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
    })).then(function (texts) {
      var all = texts.join('\n');
      reset(); parseTsv(all); source = 'lichess';
      try { localStorage.setItem(CACHE, all); } catch (e) { /* đầy bộ nhớ: lần sau tải lại */ }
    }, function () { /* giữ danh sách dự phòng */ });
  }

  function key(sans) { return sans.join(' '); }
  // Chuỗi nước này có nằm trong một biến khai cuộc đã biết không
  function known(sans) { var k = key(sans); return !!(next[k] || named[k]); }
  // Tên khai cuộc dài nhất khớp với chuỗi nước
  function name(sans) {
    for (var i = sans.length; i > 0; i--) { var n = named[key(sans.slice(0, i))]; if (n) return n; }
    return null;
  }
  // Các nước lý thuyết tiếp theo, biến được nghiên cứu nhiều nhất đứng trước
  function continuations(sans) {
    var k = key(sans), n = next[k];
    if (!n) return [];
    return Object.keys(n).map(function (m) {
      var s = sans.concat(m), nm = named[key(s)] || name(s);
      return { san: m, name: nm ? nm.name : '', weight: sub[key(s)] || 0 };
    }).sort(function (a, b) { return b.weight - a.weight; });
  }

  window.Openings = {
    init: init, known: known, name: name, continuations: continuations,
    count: function () { return count; }, source: function () { return source; }
  };
})();
