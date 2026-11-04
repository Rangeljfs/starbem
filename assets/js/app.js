/* Star Bem — motor de apresentação (deck de slides) */
(function () {
  'use strict';
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var deck = document.querySelector('.deck');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var total = slides.length;
  var atual = 0;

  var elSetaPrev = document.querySelector('.seta.prev');
  var elSetaNext = document.querySelector('.seta.next');
  var elContador = document.querySelector('.contador');
  var elProg = document.querySelector('.prog-top');
  var elTop = document.querySelector('.topbar');
  var elCtrl = document.querySelector('.ctrl');
  var elDica = document.querySelector('.dica');

  var elAssina = document.querySelector('.assinatura');
  function atualizaChrome() {
    var slideAtual = slides[atual];
    var escuro = slideAtual.classList.contains('bg-escuro') || slideAtual.classList.contains('bg-azul');
    elTop.classList.toggle('escuro', escuro);
    elCtrl.classList.toggle('escuro', escuro);
    document.body.classList.toggle('escuro-prog', escuro);
    // esconde a assinatura do rodapé nos slides que já trazem o logo grande da Volvo (capa e contracapa)
    if (elAssina) {
      var temLogo = slideAtual.id === 's1' || slideAtual.id === 's13';
      elAssina.style.opacity = temLogo ? '0' : '';
    }
    elContador.textContent = (atual + 1) + ' / ' + total;
    elProg.style.width = ((atual + 1) / total * 100) + '%';
    elSetaPrev.disabled = atual === 0;
    elSetaNext.disabled = atual === total - 1;
  }

  function voaEstrela() {
    // decisão do cliente: a estrela da capa anima sempre, mesmo com reduced-motion
    var capa = slides[0];
    if (!capa) return;
    capa.classList.remove('voar');
    void capa.offsetWidth; // reflow pra reiniciar a animação
    capa.classList.add('voar');
  }

  function dispara(slide) {
    // anima estrela da capa sempre que o slide 1 fica ativo
    if (slide === slides[0]) voaEstrela();
    // contadores
    slide.querySelectorAll('[data-alvo]').forEach(function (el) {
      if (el._feito) return; el._feito = true;
      animaNum(el);
    });
    // gráfico
    slide.querySelectorAll('.bar').forEach(function (b) {
      if (b._feito) return; b._feito = true;
      var h = b.getAttribute('data-h');
      requestAnimationFrame(function () { b.style.height = h + '%'; b.classList.add('show'); });
    });
    // timeline
    var sems = slide.querySelectorAll('.tl-sem');
    if (sems.length && !slide._tl) {
      slide._tl = true;
      sems.forEach(function (s, i) { setTimeout(function () { s.classList.add('on'); }, reduz ? 0 : i * 110); });
    }
    // anéis
    slide.querySelectorAll('.ind-ring[data-pc]').forEach(function (w) {
      if (w._feito) return; w._feito = true;
      anelAnima(w);
    });
  }

  function irPara(i, dir) {
    if (i < 0 || i >= total || i === atual) return;
    var saiu = slides[atual];
    saiu.classList.remove('ativo');
    saiu.classList.add(i > atual ? 'saindo-esq' : 'saindo-dir');
    setTimeout(function () { saiu.classList.remove('saindo-esq', 'saindo-dir'); saiu.scrollTop = 0; }, 650);
    atual = i;
    var s = slides[atual];
    s.classList.add('ativo');
    dispara(s);
    atualizaChrome();
    escondeDica();
  }
  function prox() { irPara(atual + 1); }
  function ant() { irPara(atual - 1); }

  elSetaNext.addEventListener('click', prox);
  elSetaPrev.addEventListener('click', ant);

  /* teclado */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') { e.preventDefault(); prox(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); ant(); }
    else if (e.key === 'Home') { irPara(0); }
    else if (e.key === 'End') { irPara(total - 1); }
  });

  /* roda do mouse (com trava para não pular vários) */
  var travaWheel = false;
  deck.addEventListener('wheel', function (e) {
    var s = slides[atual];
    var podeScroll = s.scrollHeight > s.clientHeight + 4;
    if (podeScroll) {
      var noTopo = s.scrollTop <= 0;
      var noFim = s.scrollTop + s.clientHeight >= s.scrollHeight - 2;
      if (!(e.deltaY < 0 && noTopo) && !(e.deltaY > 0 && noFim)) return; // deixa rolar dentro
    }
    if (travaWheel) { e.preventDefault(); return; }
    if (Math.abs(e.deltaY) < 18) return;
    e.preventDefault();
    travaWheel = true;
    if (e.deltaY > 0) prox(); else ant();
    setTimeout(function () { travaWheel = false; }, 800);
  }, { passive: false });

  /* swipe no mobile */
  var tX = 0, tY = 0;
  deck.addEventListener('touchstart', function (e) { tX = e.touches[0].clientX; tY = e.touches[0].clientY; }, { passive: true });
  deck.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - tX;
    var dy = e.changedTouches[0].clientY - tY;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy)) { if (dx < 0) prox(); else ant(); }
  }, { passive: true });

  /* contador animado */
  function animaNum(el) {
    var alvo = parseFloat(el.getAttribute('data-alvo'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pref = el.getAttribute('data-pref') || '';
    var suf = el.getAttribute('data-suf') || '';
    function fmt(v) { return pref + v.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf; }
    if (reduz) { el.textContent = fmt(alvo); return; }
    var ini = null, dur = 1500;
    function passo(t) {
      if (!ini) ini = t;
      var p = Math.min((t - ini) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(alvo * e);
      if (p < 1) requestAnimationFrame(passo); else el.textContent = fmt(alvo);
    }
    requestAnimationFrame(passo);
  }

  /* anel de progresso */
  function anelAnima(wrap) {
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
    if (reduz) { txt.textContent = pc + '%'; return; }
    var ini = null, dur = 1400;
    function p(t) {
      if (!ini) ini = t;
      var prog = Math.min((t - ini) / dur, 1);
      var e = 1 - Math.pow(1 - prog, 3);
      txt.textContent = Math.round(pc * e) + '%';
      if (prog < 1) requestAnimationFrame(p); else txt.textContent = pc + '%';
    }
    requestAnimationFrame(p);
  }

  /* dica some após 1ª navegação ou após 5s */
  var dicaOff = false;
  function escondeDica() { if (dicaOff || !elDica) return; dicaOff = true; elDica.classList.add('off'); }
  setTimeout(escondeDica, 5000);

  /* ano no rodapé (se houver) */
  var anoEl = document.getElementById('ano');
  if (anoEl) anoEl.textContent = new Date().getFullYear();

  /* ir para slide pelo hash (#s3) */
  function doHash() {
    var m = (location.hash || '').match(/^#s(\d+)$/);
    if (m) { var i = parseInt(m[1], 10) - 1; if (i >= 0 && i < total) irPara(i); }
  }
  window.addEventListener('hashchange', doHash);

  /* init */
  slides[0].classList.add('ativo');
  dispara(slides[0]);
  atualizaChrome();
  doHash();
})();
