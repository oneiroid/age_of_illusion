/* @ds-bundle: {"format":4,"namespace":"WakingRoom","components":[{"name":"Button"},{"name":"Stamp"},{"name":"Field"},{"name":"Quote"},{"name":"WakeClock"},{"name":"Veil"},{"name":"MirrorPanel"},{"name":"ChevronRule"}]} */
(function () {
  var R = window.React;
  var h = R.createElement;
  function cx() {
    return Array.prototype.filter.call(arguments, Boolean).join(" ");
  }
  function omit(o, keys) {
    var r = {};
    for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k) && keys.indexOf(k) < 0) r[k] = o[k];
    return r;
  }

  function Button(p) {
    var v = p.variant || "quiet";
    var rest = omit(p, ["variant", "className", "children", "type"]);
    return h("button", Object.assign({ type: p.type || "button" }, rest, {
      className: cx("wr-btn", "wr-btn-" + v, p.className)
    }), p.children);
  }

  function Stamp(p) {
    var tone = p.tone || "neutral";
    return h("span", { className: cx("wr-stamp", "wr-stamp-" + tone, p.className) },
      p.dot ? h("span", { className: "wr-stamp-dot", "aria-hidden": "true" }) : null,
      p.children);
  }

  function Field(p) {
    var autoId = R.useId();
    var id = p.id || autoId;
    var hintId = id + "-hint";
    var rest = omit(p, ["label", "hint", "error", "className", "id"]);
    var msg = p.error || p.hint;
    return h("div", { className: cx("wr-field", p.error ? "wr-field-error" : null, p.className) },
      h("label", { className: "wr-field-label", htmlFor: id }, p.label),
      h("input", Object.assign({}, rest, {
        id: id,
        className: "wr-field-input",
        "aria-invalid": p.error ? "true" : undefined,
        "aria-describedby": msg ? hintId : undefined
      })),
      msg ? h("div", { id: hintId, className: "wr-field-hint" }, p.error ? "Error. " + p.error : p.hint) : null);
  }

  function Quote(p) {
    var size = p.size || "m";
    var echo = p.echo && typeof p.children === "string" ? p.children.split("").reverse().join("") : null;
    return h("figure", { className: cx("wr-quote", "wr-quote-" + size, p.ghost ? "wr-ghost" : null, p.className) },
      h("blockquote", { className: "wr-quote-body" }, p.children),
      echo ? h("div", { className: "wr-quote-echo", "aria-hidden": "true" }, echo) : null,
      p.source ? h("figcaption", { className: "wr-quote-source" }, p.source) : null);
  }

  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function WakeClock(p) {
    var st = R.useState(null);
    var now = st[0], setNow = st[1];
    R.useEffect(function () {
      if (!p.live) return undefined;
      function tick() { var d = new Date(); setNow(pad(d.getHours()) + ":" + pad(d.getMinutes())); }
      tick();
      var t = setInterval(tick, 20000);
      return function () { clearInterval(t); };
    }, [p.live]);
    var time = (p.live && now) || p.time || "03:47";
    var parts = time.split(":");
    return h("div", { className: cx("wr-clock", p.className), role: "timer", "aria-label": time + (p.note ? ", " + p.note : "") },
      h("div", { className: "wr-clock-time", "aria-hidden": "true" },
        h("span", null, parts[0]),
        h("span", { className: "wr-clock-colon" }, ":"),
        h("span", null, parts[1] || "")),
      p.note ? h("div", { className: "wr-clock-note", "aria-hidden": "true" }, p.note) : null);
  }

  function Veil(p) {
    var style = { backgroundImage: "url(" + p.src + ")", minHeight: (p.height || 360) + "px" };
    var a11y = p.alt ? { role: "img", "aria-label": p.alt } : {};
    var shape = p.shape
      ? h("svg", { className: "wr-veil-shape", viewBox: "0 0 600 120", "aria-hidden": "true" },
          h("path", { d: "M610 66 C540 58 488 50 432 56 C392 60 362 47 318 52 C268 57 236 73 186 70 C146 67 122 58 98 64 C74 70 60 86 82 95 C124 106 206 99 268 101 C340 103 430 109 610 114 Z" }))
      : null;
    return h("div", Object.assign({ className: cx("wr-veil", p.className), style: style }, a11y),
      shape,
      h("div", { className: "wr-veil-light", "aria-hidden": "true" }),
      h("div", { className: "wr-veil-content" }, p.children));
  }

  function MirrorPanel(p) {
    return h("section", { className: cx("wr-mirror", p.lit ? "wr-mirror-lit" : null, p.className), "aria-label": p.label },
      h("div", { className: "wr-mirror-side wr-mirror-left" }, p.left),
      h("div", { className: "wr-mirror-axis", "aria-hidden": "true" }, h("span", { className: "wr-mirror-spike" })),
      h("div", { className: "wr-mirror-side wr-mirror-right" }, p.right));
  }

  var chevSeq = 0;
  function ChevronRule(p) {
    var ref = R.useRef(null);
    if (ref.current === null) ref.current = "wr-chev-" + (++chevSeq);
    var pid = ref.current;
    var pitch = p.pitch === "l" ? 40 : 24;
    var hgt = p.pitch === "l" ? 48 : 28;
    var a = Math.round(hgt * 0.42), b = Math.round(hgt * 0.08);
    var d = "M0 " + a + " L" + pitch / 2 + " " + b + " L" + pitch + " " + a +
      " M0 " + (a + hgt / 2) + " L" + pitch / 2 + " " + (b + hgt / 2) + " L" + pitch + " " + (a + hgt / 2);
    return h("svg", { className: cx("wr-chev", p.className), width: "100%", height: hgt, "aria-hidden": "true" },
      h("defs", null,
        h("pattern", { id: pid, width: pitch, height: hgt, patternUnits: "userSpaceOnUse" },
          h("rect", { className: "wr-chev-ground", width: pitch, height: hgt }),
          h("path", { className: "wr-chev-stripe", d: d, strokeWidth: Math.round(hgt * 0.18) }))),
      h("rect", { width: "100%", height: hgt, fill: "url(#" + pid + ")" }));
  }

  var api = { Button: Button, Stamp: Stamp, Field: Field, Quote: Quote, WakeClock: WakeClock, Veil: Veil, MirrorPanel: MirrorPanel, ChevronRule: ChevronRule };
  window.WakingRoom = Object.assign(window.WakingRoom || {}, api);
})();
