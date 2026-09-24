/* No Limitz — preview interactions. No network, no storage of lead data. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* Header rule on scroll */
  var top = $(".top");
  var onScroll = function () { top.classList.toggle("is-stuck", window.scrollY > 8); };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Reveals */
  var reveals = $$(".reveal");
  $$(".quotes .reveal, .svc .reveal").forEach(function (el, i) { el.style.setProperty("--d", (i % 4) * 60 + "ms"); });
  $$(".hero .reveal").forEach(function (el, i) { el.style.setProperty("--d", i * 70 + "ms"); });
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* Open / closed — shop time (America/New_York) */
  try {
    var parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", weekday: "short", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date());
    var get = function (t) { var p = parts.filter(function (x) { return x.type === t; })[0]; return p ? p.value : ""; };
    var dayIdx = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
    var mins = (parseInt(get("hour"), 10) % 24) * 60 + parseInt(get("minute"), 10);
    var weekday = dayIdx >= 1 && dayIdx <= 5;
    var open = weekday && mins >= 540 && mins < 1020;
    var msg;
    if (open) msg = "Open now · until 5 PM";
    else if (weekday && mins < 540) msg = "Closed · opens 9 AM";
    else if (dayIdx >= 1 && dayIdx <= 4) msg = "Closed · opens 9 AM tomorrow";
    else msg = "Closed · opens Monday 9 AM";
    var st = $("[data-status]");
    if (st) { st.classList.toggle("is-open", open); $("[data-status-text]").textContent = msg; }
    var hn = $("[data-hours-now]");
    if (hn) hn.innerHTML = '<span class="dot" style="background:' + (open ? "var(--signal)" : "var(--rule-2)") + '"></span>' + msg;
    var row = $('.hours__t tr[data-day="' + dayIdx + '"]');
    if (row) row.classList.add("is-today");
  } catch (e) { /* static hours remain */ }

  /* Shade card */
  var ALPHA = { 50: 0.42, 35: 0.58, 20: 0.72, 15: 0.8, 5: 0.9 };
  var RULES = { car: { front: 28, rear: 15, label: "car", name: "a car's" }, suv: { front: 28, rear: 6, label: "SUV / truck", name: "an SUV, van or truck's" } };
  var state = { vlt: 15, veh: "car" };
  var tiles = $$(".tile");
  var segs = $$(".seg button");

  function verdict(ok) {
    return ok ? '<span class="v v--ok">Meets guide</span>' : '<span class="v v--no">Too dark</span>';
  }
  function render() {
    var r = RULES[state.veh], s = state.vlt, a = ALPHA[s];
    tiles.forEach(function (t) {
      var on = +t.dataset.vlt === s;
      t.setAttribute("aria-checked", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
    });
    segs.forEach(function (b) {
      var on = b.dataset.veh === state.veh;
      b.setAttribute("aria-checked", on ? "true" : "false");
      b.tabIndex = on ? 0 : -1;
    });
    $(".veh--car").hidden = state.veh !== "car";
    $(".veh--suv").hidden = state.veh !== "suv";
    $$(".tint").forEach(function (el) { el.setAttribute("fill-opacity", a); });
    var frontOk = s >= r.front, rearOk = s >= r.rear;
    $$(".flag").forEach(function (f) { f.classList.toggle("is-on", !frontOk); });
    var rows = { front: [r.front, frontOk], rear: [r.rear, rearOk], back: [r.rear, rearOk] };
    Object.keys(rows).forEach(function (k) {
      var tr = $('.law tr[data-row="' + k + '"]');
      $("[data-min]", tr).textContent = rows[k][0] + "%";
      $("[data-verdict]", tr).innerHTML = verdict(rows[k][1]);
    });
    var sum;
    if (frontOk) sum = s + "% meets the guide on every side and rear window of " + (state.veh === "car" ? "a car." : "an SUV, van or truck.");
    else if (rearOk) sum = s + "% works on " + r.name + " rear side and rear windows. Front side windows need 28% or lighter.";
    else sum = s + "% is darker than the guide allows on any side or rear window of " + (state.veh === "car" ? "a car (15% minimum on rear glass)." : "an SUV, van or truck (6% minimum on rear glass).");
    $("[data-summary]").textContent = sum;
    $("[data-read-vlt]").textContent = s + "%";
    $("[data-read-veh]").textContent = r.label;
    $("[data-quote-vlt]").textContent = s + "%";
  }
  function radioKeys(list, onPick) {
    list.forEach(function (el, i) {
      el.addEventListener("click", function () { onPick(el); });
      el.addEventListener("keydown", function (e) {
        var d = (e.key === "ArrowRight" || e.key === "ArrowDown") ? 1 : (e.key === "ArrowLeft" || e.key === "ArrowUp") ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = list[(i + d + list.length) % list.length];
        onPick(n); n.focus();
      });
    });
  }
  radioKeys(tiles, function (t) { state.vlt = +t.dataset.vlt; render(); });
  radioKeys(segs, function (b) { state.veh = b.dataset.veh; render(); });
  render();

  /* Quote form — sandboxed demo */
  var form = $("#quote-form");
  var done = $("[data-done]", form);
  $("[data-quote-shade]").addEventListener("click", function () {
    var r = form.querySelector('input[name="shade"][value="' + state.vlt + '%"]');
    if (r) r.checked = true;
    if (state.veh === "suv" && !form.querySelector('input[name="vehicle"]:checked')) {
      form.querySelector('input[name="vehicle"][value="SUV / Truck"]').checked = true;
    }
  });
  function showErr(key, on) {
    var el = $('[data-err="' + key + '"]', form);
    if (el) el.hidden = !on;
    var input = form.elements[key];
    if (input && input.setAttribute) input.setAttribute("aria-invalid", on ? "true" : "false");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = form.querySelector('input[name="vehicle"]:checked');
    var name = form.elements.name.value.trim();
    var digits = form.elements.phone.value.replace(/\D/g, "");
    if (digits.length === 11 && digits.charAt(0) === "1") digits = digits.slice(1);
    var okV = !!v, okN = name.length > 0, okP = digits.length === 10;
    showErr("vehicle", !okV); showErr("name", !okN); showErr("phone", !okP);
    if (!(okV && okN && okP)) {
      var first = !okV ? form.querySelector('input[name="vehicle"]') : !okN ? form.elements.name : form.elements.phone;
      first.focus();
      return;
    }
    var shade = form.querySelector('input[name="shade"]:checked').value;
    var ws = form.querySelector('input[name="windshield"]:checked').value;
    $("[data-done-name]", form).textContent = ", " + name.split(/\s+/)[0];
    $("[data-done-sum]", form).textContent = "Your request would have read: " + v.value + " · shade " + shade.toLowerCase() + " · clear UV windshield film: " + ws.toLowerCase() + ".";
    form.classList.add("is-done");
    done.hidden = false;
    done.focus({ preventScroll: true });
    var y = form.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });
  ["name", "phone"].forEach(function (k) {
    form.elements[k].addEventListener("input", function () { showErr(k, false); });
  });
  $$('input[name="vehicle"]', form).forEach(function (r) { r.addEventListener("change", function () { showErr("vehicle", false); }); });
  $("[data-reset]", form).addEventListener("click", function () {
    form.reset();
    form.classList.remove("is-done");
    done.hidden = true;
    form.querySelector('input[name="vehicle"]').focus();
  });

  /* Proposal pill */
  var pill = $("[data-pill]");
  $("[data-pill-x]").addEventListener("click", function () {
    pill.classList.add("is-gone");
    setTimeout(function () { pill.hidden = true; }, 260);
  });
})();

/* Mobile: move preview notice into flow below the hero so it never covers a CTA */
(function(){
  var n=document.querySelector('[data-pill]'), hero=document.querySelector('section.hero');
  if(!n||!hero||!window.matchMedia) return;
  var mq=window.matchMedia('(max-width: 767px)'), home=n.parentNode, next=n.nextSibling;
  function place(){
    if(mq.matches){ if(!n.classList.contains('is-inline')){ hero.parentNode.insertBefore(n, hero.nextSibling); n.classList.add('is-inline'); } }
    else if(n.classList.contains('is-inline')){ home.insertBefore(n, next); n.classList.remove('is-inline'); }
  }
  place(); if(mq.addEventListener) mq.addEventListener('change', place);
})();
