/* site-chat widget: a dependency-free chat panel for static sites.
 *
 * Embed with one script tag:
 *
 *   <script defer src="https://jesunahmadushno.github.io/site-chat-backend/widget/site-chat.js"
 *     data-endpoint="https://site-chat.example.workers.dev/chat"
 *     data-site="rag-eval-harness"></script>
 *
 * Theme it with CSS variables on :root or on the script's host page:
 *   --scb-bg, --scb-fg, --scb-accent, --scb-accent-fg, --scb-border,
 *   --scb-radius, --scb-font
 * Defaults below are sensible on light and dark pages.
 *
 * The widget builds its DOM from JavaScript only, loads after the page
 * (use defer), and never blocks rendering. If the endpoint is down or
 * busy, the panel shows one plain fallback message.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;
  var endpoint = script.getAttribute("data-endpoint");
  var site = script.getAttribute("data-site");
  if (!endpoint || !site) return;

  var FALLBACK =
    "The assistant is not available right now. Please try again later.";

  var STYLE = [
    ".scb-button{position:fixed;right:1rem;bottom:max(1rem,env(safe-area-inset-bottom));z-index:9998;touch-action:manipulation;",
    "background:var(--scb-accent,#1f6feb);color:var(--scb-accent-fg,#ffffff);",
    "border:1px solid var(--scb-border,transparent);border-radius:999px;",
    "padding:.65rem 1.1rem;font:600 .95rem var(--scb-font,system-ui,sans-serif);",
    "cursor:pointer;box-shadow:0 4px 18px rgba(0,0,0,.25)}",
    ".scb-button:focus-visible{outline:3px solid var(--scb-accent,#1f6feb);outline-offset:2px}",
    ".scb-panel{position:fixed;right:1rem;bottom:max(4.5rem,calc(env(safe-area-inset-bottom) + 3.5rem));z-index:9998;overscroll-behavior:contain;",
    "width:min(22rem,calc(100vw - 2rem));height:min(30rem,calc(100vh - 6rem));",
    "display:none;flex-direction:column;overflow:hidden;",
    "background:var(--scb-bg,#ffffff);color:var(--scb-fg,#1a1a1a);",
    "border:1px solid var(--scb-border,#d0d7de);",
    "border-radius:var(--scb-radius,14px);",
    "font:400 .95rem/1.45 var(--scb-font,system-ui,sans-serif);",
    "box-shadow:0 12px 40px rgba(0,0,0,.3)}",
    ".scb-panel.scb-open{display:flex}",
    ".scb-head{display:flex;align-items:center;justify-content:space-between;",
    "padding:.7rem .9rem;border-bottom:1px solid var(--scb-border,#d0d7de);",
    "font-weight:700}",
    ".scb-close{background:none;border:none;color:inherit;font-size:1.15rem;",
    "cursor:pointer;line-height:1;padding:.2rem .4rem}",
    ".scb-close:focus-visible{outline:3px solid var(--scb-accent,#1f6feb);outline-offset:2px}",
    ".scb-messages{flex:1;overflow-y:auto;overscroll-behavior:contain;padding:.8rem .9rem;",
    "display:flex;flex-direction:column;gap:.6rem}",
    ".scb-msg{max-width:88%;padding:.55rem .75rem;border-radius:var(--scb-radius,14px);",
    "white-space:pre-wrap;word-wrap:break-word}",
    ".scb-msg-user{align-self:flex-end;background:var(--scb-accent,#1f6feb);",
    "color:var(--scb-accent-fg,#ffffff)}",
    ".scb-msg-bot{align-self:flex-start;background:rgba(127,127,127,.14)}",
    ".scb-form{display:flex;gap:.5rem;padding:.7rem .9rem;",
    "border-top:1px solid var(--scb-border,#d0d7de)}",
    ".scb-input{flex:1;padding:.55rem .7rem;border:1px solid var(--scb-border,#d0d7de);",
    "border-radius:var(--scb-radius,14px);background:transparent;color:inherit;",
    "font:inherit}",
    ".scb-input:focus-visible{outline:3px solid var(--scb-accent,#1f6feb);outline-offset:1px}",
    ".scb-send{background:var(--scb-accent,#1f6feb);color:var(--scb-accent-fg,#ffffff);",
    "border:none;border-radius:var(--scb-radius,14px);padding:.55rem .95rem;",
    "font:600 .95rem var(--scb-font,system-ui,sans-serif);cursor:pointer}",
    ".scb-send:focus-visible{outline:3px solid var(--scb-accent,#1f6feb);outline-offset:2px}",
    ".scb-send[disabled]{opacity:.55;cursor:wait}",
    "@media (prefers-reduced-motion: reduce){.scb-button,.scb-panel{transition:none}}",
    "@media (max-width: 920px){.scb-button{bottom:5.75rem}.scb-panel{bottom:9.25rem;height:min(30rem,calc(100vh - 10.25rem))}}",
  ].join("");

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function init() {
    if (document.querySelector(".scb-button")) return;

    var style = document.createElement("style");
    style.textContent = STYLE;
    document.head.appendChild(style);

    var button = el("button", "scb-button", "Ask about this project");
    button.type = "button";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-label", "Ask about this project");

    var panel = el("section", "scb-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Chat with the project assistant");

    var head = el("div", "scb-head");
    head.appendChild(el("span", "", "Project assistant"));
    var close = el("button", "scb-close", "×");
    close.type = "button";
    close.setAttribute("aria-label", "Close chat");
    head.appendChild(close);
    panel.appendChild(head);

    var messages = el("div", "scb-messages");
    messages.setAttribute("aria-live", "polite");
    panel.appendChild(messages);

    var form = el("form", "scb-form");
    var input = el("input", "scb-input");
    input.type = "text";
    input.maxLength = 1000;
    input.placeholder = "Ask about this project";
    input.setAttribute("aria-label", "Your question");
    var send = el("button", "scb-send", "Send");
    send.type = "submit";
    form.appendChild(input);
    form.appendChild(send);
    panel.appendChild(form);

    document.body.appendChild(button);
    document.body.appendChild(panel);

    var history = [];
    var busy = false;

    function addMessage(text, who) {
      var msg = el("div", "scb-msg scb-msg-" + who, text);
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
      return msg;
    }

    function toggle(open) {
      var willOpen = open !== undefined ? open : !panel.classList.contains("scb-open");
      panel.classList.toggle("scb-open", willOpen);
      button.setAttribute("aria-expanded", String(willOpen));
      if (willOpen && messages.childElementCount === 0) {
        addMessage(
          "Hello. I can answer questions about this project from its published results. What would you like to know?",
          "bot"
        );
      }
      if (willOpen) input.focus();
      else button.focus();
    }

    button.addEventListener("click", function () { toggle(); });
    close.addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("scb-open")) toggle(false);
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var text = input.value.trim();
      if (!text || busy) return;
      busy = true;
      send.disabled = true;
      input.value = "";
      addMessage(text, "user");
      var waiting = addMessage("Thinking…", "bot");

      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site: site, message: text, history: history.slice(-6) }),
      })
        .then(function (res) {
          return res.json().catch(function () { return null; }).then(function (data) {
            return { ok: res.ok, data: data };
          });
        })
        .then(function (result) {
          var reply = null;
          if (result.data && typeof result.data.reply === "string" && result.data.reply) {
            reply = result.data.reply;
          } else if (result.data && typeof result.data.error === "string" && result.data.error) {
            reply = result.data.error;
          }
          if (!reply) reply = FALLBACK;
          waiting.textContent = reply;
          history.push({ role: "user", content: text });
          history.push({ role: "assistant", content: reply });
          history = history.slice(-6);
        })
        .catch(function () {
          waiting.textContent = FALLBACK;
        })
        .finally(function () {
          busy = false;
          send.disabled = false;
          input.focus();
        });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
