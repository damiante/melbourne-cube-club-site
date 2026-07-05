/* Melbourne Cube Club — Swiss tournament manager.
   Runs entirely in the browser; state persists in localStorage so a
   refresh keeps the tournament going until it's manually ended/reset.

   Design goal: as little input as possible. Add names, seat them, play.
   No accounts, no settings. Standings use standard MTG Swiss scoring
   (win/bye = 3 pts, draw = 1) with OMW%/GW% tiebreakers. */
(function () {
  'use strict';

  var STORAGE_KEY = 'mcc_tournament_v1';
  var root = document.getElementById('tournament-app');
  if (!root) return;

  /* -------------------------------------------------- state */
  var state = load() || fresh();

  function fresh() {
    return { phase: 'setup', players: [], rounds: [], currentRound: 0, seq: 1 };
  }
  function load() {
    try { var s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; }
    catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }
  function id(prefix) { return prefix + (state.seq++); }

  function playerName(pid) {
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === pid) return state.players[i].name;
    return '—';
  }
  function currentRoundObj() { return state.rounds[state.currentRound - 1]; }
  function allRecorded(rd) { return rd.matches.every(function (m) { return m.result != null; }); }
  function completedRounds() {
    var n = 0;
    state.rounds.forEach(function (rd) { if (allRecorded(rd)) n++; });
    return n;
  }

  /* -------------------------------------------------- player mgmt (setup) */
  function addPlayer(name) {
    name = (name || '').trim();
    if (!name) return;
    state.players.push({ id: id('p'), name: name });
    save(); render();
    var inp = root.querySelector('.trn__input');
    if (inp) inp.focus();
  }
  function removePlayer(pid) {
    state.players = state.players.filter(function (p) { return p.id !== pid; });
    save(); render();
  }
  function isDuplicate(name) {
    var n = name.trim().toLowerCase();
    return state.players.some(function (p) { return p.name.trim().toLowerCase() === n; });
  }
  function playerById(pid) {
    for (var i = 0; i < state.players.length; i++) if (state.players[i].id === pid) return state.players[i];
    return null;
  }
  function isDropped(pid) { var p = playerById(pid); return !!(p && p.dropped); }

  // Pointer-based drag-to-reorder. Works for mouse + touch: on pointerdown on a
  // handle we track moves at the document level (robust vs pointer capture) and
  // live-reorder the list, committing the new order on release.
  function enableReorder(ul) {
    ul.querySelectorAll('.trn__drag').forEach(function (handle) {
      handle.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        var dragging = handle.closest('.trn__prow');
        if (!dragging) return;
        dragging.classList.add('is-dragging');

        function onMove(ev) {
          ev.preventDefault();
          var others = Array.prototype.slice.call(ul.querySelectorAll('.trn__prow:not(.is-dragging)'));
          var next = null;
          for (var i = 0; i < others.length; i++) {
            var r = others[i].getBoundingClientRect();
            if (ev.clientY < r.top + r.height / 2) { next = others[i]; break; }
          }
          ul.insertBefore(dragging, next);
        }
        function onUp() {
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
          dragging.classList.remove('is-dragging');
          var ids = Array.prototype.slice.call(ul.querySelectorAll('.trn__prow'))
            .map(function (r) { return r.getAttribute('data-id'); });
          state.players.sort(function (a, b) { return ids.indexOf(a.id) - ids.indexOf(b.id); });
          save(); render();
        }
        document.addEventListener('pointermove', onMove, { passive: false });
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
      });
    });
  }

  /* -------------------------------------------------- matches */
  function newMatch(a, b) { return { id: id('m'), p1: a, p2: b, result: null, bye: false }; }
  function newBye(a) { return { id: id('m'), p1: a, p2: null, result: { a: 2, d: 0, b: 1 }, bye: true }; }

  function havePlayed(a, b) {
    for (var r = 0; r < state.rounds.length; r++) {
      var ms = state.rounds[r].matches;
      for (var i = 0; i < ms.length; i++) {
        var m = ms[i];
        if (m.bye) continue;
        if ((m.p1 === a && m.p2 === b) || (m.p1 === b && m.p2 === a)) return true;
      }
    }
    return false;
  }

  /* -------------------------------------------------- round 1: seat opposites */
  // Players sit in facing columns: entry i -> column floor(i/2), row top if
  // i is even, bottom if odd. The draft passes around the table's perimeter
  // (top row left->right, then bottom row right->left).
  function seatColumns() {
    var N = state.players.length, cols = Math.ceil(N / 2), top = [], bottom = [];
    for (var c = 0; c < cols; c++) {
      top.push(state.players[2 * c] || null);
      bottom.push((2 * c + 1 < N) ? state.players[2 * c + 1] : null);
    }
    return { cols: cols, top: top, bottom: bottom };
  }
  function perimeterOrder() {
    var sc = seatColumns(), loop = [];
    sc.top.forEach(function (p) { if (p) loop.push(p.id); });                 // top L->R
    for (var c = sc.cols - 1; c >= 0; c--) if (sc.bottom[c]) loop.push(sc.bottom[c].id); // bottom R->L
    return loop;
  }
  function generateRound1() {
    // Fold the draft's seating loop so people play whoever sat opposite them
    // in the draft (the diagonal across the table), NOT the person beside them.
    var pool = perimeterOrder();
    var byeId = null;
    if (pool.length % 2 === 1) byeId = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; // odd: a random player sits out
    var half = pool.length / 2;
    var matches = [];
    for (var i = 0; i < half; i++) matches.push(newMatch(pool[i], pool[i + half]));
    if (byeId) matches.push(newBye(byeId));
    return matches;
  }

  function startTournament() {
    if (state.players.length < 2) return;
    state.rounds = [{ number: 1, matches: generateRound1() }];
    state.currentRound = 1;
    state.phase = 'round';
    save(); render();
  }

  /* -------------------------------------------------- standings / stats */
  function computeStats() {
    var stats = {};
    state.players.forEach(function (p) {
      stats[p.id] = { id: p.id, name: p.name, mp: 0, played: 0,
        mw: 0, ml: 0, md: 0, gw: 0, gl: 0, gd: 0, byes: 0, opps: [] };
    });
    state.rounds.forEach(function (rd) {
      if (!allRecorded(rd)) return; // only fully-completed rounds count toward standings
      rd.matches.forEach(function (m) {
        if (!m.result) return;
        var s1 = stats[m.p1];
        if (m.bye) {
          if (!s1) return;
          s1.mp += 3; s1.mw += 1; s1.played += 1; s1.byes += 1;
          s1.gw += m.result.a; s1.gl += m.result.b; s1.gd += m.result.d;
          return;
        }
        var s2 = stats[m.p2];
        if (!s1 || !s2) return;
        var a = m.result.a, b = m.result.b, d = m.result.d;
        s1.gw += a; s1.gl += b; s1.gd += d;
        s2.gw += b; s2.gl += a; s2.gd += d;
        s1.played += 1; s2.played += 1;
        s1.opps.push(m.p2); s2.opps.push(m.p1);
        if (a > b) { s1.mp += 3; s1.mw += 1; s2.ml += 1; }
        else if (b > a) { s2.mp += 3; s2.mw += 1; s1.ml += 1; }
        else { s1.mp += 1; s2.mp += 1; s1.md += 1; s2.md += 1; }
      });
    });
    Object.keys(stats).forEach(function (k) {
      var s = stats[k];
      var mPoss = 3 * s.played;
      s.mwp = mPoss > 0 ? Math.max(0.33, s.mp / mPoss) : 0;
      var games = s.gw + s.gl + s.gd;
      s.gwp = games > 0 ? Math.max(0.33, (3 * s.gw + s.gd) / (3 * games)) : 0;
    });
    Object.keys(stats).forEach(function (k) {
      var s = stats[k];
      s.omw = avgOpp(s.opps, stats, 'mwp');
      s.ogw = avgOpp(s.opps, stats, 'gwp');
    });
    return stats;
  }
  function avgOpp(opps, stats, key) {
    if (!opps.length) return 0;
    var sum = 0, n = 0;
    opps.forEach(function (o) { if (stats[o]) { sum += stats[o][key]; n++; } });
    return n > 0 ? sum / n : 0;
  }
  function ranking(stats) {
    return state.players.map(function (p) { return stats[p.id]; }).sort(function (x, y) {
      return (y.mp - x.mp) || (y.omw - x.omw) || (y.gwp - x.gwp) || (y.ogw - x.ogw)
        || x.name.localeCompare(y.name);
    });
  }

  /* -------------------------------------------------- Swiss pairing (round 2+) */
  function generateSwissRound() {
    // dropped players stay in the standings but are not paired again
    var ranked = ranking(computeStats()).filter(function (s) { return !isDropped(s.id); });
    var pool = ranked.map(function (s) { return s.id; });
    var matches = [];
    if (pool.length % 2 === 1) {
      var byeId = chooseBye(ranked);
      pool = pool.filter(function (x) { return x !== byeId; });
      matches.push(newBye(byeId));
    }
    var pairs = backtrackPair(pool) || sequentialPair(pool);
    pairs.forEach(function (pr) { matches.push(newMatch(pr[0], pr[1])); });
    return matches;
  }
  function chooseBye(ranked) {
    // fewest byes first (nobody gets a 2nd bye until all have had one),
    // then the lowest-standing eligible player.
    var minByes = Math.min.apply(null, ranked.map(function (s) { return s.byes; }));
    for (var i = ranked.length - 1; i >= 0; i--) if (ranked[i].byes === minByes) return ranked[i].id;
    return ranked[ranked.length - 1].id;
  }
  function backtrackPair(list) {
    if (list.length === 0) return [];
    var a = list[0];
    for (var i = 1; i < list.length; i++) {
      var b = list[i];
      if (havePlayed(a, b)) continue;
      var rest = list.slice(1); rest.splice(i - 1, 1);
      var sub = backtrackPair(rest);
      if (sub) return [[a, b]].concat(sub);
    }
    return null;
  }
  function sequentialPair(list) { // fallback: allow a rematch if unavoidable
    var res = [];
    for (var i = 0; i + 1 < list.length; i += 2) res.push([list[i], list[i + 1]]);
    return res;
  }

  function startNextRound(dropIds) {
    dropIds = dropIds || [];
    dropIds.forEach(function (pid) { var p = playerById(pid); if (p) p.dropped = true; });
    var matches = generateSwissRound();
    // remember who dropped on entry so "Back" can restore them
    state.rounds.push({ number: state.currentRound + 1, matches: matches, dropped: dropIds });
    state.currentRound += 1;
    save(); render();
  }

  function goBack() {
    if (state.currentRound > 1) {
      var removed = state.rounds.pop();
      ((removed && removed.dropped) || []).forEach(function (pid) {
        var p = playerById(pid); if (p) delete p.dropped;
      });
      state.currentRound -= 1;
    } else {
      state.rounds = [];
      state.currentRound = 0;
      state.phase = 'setup';
      state.players.forEach(function (p) { delete p.dropped; });
    }
    save(); render();
  }

  /* -------------------------------------------------- tiny DOM helper */
  function h(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'disabled') { if (v) e.disabled = true; }
      else if (k.indexOf('on') === 0) e.addEventListener(k.slice(2).toLowerCase(), v);
      else e.setAttribute(k, v);
    });
    (kids || []).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return e;
  }
  function pct(x) { return Math.round(x * 100) + '%'; }

  /* -------------------------------------------------- modal (record + confirm) */
  function openModal(content) {
    closeModal();
    var overlay = h('div', { class: 'trn__overlay', onclick: function (ev) { if (ev.target === overlay) closeModal(); } });
    overlay.appendChild(h('div', { class: 'trn__modal window', role: 'dialog', 'aria-modal': 'true' }, [content]));
    document.body.appendChild(overlay);
    document.addEventListener('keydown', escClose);
    var f = overlay.querySelector('button'); if (f) f.focus();
  }
  function escClose(ev) { if (ev.key === 'Escape') closeModal(); }
  function closeModal() {
    var ov = document.querySelector('.trn__overlay');
    if (ov) { ov.parentNode.removeChild(ov); document.removeEventListener('keydown', escClose); }
  }
  function confirmDialog(msg, confirmLabel, onYes) {
    openModal(h('div', { class: 'trn__mbody' }, [
      h('p', { class: 'trn__confirm', text: msg }),
      h('div', { class: 'trn__mactions' }, [
        h('button', { class: 'btn btn--primary', onclick: function () { closeModal(); onYes(); } }, [confirmLabel]),
        h('button', { class: 'btn btn--ghost', onclick: closeModal }, ['Cancel'])
      ])
    ]));
  }

  function stepper(label, initial) {
    var val = initial;
    var out = h('span', { class: 'trn__stepval', 'aria-live': 'polite', text: String(val) });
    function set(v) { val = Math.max(0, v); out.textContent = String(val); }
    var node = h('div', { class: 'trn__step' }, [
      h('span', { class: 'trn__steplabel', text: label }),
      h('div', { class: 'trn__stepctl' }, [
        h('button', { class: 'trn__stepbtn', type: 'button', 'aria-label': 'Decrease ' + label, onclick: function () { set(val - 1); } }, ['−']),
        out,
        h('button', { class: 'trn__stepbtn', type: 'button', 'aria-label': 'Increase ' + label, onclick: function () { set(val + 1); } }, ['+'])
      ])
    ]);
    return { node: node, get: function () { return val; } };
  }

  function openRecord(m) {
    if (m.bye) return;
    var r = m.result || { a: 0, d: 0, b: 0 };
    var s1 = stepper(playerName(m.p1) + ' — wins', r.a);
    var sd = stepper('Draws', r.d);
    var s2 = stepper(playerName(m.p2) + ' — wins', r.b);
    var actions = [
      h('button', { class: 'btn btn--primary', onclick: function () {
        m.result = { a: s1.get(), d: sd.get(), b: s2.get() };
        save(); closeModal(); render();
      } }, ['Save result'])
    ];
    if (m.result) actions.push(h('button', { class: 'btn btn--ghost', onclick: function () {
      m.result = null; save(); closeModal(); render();
    } }, ['Clear']));
    openModal(h('div', { class: 'trn__mbody' }, [
      h('h3', { class: 'trn__mtitle', text: 'Record result' }),
      s1.node, sd.node, s2.node,
      h('div', { class: 'trn__mactions' }, actions)
    ]));
  }

  /* -------------------------------------------------- render: setup */
  function renderSetup() {
    var list = h('div', { class: 'trn__players' });
    list.appendChild(h('h2', { class: 'trn__subhead', text: 'Players (' + state.players.length + ')' }));

    var ul = h('ul', { class: 'trn__plist' });
    if (state.players.length === 0) {
      ul.appendChild(h('li', { class: 'trn__empty', text: 'No players yet — add your first below.' }));
    }
    state.players.forEach(function (p, i) {
      ul.appendChild(h('li', { class: 'trn__prow', 'data-id': p.id }, [
        h('span', { class: 'trn__drag', 'aria-hidden': 'true', title: 'Drag to reorder', text: '⠿' }),
        h('span', { class: 'trn__pidx', text: String(i + 1) }),
        h('span', { class: 'trn__pname', text: p.name }),
        h('button', { class: 'trn__premove', title: 'Remove', type: 'button', 'aria-label': 'Remove ' + p.name,
          onclick: function () { removePlayer(p.id); }, text: '✕' })
      ]));
    });
    list.appendChild(ul);
    if (state.players.length > 1) enableReorder(ul);

    var err = h('p', { class: 'trn__adderr', role: 'alert' });
    var input = h('input', { class: 'trn__input', type: 'text', placeholder: 'Player name',
      maxlength: '40', 'aria-label': 'Player name', autocomplete: 'off',
      oninput: function () { err.textContent = ''; } });
    list.appendChild(h('form', { class: 'trn__addform', onsubmit: function (ev) {
      ev.preventDefault();
      var name = input.value.trim();
      if (!name) return;
      if (isDuplicate(name)) { err.textContent = '“' + name + '” is already in the list.'; return; }
      addPlayer(name);
    } }, [
      input,
      h('button', { class: 'btn btn--ghost trn__addbtn', type: 'submit' }, ['Add'])
    ]));
    list.appendChild(err);
    root.appendChild(list);

    root.appendChild(renderTable());

    root.appendChild(h('div', { class: 'trn__actions' }, [
      h('button', { class: 'btn btn--primary', disabled: state.players.length < 2,
        onclick: startTournament }, ['Start tournament!'])
    ]));
  }

  function seatEl(p) {
    if (!p) return h('div', { class: 'trn__seat trn__seat--empty' });
    var i = state.players.indexOf(p);
    return h('div', { class: 'trn__seat' }, [
      h('span', { class: 'trn__seat-num', text: String(i + 1) }),
      h('span', { class: 'trn__seat-name', title: p.name, text: p.name })
    ]);
  }
  function renderTable() {
    var N = state.players.length;
    var sc = seatColumns();
    var cols = Math.max(sc.cols, 1);
    var tracks = 'repeat(' + cols + ', var(--seatw))';

    var top = h('div', { class: 'trn__side trn__side--top' });
    top.style.gridTemplateColumns = tracks;
    sc.top.forEach(function (p) { top.appendChild(seatEl(p)); });

    var bottom = h('div', { class: 'trn__side trn__side--bottom' });
    bottom.style.gridTemplateColumns = tracks;
    sc.bottom.forEach(function (p) { bottom.appendChild(seatEl(p)); });

    var table = h('div', { class: 'trn__table' }, [
      h('span', { class: 'trn__table-label',
        text: N ? N + (N === 1 ? ' player' : ' players') : 'Add players to seat them' })
    ]);

    var stage = h('div', { class: 'trn__stage' }, [top, table, bottom]);
    return h('div', { class: 'trn__arena' }, [
      h('p', { class: 'trn__seatinglabel', text: 'Table seating' }),
      stage
    ]);
  }

  /* -------------------------------------------------- render: round */
  function renderRound() {
    var rd = currentRoundObj();
    root.appendChild(h('h1', { class: 'trn__round-head molten', text: 'Round ' + rd.number }));

    var wrap = h('div', { class: 'trn__matches' });
    rd.matches.forEach(function (m) { wrap.appendChild(renderMatch(m)); });
    root.appendChild(wrap);

    root.appendChild(h('div', { class: 'trn__actions trn__actions--row' }, [
      h('button', { class: 'btn btn--ghost trn__back', onclick: function () {
        var toPrev = state.currentRound > 1;
        var msg = toPrev
          ? 'Go back to round ' + (state.currentRound - 1) + '? This round’s pairings and results will be discarded.'
          : 'Go back to player setup? This round’s pairings will be discarded — your players are kept.';
        confirmDialog(msg, toPrev ? 'Go back' : 'Back to setup', goBack);
      } }, ['◂ Back']),
      h('button', { class: 'btn btn--primary trn__next', disabled: !allRecorded(rd),
        onclick: openNextRoundDialog }, ['Start next round'])
    ]));

    root.appendChild(h('div', { class: 'trn__actions' }, [
      h('button', { class: 'btn btn--ghost', onclick: openResults }, ['View current results'])
    ]));

    if (completedRounds() >= 1) {
      root.appendChild(h('div', { class: 'trn__actions trn__actions--sub' }, [
        h('button', { class: 'btn btn--ghost', onclick: function () {
          var msg = 'End the tournament and show final standings?';
          if (!allRecorded(rd)) msg += ' The current round isn’t finished, so only completed rounds will count.';
          confirmDialog(msg, 'End tournament', function () {
            state.phase = 'ended'; save(); render();
          });
        } }, ['End tournament?'])
      ]));
    }
  }

  function renderMatch(m) {
    if (m.bye) {
      return h('div', { class: 'trn__match trn__match--bye' }, [
        h('div', { class: 'trn__byerow' }, [
          h('span', { class: 'trn__mname', text: playerName(m.p1) }),
          h('span', { class: 'trn__mbye-tag', text: 'BYE · 2–1 win' })
        ])
      ]);
    }
    var done = !!m.result;
    // W | L | D from the left-hand player's perspective (a = their wins,
    // b = their losses / opponent wins, d = draws).
    var vals = done ? [m.result.a, m.result.b, m.result.d] : ['–', '–', '–'];
    return h('div', {
      class: 'trn__match ' + (done ? 'is-recorded' : 'is-pending'),
      role: 'button', tabindex: '0',
      onclick: function () { openRecord(m); },
      onkeydown: function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); openRecord(m); } }
    }, [
      h('div', { class: 'trn__mtop' }, [
        h('span', { class: 'trn__mname trn__mname--l', text: playerName(m.p1) }),
        h('span', { class: 'trn__vs', text: 'vs' }),
        h('span', { class: 'trn__mname trn__mname--r', text: playerName(m.p2) })
      ]),
      h('div', { class: 'trn__wld' }, [
        h('span', { class: 'trn__wld-h', text: 'W' }),
        h('span', { class: 'trn__wld-h', text: 'L' }),
        h('span', { class: 'trn__wld-h', text: 'D' }),
        h('span', { class: 'trn__wld-v', text: String(vals[0]) }),
        h('span', { class: 'trn__wld-v', text: String(vals[1]) }),
        h('span', { class: 'trn__wld-v', text: String(vals[2]) })
      ]),
      h('div', { class: 'trn__mhint', text: done ? 'Tap to edit' : 'Tap to record' })
    ]);
  }

  /* -------------------------------------------------- standings (shared) */
  function standingsLegend() {
    var played = completedRounds();
    return h('p', { class: 'trn__legend',
      text: played + (played === 1 ? ' round' : ' rounds') + ' played · pts · match W–D–L · OMW% tiebreak' });
  }
  function standingsBoard() {
    var board = h('div', { class: 'window trn__standings' });
    ranking(computeStats()).forEach(function (s, i) {
      var name = h('span', { class: 'trn__sname' }, [s.name]);
      if (isDropped(s.id)) name.appendChild(h('span', { class: 'trn__stag', text: 'dropped' }));
      board.appendChild(h('div', { class: 'trn__srow' + (i === 0 ? ' trn__srow--first' : '') }, [
        h('span', { class: 'trn__splace', text: '#' + (i + 1) }),
        name,
        h('div', { class: 'trn__smeta' }, [
          h('span', { class: 'trn__spts', text: s.mp + ' pts' }),
          h('span', { class: 'trn__srec', text: s.mw + '–' + s.md + '–' + s.ml }),
          h('span', { class: 'trn__somw', text: 'OMW ' + pct(s.omw) })
        ])
      ]));
    });
    return board;
  }

  // "View current results" — standings as if ended, without ending
  function openResults() {
    openModal(h('div', { class: 'trn__mbody' }, [
      h('h3', { class: 'trn__mtitle', text: 'Current standings' }),
      standingsLegend(),
      standingsBoard(),
      h('div', { class: 'trn__mactions' }, [
        h('button', { class: 'btn btn--primary', onclick: closeModal }, ['Close'])
      ])
    ]));
  }

  // "Start next round" dialog, with an option to drop players first
  function openNextRoundDialog() {
    var selected = {};
    var active = state.players.filter(function (p) { return !p.dropped; });
    var hint = h('p', { class: 'trn__drophint' });
    var startBtn = h('button', { class: 'btn btn--primary', onclick: function () {
      closeModal(); startNextRound(Object.keys(selected));
    } }, ['Start next round']);
    function refresh() {
      var remaining = active.length - Object.keys(selected).length;
      startBtn.disabled = remaining < 2;
      hint.textContent = remaining < 2 ? 'Keep at least 2 players in to start a round.' : '';
    }
    var chips = active.map(function (p) {
      var chip = h('button', { class: 'trn__dropchip', type: 'button', onclick: function () {
        if (selected[p.id]) { delete selected[p.id]; chip.classList.remove('is-dropping'); }
        else { selected[p.id] = true; chip.classList.add('is-dropping'); }
        refresh();
      }, text: p.name });
      return chip;
    });
    refresh();
    openModal(h('div', { class: 'trn__mbody' }, [
      h('h3', { class: 'trn__mtitle', text: 'Start next round' }),
      h('p', { class: 'trn__confirm', text: 'Locks in the current results and generates fresh Swiss pairings.' }),
      h('p', { class: 'trn__droplabel', text: 'Someone drop out? Tap to remove them from here on — they still count in the final standings.' }),
      h('div', { class: 'trn__dropchips' }, chips),
      hint,
      h('div', { class: 'trn__mactions' }, [
        startBtn,
        h('button', { class: 'btn btn--ghost', onclick: closeModal }, ['Cancel'])
      ])
    ]));
  }

  /* -------------------------------------------------- render: ended */
  function renderEnded() {
    root.appendChild(h('h1', { class: 'trn__round-head molten', text: 'Final standings' }));
    root.appendChild(standingsLegend());
    root.appendChild(standingsBoard());

    root.appendChild(h('div', { class: 'trn__actions' }, [
      h('button', { class: 'btn btn--ghost', onclick: function () {
        confirmDialog('Reset everything and start a brand-new tournament? This clears all players and results.',
          'Reset', function () { state = fresh(); save(); render(); });
      } }, ['Reset tournament'])
    ]));
  }

  /* -------------------------------------------------- boot */
  function render() {
    closeModal();
    var head = document.getElementById('trn-pagehead');   // hide "Run a Tournament" once underway
    if (head) head.style.display = state.phase === 'setup' ? '' : 'none';
    root.innerHTML = '';
    if (state.phase === 'round') renderRound();
    else if (state.phase === 'ended') renderEnded();
    else renderSetup();
  }

  render();
})();
