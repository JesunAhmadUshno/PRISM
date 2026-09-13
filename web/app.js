/* ==========================================================================
   PRISM marketing site behaviour
   File: web/app.js
   Owner: web design and front end
   Built: 2026-09-13

   This script makes exactly zero network requests. No fetch, no
   XMLHttpRequest, no WebSocket, no sendBeacon, no dynamic import, no image
   preload, no third party. That is not a coincidence: the live counter this
   file renders would report any request it made, including its own.

   Five progressive enhancements, each of which degrades to something usable:

     1. Theme control       without it, the page follows prefers-color-scheme
     2. Network monitor     without it, a paragraph points at DevTools instead
     3. Connectivity badge  without it, the instruction to pull the plug stands
     4. Copy buttons        without them, the code blocks are still selectable
     5. Local file demo     hidden entirely unless this script runs

   Every value derived from a file name or a URL is written with textContent
   or a DOM node, never with innerHTML.
   ========================================================================== */

(function () {
  'use strict';

  var doc = document;

  /** @param {string} sel @param {ParentNode} [root] */
  function $(sel, root) { return (root || doc).querySelector(sel); }

  function el(tag, className, text) {
    var node = doc.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined && text !== null) { node.textContent = String(text); }
    return node;
  }

  /* ======================================================================
     1. THEME
     Three states: system, light, dark. "system" removes the attribute so
     the stylesheet's prefers-color-scheme block takes over again.
     ====================================================================== */

  var THEME_KEY = 'prism-site-theme';
  var THEME_COLORS = { light: '#f8fafc', dark: '#0b1220' };

  var THEME_MODES = [
    {
      id: 'system',
      label: 'Match my system setting',
      short: 'Auto',
      icon: 'M4 5.5h16v9.5H4zM9 19h6M12 15v4'
    },
    {
      id: 'light',
      label: 'Light theme',
      short: 'Light',
      icon: 'M12 5V3m0 18v-2m7-7h2M3 12h2m11.9-4.9 1.4-1.4M5.7 18.3l1.4-1.4m9.8 0 1.4 1.4M5.7 5.7l1.4 1.4M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z'
    },
    {
      id: 'dark',
      label: 'Dark theme',
      short: 'Dark',
      icon: 'M20 14.2A8.2 8.2 0 0 1 9.8 4 8.2 8.2 0 1 0 20 14.2Z'
    }
  ];

  /** @returns {'light'|'dark'|null} null means the visitor has not chosen. */
  function readStoredTheme() {
    try {
      var v = window.localStorage.getItem(THEME_KEY);
      return (v === 'light' || v === 'dark') ? v : null;
    } catch (e) {
      // Private mode, blocked storage, or a locked-down corporate profile.
      return null;
    }
  }

  function storeTheme(mode) {
    try {
      if (mode === 'system') { window.localStorage.removeItem(THEME_KEY); }
      else { window.localStorage.setItem(THEME_KEY, mode); }
    } catch (e) { /* Nothing to do, and nothing worth telling the user. */ }
  }

  /* The two theme-color meta tags in the head are media scoped. When the
     visitor overrides the system setting, those stop matching what they see,
     so an unscoped tag is inserted in front of them. First matching tag wins,
     and an unscoped tag always matches. Removing it restores the default. */
  function syncBrowserChrome(mode) {
    var override = $('meta[name="theme-color"][data-theme-override]');
    if (mode === 'system') {
      if (override) { override.remove(); }
      return;
    }
    if (!override) {
      override = doc.createElement('meta');
      override.setAttribute('name', 'theme-color');
      override.setAttribute('data-theme-override', '');
      doc.head.insertBefore(override, doc.head.firstChild);
    }
    override.setAttribute('content', THEME_COLORS[mode]);
  }

  function applyTheme(mode) {
    if (mode === 'system') { doc.documentElement.removeAttribute('data-theme'); }
    else { doc.documentElement.setAttribute('data-theme', mode); }
    syncBrowserChrome(mode);
  }

  function buildThemeControl() {
    var slot = $('#theme-slot');
    if (!slot) { return; }

    // With nothing stored, adopt whatever the document already says rather
    // than forcing "system". That keeps an author-set data-theme on the html
    // element working, and it means this control never changes what the
    // visitor is looking at just by loading.
    var stored = readStoredTheme();
    var current = stored || doc.documentElement.getAttribute('data-theme') || 'system';
    if (stored) { applyTheme(stored); }

    var group = el('div', 'theme-group');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'Colour theme');

    var buttons = THEME_MODES.map(function (mode) {
      var btn = el('button', 'theme-btn');
      btn.type = 'button';
      btn.setAttribute('aria-pressed', String(mode.id === current));
      btn.setAttribute('aria-label', mode.label);
      btn.title = mode.label;
      btn.dataset.mode = mode.id;

      var svg = doc.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('width', '15');
      svg.setAttribute('height', '15');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      var path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', mode.icon);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', 'currentColor');
      path.setAttribute('stroke-width', '1.6');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
      btn.appendChild(svg);

      btn.addEventListener('click', function () {
        applyTheme(mode.id);
        storeTheme(mode.id);
        buttons.forEach(function (other) {
          other.setAttribute('aria-pressed', String(other.dataset.mode === mode.id));
        });
      });

      group.appendChild(btn);
      return btn;
    });

    slot.appendChild(group);
    slot.hidden = false;
  }

  /* ======================================================================
     2. NETWORK MONITOR
     Reads the browser's own Navigation Timing and Resource Timing entries.
     It counts the document itself, which Resource Timing omits, so the
     number shown is the complete set of requests this page has caused.
     ====================================================================== */

  var monitor = {
    root: $('.monitor'),
    count: $('#req-count'),
    unit: $('#req-unit'),
    idle: $('#req-idle'),
    list: $('#req-list'),
    nojs: $('#monitor-nojs'),
    seen: Object.create(null),
    entries: [],
    lastAt: 0,
    shownCount: -1
  };

  function fmtBytes(n) {
    if (typeof n !== 'number' || !isFinite(n) || n <= 0) { return null; }
    if (n < 1024) { return n + ' B'; }
    if (n < 1024 * 1024) { return (n / 1024).toFixed(1) + ' kB'; }
    return (n / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function fmtDuration(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    if (s < 60) { return s + 's'; }
    var m = Math.floor(s / 60);
    var rest = s % 60;
    if (m < 60) { return m + 'm ' + String(rest).padStart(2, '0') + 's'; }
    var h = Math.floor(m / 60);
    return h + 'h ' + String(m % 60).padStart(2, '0') + 'm';
  }

  function describeUrl(rawUrl) {
    var out = { label: rawUrl, host: '', external: true };
    try {
      var u = new URL(rawUrl, window.location.href);
      out.host = u.host;
      out.external = (u.origin !== window.location.origin);
      var path = u.pathname;
      out.label = out.external ? (u.host + path) : (path === '/' ? '/ (this page)' : path);
    } catch (e) {
      // A blob: or data: URL, or something unparseable. Show it verbatim.
      out.label = String(rawUrl).slice(0, 120);
      out.external = false;
      out.host = '';
    }
    return out;
  }

  function addEntry(rec) {
    var key = rec.url + '|' + Math.round(rec.at);
    if (monitor.seen[key]) { return false; }
    monitor.seen[key] = true;
    monitor.entries.push(rec);
    if (rec.at > monitor.lastAt) { monitor.lastAt = rec.at; }
    return true;
  }

  function renderMonitor() {
    if (!monitor.root) { return; }

    var total = monitor.entries.length;

    // role="status" is on the count, so only write to it when the number
    // actually changed. A value rewritten every second would be announced
    // every second, which is hostile to a screen reader user.
    if (total !== monitor.shownCount) {
      monitor.shownCount = total;
      if (monitor.count) { monitor.count.textContent = String(total); }
      if (monitor.unit) {
        monitor.unit.textContent = (total === 1)
          ? 'request since this page loaded'
          : 'requests since this page loaded';
      }
      renderList();
    }

    if (monitor.idle) {
      monitor.idle.textContent = fmtDuration(performance.now() - monitor.lastAt);
    }

    var recent = (performance.now() - monitor.lastAt) < 1500;
    monitor.root.setAttribute('data-state', recent ? 'active' : 'idle');
  }

  function renderList() {
    if (!monitor.list) { return; }
    monitor.list.textContent = '';

    if (!monitor.entries.length) {
      monitor.list.appendChild(el('li', 'monitor__empty', 'No entries in the timing buffer.'));
      return;
    }

    monitor.entries
      .slice()
      .sort(function (a, b) { return a.at - b.at; })
      .forEach(function (rec) {
        var info = describeUrl(rec.url);
        var li = doc.createElement('li');

        var name = el('span', 'req-name');
        var chip = el('span', 'req-origin', info.external ? (info.host || 'external') : 'same origin');
        chip.dataset.external = String(info.external);
        name.appendChild(chip);
        name.appendChild(doc.createTextNode(info.label));
        name.title = rec.url;

        var bits = [rec.kind];
        var size = fmtBytes(rec.size);
        if (size) { bits.push(size); }
        var meta = el('span', 'req-meta', bits.join('  '));

        li.appendChild(name);
        li.appendChild(meta);
        monitor.list.appendChild(li);
      });
  }

  function ingestResourceEntries(list) {
    var added = false;
    for (var i = 0; i < list.length; i++) {
      var e = list[i];
      if (!e || !e.name) { continue; }
      var at = (typeof e.responseEnd === 'number' && e.responseEnd > 0) ? e.responseEnd : e.startTime;
      if (addEntry({
        url: e.name,
        kind: e.initiatorType || 'resource',
        size: e.transferSize,
        at: at
      })) { added = true; }
    }
    return added;
  }

  function startMonitor() {
    if (!monitor.root || typeof performance === 'undefined') { return; }
    if (monitor.nojs) { monitor.nojs.hidden = true; }
    if (monitor.count) { monitor.count.setAttribute('role', 'status'); }

    // The document itself. Resource Timing does not list it, and leaving it
    // out would understate the count on a page whose whole argument is that
    // the count is honest.
    try {
      var navEntries = performance.getEntriesByType('navigation');
      if (navEntries && navEntries.length) {
        var nav = navEntries[0];
        addEntry({
          url: window.location.href,
          kind: 'document',
          size: nav.transferSize,
          at: nav.responseEnd || 0
        });
      } else {
        addEntry({ url: window.location.href, kind: 'document', size: 0, at: 0 });
      }
    } catch (e) {
      addEntry({ url: window.location.href, kind: 'document', size: 0, at: 0 });
    }

    try {
      if (typeof performance.getEntriesByType === 'function') {
        ingestResourceEntries(performance.getEntriesByType('resource'));
      }
    } catch (e) { /* Ignore and rely on the observer. */ }

    // A PerformanceObserver keeps receiving entries after the resource timing
    // buffer fills, which a poll of getEntriesByType would not.
    if (typeof window.PerformanceObserver === 'function') {
      try {
        var observer = new PerformanceObserver(function (recordList) {
          if (ingestResourceEntries(recordList.getEntries())) { renderMonitor(); }
        });
        observer.observe({ type: 'resource', buffered: true });
      } catch (e) {
        try {
          var legacy = new PerformanceObserver(function (recordList) {
            if (ingestResourceEntries(recordList.getEntries())) { renderMonitor(); }
          });
          legacy.observe({ entryTypes: ['resource'] });
        } catch (e2) { /* Older engine. The initial snapshot still renders. */ }
      }
    }

    renderMonitor();
    window.setInterval(renderMonitor, 1000);
  }

  /* ======================================================================
     3. CONNECTIVITY BADGE
     Supports check 2, "pull the plug". navigator.onLine is only a hint from
     the operating system, and the wording says so rather than overstating it.
     ====================================================================== */

  function startConnectivityBadge() {
    var wrap = $('#offline-state');
    var badge = $('#offline-badge');
    if (!wrap || !badge || typeof navigator.onLine !== 'boolean') { return; }

    function paint() {
      if (navigator.onLine) {
        badge.dataset.tone = 'info';
        badge.textContent = 'Your browser reports that you are online. '
          + 'Disconnect and reload this section to see it change.';
      } else {
        badge.dataset.tone = 'ok';
        badge.textContent = 'Your browser reports that you are offline, '
          + 'and this page is still working. That is the check, on this page.';
      }
    }

    wrap.setAttribute('aria-live', 'polite');
    wrap.hidden = false;
    paint();
    window.addEventListener('online', paint);
    window.addEventListener('offline', paint);
  }

  /* ======================================================================
     4. COPY BUTTONS
     ====================================================================== */

  function startCopyButtons() {
    var buttons = doc.querySelectorAll('.copy-btn');

    Array.prototype.forEach.call(buttons, function (btn) {
      var targetId = btn.getAttribute('data-copy-target');
      var target = targetId ? doc.getElementById(targetId) : null;
      if (!target) { btn.hidden = true; return; }

      var label = $('.copy-btn__label', btn);
      var resetTimer = 0;

      function flash(message) {
        if (label) { label.textContent = message; }
        btn.dataset.state = 'copied';
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(function () {
          if (label) { label.textContent = 'Copy'; }
          btn.removeAttribute('data-state');
        }, 2200);
      }

      function selectInstead() {
        try {
          var range = doc.createRange();
          range.selectNodeContents(target);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);
          flash('Selected');
        } catch (e) {
          flash('Select it');
        }
      }

      btn.addEventListener('click', function () {
        var text = target.textContent || '';
        // navigator.clipboard is a local API. It is not a network call, and it
        // does not appear in the request counter above, which is correct.
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
          navigator.clipboard.writeText(text).then(
            function () { flash('Copied'); },
            function () { selectInstead(); }
          );
        } else {
          selectInstead();
        }
      });
    });
  }

  /* ======================================================================
     5. LOCAL FILE DEMO
     Reads the first 64 kB of a file the visitor chooses and shows what the
     browser saw. Nothing is uploaded, nothing is stored, nothing persists
     past a page reload. The point of the section is the request count
     printed before and after.
     ====================================================================== */

  var SAMPLE_BYTES = 64 * 1024;

  function startFileDemo() {
    var demo = $('#demo');
    var input = $('#demo-file');
    var zone = $('#dropzone');
    var readout = $('#readout');
    var grid = $('#readout-grid');
    var sample = $('#readout-sample');
    var verdict = $('#readout-verdict');
    var clearBtn = $('#demo-clear');

    if (!demo || !input || !zone || !readout || !grid || !sample || !verdict) { return; }

    // FileReader is the API PRISM itself relies on. If it is missing, the
    // demo has nothing honest to show, so it stays hidden.
    if (typeof window.FileReader !== 'function' || typeof window.File !== 'function') { return; }

    demo.hidden = false;
    readout.setAttribute('aria-live', 'polite');

    function row(term, value) {
      var wrap = doc.createElement('div');
      wrap.appendChild(el('dt', null, term));
      wrap.appendChild(el('dd', null, value));
      return wrap;
    }

    function reset() {
      readout.hidden = true;
      grid.textContent = '';
      var code = $('code', sample);
      if (code) { code.textContent = ''; }
      verdict.textContent = '';
      verdict.removeAttribute('data-tone');
      input.value = '';
      zone.removeAttribute('data-dragging');
    }

    // Swap every C0 control character (tab excepted) for U+FFFD so a binary
    // file cannot break the layout. Written character by character rather
    // than with a regex so this source file contains no escape sequences.
    function printable(text) {
      var REPLACEMENT = String.fromCharCode(0xFFFD);
      var out = "";
      for (var i = 0; i < text.length; i++) {
        var code = text.charCodeAt(i);
        var isControl = (code < 32 && code !== 9) || code === 127;
        out += isControl ? REPLACEMENT : text.charAt(i);
      }
      return out;
    }

    // How much of the sample the browser could not decode as UTF-8. A high
    // proportion means the file is not text, which an .xlsx never is.
    function replacementRatio(text) {
      if (!text.length) { return 0; }
      var mark = String.fromCharCode(0xFFFD);
      var hits = 0;
      for (var i = 0; i < text.length; i++) {
        if (text.charAt(i) === mark) { hits++; }
      }
      return hits / text.length;
    }

    function handle(file) {
      if (!file) { return; }

      var before = monitor.entries.length;
      var slice = file.slice(0, SAMPLE_BYTES);
      var reader = new FileReader();

      reader.onerror = function () {
        readout.hidden = false;
        grid.textContent = '';
        grid.appendChild(row('Result', 'Your browser could not read that file.'));
        verdict.dataset.tone = 'warn';
        verdict.textContent = 'The read failed locally. Nothing was sent anywhere, '
          + 'because there is nowhere for this page to send it.';
      };

      reader.onload = function () {
        var text = String(reader.result || '');
        var lines = text.split(/\r\n|\r|\n/);
        var first = printable(lines[0] || '');
        var ratio = replacementRatio(text);
        var looksBinary = text.length > 0 && ratio > 0.05;

        var after = monitor.entries.length;

        grid.textContent = '';
        grid.appendChild(row('File name', file.name));
        grid.appendChild(row('Size on disk', file.size.toLocaleString('en-CA') + ' bytes'));
        grid.appendChild(row('Type reported', file.type || 'not reported by the browser'));
        grid.appendChild(row(
          'Last modified',
          file.lastModified ? new Date(file.lastModified).toLocaleString() : 'not reported'
        ));
        grid.appendChild(row(
          'Bytes read here',
          Math.min(file.size, SAMPLE_BYTES).toLocaleString('en-CA')
            + ' (first 64 kB only)'
        ));
        grid.appendChild(row(
          'Lines in that sample',
          looksBinary ? 'not text, so lines are not meaningful' : lines.length.toLocaleString('en-CA')
        ));
        grid.appendChild(row('Bytes sent anywhere', '0'));

        var code = $('code', sample);
        if (code) {
          if (looksBinary) {
            code.textContent = 'This file is not plain text, so there is no readable first line. '
              + 'An .xlsx workbook is a zip archive, which is why it looks like this. '
              + 'PRISM unpacks it with SheetJS, in the tab, and this page does not.';
          } else {
            code.textContent = first.length > 400 ? (first.slice(0, 400) + ' ...') : (first || '(the first line is empty)');
          }
        }

        if (after === before) {
          verdict.removeAttribute('data-tone');
          verdict.textContent = 'The request counter at the top of this page read '
            + before + ' before that file was opened and ' + after
            + ' after it. Reading your file caused no network request, because reading a '
            + 'local file is not a network operation. This is the whole mechanism PRISM '
            + 'is built on.';
        } else {
          verdict.dataset.tone = 'warn';
          verdict.textContent = 'The request counter moved from ' + before + ' to ' + after
            + '. This page makes no request of its own, so something else on this page load '
            + 'did that, most likely a browser extension. Check the Network panel, and treat '
            + 'that as the real instrument rather than this one.';
        }

        readout.hidden = false;
      };

      reader.readAsText(slice);
    }

    input.addEventListener('change', function () {
      handle(input.files && input.files[0]);
    });

    if (clearBtn) { clearBtn.addEventListener('click', reset); }

    ['dragenter', 'dragover'].forEach(function (type) {
      zone.addEventListener(type, function (ev) {
        ev.preventDefault();
        zone.dataset.dragging = 'true';
      });
    });

    ['dragleave', 'dragend'].forEach(function (type) {
      zone.addEventListener(type, function (ev) {
        if (ev.target === zone) { zone.removeAttribute('data-dragging'); }
      });
    });

    zone.addEventListener('drop', function (ev) {
      ev.preventDefault();
      zone.removeAttribute('data-dragging');
      var dt = ev.dataTransfer;
      if (dt && dt.files && dt.files.length) { handle(dt.files[0]); }
    });

    // A file dropped anywhere else would otherwise navigate the tab away from
    // the page, which on a page about not moving files is a poor look.
    ['dragover', 'drop'].forEach(function (type) {
      window.addEventListener(type, function (ev) {
        if (!zone.contains(ev.target)) { ev.preventDefault(); }
      });
    });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */

  var booted = false;

  function boot() {
    // Idempotent on purpose. A deferred script runs once, but a second
    // DOMContentLoaded or a duplicated script tag would otherwise build a
    // second theme control and a second timer.
    if (booted) { return; }
    booted = true;

    buildThemeControl();
    startMonitor();
    startConnectivityBadge();
    startCopyButtons();
    startFileDemo();
  }

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
