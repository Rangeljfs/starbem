/* Star Bem — interações e animações */
(function () {
  'use strict';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- menu mobile ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('aberto');
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('aberto'); });
    });
  }

  /* ---------- reveal on scroll ---------- */
  var revs = document.querySelectorAll('.reveal');
  if (reduz) {
    revs.forEach(function (el) { el.classList.add('vis'); });
  } else {
    var ioRev = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('vis'); ioRev.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revs.forEach(function (el) { ioRev.observe(el); });
  }

  /* ---------- nav ativo por seção ---------- */
  var secoes = document.querySelectorAll('section[id]');
  var navAs = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  function setAtivo(id) {
    navAs.forEach(function (a) {
      a.classList.toggle('ativo', a.getAttribute('href') === '#' + id);
    });
  }
  var ioNav = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) setAtivo(e.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  secoes.forEach(function (s) { ioNav.observe(s); });

  /* ---------- contadores animados ---------- */
  function animaNum(el) {
    var alvo = parseFloat(el.getAttribute('data-alvo'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pref = el.getAttribute('data-pref') || '';
    var suf = el.getAttribute('data-suf') || '';
    if (reduz) { el.textContent = pref + alvo.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; return; }
    var ini = null, dur = 1500;
    function passo(t) {
      if (!ini) ini = t;
      var p = Math.min((t - ini) / dur, 1);
      var ease = 1 - Math.pow(1 - p, 3);
      var val = alvo * ease;
      el.textContent = pref + val.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }
  var ioNum = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { animaNum(e.target); ioNum.unobserve(e.target); }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-alvo]').forEach(function (el) { ioNum.observe(el); });

  /* ---------- gráfico de barras ---------- */
  var chart = document.querySelector('.chart');
  if (chart) {
    var ioChart = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        chart.querySelectorAll('.bar').forEach(function (b) {
          var h = b.getAttribute('data-h');
          requestAnimationFrame(function () { b.style.height = h + '%'; b.classList.add('show'); });
        });
        ioChart.unobserve(chart);
      });
    }, { threshold: 0.4 });
    ioChart.observe(chart);
  }

  /* ---------- timeline ---------- */
  var tl = document.querySelector('.tl-trilho');
  if (tl) {
    var ioTl = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var sems = tl.querySelectorAll('.tl-sem');
        sems.forEach(function (s, i) {
          setTimeout(function () { s.classList.add('on'); }, reduz ? 0 : i * 120);
        });
        ioTl.unobserve(tl);
      });
    }, { threshold: 0.4 });
    ioTl.observe(tl);
  }

  /* ---------- anéis de indicadores ---------- */
  var aneis = document.querySelectorAll('.ind-ring[data-pc]');
  var ioRing = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      var wrap = e.target;
      var pc = parseInt(wrap.getAttribute('data-pc'), 10);
      var circ = wrap.querySelector('.prog');
      var txt = wrap.querySelector('.pc');
      var r = 52, c = 2 * Math.PI * r;
      circ.style.strokeDasharray = c;
      circ.style.strokeDashoffset = c;
      requestAnimationFrame(function () {
        circ.style.transition = reduz ? 'none' : 'stroke-dashoffset 1.4s cubic-bezier(.22,1,.36,1)';
        circ.style.strokeDashoffset = c * (1 - pc / 100);
      });
      // conta o texto
      var ini = null, dur = 1400;
      function p(t) {
        if (!ini) ini = t;
        var prog = Math.min((t - ini) / dur, 1);
        var ease = 1 - Math.pow(1 - prog, 3);
        txt.textContent = Math.round(pc * ease) + '%';
        if (prog < 1 && !reduz) requestAnimationFrame(p);
        else txt.textContent = pc + '%';
      }
      if (reduz) { txt.textContent = pc + '%'; } else { requestAnimationFrame(p); }
      ioRing.unobserve(wrap);
    });
  }, { threshold: 0.5 });
  aneis.forEach(function (a) { ioRing.observe(a); });

  /* ---------- ano no rodapé ---------- */
  var anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();
})();
