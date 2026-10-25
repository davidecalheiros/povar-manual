(function () {
  var WEBHOOK = 'https://davidecalheiros.app.n8n.cloud/webhook/povar-manual-contacto';
  var MANUAL = 'https://drive.google.com/file/d/1UIdUXpf73Ukc5rLJRAQIi1V4C0cBxwXD/view';
  var inicio = Date.now();

  var form = document.getElementById('form-manual');
  if (!form) return;

  var params = new URLSearchParams(location.search);
  var caminho = location.pathname.replace(/\/+$/, '').replace(/\.html$/, '') || '/';
  var origem = /\/qr$/.test(caminho) ? 'qr' : (params.get('utm_source') || 'direto');

  var veioDe = '';
  try { if (document.referrer) veioDe = new URL(document.referrer).host; } catch (e) {}
  try {
    var jaContou = sessionStorage.getItem('povar_visita');
    if (!jaContou) {
      sessionStorage.setItem('povar_visita', '1');
      fetch(WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({ tipo: 'visita', origem: origem, veio_de: veioDe }),
        keepalive: true
      }).catch(function () {});
    }
  } catch (e) {}

  var erro = document.getElementById('erro');
  var botao = document.getElementById('enviar');
  var nomeEl = document.getElementById('nome');
  var emailEl = document.getElementById('email');
  var consentEl = document.getElementById('consentimento');

  function mostrarErro(texto, campo) {
    erro.textContent = texto;
    erro.classList.add('ativo');
    campo.setAttribute('aria-invalid', 'true');
    campo.focus();
  }

  [nomeEl, emailEl].forEach(function (el) {
    el.addEventListener('input', function () { el.removeAttribute('aria-invalid'); });
  });

  function abrirManual() {
    location.href = MANUAL;
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    erro.classList.remove('ativo');

    var nome = nomeEl.value.trim();
    var email = emailEl.value.trim();

    if (nome.length < 2) return mostrarErro('Indique o seu nome.', nomeEl);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return mostrarErro('Confirme o email: parece incompleto.', emailEl);
    if (!consentEl.checked) return mostrarErro('Para continuar, aceite a caixa acima.', consentEl);

    botao.disabled = true;
    botao.textContent = 'A abrir o manual...';

    var controlo = typeof AbortController === 'function' ? new AbortController() : null;
    var limite = setTimeout(function () { if (controlo) controlo.abort(); }, 6000);

    fetch(WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify({
        nome: nome,
        email: email,
        website: document.getElementById('website').value,
        consentimento: true,
        origem: origem,
        t: Date.now() - inicio
      }),
      signal: controlo ? controlo.signal : undefined
    }).then(function (res) {
      clearTimeout(limite);
      if (res.status === 400) {
        botao.disabled = false;
        botao.textContent = 'Enviar';
        return mostrarErro('Não foi possível validar os dados. Confirme o nome e o email.', emailEl);
      }
      abrirManual();
    }).catch(function () {
      clearTimeout(limite);
      abrirManual();
    });
  });
})();
