/*
 * Portal de Serviços (protótipo) – UNISC
 * 1. Preferências (fonte e contraste)   2. Busca tolerante   3. Roteador por hash
 * 4. Telas   5. Barra de acessibilidade   6. Combobox de sugestões   7. Início
 * 8. Sessão   9. Validação   10. Página do serviço   11. Entrar e senha
 * 12. Pedido (etapas, revisão, confirmação)
 *
 * Carregado no <head> sem defer: as preferências salvas valem antes da primeira pintura.
 * O resto espera o DOMContentLoaded.
 */
(function () {
  'use strict';

  var DADOS = window.PORTAL_DADOS || { servicos: [] };
  var NOME_PORTAL = 'Portal de Serviços (protótipo)';

  /* 1. Preferências ------------------------------------------------------- */
  var CHAVE_FONTE = 'portal-prototipo:fonte';
  var CHAVE_CONTRASTE = 'portal-prototipo:contraste';
  var NIVEIS_FONTE = ['100%', '115%', '130%', '150%']; // casa com html[data-fonte] no CSS
  var raiz = document.documentElement;

  function lerPreferencia(chave) {
    try { return window.localStorage.getItem(chave); } catch (e) { return null; }
  }
  function gravarPreferencia(chave, valor) {
    try { window.localStorage.setItem(chave, valor); } catch (e) { /* navegador bloqueou: segue sem guardar */ }
  }

  function nivelFonte() {
    var n = parseInt(raiz.getAttribute('data-fonte') || '0', 10);
    return isNaN(n) ? 0 : Math.min(Math.max(n, 0), NIVEIS_FONTE.length - 1);
  }
  function aplicarFonte(n) {
    if (n > 0) raiz.setAttribute('data-fonte', String(n));
    else raiz.removeAttribute('data-fonte');
  }
  function contrasteLigado() {
    return raiz.getAttribute('data-contraste') === 'alto';
  }
  function aplicarContraste(ligado) {
    if (ligado) raiz.setAttribute('data-contraste', 'alto');
    else raiz.removeAttribute('data-contraste');
  }

  (function aplicarPreferenciasSalvas() {
    var fonte = parseInt(lerPreferencia(CHAVE_FONTE), 10);
    if (!isNaN(fonte) && fonte > 0 && fonte < NIVEIS_FONTE.length) aplicarFonte(fonte);
    if (lerPreferencia(CHAVE_CONTRASTE) === 'alto') aplicarContraste(true);
  })();

  /* 2. Busca tolerante ---------------------------------------------------- */
  var PALAVRAS_VAZIAS = new Set([
    'a', 'o', 'as', 'os', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na',
    'nos', 'nas', 'para', 'pra', 'pro', 'por', 'com', 'meu', 'minha', 'meus', 'minhas', 'seu',
    'sua', 'eu', 'quero', 'preciso', 'como', 'que', 'onde', 'fazer', 'ver'
  ]);

  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\./g, '')               // "c.n.h" vira "cnh"
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }
  function palavrasUteis(texto) {
    return normalizar(texto).split(' ').filter(function (p) {
      return p && !PALAVRAS_VAZIAS.has(p);
    });
  }

  // Distância de edição com troca de letras vizinhas ("cartiera" -> "carteira").
  function distancia(a, b) {
    var m = a.length, n = b.length, i, j, d = [];
    if (Math.abs(m - n) > 2) return 3;
    for (i = 0; i <= m; i++) { d[i] = [i]; }
    for (j = 0; j <= n; j++) { d[0][j] = j; }
    for (i = 1; i <= m; i++) {
      for (j = 1; j <= n; j++) {
        var custo = a[i - 1] === b[j - 1] ? 0 : 1;
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + custo);
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
        }
      }
    }
    return d[m][n];
  }
  function prefixoComum(a, b) {
    var i = 0;
    while (i < a.length && i < b.length && a[i] === b[i]) i++;
    return i;
  }

  // Índice montado uma vez: frases e vocabulário de cada serviço.
  var INDICE = DADOS.servicos.map(function (servico) {
    var frases = [servico.titulo].concat(servico.sinonimos || []).map(normalizar);
    var vocabulario = new Set();
    frases.forEach(function (frase) {
      palavrasUteis(frase).forEach(function (p) { vocabulario.add(p); });
    });
    return { servico: servico, frases: frases, vocabulario: Array.from(vocabulario) };
  });

  function pontuarPalavra(palavra, vocabulario) {
    var melhor = 0;
    vocabulario.forEach(function (v) {
      var nota = 0;
      if (v === palavra) nota = 3;                                          // igual
      else if (palavra.length >= 2 && v.indexOf(palavra) === 0) nota = 2;  // ainda digitando
      else if (palavra.length >= 4 && v.length >= 4 &&
               distancia(palavra, v) <= (palavra.length >= 7 ? 2 : 1)) nota = 1.5; // erro de digitação
      else if (prefixoComum(palavra, v) >= 5) nota = 1;                     // "renovacao" x "renovar"
      if (nota > melhor) melhor = nota;
    });
    return melhor;
  }

  function buscar(texto) {
    var palavras = palavrasUteis(texto);
    var frase = normalizar(texto);
    if (!palavras.length) return [];

    var resultados = INDICE.map(function (item, ordem) {
      var pontos = 0, acertos = 0;
      palavras.forEach(function (p) {
        var nota = pontuarPalavra(p, item.vocabulario);
        if (nota > 0) { acertos++; pontos += nota; }
      });
      item.frases.forEach(function (f) {
        if (f === frase) pontos += 4;
        else if (frase.length >= 3 && f.indexOf(frase) === 0) pontos += 2;
      });
      var cobre = acertos > 0 && acertos / palavras.length >= 0.5;
      return { servico: item.servico, pontos: cobre ? pontos : 0, ordem: ordem };
    });

    // Corta o que é bem mais fraco que o melhor ("renovar carta" não deve trazer "cartão de vacina").
    var melhor = Math.max.apply(null, resultados.map(function (r) { return r.pontos; }));
    return resultados
      .filter(function (r) { return r.pontos > 0 && r.pontos >= melhor * 0.4; })
      .sort(function (a, b) { return b.pontos - a.pontos || a.ordem - b.ordem; });
  }

  function rotaDoServico(servico) {
    return servico.disponivel ? '#servico' : '#indisponivel?s=' + encodeURIComponent(servico.id);
  }
  function servicoPorId(id) {
    return DADOS.servicos.filter(function (s) { return s.id === id; })[0] || null;
  }

  /* 3. Roteador por hash -------------------------------------------------- */
  var ROTA_FORMULARIO = '#etapa-1';

  // Cada tela pode ter uma função que a prepara; se ela devolver texto, vira o título da aba.
  var TELAS = {
    'inicio': null,
    'busca': function (params) { return preencherBusca(params.get('q') || ''); },
    'indisponivel': function (params) { preencherIndisponivel(params.get('s')); },
    'servico': prepararServico,
    'entrar': prepararEntrar,
    'entrar-senha': prepararEntrarSenha,
    'esqueci-senha': prepararEsqueci,
    'etapa': prepararEtapa,            // #etapa-1 a #etapa-N usam a mesma tela
    'revisar': prepararRevisar,
    'confirmacao': prepararConfirmacao
  };

  function lerRota() {
    var bruto = window.location.hash.replace(/^#/, '');
    var corte = bruto.indexOf('?');
    var nome = corte >= 0 ? bruto.slice(0, corte) : bruto;
    var consulta = corte >= 0 ? bruto.slice(corte + 1) : '';
    return { nome: nome || 'inicio', params: new URLSearchParams(consulta) };
  }

  function irPara(hash) {
    if (window.location.hash === hash) renderizar(true);
    else window.location.hash = hash;
  }

  function mostrarTela(nome, titulo, moverFoco) {
    var alvo = null;
    document.querySelectorAll('[data-tela]').forEach(function (tela) {
      var ativa = tela.getAttribute('data-tela') === nome;
      tela.hidden = !ativa;
      if (ativa) alvo = tela;
    });
    if (!alvo) return;
    document.title = (titulo || alvo.getAttribute('data-titulo')) + ' – ' + NOME_PORTAL;
    window.scrollTo(0, 0);
    if (moverFoco) {
      var h1 = alvo.querySelector('h1');
      if (h1) h1.focus({ preventScroll: true });
    }
  }

  function renderizar(moverFoco) {
    var rota = lerRota();
    var tem = Object.prototype.hasOwnProperty;
    fecharTodasAsSugestoes();

    // Proteções do pedido: sem entrar, fora de ordem ou já enviado.
    var desvio = desvioDoPedido(rota.nome);
    if (desvio) {
      window.location.replace(desvio); // troca a rota sem empilhar no histórico
      return;
    }

    var nomeTela = numeroDaEtapa(rota.nome) ? 'etapa' : rota.nome;
    if (tem.call(TELAS, nomeTela)) {
      var preparar = TELAS[nomeTela];
      var titulo = preparar ? preparar(rota.params, rota.nome) : null;
      mostrarTela(nomeTela, titulo, moverFoco);
    } else {
      mostrarTela('nao-encontrada', null, moverFoco);
    }
  }

  /* 4. Telas -------------------------------------------------------------- */
  function texto(seletor, valor) {
    var el = document.querySelector(seletor);
    if (el) el.textContent = valor;
    return el;
  }
  function criar(tag, classe, conteudo) {
    var el = document.createElement(tag);
    if (classe) el.className = classe;
    if (conteudo != null) el.textContent = conteudo;
    return el;
  }

  // Devolve o título da aba para a tela de resultado.
  function preencherBusca(termo) {
    var alvo = document.querySelector('[data-busca-resultados]');
    var campo = document.getElementById('busca-pagina-campo');
    alvo.textContent = '';
    if (campo) campo.value = termo;

    if (!palavrasUteis(termo).length) {
      texto('[data-busca-titulo]', 'Resultado da busca');
      texto('[data-busca-termo]', 'Você ainda não escreveu o que precisa. Use a busca abaixo.');
      return 'Resultado da busca';
    }

    var resultados = buscar(termo);
    texto('[data-busca-termo]', 'Você buscou: “' + termo + '”');

    if (!resultados.length) {
      texto('[data-busca-titulo]', 'Não encontramos nenhum serviço');
      var ajuda = criar('div', 'sem-resultado');
      ajuda.appendChild(criar('h2', null, 'O que você pode fazer'));
      var dicas = criar('ul');
      dicas.appendChild(criar('li', null, 'Confira se as palavras estão escritas certo.'));
      dicas.appendChild(criar('li', null, 'Tente com outras palavras, por exemplo “carteira de motorista” ou “aposentadoria”.'));
      var itemLink = criar('li');
      var link = criar('a', null, 'Ver os serviços mais procurados');
      link.href = '#inicio';
      itemLink.appendChild(link);
      dicas.appendChild(itemLink);
      ajuda.appendChild(dicas);
      alvo.appendChild(ajuda);
      return 'Nenhum serviço encontrado';
    }

    var quantos = resultados.length === 1
      ? 'Encontramos 1 serviço'
      : 'Encontramos ' + resultados.length + ' serviços';
    texto('[data-busca-titulo]', quantos);

    var lista = criar('ol', 'resultados');
    resultados.forEach(function (r) {
      var item = criar('li', 'resultado');
      var h2 = criar('h2', 'resultado__titulo');
      var a = criar('a', null, r.servico.titulo);
      a.href = rotaDoServico(r.servico);
      h2.appendChild(a);
      item.appendChild(h2);
      item.appendChild(criar('p', 'resultado__resumo', r.servico.resumo));
      lista.appendChild(item);
    });
    alvo.appendChild(lista);
    return quantos;
  }

  function preencherIndisponivel(id) {
    var servico = servicoPorId(id);
    var el = texto('[data-indisponivel-servico]', servico ? 'Você escolheu: ' + servico.titulo + '.' : '');
    if (el) el.hidden = !servico;
  }

  /* 5. Barra de acessibilidade ------------------------------------------- */
  var avisoTimer;
  function avisar(mensagem) {
    var regiao = document.getElementById('aviso-global');
    if (!regiao) return;
    regiao.textContent = '';
    clearTimeout(avisoTimer);
    avisoTimer = setTimeout(function () { regiao.textContent = mensagem; }, 60);
  }

  function iniciarAcessibilidade() {
    var menos = document.querySelector('[data-fonte-acao="menos"]');
    var mais = document.querySelector('[data-fonte-acao="mais"]');
    var valor = document.querySelector('[data-fonte-valor]');
    var contraste = document.querySelector('[data-contraste]');

    function atualizarFonte() {
      var n = nivelFonte();
      valor.textContent = NIVEIS_FONTE[n];
      menos.setAttribute('aria-disabled', String(n === 0));
      mais.setAttribute('aria-disabled', String(n === NIVEIS_FONTE.length - 1));
    }
    function mudarFonte(passo) {
      var atual = nivelFonte();
      var novo = Math.min(Math.max(atual + passo, 0), NIVEIS_FONTE.length - 1);
      if (novo === atual) {
        avisar(passo > 0 ? 'A letra já está no maior tamanho.' : 'A letra já está no menor tamanho.');
        return;
      }
      aplicarFonte(novo);
      gravarPreferencia(CHAVE_FONTE, String(novo));
      atualizarFonte();
      avisar('Tamanho da letra: ' + NIVEIS_FONTE[novo] + '.');
    }

    menos.addEventListener('click', function () { mudarFonte(-1); });
    mais.addEventListener('click', function () { mudarFonte(1); });
    contraste.addEventListener('click', function () {
      var ligar = !contrasteLigado();
      aplicarContraste(ligar);
      gravarPreferencia(CHAVE_CONTRASTE, ligar ? 'alto' : 'normal');
      contraste.setAttribute('aria-pressed', String(ligar));
      avisar(ligar ? 'Alto contraste ligado.' : 'Alto contraste desligado.');
    });

    contraste.setAttribute('aria-pressed', String(contrasteLigado()));
    atualizarFonte();
  }

  /* 6. Combobox de sugestões (padrão ARIA) ------------------------------- */
  var fechadores = [];
  function fecharTodasAsSugestoes() {
    fechadores.forEach(function (fechar) { fechar(); });
  }

  function iniciarBusca(form) {
    var campo = form.querySelector('[data-busca-campo]');
    var lista = form.querySelector('[data-busca-lista]');
    var status = form.querySelector('[data-busca-status]');
    var erro = form.querySelector('[data-busca-erro]');
    var itens = [];
    var ativo = -1;
    var statusTimer;

    function anunciar(mensagem) {
      clearTimeout(statusTimer);
      statusTimer = setTimeout(function () { status.textContent = mensagem; }, 500);
    }
    function limparErro() {
      erro.textContent = '';
      campo.removeAttribute('aria-invalid');
    }
    function mostrarErro(mensagem) {
      erro.textContent = '';
      campo.setAttribute('aria-invalid', 'true');
      setTimeout(function () { erro.textContent = mensagem; }, 60);
    }

    function fechar() {
      lista.hidden = true;
      campo.setAttribute('aria-expanded', 'false');
      campo.removeAttribute('aria-activedescendant');
      ativo = -1;
    }
    fechadores.push(fechar);

    function abrir() {
      if (!itens.length) return;
      lista.hidden = false;
      campo.setAttribute('aria-expanded', 'true');
    }
    function marcar(indice) {
      ativo = indice;
      Array.prototype.forEach.call(lista.children, function (op, i) {
        op.setAttribute('aria-selected', String(i === indice));
      });
      var opcao = lista.children[indice];
      if (opcao) {
        campo.setAttribute('aria-activedescendant', opcao.id);
        opcao.scrollIntoView({ block: 'nearest' });
      }
    }

    function atualizar() {
      var valor = campo.value;
      lista.textContent = '';
      ativo = -1;
      campo.removeAttribute('aria-activedescendant');

      if (normalizar(valor).length < 2) {
        itens = [];
        fechar();
        status.textContent = '';
        return;
      }

      itens = buscar(valor).slice(0, 5);
      itens.forEach(function (r, i) {
        var op = criar('li', 'busca__opcao');
        op.id = lista.id + '-opcao-' + i;
        op.setAttribute('role', 'option');
        op.setAttribute('aria-selected', 'false');
        op.setAttribute('data-indice', String(i));
        op.appendChild(criar('span', 'busca__opcao-titulo', r.servico.titulo));
        op.appendChild(criar('span', 'busca__opcao-resumo', r.servico.resumo));
        lista.appendChild(op);
      });

      if (itens.length) {
        abrir();
        anunciar(itens.length === 1
          ? '1 sugestão. Use as setas para escolher ou aperte Enter para buscar.'
          : itens.length + ' sugestões. Use as setas para escolher ou aperte Enter para buscar.');
      } else {
        fechar();
        anunciar('Nenhuma sugestão. Aperte Enter para buscar assim mesmo.');
      }
    }

    function escolher(indice) {
      var r = itens[indice];
      if (!r) return;
      campo.value = r.servico.titulo;
      fechar();
      irPara(rotaDoServico(r.servico));
    }

    campo.addEventListener('input', function () {
      limparErro();
      atualizar();
    });

    campo.addEventListener('keydown', function (e) {
      var aberto = !lista.hidden;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!aberto) { atualizar(); }
          if (itens.length) marcar(ativo + 1 >= itens.length ? 0 : ativo + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          if (!aberto) { atualizar(); }
          if (itens.length) marcar(ativo <= 0 ? itens.length - 1 : ativo - 1);
          break;
        case 'Enter':
          if (aberto && ativo >= 0) { e.preventDefault(); escolher(ativo); }
          break;
        case 'Escape':
          if (aberto) { e.preventDefault(); fechar(); }
          break;
        case 'Tab':
          fechar();
          break;
      }
    });

    campo.addEventListener('blur', fechar);
    // Clique na sugestão sem tirar o foco do campo antes da hora.
    lista.addEventListener('mousedown', function (e) { e.preventDefault(); });
    lista.addEventListener('click', function (e) {
      var op = e.target.closest('[data-indice]');
      if (op) escolher(parseInt(op.getAttribute('data-indice'), 10));
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var valor = campo.value.trim();
      if (!palavrasUteis(valor).length) {
        mostrarErro('Escreva o que você precisa resolver. Por exemplo: renovar carteira de motorista.');
        campo.focus();
        return;
      }
      limparErro();
      fechar();
      irPara('#busca?q=' + encodeURIComponent(valor));
    });
  }

  /* 7. Início: serviços mais procurados ---------------------------------- */
  var ICONES = {
    volante: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 14v7M10.1 11.4 3.4 9.6M13.9 11.4l6.7-1.8"/>',
    identidade: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14.5 10h4M14.5 14h4"/>',
    moeda: '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.4-.9-1.4-1.5-2.5-1.5-1.4 0-2.5.8-2.5 2s1.1 1.6 2.5 2 2.5.8 2.5 2-1.1 2-2.5 2c-1.1 0-2.1-.6-2.5-1.5M12 6.5V8M12 16v1.5"/>',
    documento: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M9.5 12h6M9.5 15.5h6"/>',
    saude: '<path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z"/><path d="M12 9v6M9 12h6"/>',
    carteira: '<path d="M4.5 5H17v3"/><rect x="3" y="8" width="18" height="12" rx="2"/><path d="M16 14h2"/>',
    chave: '<circle cx="8" cy="15" r="4"/><path d="m10.8 12.2 8.7-8.7M16 7l3 3M13.5 9.5l2 2"/>',
    banco: '<path d="M3 10h18L12 4z"/><path d="M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18"/>',
    celular: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17.5h2"/>'
  };

  function criarIcone(nome) {
    var caixa = criar('span', 'servico-botao__icone');
    // Marcação fixa do próprio protótipo (ICONES), nunca texto do usuário.
    caixa.innerHTML = '<svg class="icone" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
      (ICONES[nome] || ICONES.documento) + '</svg>';
    return caixa;
  }

  function iniciarMaisProcurados() {
    var lista = document.querySelector('[data-mais-procurados]');
    if (!lista) return;
    DADOS.servicos.forEach(function (servico) {
      var item = criar('li');
      var link = criar('a', 'servico-botao');
      link.href = rotaDoServico(servico);
      link.appendChild(criarIcone(servico.icone));
      link.appendChild(criar('span', null, servico.titulo));
      item.appendChild(link);
      lista.appendChild(item);
    });
  }

  /* 8. Sessão (só durante a visita) -------------------------------------- */
  var CHAVE_SESSAO = 'portal-prototipo:sessao';
  var USUARIO = DADOS.usuarioExemplo || { nome: 'Carlos', cpfTeste: '', celularFinal: '' };
  var sessao = (function () {
    try {
      var salva = JSON.parse(window.sessionStorage.getItem(CHAVE_SESSAO));
      return salva && salva.nome ? salva : null;
    } catch (e) { return null; }
  })();

  function atualizarCabecalho() {
    var caixa = document.querySelector('[data-sessao]');
    if (!caixa) return;
    caixa.hidden = !sessao;
    texto('[data-sessao-nome]', sessao ? sessao.nome : '');
  }
  function entrar() {
    sessao = { nome: USUARIO.nome };
    try { window.sessionStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao)); } catch (e) { /* segue só na memória */ }
    atualizarCabecalho();
    avisar('Você entrou como ' + sessao.nome + '.');
    irPara(ROTA_FORMULARIO);
  }
  function sair() {
    sessao = null;
    try { window.sessionStorage.removeItem(CHAVE_SESSAO); } catch (e) { /* nada a limpar */ }
    limparPedido();
    atualizarCabecalho();
    avisar('Você saiu da sua conta.');
    irPara('#inicio');
  }

  /* 9. Validação (padrão GOV.UK: resumo no topo + erro junto do campo) ---- */
  function mostrarErroCampo(campo, mensagem) {
    var bloco = campo.closest('.campo');
    var erro = document.getElementById(campo.id + '-erro');
    if (erro) {
      erro.textContent = '';
      if (mensagem) {
        erro.appendChild(criar('span', 'visualmente-oculto', 'Erro: '));
        erro.appendChild(document.createTextNode(mensagem));
      }
    }
    if (mensagem) campo.setAttribute('aria-invalid', 'true');
    else campo.removeAttribute('aria-invalid');
    if (bloco) bloco.classList.toggle('campo--erro', !!mensagem);
  }

  function tituloSemErro() {
    return document.title.replace(/^Erro: /, '');
  }

  // regras: [{ campo: <input>, mensagem: '' quando está certo }]. Devolve true se não há erro.
  function validar(tela, regras) {
    var resumo = tela.querySelector('[data-resumo-erros]');
    var lista = resumo.querySelector('ul');
    var erros = regras.filter(function (r) { return r.mensagem; });

    regras.forEach(function (r) { mostrarErroCampo(r.campo, r.mensagem); });
    lista.textContent = '';

    if (!erros.length) {
      resumo.hidden = true;
      document.title = tituloSemErro();
      return true;
    }

    erros.forEach(function (r) {
      var item = criar('li');
      var link = criar('a', null, r.mensagem);
      link.href = '#' + r.campo.id;
      // O hash é a rota: o link só leva o foco ao campo.
      link.addEventListener('click', function (e) {
        e.preventDefault();
        r.campo.focus();
      });
      item.appendChild(link);
      lista.appendChild(item);
    });
    resumo.hidden = false;
    document.title = 'Erro: ' + tituloSemErro();
    resumo.focus();
    return false;
  }

  function limparValidacao(tela) {
    tela.querySelectorAll('[aria-invalid]').forEach(function (campo) { mostrarErroCampo(campo, ''); });
    var resumo = tela.querySelector('[data-resumo-erros]');
    if (resumo) resumo.hidden = true;
  }

  /* CPF: aceita com ou sem pontos; confere os dois dígitos finais. */
  function soNumeros(valor) { return String(valor || '').replace(/\D/g, ''); }

  function cpfValido(d) {
    if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false;
    for (var t = 9; t < 11; t++) {
      var soma = 0;
      for (var i = 0; i < t; i++) soma += parseInt(d[i], 10) * (t + 1 - i);
      if ((soma * 10) % 11 % 10 !== parseInt(d[t], 10)) return false;
    }
    return true;
  }

  function erroDoCpf(valor) {
    var v = String(valor || '').trim();
    if (!v) return 'Digite o seu CPF.';
    if (/[^\d.\-\s]/.test(v)) return 'Use só números no CPF.';
    var d = soNumeros(v);
    if (d.length !== 11) {
      return 'O CPF tem 11 números. Você digitou ' + (d.length === 1 ? '1 número' : d.length + ' números') +
        '. Confira e digite de novo.';
    }
    if (!cpfValido(d)) return 'Este CPF não existe. Confira os números.';
    return '';
  }

  function formatarCpf(campo) {
    var d = soNumeros(campo.value);
    if (d.length === 11) {
      campo.value = d.slice(0, 3) + '.' + d.slice(3, 6) + '.' + d.slice(6, 9) + '-' + d.slice(9);
    }
  }

  /* 10. Página do serviço ------------------------------------------------- */
  var servicoMontado = false;

  function lista(itens, tag, classe) {
    var el = criar(tag || 'ul', classe);
    itens.forEach(function (t) { el.appendChild(criar('li', null, t)); });
    return el;
  }
  function servicoPrincipal() {
    return DADOS.servicos.filter(function (s) { return s.disponivel && s.pagina; })[0] || null;
  }
  function preencherPrazos(ul, prazos) {
    prazos.forEach(function (p) {
      var li = criar('li');
      li.appendChild(criar('strong', null, p.rotulo + ': '));
      li.appendChild(document.createTextNode(p.texto));
      ul.appendChild(li);
    });
    return ul;
  }
  function parte(nome) {
    var el = document.querySelector('[data-servico-parte="' + nome + '"]');
    el.textContent = '';
    return el;
  }

  function montarServico() {
    var servico = DADOS.servicos.filter(function (s) { return s.disponivel && s.pagina; })[0];
    if (!servico) return;
    var p = servico.pagina;

    texto('[data-servico-resumo]', p.resumo);

    var oQueE = parte('oQueE');
    p.oQueE.forEach(function (t) { oQueE.appendChild(criar('p', null, t)); });

    var quem = parte('quemPode');
    quem.appendChild(lista(p.quemPode));
    quem.appendChild(criar('p', null, 'Não pode pedir por aqui:'));
    quem.appendChild(lista(p.quemNaoPode));

    var custo = parte('custo');
    var tabela = criar('table', 'custo');
    tabela.appendChild(criar('caption', 'visualmente-oculto', 'Quanto custa a renovação (valores de exemplo)'));
    var cabeca = criar('thead');
    var linhaCabeca = criar('tr');
    var th1 = criar('th', null, 'O que você paga'); th1.scope = 'col';
    var th2 = criar('th', null, 'Valor'); th2.scope = 'col';
    linhaCabeca.appendChild(th1); linhaCabeca.appendChild(th2);
    cabeca.appendChild(linhaCabeca);
    tabela.appendChild(cabeca);
    var corpo = criar('tbody');
    p.custo.partes.forEach(function (par) {
      var tr = criar('tr');
      var th = criar('th', null, par[0]); th.scope = 'row';
      tr.appendChild(th);
      tr.appendChild(criar('td', null, par[1]));
      corpo.appendChild(tr);
    });
    tabela.appendChild(corpo);
    var pe = criar('tfoot');
    var trTotal = criar('tr');
    var thTotal = criar('th', null, 'Total'); thTotal.scope = 'row';
    trTotal.appendChild(thTotal);
    trTotal.appendChild(criar('td', null, p.custo.total));
    pe.appendChild(trTotal);
    tabela.appendChild(pe);
    custo.appendChild(tabela);
    custo.appendChild(criar('p', null, p.custo.comoPagar));

    preencherPrazos(parte('prazo').appendChild(criar('ul')), p.prazo);

    parte('documentos').appendChild(lista(p.documentos));

    var passos = criar('ol', 'passos');
    passos.setAttribute('role', 'list'); // list-style: none tira a semântica no Safari
    p.passos.forEach(function (par) {
      var li = criar('li');
      li.appendChild(criar('h3', null, par[0]));
      li.appendChild(criar('p', null, par[1]));
      passos.appendChild(li);
    });
    parte('passos').appendChild(passos);

    servicoMontado = true;
  }

  function prepararServico() {
    if (!servicoMontado) montarServico();
    var comecar = document.querySelector('[data-comecar]');
    var nota;
    if (sessao && pedido.enviado) {
      comecar.href = '#confirmacao';
      nota = 'Você já enviou este pedido. O botão mostra o número do protocolo.';
    } else if (sessao) {
      comecar.href = ROTA_FORMULARIO;
      nota = 'Você já entrou como ' + sessao.nome + '. Vamos direto para as perguntas.';
    } else {
      comecar.href = '#entrar';
      nota = 'Você vai precisar entrar com a sua conta.';
    }
    texto('[data-comecar-nota]', nota);
  }

  /* 11. Entrar, entrar com senha, esqueci minha senha -------------------- */
  var opcaoAberta = null;

  function fecharPainelSimulado() {
    var painel = document.querySelector('[data-painel-simulado]');
    if (painel) painel.hidden = true;
  }

  function prepararEntrar() {
    fecharPainelSimulado();
    opcaoAberta = null;
  }

  function prepararEntrarSenha() {
    var tela = document.getElementById('tela-entrar-senha');
    var senha = document.getElementById('login-senha');
    var mostrar = tela.querySelector('[data-mostrar-senha]');
    limparValidacao(tela);
    senha.value = '';
    senha.type = 'password';
    mostrar.textContent = 'Mostrar senha';
  }

  function prepararEsqueci() {
    var tela = document.getElementById('tela-esqueci-senha');
    limparValidacao(tela);
    tela.querySelector('[data-form-esqueci]').hidden = false;
    tela.querySelector('[data-esqueci-sucesso]').hidden = true;
    document.getElementById('esqueci-cpf').value = '';
  }

  function iniciarEntrar() {
    var listaOpcoes = document.querySelector('[data-opcoes-login]');
    var painel = document.querySelector('[data-painel-simulado]');

    (DADOS.login || []).forEach(function (opcao) {
      var li = criar('li');
      var alvo;
      if (opcao.id === 'senha') {
        alvo = criar('a', 'opcao-login');
        alvo.href = '#entrar-senha';
      } else {
        alvo = criar('button', 'opcao-login');
        alvo.type = 'button';
        alvo.addEventListener('click', function () {
          opcaoAberta = alvo;
          texto('[data-painel-simulado-titulo]', 'Entrar ' + opcao.titulo.charAt(0).toLowerCase() + opcao.titulo.slice(1));
          texto('[data-painel-simulado-como]', opcao.comoSeria);
          painel.hidden = false;
          painel.querySelector('[data-painel-simulado-titulo]').focus();
        });
      }
      alvo.appendChild(criarIcone(opcao.icone));
      var textos = criar('span');
      textos.appendChild(criar('span', 'opcao-login__titulo', opcao.titulo));
      textos.appendChild(criar('span', 'opcao-login__descricao', opcao.descricao));
      alvo.appendChild(textos);
      li.appendChild(alvo);
      listaOpcoes.appendChild(li);
    });

    painel.querySelector('[data-entrar-simulado]').textContent = 'Continuar como ' + USUARIO.nome;
    painel.querySelector('[data-entrar-simulado]').addEventListener('click', entrar);
    painel.querySelector('[data-fechar-simulado]').addEventListener('click', function () {
      fecharPainelSimulado();
      if (opcaoAberta) opcaoAberta.focus();
    });
  }

  function iniciarFormularios() {
    // CPF fica no formato 000.000.000-00 quando a pessoa sai do campo.
    document.querySelectorAll('[data-cpf]').forEach(function (campo) {
      campo.addEventListener('blur', function () { formatarCpf(campo); });
    });

    // Mostrar / esconder a senha.
    var botaoMostrar = document.querySelector('[data-mostrar-senha]');
    var campoSenha = document.getElementById('login-senha');
    botaoMostrar.addEventListener('click', function () {
      var mostrar = campoSenha.type === 'password';
      campoSenha.type = mostrar ? 'text' : 'password';
      botaoMostrar.textContent = mostrar ? 'Esconder senha' : 'Mostrar senha';
      avisar(mostrar ? 'A senha está aparecendo.' : 'A senha está escondida.');
    });

    texto('[data-cpf-teste]', USUARIO.cpfTeste);
    texto('[data-celular-final]', USUARIO.celularFinal);

    // Entrar com CPF e senha.
    var formLogin = document.querySelector('[data-form-login]');
    formLogin.addEventListener('submit', function (e) {
      e.preventDefault();
      var cpf = document.getElementById('login-cpf');
      var ok = validar(document.getElementById('tela-entrar-senha'), [
        { campo: cpf, mensagem: erroDoCpf(cpf.value) },
        { campo: campoSenha, mensagem: campoSenha.value ? '' : 'Digite a sua senha.' }
      ]);
      if (!ok) return;
      campoSenha.value = '';
      entrar();
    });

    // Esqueci minha senha.
    var telaEsqueci = document.getElementById('tela-esqueci-senha');
    var formEsqueci = telaEsqueci.querySelector('[data-form-esqueci]');
    formEsqueci.addEventListener('submit', function (e) {
      e.preventDefault();
      var cpf = document.getElementById('esqueci-cpf');
      if (!validar(telaEsqueci, [{ campo: cpf, mensagem: erroDoCpf(cpf.value) }])) return;
      formEsqueci.hidden = true;
      var sucesso = telaEsqueci.querySelector('[data-esqueci-sucesso]');
      sucesso.hidden = false;
      sucesso.querySelector('.sucesso__titulo').focus();
    });

    document.querySelector('[data-sair]').addEventListener('click', sair);
  }

  /* 12. Pedido: etapas, revisão e confirmação ---------------------------- */
  var FORM = DADOS.formulario || { etapas: [], proximosPassos: [], textoWhatsApp: '' };
  var ETAPAS = FORM.etapas;
  var CHAVE_PEDIDO = 'portal-prototipo:pedido';
  var pedido = lerPedido();
  var etapaAtual = null;
  var voltarParaRevisao = false;

  function pedidoVazio() { return { respostas: {}, enviado: null }; }
  function lerPedido() {
    try {
      var salvo = JSON.parse(window.sessionStorage.getItem(CHAVE_PEDIDO));
      if (salvo && salvo.respostas) return salvo;
    } catch (e) { /* começa vazio */ }
    return pedidoVazio();
  }
  function guardarPedido() {
    try { window.sessionStorage.setItem(CHAVE_PEDIDO, JSON.stringify(pedido)); } catch (e) { /* segue só na memória */ }
  }
  function limparPedido() {
    pedido = pedidoVazio();
    try { window.sessionStorage.removeItem(CHAVE_PEDIDO); } catch (e) { /* nada a limpar */ }
  }

  function numeroDaEtapa(nome) {
    var m = /^etapa-(\d+)$/.exec(nome);
    if (!m) return 0;
    var n = parseInt(m[1], 10);
    return n >= 1 && n <= ETAPAS.length ? n : 0;
  }
  function etapaPorId(id) {
    return ETAPAS.filter(function (e) { return e.id === id; })[0] || null;
  }
  function primeiraSemResposta() {
    for (var i = 0; i < ETAPAS.length; i++) {
      if (!pedido.respostas[ETAPAS[i].id]) return i + 1;
    }
    return 0;
  }

  // Devolve a rota certa quando a pessoa não pode estar onde está; senão, null.
  function desvioDoPedido(nome) {
    var etapa = numeroDaEtapa(nome);
    if (!etapa && nome !== 'revisar' && nome !== 'confirmacao') return null;
    if (!sessao) return '#entrar';
    if (nome === 'confirmacao') return pedido.enviado ? null : '#revisar';
    if (pedido.enviado) return '#confirmacao';
    var falta = primeiraSemResposta();
    if (etapa && falta && etapa > falta) return '#etapa-' + falta;
    if (nome === 'revisar' && falta) return '#etapa-' + falta;
    return null;
  }

  function textoDaResposta(etapa) {
    if (!etapa) return '';
    var valor = pedido.respostas[etapa.id];
    if (etapa.tipo === 'opcoes') {
      var opcao = (etapa.opcoes || []).filter(function (o) { return o.valor === valor; })[0];
      return opcao ? opcao.texto : '';
    }
    return valor || '';
  }
  function totalDoServico() {
    var servico = servicoPrincipal();
    return servico ? servico.pagina.custo.total : '';
  }
  // Troca {chave} pelo valor. O resultado sempre entra por textContent.
  function trocar(modelo, valores) {
    return String(modelo || '').replace(/\{(\w+)\}/g, function (_, chave) {
      return valores[chave] != null ? valores[chave] : '';
    });
  }

  /* Celular: 10 ou 11 números com DDD. */
  function erroDoCelular(valor, etapa) {
    var v = String(valor || '').trim();
    if (!v) return etapa.erroVazio;
    if (/[^\d()\-\s.]/.test(v)) return 'Use só números no celular.';
    var d = soNumeros(v);
    if (d.length < 10 || d.length > 11) {
      return 'O celular tem 10 ou 11 números com o DDD. Você digitou ' +
        (d.length === 1 ? '1 número' : d.length + ' números') + '.';
    }
    return '';
  }
  function formatarCelular(campo) {
    var d = soNumeros(campo.value);
    if (d.length === 11) campo.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    else if (d.length === 10) campo.value = '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  }

  function paragrafoComId(classe, id, conteudo) {
    var p = criar('p', classe, conteudo);
    p.id = id;
    return p;
  }

  // Monta a pergunta da etapa. Escolha: fieldset com o h1 na legenda. Texto: h1 com o label.
  function montarCampoDaEtapa(alvo, etapa) {
    var resposta = pedido.respostas[etapa.id] || '';
    var bloco = criar('div', 'campo');
    var h1 = criar('h1', 'tela__titulo');
    h1.id = 'etapa-pergunta';
    h1.tabIndex = -1;
    alvo.textContent = '';

    if (etapa.tipo === 'opcoes') {
      var grupo = criar('fieldset', 'escolha');
      grupo.setAttribute('aria-describedby', 'etapa-dica etapa-opcao-0-erro');
      var legenda = criar('legend', 'escolha__legenda');
      h1.textContent = etapa.pergunta;
      legenda.appendChild(h1);
      grupo.appendChild(legenda);
      grupo.appendChild(paragrafoComId('campo__dica', 'etapa-dica', etapa.dica || ''));
      var erroOpcao = paragrafoComId('campo__erro', 'etapa-opcao-0-erro');
      erroOpcao.setAttribute('aria-live', 'polite');
      grupo.appendChild(erroOpcao);

      var opcoes = criar('div', 'opcoes');
      etapa.opcoes.forEach(function (op, i) {
        var caixa = criar('div', 'opcao');
        var entrada = criar('input', 'opcao__entrada');
        entrada.type = 'radio';
        entrada.name = 'resposta';
        entrada.value = op.valor;
        entrada.id = 'etapa-opcao-' + i;
        entrada.checked = op.valor === resposta;
        var rotulo = criar('label', 'opcao__rotulo', op.texto);
        rotulo.htmlFor = entrada.id;
        if (op.detalhe) rotulo.appendChild(criar('span', 'opcao__detalhe', op.detalhe));
        caixa.appendChild(entrada);
        caixa.appendChild(rotulo);
        opcoes.appendChild(caixa);
      });
      grupo.appendChild(opcoes);
      bloco.appendChild(grupo);
    } else {
      h1.classList.add('titulo-campo');
      var rotuloCampo = criar('label', null, etapa.pergunta);
      rotuloCampo.htmlFor = 'etapa-texto';
      h1.appendChild(rotuloCampo);
      bloco.appendChild(h1);
      bloco.appendChild(paragrafoComId('campo__dica', 'etapa-dica', etapa.dica || ''));
      var erroTexto = paragrafoComId('campo__erro', 'etapa-texto-erro');
      erroTexto.setAttribute('aria-live', 'polite');
      bloco.appendChild(erroTexto);

      var campo = criar('input', 'campo__entrada campo__entrada--celular');
      campo.id = 'etapa-texto';
      campo.name = 'resposta';
      campo.type = 'tel';
      campo.setAttribute('inputmode', 'tel');
      campo.setAttribute('autocomplete', 'tel-national');
      campo.setAttribute('aria-describedby', 'etapa-dica etapa-texto-erro');
      campo.value = resposta;
      campo.addEventListener('blur', function () { formatarCelular(campo); });
      bloco.appendChild(campo);
    }
    alvo.appendChild(bloco);
  }

  function prepararEtapa(params, nome) {
    var n = numeroDaEtapa(nome);
    var etapa = ETAPAS[n - 1];
    var tela = document.getElementById('tela-etapa');
    etapaAtual = { numero: n, etapa: etapa };
    voltarParaRevisao = params.get('voltar') === 'revisar';
    limparValidacao(tela);

    tela.querySelector('.progresso').setAttribute('data-etapa-numero', String(n));
    texto('[data-etapa-progresso]', 'Etapa ' + n + ' de ' + ETAPAS.length);

    var voltar = tela.querySelector('[data-etapa-voltar]');
    voltar.href = voltarParaRevisao ? '#revisar' : (n === 1 ? '#servico' : '#etapa-' + (n - 1));
    voltar.textContent = voltarParaRevisao ? 'Voltar para a revisão' : 'Voltar';

    tela.querySelector('[data-form-etapa] [type="submit"]').textContent =
      voltarParaRevisao ? 'Salvar e voltar para a revisão' : 'Continuar';

    montarCampoDaEtapa(tela.querySelector('[data-etapa-campo]'), etapa);
    return etapa.pergunta + ' (etapa ' + n + ' de ' + ETAPAS.length + ')';
  }

  function prepararRevisar() {
    var lista = document.querySelector('[data-revisao]');
    lista.textContent = '';
    ETAPAS.forEach(function (etapa, i) {
      var linha = criar('div', 'revisao__linha');
      linha.appendChild(criar('dt', 'revisao__pergunta', etapa.revisao));
      linha.appendChild(criar('dd', 'revisao__resposta', textoDaResposta(etapa)));
      var acao = criar('dd', 'revisao__acao');
      var link = criar('a', null, 'Mudar');
      link.href = '#etapa-' + (i + 1) + '?voltar=revisar';
      link.appendChild(criar('span', 'visualmente-oculto', ' ' + etapa.mudar));
      acao.appendChild(link);
      linha.appendChild(acao);
      lista.appendChild(linha);
    });
    texto('[data-revisar-total]', totalDoServico());
  }

  function gerarProtocolo() {
    var numero = Math.floor(100000 + Math.random() * 900000);
    return new Date().getFullYear() + '-CNH-' + numero;
  }

  function prepararConfirmacao() {
    var enviado = pedido.enviado;
    var quando = new Date(enviado.quando);
    var impressa = pedido.respostas.impressa === 'sim';

    texto('[data-protocolo]', enviado.protocolo);
    texto('[data-enviado-em]', 'Enviado em ' + quando.toLocaleDateString('pt-BR') + ' às ' +
      quando.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + '.');
    texto('[data-copiar-aviso]', '');
    document.querySelector('[data-whatsapp]').href = 'https://wa.me/?text=' +
      encodeURIComponent(trocar(FORM.textoWhatsApp, { protocolo: enviado.protocolo }));

    var valores = {
      celular: pedido.respostas.celular || '',
      cidade: textoDaResposta(etapaPorId('cidade')),
      total: totalDoServico()
    };
    var proximos = document.querySelector('[data-proximos]');
    proximos.textContent = '';
    FORM.proximosPassos.forEach(function (par) {
      var corpo = typeof par[1] === 'string' ? par[1] : (impressa ? par[1].impressa : par[1].digital);
      var li = criar('li');
      li.appendChild(criar('h3', null, par[0]));
      li.appendChild(criar('p', null, trocar(corpo, valores)));
      proximos.appendChild(li);
    });

    var prazos = document.querySelector('[data-prazos]');
    var servico = servicoPrincipal();
    prazos.textContent = '';
    preencherPrazos(prazos, servico ? servico.pagina.prazo.filter(function (p) {
      return impressa || !p.soImpressa;
    }) : []);
  }

  function iniciarPedido() {
    var tela = document.getElementById('tela-etapa');

    tela.querySelector('[data-form-etapa]').addEventListener('submit', function (e) {
      e.preventDefault();
      if (!etapaAtual) return;
      var etapa = etapaAtual.etapa;
      var regra, valor;

      if (etapa.tipo === 'opcoes') {
        var marcada = tela.querySelector('input[name="resposta"]:checked');
        var opcao = marcada && etapa.opcoes.filter(function (o) { return o.valor === marcada.value; })[0];
        regra = {
          campo: document.getElementById('etapa-opcao-0'),
          mensagem: !marcada ? etapa.erroVazio : ((opcao && opcao.bloqueia) || '')
        };
        valor = marcada ? marcada.value : '';
      } else {
        var campo = document.getElementById('etapa-texto');
        formatarCelular(campo);
        regra = { campo: campo, mensagem: erroDoCelular(campo.value, etapa) };
        valor = campo.value.trim();
      }

      if (!validar(tela, [regra])) return;
      pedido.respostas[etapa.id] = valor;
      guardarPedido();
      var proxima = etapaAtual.numero < ETAPAS.length ? '#etapa-' + (etapaAtual.numero + 1) : '#revisar';
      irPara(voltarParaRevisao ? '#revisar' : proxima);
    });

    document.querySelector('[data-form-enviar]').addEventListener('submit', function (e) {
      e.preventDefault();
      if (pedido.enviado || primeiraSemResposta()) { renderizar(true); return; }
      pedido.enviado = { protocolo: gerarProtocolo(), quando: new Date().toISOString() };
      guardarPedido();
      window.location.replace('#confirmacao'); // a revisão sai do histórico
      avisar('Pedido enviado. Número do protocolo: ' + pedido.enviado.protocolo + '.');
    });

    document.querySelector('[data-copiar]').addEventListener('click', function () {
      var numero = pedido.enviado ? pedido.enviado.protocolo : '';
      var aviso = document.querySelector('[data-copiar-aviso]');
      function falhou() { aviso.textContent = 'Não deu para copiar. Anote o número: ' + numero + '.'; }
      try {
        navigator.clipboard.writeText(numero).then(function () {
          aviso.textContent = 'Número copiado. Agora você pode colar onde quiser.';
        }, falhou);
      } catch (err) { falhou(); }
    });
  }

  /* Partida --------------------------------------------------------------- */
  function iniciar() {
    iniciarAcessibilidade();
    iniciarMaisProcurados();
    iniciarEntrar();
    iniciarFormularios();
    iniciarPedido();
    atualizarCabecalho();
    document.querySelectorAll('[data-busca]').forEach(iniciarBusca);

    // O skip-link não pode trocar o hash (o hash é a rota).
    var pular = document.querySelector('[data-pular]');
    if (pular) {
      pular.addEventListener('click', function (e) {
        e.preventDefault();
        var principal = document.getElementById('conteudo');
        principal.focus();
        principal.scrollIntoView();
      });
    }

    window.addEventListener('hashchange', function () { renderizar(true); });
    renderizar(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})();
