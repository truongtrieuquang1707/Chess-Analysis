// Chuỗi giao diện và lời nhận xét cho hai ngôn ngữ. Giá trị là chuỗi ({0}, {1}… là tham số), mảng, hoặc hàm.
(function () {
  'use strict';
  var L = {
    vi: {
      title: 'Cờ Vua', sides: ['Trắng', 'Đen'], pieces: ['', 'Tốt', 'Mã', 'Tượng', 'Xe', 'Hậu', 'Vua'],
      engine_loading: 'Đang tải engine…', engine_builtin: 'Engine dự phòng (ngoại tuyến)',
      btn_review: 'Phân tích ván đấu', btn_new: 'Ván mới', btn_undo: 'Đi lại', btn_resign: 'Đầu hàng',
      tip_flip: 'Xoay bàn cờ', tip_sound: 'Bật/tắt âm thanh', tip_lang: 'Switch to English', lang_btn: 'EN',
      dlg_title: 'Ván mới', f_opp: 'Đối thủ', o_ai: 'Máy', o_human: 'Hai người', f_side: 'Bạn cầm quân',
      s_white: 'Trắng', s_black: 'Đen', s_random: 'Ngẫu nhiên', f_elo: 'Elo của máy',
      f_time: 'Thời gian (phút | giây cộng thêm mỗi nước)', cancel: 'Hủy', start: 'Bắt đầu',
      tier: function (e) {
        return e >= 3200 ? 'Tối đa' : e >= 2500 ? 'Kiện tướng' : e >= 2000 ? 'Chuyên gia' : e >= 1500 ? 'Nâng cao' :
          e >= 1000 ? 'Trung cấp' : 'Mới chơi';
      },
      st_review: 'Phân tích ván đấu', st_thinking: 'Máy đang nghĩ…',
      st_turn: function (side, check) { return 'Lượt của ' + side + (check ? ' — đang bị chiếu!' : ''); },
      over_mate: 'Chiếu hết — {0} thắng', over_stalemate: 'Hòa — hết nước đi (pat)',
      over_material: 'Hòa — không đủ quân để chiếu hết', over_rep: 'Hòa — lặp lại thế cờ 3 lần', over_50: 'Hòa — luật 50 nước',
      over_resign: '{1} đầu hàng — {0} thắng', over_time: '{1} hết giờ — {0} thắng',
      over_time_draw: 'Hòa — {1} hết giờ nhưng {0} không đủ quân để chiếu hết',
      you: 'Bạn ({0})', bot: 'Máy ({0})',
      moves_empty: 'Chưa có nước đi nào. Kéo-thả hoặc bấm vào quân để đi.',
      progress: 'Đang phân tích từng nước… {0}/{1}', sum_accuracy: 'Độ chính xác', sum_stats: 'Thống kê nước đi',
      c_start_title: 'Thế cờ ban đầu',
      c_start_text: 'Dùng phím ← → hoặc bấm vào từng nước để xem nhận xét. Mũi tên xanh trên bàn cờ là nước máy đề xuất khi nước đã đi chưa phải tốt nhất.',
      c_best: 'Nước tốt nhất:',
      cls_brilliant: 'Thiên tài', cls_best: 'Tốt nhất', cls_excellent: 'Xuất sắc', cls_good: 'Ổn', cls_book: 'Lý thuyết',
      cls_forced: 'Bắt buộc', cls_inaccuracy: 'Thiếu chính xác', cls_mistake: 'Sai lầm', cls_blunder: 'Sai lầm nghiêm trọng',

      p_shield: 'Nước này làm thủng lớp Tốt che chắn Vua của {0}, tạo điểm yếu để đối phương tấn công sau này.',
      p_pawns: 'Nước này tạo ra Tốt chồng hoặc Tốt cô lập — những điểm yếu lâu dài khó phòng thủ.',
      p_devLag: 'Nước này chưa đưa thêm quân nào vào trận; {0} giúp phát triển lực lượng nhanh hơn.',
      p_center: '{0} kiểm soát trung tâm (d4, e4, d5, e5) tốt hơn hẳn.',
      p_activity: '{0} giúp các quân hoạt động hơn (thêm khoảng {1} ô khống chế).',
      p_oppActive: 'Nước này mở đường cho quân của {0} hoạt động mạnh hơn.',
      p_plan: 'Kế hoạch máy đề xuất: {0}.',
      c_opening: 'Khai cuộc: {0}', c_theory: 'Rời khỏi lý thuyết. Các nước chính trong thế cờ này: {0}.',
      opening_live: 'Khai cuộc: {0}',
      a_showBest: '▶ Xem biến tốt nhất', a_showThreat: '⚔ Xem đòn của đối phương', a_retry: '🎯 Tự tìm nước tốt hơn',
      ex_best: 'Biến tốt nhất', ex_threat: 'Đòn của đối phương', ex_back: '↩ Quay lại', ex_replay: '⟲ Xem lại',
      rt_title: 'Luyện tập: tìm nước tốt hơn cho {0}',
      rt_prompt: 'Thế cờ trước nước {0}. Hãy đi nước bạn cho là tốt nhất cho {1}.',
      rt_checking: 'Đang kiểm tra nước {0}…',
      rt_right: '✅ Chính xác! {0} chính là nước tốt nhất.',
      rt_alt: '✅ Rất tốt! {0} mạnh gần ngang nước máy đề xuất ({1}).',
      rt_wrong: '❌ {0} chưa ổn — đối thủ có thể đáp {1} (đánh giá {2}). Thử lại nhé!',
      rt_hint: 'Gợi ý', rt_hintText: '💡 Gợi ý: hãy dùng {0} ở {1}.', rt_solution: 'Xem đáp án', rt_exit: 'Thoát luyện tập',
      rt_solText: 'Đáp án: {0} — {1}',
      tip_hang: 'Mẹo: trước khi đi, rà lại mọi quân của mình — quân nào đang bị tấn công, quân nào chỉ được bảo vệ một lần? Ô sắp đi tới có bị quân rẻ hơn của đối phương khống chế không?',
      tip_allow: 'Mẹo: sau khi chọn được nước, hãy "đổi vai" một giây — nếu là đối thủ, bạn sẽ chiếu, ăn quân hay đe dọa gì?',
      tip_miss: 'Mẹo: mỗi lượt, hãy tìm trước các nước Chiếu – Ăn quân – Đe dọa của chính mình; các đòn chiến thuật thường nằm ở đó.',
      tip_mateAllow: 'Mẹo: luôn để ý các đường tấn công vào Vua của mình (cột mở, đường chéo, hàng cuối) trước khi đi nước khác.',
      tip_mateMiss: 'Mẹo: khi Vua đối phương thiếu ô thoát, hãy thử mọi nước chiếu — có thể có chiếu hết.',
      tip_stalemate: 'Mẹo: khi thắng áp đảo, luôn chừa cho Vua đối phương ít nhất một nước đi để tránh hòa pat.',
      tip_king: 'Mẹo: ở khai cuộc và trung cuộc, hãy giữ Vua ở nơi an toàn và nhập thành sớm.',
      tip_queen: 'Mẹo: đừng đưa Hậu ra quá sớm — hãy phát triển Mã, Tượng trước.',
      tip_castle: 'Mẹo: nhập thành sớm vừa bảo vệ Vua vừa đưa Xe vào trận.',
      tip_develop: 'Mẹo: ở khai cuộc, ưu tiên đưa Mã, Tượng ra trận và tránh đi một quân nhiều lần.',
      tip_positional: 'Mẹo: khi không có đòn chiến thuật, hãy tìm quân kém hoạt động nhất của mình và cải thiện nó.',
      ls_title: '🎓 Bài học từ ván đấu', ls_phases: 'Độ chính xác theo giai đoạn', ls_moments: 'Khoảnh khắc quyết định',
      ph_opening: 'Khai cuộc', ph_middlegame: 'Trung cuộc', ph_endgame: 'Tàn cuộc',
      ls_hang: 'Để mất quân không được bảo vệ ({0} lần). Trước mỗi nước, hãy kiểm tra quân nào của mình đang bị tấn công.',
      ls_allow: 'Tạo cơ hội cho đòn chiến thuật của đối thủ ({0} lần). Hãy tự hỏi "đối thủ sẽ đáp gì?" trước khi đi.',
      ls_miss: 'Bỏ lỡ cơ hội thắng chất ({0} lần). Hãy rà soát Chiếu – Ăn quân – Đe dọa mỗi lượt.',
      ls_mateAllow: 'Để Vua bị chiếu hết hoặc rơi vào lưới chiếu ({0} lần). Chú ý an toàn Vua.',
      ls_mateMiss: 'Bỏ lỡ đòn chiếu hết ({0} lần). Khi Vua đối phương yếu, hãy thử mọi nước chiếu.',
      ls_stalemate: 'Để thế thắng thành hòa pat ({0} lần).',
      ls_positional: 'Có {0} nước kém về mặt thế trận. Dùng nút "Xem biến tốt nhất" để xem kế hoạch đúng.',
      ls_opening: function (n, name) {
        return 'Mắc {n} lỗi ở giai đoạn khai cuộc'.replace('{n}', n) + (name ? ' (' + name + ')' : '') +
          '. Xem phần "Rời khỏi lý thuyết" ở nước đầu tiên ra khỏi sách để biết các nước chính.';
      },
      ls_clean: 'Không có lỗi đáng kể — ván đấu rất chắc chắn!',
      mat: function (n) {
        return n === 1 ? 'một Tốt' : n === 3 ? 'một quân nhẹ' : n === 5 ? 'một Xe' : n === 9 ? 'một Hậu' : 'chất tương đương ' + n + ' Tốt';
      },
      target: '{0} ở {1}', and: ' và ',
      m_mate: 'Chiếu hết!', m_castle: 'Nhập thành, đưa Vua vào nơi an toàn và đưa Xe vào cuộc.',
      m_promo: 'Phong cấp Tốt thành {0}.', m_recapture: 'Bắt lại {0} ở {1}, hoàn tất việc đổi quân.',
      m_capMore: 'Ăn {0} ở {1}, mở đường thắng thêm chất ở các nước sau.', m_capWin: 'Ăn {0} ở {1} — lời {2}.',
      m_tradePawn: 'Đổi Tốt.', m_trade: 'Đổi {0} lấy {1}, giữ cân bằng chất.', m_cap: 'Ăn {0} ở {1}.',
      m_fork: 'Đòn chĩa đôi: {0} cùng lúc tấn công {1}.', m_checkAttack: 'Vừa chiếu Vua vừa tấn công {0}.',
      m_threat: 'Tạo đe dọa lên {0}.', m_checkForce: 'Chiếu Vua, buộc đối phương phải đối phó.',
      m_rescue: 'Đưa {0} đang bị đe dọa đến chỗ an toàn.', m_check: 'Chiếu Vua.',
      m_develop: 'Phát triển {0} ra vị trí hoạt động hơn.', m_center: 'Đưa Tốt chiếm trung tâm.',
      b_stalemate: 'Thế cờ đang thắng lại thành hòa: {0} không còn nước đi hợp lệ nào mà Vua không bị chiếu (hòa pat).',
      b_allowMate: 'Nước {3} cho phép {0} chiếu hết trong {1} nước: {2}.', b_missMate: 'Nước {2} bỏ lỡ đòn chiếu hết trong {0} nước: {1}.',
      b_lineLoss: 'Sau {0}, {1} thiệt {2}.', b_allowLine: 'Nước này cho phép {0}: sau {1} {2} thiệt {3}.',
      b_movedCaptured: function (piece, sq, san, me, whole, mat, took) {
        if (took) return piece + ' ăn ' + took + ' ở ' + sq + ' nhưng bị bắt lại ngay bằng ' + san + ' — tính cả quân vừa ăn, ' + me + ' vẫn thiệt ' + mat + '.';
        return piece + ' vừa đi tới ' + sq + ' bị bắt ngay bằng ' + san + ' — ' + me + (whole ? ' mất ' + piece : ' thiệt ' + mat) + '.';
      },
      b_leftHanging: 'Bỏ mặc {0} ở {1} đang bị tấn công — {2} ăn bằng {3}.',
      b_undefended: 'Nước này làm {0} ở {1} mất sự bảo vệ — {2} ăn bằng {3}.',
      b_allowTactic: 'Nước này cho phép đòn {0}: sau {1} {2} mất {3}.',
      b_missGainLine: 'Nước {3} bỏ lỡ cơ hội lời chất: sau {0} {1} lời {2}.', b_missCapture: 'Nước {3} bỏ lỡ cơ hội ăn {0} ở {1} bằng {2}{4}.',
      b_missTactic: 'Nước {4} bỏ lỡ đòn chiến thuật {0}: sau {1} {2} thắng {3}.',
      tk_trap: 'bắt chết {0} của {1} ở {2} (quân này bị tấn công mà không còn ô nào an toàn để chạy)',
      tk_fork: 'chĩa đôi — {0} tấn công cùng lúc {1}', tk_pin: 'ghim {0} vào {1} phía sau',
      tk_pinK: 'ghim {0} vào Vua, khiến quân này không được phép di chuyển',
      tk_skewer: 'xiên {0}: quân này buộc phải tránh và để lộ {1} phía sau',
      tk_disc: 'tấn công mở — {0} phía sau bất ngờ lộ ra tấn công {1}', tk_discCheck: 'chiếu mở — {0} phía sau lộ ra chiếu Vua',
      m_tac: '{0}!',
      b_missTac: 'Nước {0} đánh mất cơ hội {1}. Đúng ra phải đi {2}: {3}{4}.',
      b_oppTac: 'Sau {0}, {1} có thể {2}: {3}{4}.',
      b_oppTacLine: 'Sau {0}, {1} có chuỗi nước để {2}: {3}{4}.',
      b_missTacLine: 'Nước {0} đánh mất cơ hội {1}: {2}{3}.',
      win_mat: ' — {0} sẽ thắng {1}', lose_mat: ' — {0} mất {1}',
      p_oppIdea: '{0} được dịp đi {1} để {2}.',
      e_shift: 'Thế cờ của {0}: {1} ({2}) → {3} ({4}).',
      ev_mating: 'có đòn chiếu hết', ev_mated: 'sắp bị chiếu hết', ev_win: 'thắng rõ', ev_better2: 'ưu thế lớn',
      ev_better: 'nhỉnh hơn', ev_equal: 'cân bằng', ev_worse: 'hơi kém', ev_worse2: 'bất lợi lớn', ev_lose: 'thua rõ',
      p_kingMove: 'Di chuyển Vua khiến {0} mất quyền nhập thành.',
      p_earlyQueen: 'Đưa Hậu ra quá sớm, dễ bị quân đối phương đuổi và mất nhịp phát triển.',
      p_allowCheck: 'Nước này cho {0} nước chiếu {1} giành thế chủ động.',
      p_castleBetter: 'Nhập thành {0} để Vua an toàn là lựa chọn tốt hơn.', p_develop: 'Nên ưu tiên phát triển quân với {0}.',
      p_stronger: 'Mạnh hơn là {0}: {1}',
      p_generic: 'Không mất quân ngay, nhưng nước này kém chủ động và để {0} cải thiện thế cờ dễ dàng.',
      t_forced: 'Đây là nước đi hợp lệ duy nhất.', t_book: 'Nước khai cuộc quen thuộc theo lý thuyết.',
      t_brilliant: 'Thí {0} ở {1}! Quân này có thể bị bắt, nhưng nếu ăn thì {2} sẽ gặp rắc rối lớn hơn.',
      t_best: 'Đây đúng là nước mạnh nhất trong thế cờ này.',
      t_excellent: 'Nước đi rất tốt, gần như ngang với nước mạnh nhất {0}.',
      t_good: 'Nước đi chấp nhận được, dù {0} chính xác hơn một chút.'
    },

    en: {
      title: 'Chess', sides: ['White', 'Black'], pieces: ['', 'pawn', 'knight', 'bishop', 'rook', 'queen', 'king'],
      engine_loading: 'Loading engine…', engine_builtin: 'Fallback engine (offline)',
      btn_review: 'Review game', btn_new: 'New game', btn_undo: 'Undo', btn_resign: 'Resign',
      tip_flip: 'Flip board', tip_sound: 'Sound on/off', tip_lang: 'Chuyển sang tiếng Việt', lang_btn: 'VI',
      dlg_title: 'New game', f_opp: 'Opponent', o_ai: 'Computer', o_human: 'Two players', f_side: 'You play',
      s_white: 'White', s_black: 'Black', s_random: 'Random', f_elo: 'Computer Elo',
      f_time: 'Time control (minutes | seconds added per move)', cancel: 'Cancel', start: 'Start',
      tier: function (e) {
        return e >= 3200 ? 'Maximum' : e >= 2500 ? 'Master' : e >= 2000 ? 'Expert' : e >= 1500 ? 'Advanced' :
          e >= 1000 ? 'Intermediate' : 'Beginner';
      },
      st_review: 'Game review', st_thinking: 'Computer is thinking…',
      st_turn: function (side, check) { return side + ' to move' + (check ? ' — in check!' : ''); },
      over_mate: 'Checkmate — {0} wins', over_stalemate: 'Draw — stalemate',
      over_material: 'Draw — insufficient material', over_rep: 'Draw — threefold repetition', over_50: 'Draw — 50-move rule',
      over_resign: '{1} resigned — {0} wins', over_time: '{1} ran out of time — {0} wins',
      over_time_draw: 'Draw — {1} ran out of time but {0} cannot checkmate',
      you: 'You ({0})', bot: 'Computer ({0})',
      moves_empty: 'No moves yet. Drag a piece or click it to move.',
      progress: 'Analyzing each move… {0}/{1}', sum_accuracy: 'Accuracy', sum_stats: 'Move breakdown',
      c_start_title: 'Starting position',
      c_start_text: 'Use the ← → keys or click a move to read its comment. The green arrow on the board shows the engine\'s suggestion whenever the move played was not the best one.',
      c_best: 'Best move:',
      cls_brilliant: 'Brilliant', cls_best: 'Best', cls_excellent: 'Excellent', cls_good: 'Good', cls_book: 'Book',
      cls_forced: 'Forced', cls_inaccuracy: 'Inaccuracy', cls_mistake: 'Mistake', cls_blunder: 'Blunder',

      p_shield: "This weakens the pawn shield in front of {0}'s king, creating a target for a later attack.",
      p_pawns: 'This creates doubled or isolated pawns — long-term weaknesses that are hard to defend.',
      p_devLag: 'This does not bring a new piece into play; {0} develops faster.',
      p_center: '{0} controls the center (d4, e4, d5, e5) much better.',
      p_activity: '{0} makes your pieces more active (about {1} more squares controlled).',
      p_oppActive: "This opens lines for {0}'s pieces to become more active.",
      p_plan: 'The engine plan: {0}.',
      c_opening: 'Opening: {0}', c_theory: 'Out of book. The main theory moves here: {0}.',
      opening_live: 'Opening: {0}',
      a_showBest: '▶ Show best line', a_showThreat: "⚔ Show opponent's reply", a_retry: '🎯 Find a better move',
      ex_best: 'Best line', ex_threat: "Opponent's reply", ex_back: '↩ Back', ex_replay: '⟲ Replay',
      rt_title: 'Practice: find a better move for {0}',
      rt_prompt: 'Position before {0}. Play the move you think is best for {1}.',
      rt_checking: 'Checking {0}…',
      rt_right: '✅ Correct! {0} is the best move.',
      rt_alt: '✅ Very good! {0} is almost as strong as the engine move ({1}).',
      rt_wrong: '❌ {0} is not good enough — the opponent can answer {1} (eval {2}). Try again!',
      rt_hint: 'Hint', rt_hintText: '💡 Hint: use your {0} on {1}.', rt_solution: 'Show solution', rt_exit: 'Exit practice',
      rt_solText: 'Solution: {0} — {1}',
      tip_hang: 'Tip: before moving, scan all your pieces — which are attacked, which are defended only once? Is the target square covered by a cheaper enemy piece?',
      tip_allow: 'Tip: once you pick a move, switch sides for a second — what checks, captures or threats would you play as the opponent?',
      tip_miss: 'Tip: every turn, look at your own Checks, Captures and Threats first; tactics usually hide there.',
      tip_mateAllow: 'Tip: always watch the lines aimed at your king (open files, diagonals, the back rank) before doing anything else.',
      tip_mateMiss: 'Tip: when the enemy king has few escape squares, try every check — there may be a mate.',
      tip_stalemate: 'Tip: when you are winning big, always leave the enemy king at least one legal move to avoid stalemate.',
      tip_king: 'Tip: in the opening and middlegame keep your king safe and castle early.',
      tip_queen: 'Tip: do not bring the queen out too early — develop knights and bishops first.',
      tip_castle: 'Tip: castling early both protects the king and brings a rook into play.',
      tip_develop: 'Tip: in the opening, get knights and bishops out and avoid moving the same piece twice.',
      tip_positional: 'Tip: when there is no tactic, find your least active piece and improve it.',
      ls_title: '🎓 Lessons from this game', ls_phases: 'Accuracy by phase', ls_moments: 'Key moments',
      ph_opening: 'Opening', ph_middlegame: 'Middlegame', ph_endgame: 'Endgame',
      ls_hang: 'Left pieces unprotected ({0} times). Before each move, check which of your pieces are attacked.',
      ls_allow: 'Allowed the opponent a tactic ({0} times). Ask "what will my opponent reply?" before moving.',
      ls_miss: 'Missed chances to win material ({0} times). Scan Checks, Captures and Threats every turn.',
      ls_mateAllow: 'Walked into checkmate or a mating attack ({0} times). Watch your king safety.',
      ls_mateMiss: 'Missed a checkmate ({0} times). When the enemy king is weak, try every check.',
      ls_stalemate: 'Let a winning position slip into stalemate ({0} times).',
      ls_positional: '{0} positionally weak moves. Use "Show best line" to see the right plan.',
      ls_opening: function (n, name) {
        return n + ' mistake' + (n > 1 ? 's' : '') + ' in the opening' + (name ? ' (' + name + ')' : '') +
          '. See the "Out of book" note on the first move that left theory for the main moves.';
      },
      ls_clean: 'No significant mistakes — a very solid game!',
      mat: function (n) {
        return n === 1 ? 'a pawn' : n === 3 ? 'a minor piece' : n === 5 ? 'a rook' : n === 9 ? 'a queen' : 'material worth ' + n + ' pawns';
      },
      target: 'the {0} on {1}', and: ' and ',
      m_mate: 'Checkmate!', m_castle: 'Castles, tucking the king away and bringing the rook into play.',
      m_promo: 'Promotes the pawn to a {0}.', m_recapture: 'Recaptures the {0} on {1}, completing the trade.',
      m_capMore: 'Takes the {0} on {1}, with more material to follow.', m_capWin: 'Takes the {0} on {1}, winning {2}.',
      m_tradePawn: 'Trades pawns.', m_trade: 'Trades {0} for {1}, keeping material level.', m_cap: 'Takes the {0} on {1}.',
      m_fork: 'A fork: the {0} attacks {1} at once.', m_checkAttack: 'Gives check while attacking {0}.',
      m_threat: 'Creates a threat against {0}.', m_checkForce: 'Gives check, forcing a response.',
      m_rescue: 'Moves the threatened {0} to safety.', m_check: 'Gives check.',
      m_develop: 'Develops the {0} to a more active square.', m_center: 'Stakes a claim in the center with the pawn.',
      b_stalemate: 'A winning position is thrown away: {0} has no legal move and is not in check (stalemate).',
      b_allowMate: '{3} allows {0} to force checkmate in {1}: {2}.', b_missMate: '{2} misses a forced checkmate in {0}: {1}.',
      b_lineLoss: 'After {0}, {1} is down {2}.', b_allowLine: 'This allows {0}: after {1}, {2} is down {3}.',
      b_movedCaptured: function (piece, sq, san, me, whole, mat, took) {
        if (took) return 'The ' + piece + ' takes the ' + took + ' on ' + sq + ' but is recaptured at once by ' + san + ' — even counting that, ' + me + ' is down ' + mat + '.';
        return 'The ' + piece + ' that just moved to ' + sq + ' is simply captured by ' + san + ' — ' + me +
          (whole ? ' loses the ' + piece : ' is down ' + mat) + '.';
      },
      b_leftHanging: 'Leaves the {0} on {1} under attack — {2} takes it with {3}.',
      b_undefended: 'This leaves the {0} on {1} without enough protection — {2} takes it with {3}.',
      b_allowTactic: 'This allows the shot {0}: after {1}, {2} loses the {3}.',
      b_missGainLine: '{3} misses a chance to win material: after {0}, {1} is up {2}.',
      b_missCapture: '{3} misses the chance to take the {0} on {1} with {2}{4}.',
      b_missTactic: '{4} misses the tactic {0}: after {1}, {2} wins the {3}.',
      tk_trap: 'trap {1}\'s {0} on {2} (it is attacked and has no safe square to run to)',
      tk_fork: 'fork {1} with the {0}', tk_pin: 'pin {0} to {1} behind it',
      tk_pinK: 'pin {0} to the king, so it is not allowed to move',
      tk_skewer: 'skewer {0}: it has to move away and expose {1} behind it',
      tk_disc: 'unleash a discovered attack — {0} suddenly hits {1}', tk_discCheck: 'give a discovered check with {0}',
      m_tac: 'Strong idea: {0}!',
      b_missTac: '{0} throws away the chance to {1}. The right move was {2}: {3}{4}.',
      b_oppTac: 'After {0}, {1} can {2}: {3}{4}.',
      b_oppTacLine: 'After {0}, {1} has a sequence to {2}: {3}{4}.',
      b_missTacLine: '{0} throws away the chance to {1}: {2}{3}.',
      win_mat: ' — {0} would win {1}', lose_mat: ' — {0} loses {1}',
      p_oppIdea: '{0} gets to play {1} to {2}.',
      e_shift: '{0}\'s position: {1} ({2}) → {3} ({4}).',
      ev_mating: 'has a forced mate', ev_mated: 'is getting mated', ev_win: 'winning', ev_better2: 'clearly better',
      ev_better: 'slightly better', ev_equal: 'equal', ev_worse: 'slightly worse', ev_worse2: 'clearly worse', ev_lose: 'losing',
      p_kingMove: 'Moving the king costs {0} the right to castle.',
      p_earlyQueen: 'Bringing the queen out this early invites attacks and loses time.',
      p_allowCheck: 'This gives {0} the check {1}, seizing the initiative.',
      p_castleBetter: 'Castling with {0} to get the king safe was the better choice.', p_develop: 'Developing a piece with {0} should come first.',
      p_stronger: 'Stronger is {0}: {1}',
      p_generic: 'No material is lost right away, but this is passive and lets {0} improve freely.',
      t_forced: 'This is the only legal move.', t_book: 'A well-known theoretical opening move.',
      t_brilliant: 'A {0} sacrifice on {1}! The piece can be taken, but accepting it lands {2} in even more trouble.',
      t_best: 'This is the strongest move in the position.',
      t_excellent: 'An excellent move, nearly as good as the top choice {0}.',
      t_good: 'A reasonable move, though {0} is slightly more accurate.'
    }
  };

  var lang = 'vi';
  try { if (localStorage.getItem('chess.lang') === 'en') lang = 'en'; } catch (e) { /* không có bộ nhớ cục bộ */ }

  function t(key) {
    var s = L[lang][key], a = arguments;
    if (typeof s === 'function') return s.apply(null, [].slice.call(a, 1));
    if (typeof s !== 'string') return s;
    return s.replace(/\{(\d)\}/g, function (_, i) { return a[+i + 1]; });
  }

  // Điền chữ cho các phần tử tĩnh có data-i18n / data-i18n-title
  function apply() {
    document.documentElement.lang = lang;
    document.title = t('title');
    [].forEach.call(document.querySelectorAll('[data-i18n]'), function (el) { el.textContent = t(el.dataset.i18n); });
    [].forEach.call(document.querySelectorAll('[data-i18n-title]'), function (el) { el.title = t(el.dataset.i18nTitle); });
  }

  window.I18N = {
    t: t, apply: apply,
    get: function () { return lang; },
    set: function (l) { lang = l; try { localStorage.setItem('chess.lang', l); } catch (e) { /* bỏ qua */ } apply(); }
  };
})();
