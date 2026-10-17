// Cơ sở dữ liệu khai cuộc. Dùng bộ dữ liệu mở của Lichess (~3.900 biến có tên và mã ECO), tải một lần rồi lưu
// trong trình duyệt; khi không có mạng thì dùng danh sách dự phòng nhỏ bên dưới. Bộ Lichess chỉ ghi tới nước đặt
// tên biến (London chỉ tới 2.Bf4), nên có thêm các biến chính được đi sâu hơn (EXTRA). Tra cứu theo thế cờ chứ
// không theo thứ tự nước, nên đi hoán vị (vd. 1.d4 Nf6 2.Nf3 d5 3.Bf4) vẫn nhận ra đúng khai cuộc.
(function () {
  'use strict';
  var BASES = ['https://cdn.jsdelivr.net/gh/lichess-org/chess-openings@master/',
    'https://raw.githubusercontent.com/lichess-org/chess-openings/master/'], CACHE = 'chess.openings.v1';
  var lines = [], idx = null, source = 'builtin';

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


  // Các biến chính đi sâu hơn (không đặt tên: tên lấy từ thế cờ gần nhất có tên trong bộ dữ liệu)
  var EXTRA = [
    // London System
    'd4 d5 Bf4 Nf6 e3 e6 Nf3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3 b6 Ne5 Bb7',
    'd4 d5 Bf4 Nf6 e3 c5 c3 Nc6 Nd2 e6 Ngf3 Bd6 Bg3 O-O Bd3',
    'd4 d5 Bf4 Nf6 e3 e6 Nd2 c5 c3 Nc6 Ngf3 Bd6 Bg3 O-O Bd3',
    'd4 d5 Bf4 Nf6 e3 Bf5 c4 e6 Nc3 Bb4 Qb3 Nc6',
    'd4 d5 Bf4 Nf6 e3 c5 c3 Qb6 Qb3 c4 Qc2 Bf5 Qc1 e6 Nd2 Nc6',
    'd4 d5 Bf4 c5 e3 Nc6 c3 Nf6 Nd2 e6 Ngf3 Bd6 Bg3 O-O Bd3',
    'd4 Nf6 Bf4 g6 e3 Bg7 Nf3 O-O Be2 d6 h3 c5 c3',
    'd4 Nf6 Bf4 e6 e3 c5 c3 Nc6 Nd2 d5 Ngf3 Bd6 Bg3 O-O Bd3',
    'd4 Nf6 Bf4 d5 e3 c5 c3 Nc6 Nd2 Bf5 Ngf3 e6 Qb3 Qc8',
    'd4 Nf6 Nf3 g6 Bf4 Bg7 e3 O-O Be2 d6 h3 c5 c3 b6 O-O Bb7',
    'd4 d5 Nf3 Nf6 Bf4 e6 e3 c5 c3 Nc6 Nbd2 Bd6 Bg3 O-O Bd3',
    'd4 Nf6 Nf3 e6 Bf4 c5 e3 Nc6 c3 d5 Nbd2 Bd6 Bg3 O-O Bd3',
    'd4 d6 Nf3 Nf6 Bf4 g6 e3 Bg7 Be2 O-O O-O',
    'd4 d5 Nc3 Nf6 Bf4 e6 Nb5 Na6 e3 Be7',
    // Italian Game
    'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d3 d6 O-O O-O Re1 a6 Bb3 Ba7 Nbd2 Ne7 Nf1 Ng6 Ng3',
    'e4 e5 Nf3 Nc6 Bc4 Bc5 c3 Nf6 d4 exd4 cxd4 Bb4+ Bd2 Bxd2+ Nbxd2 d5 exd5 Nxd5 Qb3 Nce7 O-O O-O',
    'e4 e5 Nf3 Nc6 Bc4 Bc5 O-O Nf6 d3 d6 c3 O-O Re1 a6 Bb3 Ba7 h3 h6 Nbd2 Re8',
    'e4 e5 Nf3 Nc6 Bc4 Bc5 d3 Nf6 c3 d6 O-O O-O Re1 a5 Bb5 Ne7 d4 Bb6',
    'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Bc5 c3 d6 O-O O-O Re1 a6 Bb3 Ba7 Nbd2',
    'e4 e5 Nf3 Nc6 Bc4 Nf6 d3 Be7 O-O O-O Re1 d6 c3 Na5 Bb5 a6 Ba4 b5 Bc2 c5 Nbd2',
    'e4 e5 Nf3 Nc6 Bc4 Nf6 Ng5 d5 exd5 Na5 Bb5+ c6 dxc6 bxc6 Be2 h6 Nf3 e4 Ne5 Bd6 d4',
    'e4 e5 Nf3 Nc6 Bc4 Nf6 d4 exd4 O-O Nxe4 Re1 d5 Bxd5 Qxd5 Nc3 Qa5 Nxe4 Be6',
    'e4 e5 Nf3 Nc6 Bc4 Bc5 b4 Bxb4 c3 Ba5 d4 exd4 O-O',
    // Ruy Lopez
    'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 d6 c3 O-O h3 Na5 Bc2 c5 d4 Qc7 Nbd2',
    'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Be7 Re1 b5 Bb3 O-O c3 d5 exd5 Nxd5 Nxe5 Nxe5 Rxe5 c6 d4 Bd6 Re1 Qh4 g3 Qh3',
    'e4 e5 Nf3 Nc6 Bb5 Nf6 O-O Nxe4 d4 Nd6 Bxc6 dxc6 dxe5 Nf5 Qxd8+ Kxd8 Nc3 Ke8',
    'e4 e5 Nf3 Nc6 Bb5 Nf6 d3 Bc5 c3 O-O O-O d6 h3 a6 Ba4 Ba7 Re1',
    'e4 e5 Nf3 Nc6 Bb5 a6 Bxc6 dxc6 O-O f6 d4 exd4 Nxd4 c5 Nb3 Qxd1 Rxd1',
    'e4 e5 Nf3 Nc6 Bb5 a6 Ba4 Nf6 O-O Nxe4 d4 b5 Bb3 d5 dxe5 Be6 c3',
    // Các khai cuộc tốt vua khác
    'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Nf6 Nxc6 bxc6 e5 Qe7 Qe2 Nd5 c4 Ba6 b3',
    'e4 e5 Nf3 Nc6 d4 exd4 Nxd4 Bc5 Be3 Qf6 c3 Nge7 Bc4 O-O O-O',
    'e4 e5 Nf3 Nc6 d4 exd4 Bc4 Nf6 e5 d5 Bb5 Ne4 Nxd4 Bd7',
    'e4 e5 Nf3 Nc6 Nc3 Nf6 Bb5 Bb4 O-O O-O d3 d6 Bg5 Bxc3 bxc3 Qe7 Re1 Nd8 d4 Ne6',
    'e4 e5 Nf3 Nc6 Nc3 Nf6 d4 exd4 Nxd4 Bb4 Nxc6 bxc6 Bd3 d5 exd5 cxd5 O-O O-O Bg5 c6',
    'e4 e5 Nf3 Nf6 Nxe5 d6 Nf3 Nxe4 d4 d5 Bd3 Nc6 O-O Be7 c4 Nb4 Be2 O-O Nc3',
    'e4 d6 d4 Nf6 Nc3 e5 Nf3 Nbd7 Bc4 Be7 O-O O-O',
    'e4 e5 Nc3 Nf6 Bc4 Nc6 d3 Bb4 Bg5 h6 Bxf6 Bxc3+ bxc3 Qxf6',
    'e4 e5 f4 exf4 Nf3 g5 h4 g4 Ne5 Nf6 Bc4 d5 exd5 Bd6 d4 Nh5',
    'e4 e5 Bc4 Nf6 d3 c6 Nf3 d5 Bb3 Bd6 Nc3 dxe4 Ng5 O-O Ngxe4',
    'e4 e5 d4 exd4 Qxd4 Nc6 Qe3 Nf6 Nc3 Bb4 Bd2 O-O O-O-O Re8',
    // Sicilian
    'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be3 e5 Nb3 Be6 f3 Be7 Qd2 O-O O-O-O Nbd7 g4',
    'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Bg5 e6 f4 Be7 Qf3 Qc7 O-O-O Nbd7',
    'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6 Be2 e5 Nb3 Be7 O-O O-O Be3 Be6',
    'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6 Be3 Bg7 f3 O-O Qd2 Nc6 Bc4 Bd7 O-O-O Rc8 Bb3 Ne5',
    'e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6 Bg5 e6 Qd2 a6 O-O-O Bd7 f4 Be7',
    'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 Nf6 Nc3 e5 Ndb5 d6 Bg5 a6 Na3 b5 Bxf6 gxf6 Nd5 f5',
    'e4 c5 Nf3 e6 d4 cxd4 Nxd4 Nc6 Nc3 Qc7 Be3 a6 Qd2 Nf6 O-O-O Bb4 f3 Ne5',
    'e4 c5 Nf3 e6 d4 cxd4 Nxd4 a6 Bd3 Nf6 O-O Qc7 Qe2 d6 c4 g6',
    'e4 c5 Nf3 Nc6 d4 cxd4 Nxd4 g6 c4 Bg7 Be3 Nf6 Nc3 O-O Be2 d6 O-O Bd7',
    'e4 c5 c3 Nf6 e5 Nd5 d4 cxd4 Nf3 Nc6 cxd4 d6 Bc4 Nb6 Bb5 dxe5 Nxe5 Bd7',
    'e4 c5 c3 d5 exd5 Qxd5 d4 Nf6 Nf3 e6 Be2 Nc6 O-O cxd4 cxd4 Be7 Nc3 Qd6',
    'e4 c5 Nf3 Nc6 Bb5 g6 Bxc6 dxc6 d3 Bg7 h3 Nf6 Nc3 O-O Be3 b6',
    'e4 c5 Nf3 d6 Bb5+ Bd7 Bxd7+ Qxd7 O-O Nc6 c3 Nf6 d4',
    'e4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 f4 e6 Nf3 Nge7 O-O O-O',
    'e4 c5 Nc3 Nc6 f4 g6 Nf3 Bg7 Bc4 e6 f5',
    'e4 c5 d4 cxd4 c3 dxc3 Nxc3 Nc6 Nf3 d6 Bc4 e6 O-O Nf6 Qe2 Be7 Rd1 e5',
    // French
    'e4 e6 d4 d5 e5 c5 c3 Nc6 Nf3 Qb6 a3 c4 Nbd2 Na5 Be2 Bd7 O-O Ne7',
    'e4 e6 d4 d5 Nc3 Bb4 e5 c5 a3 Bxc3+ bxc3 Ne7 Qg4 Qc7 Qxg7 Rg8 Qxh7 cxd4 Ne2 Nbc6 f4',
    'e4 e6 d4 d5 Nc3 Nf6 Bg5 Be7 e5 Nfd7 Bxe7 Qxe7 f4 O-O Nf3 c5 Qd2 Nc6 O-O-O',
    'e4 e6 d4 d5 Nc3 Nf6 e5 Nfd7 f4 c5 Nf3 Nc6 Be3 cxd4 Nxd4 Bc5 Qd2 O-O O-O-O',
    'e4 e6 d4 d5 Nd2 Nf6 e5 Nfd7 Bd3 c5 c3 Nc6 Ne2 cxd4 cxd4 f6 exf6 Nxf6 Nf3 Bd6 O-O',
    'e4 e6 d4 d5 Nd2 c5 exd5 Qxd5 Ngf3 cxd4 Bc4 Qd6 O-O Nf6 Nb3 Nc6 Nbxd4 Nxd4 Nxd4 a6',
    'e4 e6 d4 d5 exd5 exd5 Nf3 Nf6 Bd3 Bd6 O-O O-O Bg5 Bg4 Nbd2 Nbd7',
    'e4 e6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Nf3 Ngf6 Nxf6+ Nxf6 Bd3 c5 dxc5 Bxc5',
    // Caro-Kann
    'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5 Ng3 Bg6 h4 h6 Nf3 Nd7 h5 Bh7 Bd3 Bxd3 Qxd3 e6 Bd2 Ngf6 O-O-O Be7',
    'e4 c6 d4 d5 e5 Bf5 Nf3 e6 Be2 c5 Be3 cxd4 Nxd4 Ne7 O-O Nbc6',
    'e4 c6 d4 d5 e5 Bf5 Nc3 e6 g4 Bg6 Nge2 c5 h4 h5 Nf4 Bh7',
    'e4 c6 d4 d5 exd5 cxd5 c4 Nf6 Nc3 e6 Nf3 Be7 cxd5 Nxd5 Bd3 Nc6 O-O O-O',
    'e4 c6 d4 d5 exd5 cxd5 Bd3 Nc6 c3 Nf6 Bf4 Bg4 Qb3 Qd7 Nd2 e6',
    'e4 c6 Nc3 d5 Nf3 Bg4 h3 Bxf3 Qxf3 e6 d4 Nf6 Bd3 dxe4 Nxe4 Qxd4 c3 Qd8',
    'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Nf3 Ngf6 Nxf6+ Nxf6 c3 Bf5 Ne5 e6 Bg5 Be7',
    // Scandinavian, Pirc, Modern, Alekhine
    'e4 d5 exd5 Qxd5 Nc3 Qa5 d4 Nf6 Nf3 c6 Bc4 Bf5 Bd2 e6 Qe2 Bb4 O-O-O Nbd7',
    'e4 d5 exd5 Qxd5 Nc3 Qd6 d4 Nf6 Nf3 a6 Be2 Nc6 O-O Bf5 Be3',
    'e4 d5 exd5 Nf6 d4 Nxd5 Nf3 g6 c4 Nb6 Nc3 Bg7 h3 O-O Be3',
    'e4 d6 d4 Nf6 Nc3 g6 Nf3 Bg7 Be2 O-O O-O c6 a4 Nbd7',
    'e4 d6 d4 Nf6 Nc3 g6 Be3 Bg7 Qd2 c6 f3 b5 g4',
    'e4 d6 d4 Nf6 Nc3 g6 f4 Bg7 Nf3 O-O Bd3 Na6 O-O c5 d5',
    'e4 g6 d4 Bg7 Nc3 d6 Be3 a6 Qd2 Nd7 f4 b5 Nf3 Bb7',
    'e4 Nf6 e5 Nd5 d4 d6 Nf3 dxe5 Nxe5 c6 Be2 Bf5 O-O Nd7 Nf3 e6',
    'e4 Nf6 e5 Nd5 d4 d6 Nf3 Bg4 Be2 e6 O-O Be7 c4 Nb6 Nbd2',
    // Queen's Gambit, Slav
    'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 b6 cxd5 Nxd5 Bxe7 Qxe7 Nxd5 exd5 Rc1 Be6',
    'd4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 Nbd7 Rc1 c6 Bd3 dxc4 Bxc4 Nd5',
    'd4 d5 c4 e6 Nf3 Nf6 Nc3 Be7 Bf4 O-O e3 c5 dxc5 Bxc5 a3 Nc6 Qc2 Qa5 Rd1 Rd8',
    'd4 d5 c4 e6 Nc3 Nf6 cxd5 exd5 Bg5 c6 Qc2 Be7 e3 Nbd7 Bd3 O-O Nge2 Re8 O-O Nf8',
    'd4 d5 c4 e6 Nc3 Nf6 Nf3 Bb4 cxd5 exd5 Bg5 Nbd7 e3 c5 Bd3',
    'd4 d5 c4 e6 Nc3 c5 cxd5 exd5 Nf3 Nc6 g3 Nf6 Bg2 Be7 O-O O-O',
    'd4 d5 c4 dxc4 Nf3 Nf6 e3 e6 Bxc4 c5 O-O a6 dxc5 Qxd1 Rxd1 Bxc5',
    'd4 d5 c4 dxc4 e4 e5 Nf3 exd4 Bxc4 Bb4+ Nbd2 Nc6 O-O',
    'd4 d5 c4 c6 Nf3 Nf6 Nc3 dxc4 a4 Bf5 e3 e6 Bxc4 Bb4 O-O Nbd7 Qe2 Bg6 e4 O-O',
    'd4 d5 c4 c6 cxd5 cxd5 Nc3 Nf6 Bf4 Nc6 e3 Bf5 Nf3 e6 Qb3 Bb4',
    'd4 d5 c4 c6 Nf3 Nf6 e3 Bf5 Nc3 e6 Nh4 Bg6 Nxg6 hxg6 Bd3 Nbd7',
    'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 e3 Nbd7 Bd3 dxc4 Bxc4 b5 Bd3 Bb7 O-O a6 e4 c5 d5',
    'd4 d5 c4 c6 Nf3 Nf6 Nc3 e6 Bg5 h6 Bh4 dxc4 e4 g5 Bg3 b5 Be2 Bb7',
    'd4 d5 Nf3 Nf6 e3 e6 Bd3 c5 c3 Nc6 Nbd2 Bd6 O-O O-O dxc5 Bxc5 e4',
    // Indian defences
    'd4 Nf6 c4 e6 Nc3 Bb4 Qc2 O-O a3 Bxc3+ Qxc3 b6 Bg5 Bb7 f3 h6 Bh4 d5 e3 Nbd7',
    'd4 Nf6 c4 e6 Nc3 Bb4 e3 O-O Bd3 d5 Nf3 c5 O-O Nc6 a3 Bxc3 bxc3 dxc4 Bxc4 Qc7',
    'd4 Nf6 c4 e6 Nf3 b6 g3 Ba6 b3 Bb4+ Bd2 Be7 Bg2 c6 Bc3 d5 Ne5 Nfd7 Nxd7 Nxd7 Nd2 O-O O-O',
    'd4 Nf6 c4 e6 Nf3 Bb4+ Bd2 Qe7 g3 Nc6 Nc3 Bxc3 Bxc3 Ne4 Rc1 O-O Bg2 d6',
    'd4 Nf6 c4 e6 g3 d5 Bg2 Be7 Nf3 O-O O-O dxc4 Qc2 a6 Qxc4 b5 Qc2 Bb7 Bd2 Be4 Qc1',
    'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2 e5 O-O Nc6 d5 Ne7 Ne1 Nd7 Nd3 f5 Bd2 Nf6 f3 f4',
    'd4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3 O-O Be3 e5 d5 c6 Qd2 cxd5 cxd5 a6',
    'd4 Nf6 c4 g6 Nf3 Bg7 g3 O-O Bg2 d6 O-O Nbd7 Nc3 e5 e4 c6 h3 Qb6',
    'd4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5 e4 Nxc3 bxc3 Bg7 Nf3 c5 Rb1 O-O Be2 cxd4 cxd4 Qa5 Bd2 Qxa2 O-O',
    'd4 Nf6 c4 g6 Nc3 d5 Nf3 Bg7 Qb3 dxc4 Qxc4 O-O e4 Bg4 Be3 Nfd7',
    'd4 Nf6 c4 c5 d5 e6 Nc3 exd5 cxd5 d6 e4 g6 Nf3 Bg7 Be2 O-O O-O Re8 Nd2 Na6',
    'd4 Nf6 c4 c5 d5 b5 cxb5 a6 bxa6 g6 Nc3 Bxa6 e4 Bxf1 Kxf1 d6 Nf3 Bg7 g3 O-O Kg2',
    'd4 f5 g3 Nf6 Bg2 g6 Nf3 Bg7 O-O O-O c4 d6 Nc3 Qe8',
    'd4 e6 c4 f5 g3 Nf6 Bg2 d5 Nf3 c6 O-O Bd6 b3 Qe7',
    'd4 Nf6 Bg5 Ne4 Bf4 c5 f3 Qa5+ c3 Nf6 d5 Qb6',
    'd4 Nf6 Nf3 e6 Bg5 c5 e3 h6 Bh4 b6 c3 Bb7 Nbd2 Be7',
    // English, Réti, King's Indian Attack
    'c4 e5 Nc3 Nf6 g3 d5 cxd5 Nxd5 Bg2 Nb6 Nf3 Nc6 O-O Be7 d3 O-O a3 Be6 b4',
    'c4 e5 Nc3 Nc6 g3 g6 Bg2 Bg7 d3 d6 e4 f5 Nge2 Nf6 O-O O-O',
    'c4 c5 Nc3 Nc6 g3 g6 Bg2 Bg7 Nf3 e5 O-O Nge7 d3 O-O a3 d6 Rb1 a5',
    'c4 Nf6 Nc3 e6 e4 d5 e5 d4 exf6 dxc3 bxc3 Qxf6 d4 c5 Nf3 h6 Bd3',
    'c4 c6 e4 d5 exd5 cxd5 cxd5 Nf6 Nc3 Nxd5 Nf3 Nxc3 bxc3 g6 d4 Bg7',
    'Nf3 d5 g3 Nf6 Bg2 c6 O-O Bg4 d3 Nbd7 Nbd2 e5 e4 dxe4 dxe4 Bc5 h3 Bh5',
    'Nf3 d5 c4 e6 g3 Nf6 Bg2 Be7 O-O O-O b3 c5 Bb2 Nc6 e3 b6',
    'e4 e6 d3 d5 Nd2 Nf6 Ngf3 c5 g3 Nc6 Bg2 Be7 O-O O-O Re1 b5 e5 Nd7'
  ];

  function reset() { lines = []; idx = null; }
  function add(eco, name, sans) { lines.push({ eco: eco, name: name, sans: sans }); }
  function addBase() { EXTRA.forEach(function (l) { add('', '', l.split(' ')); }); }
  function parseTsv(text) {
    text.split('\n').forEach(function (line) {
      var c = line.split('\t');
      if (c.length < 3 || c[0] === 'eco') return;
      add(c[0], c[1], c[2].replace(/\d+\.(\.\.)?/g, ' ').trim().split(/\s+/));
    });
  }

  reset();
  FALLBACK.forEach(function (o) { add(o[0], o[1], o[2].split(' ')); });
  addBase();

  // ---------- chỉ mục theo thế cờ ----------
  // Dựng lần đầu khi cần (cần luật cờ của chess.js): pos[khóa thế cờ] = { name, next: { san: { w, key } } }
  var plain = function (s) { return s.replace(/[+#!?]/g, ''); };
  var keyCache;
  function step(prefix, prevKey, san) {
    var k = prefix + ' ' + plain(san);
    if (k in keyCache) return keyCache[k];
    var C = window.Chess, g = new C.Game(prevKey + ' 0 1'), want = plain(san), hit = null;
    // lọc theo ô đến trước rồi mới sinh ký hiệu SAN (tốn kém) cho vài nước còn lại
    var dest = want[0] === 'O' ? null : want.replace(/=.*/, '').slice(-2);
    g.legal().some(function (m) {
      if (dest && C.sqName(C.mTo(m)) !== dest) return false;
      var s = g.san(m);
      if (plain(s) === want) { hit = { m: m, san: s }; return true; }
      return false;
    });
    var r = null;
    if (hit) { g.make(hit.m); r = { key: g.key(), san: hit.san }; }
    return (keyCache[k] = r);
  }
  function build() {
    keyCache = {};
    var pos = {}, start = new window.Chess.Game().key();
    pos[start] = { name: null, next: {} };
    lines.forEach(function (l) {
      var key = start, prefix = '';
      for (var i = 0; i < l.sans.length; i++) {
        var r = step(prefix, key, l.sans[i]);
        if (!r) { if (window.console) console.warn('Openings: nước không hợp lệ', l.sans.slice(0, i + 1).join(' ')); return; }
        prefix += ' ' + plain(l.sans[i]);
        var e = pos[key].next[r.san] = pos[key].next[r.san] || { w: 0, key: r.key };
        e.w++;
        key = r.key;
        pos[key] = pos[key] || { name: null, next: {} };
      }
      if (l.name && !pos[key].name) pos[key].name = { eco: l.eco, name: l.name };
    });
    idx = pos;
  }
  // Khóa thế cờ sau từng nước của chuỗi (phần tử 0 = thế xuất phát); null nếu chuỗi có nước không hợp lệ
  function keysOf(sans) {
    if (!idx) build();
    var key = new window.Chess.Game().key(), prefix = '', out = [key];
    for (var i = 0; i < sans.length; i++) {
      var r = step(prefix, key, sans[i]);
      if (!r) return out;
      prefix += ' ' + plain(sans[i]);
      out.push(key = r.key);
    }
    return out;
  }

  function init() {
    try {
      var cached = localStorage.getItem(CACHE);
      if (cached) { reset(); parseTsv(cached); addBase(); source = 'lichess'; return Promise.resolve(); }
    } catch (e) { /* không có bộ nhớ cục bộ */ }
    function load(base) {
      return Promise.all('abcde'.split('').map(function (f) {
        return fetch(base + f + '.tsv').then(function (r) { if (!r.ok) throw new Error(r.status); return r.text(); });
      }));
    }
    return load(BASES[0]).catch(function () { return load(BASES[1]); }).then(function (texts) {
      var all = texts.join('\n');
      reset(); parseTsv(all); addBase(); source = 'lichess';
      try { localStorage.setItem(CACHE, all); } catch (e) { /* đầy bộ nhớ: lần sau tải lại */ }
    }, function () { /* giữ danh sách dự phòng */ });
  }

  // Thế cờ sau chuỗi nước này có nằm trong lý thuyết khai cuộc không (kể cả khi đến bằng đường hoán vị)
  function known(sans) {
    var ks = keysOf(sans);
    return ks.length === sans.length + 1 && !!idx[ks[ks.length - 1]];
  }
  // Tên khai cuộc của thế cờ gần nhất có tên trên đường đi
  function name(sans) {
    var ks = keysOf(sans);
    for (var i = ks.length - 1; i > 0; i--) { var p = idx[ks[i]]; if (p && p.name) return p.name; }
    return null;
  }
  // Các nước lý thuyết tiếp theo, biến được nghiên cứu nhiều nhất đứng trước
  function continuations(sans) {
    var ks = keysOf(sans), p = ks.length === sans.length + 1 && idx[ks[ks.length - 1]];
    if (!p) return [];
    var cur = name(sans);
    return Object.keys(p.next).map(function (m) {
      var e = p.next[m], nm = idx[e.key].name || cur;
      return { san: m, name: nm ? nm.name : '', weight: e.w };
    }).sort(function (a, b) { return b.weight - a.weight; });
  }

  window.Openings = {
    init: init, known: known, name: name, continuations: continuations,
    count: function () { return lines.length; }, source: function () { return source; }
  };
})();
