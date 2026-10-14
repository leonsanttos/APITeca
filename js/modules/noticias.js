const INTERVALO_MINIMO_MS = 5000;
let ultimaConsulta = 0;
let carregando = false;
let localizacaoAtual = null;
let localizacaoPendente = null;
let timerConsulta = null;

function formatarDataIndexacao(data) {
  const partes = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z$/.exec(data || '');
  if (!partes) return 'horário indisponível';

  const instante = new Date(Date.UTC(
    Number(partes[1]),
    Number(partes[2]) - 1,
    Number(partes[3]),
    Number(partes[4]),
    Number(partes[5]),
    Number(partes[6])
  ));

  return `${new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'UTC'
  }).format(instante)} UTC`;
}

function criarItemNoticia(noticia) {
  if (typeof noticia.title !== 'string' || !noticia.title.trim()) return null;

  let url;
  try {
    url = new URL(noticia.url);
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(url.protocol)) return null;

  const item = document.createElement('li');
  item.className = 'noticia-item';

  const link = document.createElement('a');
  link.href = url.href;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = noticia.title;

  const metadados = document.createElement('p');
  metadados.className = 'noticia-metadados';
  const fonte = noticia.domain || url.hostname;
  const pais = noticia.sourcecountry ? ` · ${noticia.sourcecountry}` : '';
  metadados.textContent = `Fonte: ${fonte}${pais} · Indexada: ${formatarDataIndexacao(noticia.seendate)}`;

  item.append(link, metadados);
  return item;
}

function mostrarMensagem(status, mensagem) {
  status.textContent = mensagem;
}

function agendarConsulta(botao, lista, status, localizacao) {
  localizacaoAtual = localizacao;
  localizacaoPendente = localizacao;
  lista.replaceChildren();
  mostrarMensagem(status, `Buscando notícias de ${localizacao.cidade}, ${localizacao.pais}...`);

  if (timerConsulta) clearTimeout(timerConsulta);
  const tempoRestante = Math.max(0, INTERVALO_MINIMO_MS - (Date.now() - ultimaConsulta));
  timerConsulta = setTimeout(() => {
    timerConsulta = null;
    void carregarNoticias(botao, lista, status);
  }, carregando ? Math.max(tempoRestante, 1000) : tempoRestante);
}

async function carregarNoticias(botao, lista, status) {
  if (carregando || !localizacaoPendente) return;

  const localizacao = localizacaoPendente;
  localizacaoPendente = null;
  const tempoRestante = INTERVALO_MINIMO_MS - (Date.now() - ultimaConsulta);
  if (ultimaConsulta && tempoRestante > 0) {
    localizacaoPendente = localizacao;
    timerConsulta = setTimeout(() => {
      timerConsulta = null;
      void carregarNoticias(botao, lista, status);
    }, tempoRestante);
    return;
  }

  carregando = true;
  ultimaConsulta = Date.now();
  botao.disabled = true;
  lista.setAttribute('aria-busy', 'true');
  mostrarMensagem(status, `Buscando notícias de ${localizacao.cidade}, ${localizacao.pais}...`);

  try {
    const parametros = new URLSearchParams({
      cidade: localizacao.cidade,
      pais: localizacao.codigoPais
    });
    const resposta = await fetch(`/api/noticias?${parametros}`);
    if (!resposta.ok) {
      throw new Error(`A consulta de notícias falhou (HTTP ${resposta.status}).`);
    }
    const dados = await resposta.json();
    if (!Array.isArray(dados.articles)) {
      throw new Error('A API retornou uma resposta de notícias inválida.');
    }

    const itens = dados.articles
      .map(criarItemNoticia)
      .filter(Boolean);

    if (localizacaoAtual !== localizacao) return;

    if (itens.length === 0) {
      lista.replaceChildren();
      mostrarMensagem(status, `Nenhuma notícia em português sobre ${localizacao.cidade} foi encontrada nos últimos 7 dias.`);
      return;
    }

    lista.replaceChildren(...itens);
    mostrarMensagem(status, `${itens.length} notícias relacionadas a ${localizacao.cidade}, ${localizacao.pais}. Confira as fontes originais.`);
  } catch (erro) {
    console.error('Erro ao carregar notícias:', erro);
    if (localizacaoAtual !== localizacao) return;
    const mensagem = erro.message?.includes('429')
      ? 'A API limitou as consultas. Aguarde alguns segundos e tente novamente.'
      : 'A GDELT não respondeu; pode ser uma falha de conexão ou limite temporário. Tente novamente em instantes.';
    mostrarMensagem(status, mensagem);
  } finally {
    carregando = false;
    lista.setAttribute('aria-busy', 'false');
    botao.disabled = !localizacaoAtual;
    if (localizacaoPendente) {
      agendarConsulta(botao, lista, status, localizacaoPendente);
    }
  }
}

export function initNoticias() {
  const botao = document.getElementById('btn-noticias');
  const lista = document.getElementById('noticias-lista');
  const status = document.getElementById('noticias-status');
  const formularioClima = document.getElementById('clima-form');

  if (!botao || !lista || !status || !formularioClima) return;

  formularioClima.addEventListener('submit', () => {
    localizacaoAtual = null;
    localizacaoPendente = null;
    if (timerConsulta) clearTimeout(timerConsulta);
    timerConsulta = null;
    lista.replaceChildren();
    lista.setAttribute('aria-busy', 'false');
    botao.disabled = true;
    mostrarMensagem(status, 'Buscando a localização para carregar as notícias...');
  });
  document.addEventListener('localidade:encontrada', event => {
    agendarConsulta(botao, lista, status, event.detail);
  });
  document.addEventListener('localidade:nao-encontrada', () => {
    mostrarMensagem(status, 'Informe uma cidade e um país válidos para buscar notícias.');
  });
  document.addEventListener('localidade:falha', () => {
    mostrarMensagem(status, 'Não foi possível identificar a localização para buscar notícias.');
  });
  botao.addEventListener('click', () => {
    if (localizacaoAtual) agendarConsulta(botao, lista, status, localizacaoAtual);
  });
}
