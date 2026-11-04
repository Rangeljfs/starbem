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

  /* ===================== EXPORTAR PDF (A4 paisagem, 1 slide por folha) ===================== */
  var btnPdf = document.querySelector('.btn-pdf');
  var pdfLoad = document.querySelector('.pdf-loading');

  function fmtAlvo(el) {
    var alvo = parseFloat(el.getAttribute('data-alvo'));
    var dec = parseInt(el.getAttribute('data-dec') || '0', 10);
    var pref = el.getAttribute('data-pref') || '';
    var suf = el.getAttribute('data-suf') || '';
    return pref + alvo.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suf;
  }

  // mapa id->symbol (do sprite) pra inlinar os ícones no PDF
  var symbolMap = {};
  (function () {
    document.querySelectorAll('svg[aria-hidden="true"] symbol').forEach(function (sym) {
      symbolMap[sym.id] = { vb: sym.getAttribute('viewBox') || '0 0 24 24', inner: sym.innerHTML };
    });
  })();

  // html2canvas NÃO renderiza <use href="#..."> de <symbol>. Então, no clone,
  // troca cada <svg><use/></svg> por um SVG inline com os paths de verdade e
  // com stroke/fill aplicados como ATRIBUTOS (o canvas ignora o CSS herdado).
  function inlineIcones(page) {
    page.querySelectorAll('use').forEach(function (use) {
      var href = use.getAttribute('href') || use.getAttribute('xlink:href') || '';
      var id = href.replace('#', '');
      var sym = symbolMap[id];
      var svg = use.closest('svg');
      if (!sym || !svg) return;
      var cs = getComputedStyle(svg);
      var stroke = cs.stroke && cs.stroke !== 'none' ? cs.stroke : '';
      var fill = cs.fill || 'none';
      var sw = cs.strokeWidth || '1.5';
      // se não tem stroke nem fill útil, assume traço escuro pra não sumir
      if ((!stroke || stroke === 'rgb(0, 0, 0)') && fill === 'none') stroke = stroke || '#0f6f82';
      svg.setAttribute('viewBox', sym.vb);
      if (stroke) { svg.setAttribute('stroke', stroke); svg.setAttribute('stroke-width', sw); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round'); }
      svg.setAttribute('fill', fill);
      svg.innerHTML = sym.inner; // substitui o <use> pelos paths reais
    });
  }

  function preparaClone(page) {
    // ícones inline (ANTES de medir/renderizar)
    inlineIcones(page);
    // contadores no valor final
    page.querySelectorAll('[data-alvo]').forEach(function (el) { el.textContent = fmtAlvo(el); });
    // barras do gráfico na altura final
    page.querySelectorAll('.bar').forEach(function (b) {
      var h = b.getAttribute('data-h'); if (h) { b.style.height = h + '%'; b.classList.add('show'); }
    });
    // timeline toda acesa
    page.querySelectorAll('.tl-sem').forEach(function (s) { s.classList.add('on'); });
    // anéis de progresso no valor final
    page.querySelectorAll('.ind-ring[data-pc]').forEach(function (w) {
      var pc = parseInt(w.getAttribute('data-pc'), 10);
      var circ = w.querySelector('.prog'); var pcTxt = w.querySelector('.pc');
      if (circ) { var r = 52, c = 2 * Math.PI * r; circ.style.strokeDasharray = c; circ.style.strokeDashoffset = c * (1 - pc / 100); }
      if (pcTxt) pcTxt.textContent = pc + '%';
    });
  }

  var gerando = false;
  function setPdfMsg(txt) {
    if (!pdfLoad) return;
    var s = pdfLoad.querySelector('span');
    if (s) s.textContent = txt;
  }
  function limpaPdf(stage) {
    if (stage && stage.parentNode) stage.remove();
    if (pdfLoad) { pdfLoad.hidden = true; pdfLoad.classList.remove('on'); setPdfMsg('Gerando PDF…'); }
    if (btnPdf) btnPdf.disabled = false;
    gerando = false;
  }
  // garante que o overlay NUNCA esteja visível ao abrir a página
  if (pdfLoad) { pdfLoad.hidden = true; pdfLoad.classList.remove('on'); }

  function gerarPDF() {
    if (gerando) return; // evita duplo clique
    var temCanvas = typeof html2canvas !== 'undefined';
    var JsPDFCtor = (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
    if (!temCanvas || !JsPDFCtor) {
      alert('Não foi possível carregar o gerador de PDF. Verifique a conexão e tente novamente.'); return;
    }
    gerando = true;
    btnPdf.disabled = true;
    if (pdfLoad) { pdfLoad.hidden = false; pdfLoad.classList.add('on'); setPdfMsg('Gerando PDF…'); }

    var PW = 1123, PH = 794; // A4 paisagem em px (96dpi)
    // escala adaptativa: celular/telas pequenas usam escala menor pra não travar nem estourar memória
    var escala = (window.innerWidth < 760 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)) ? 1.1 : 1.8;
    var pdf;
    try { pdf = new JsPDFCtor({ unit: 'px', format: [PW, PH], orientation: 'landscape', compress: true }); }
    catch (e) { limpaPdf(null); alert('Não foi possível iniciar o PDF. Tente novamente.'); return; }

    // uma folha de impressão de cada vez (economiza memória no celular)
    function montaPagina(i) {
      var sl = slides[i];
      var stage = document.createElement('div');
      stage.className = 'pdf-stage';
      var page = document.createElement('div');
      page.className = 'pdf-page ' + (sl.classList.contains('bg-escuro') ? 'bg-escuro' : sl.classList.contains('bg-branco') ? 'bg-branco' : 'bg-papel');
      page.innerHTML = '<div class="slide-inner ' + sl.querySelector('.slide-inner').className.replace('slide-inner', '').trim() + '">' + sl.querySelector('.slide-inner').innerHTML + '</div>';
      var rod = document.createElement('div');
      rod.className = 'pdf-rodape'; rod.textContent = 'Associação Volvo';
      page.appendChild(rod);
      stage.appendChild(page);
      document.body.appendChild(stage);   // precisa estar NO DOM antes de preparaClone
      preparaClone(page);                  // inlina ícones usando getComputedStyle
      return { stage: stage, page: page };
    }

    var idx = 0;
    function proxima() {
      if (idx >= slides.length) {
        try { pdf.save('Star-Bem-apresentacao.pdf'); } catch (e) {}
        limpaPdf(null);
        return;
      }
      setPdfMsg('Gerando PDF… ' + (idx + 1) + '/' + slides.length);
      var m = montaPagina(idx);
      html2canvas(m.page, { scale: escala, useCORS: true, backgroundColor: null, width: PW, height: PH, windowWidth: PW, windowHeight: PH, logging: false })
        .then(function (canvas) {
          var img = canvas.toDataURL('image/jpeg', 0.9);
          if (idx > 0) pdf.addPage([PW, PH], 'landscape');
          pdf.addImage(img, 'JPEG', 0, 0, PW, PH);
          m.stage.remove();
          idx++;
          // respiro pro navegador não travar (importante no celular)
          setTimeout(proxima, 30);
        })
        .catch(function (e) {
          limpaPdf(m.stage);
          alert('Falha ao gerar o PDF. Se estiver no celular, tente pelo computador. (' + (e && e.message ? e.message : 'erro') + ')');
        });
    }
    // começa após o overlay pintar
    setTimeout(proxima, 60);
  }

  if (btnPdf) btnPdf.addEventListener('click', gerarPDF);

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
