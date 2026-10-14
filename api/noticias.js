const URL_GDELT = 'https://api.gdeltproject.org/api/v2/doc/doc';
const TEMPO_LIMITE_MS = 10000;
const CIDADE_VALIDA = /^[\p{L}\p{M}\p{N} .,'’()-]+$/u;

function responder(res, status, dados) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.status(status).json(dados);
}

function validarParametros(url) {
  const cidade = url.searchParams.get('cidade')?.trim() || '';
  const pais = url.searchParams.get('pais')?.trim().toUpperCase() || '';

  if (cidade.length < 2 || cidade.length > 80 || !CIDADE_VALIDA.test(cidade)) {
    return { erro: 'Informe um nome de cidade válido.' };
  }
  if (!/^[A-Z]{2}$/.test(pais)) {
    return { erro: 'Informe o código de país ISO de duas letras.' };
  }

  return { cidade, pais };
}

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return responder(res, 405, { erro: 'Método não permitido.' });
  }

  const url = new URL(req.url, 'https://apiteca.invalid');
  const parametros = validarParametros(url);
  if (parametros.erro) {
    return responder(res, 400, { erro: parametros.erro });
  }

  const termos = [
    `"${parametros.cidade}"`,
    `sourcecountry:${parametros.pais}`,
    'sourcelang:portuguese'
  ];
  const query = new URLSearchParams({
    query: termos.join(' '),
    mode: 'ArtList',
    format: 'json',
    maxrecords: '10',
    sort: 'DateDesc',
    timespan: '7d'
  });

  try {
    const resposta = await fetch(`${URL_GDELT}?${query}`, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS)
    });
    if (!resposta.ok) {
      return responder(res, resposta.status === 429 ? 503 : 502, {
        erro: 'O serviço de notícias está temporariamente indisponível.'
      });
    }

    const dados = await resposta.json();
    if (!Array.isArray(dados.articles)) {
      return responder(res, 502, {
        erro: 'O serviço de notícias retornou uma resposta inválida.'
      });
    }

    const articles = dados.articles
      .filter(article => typeof article.title === 'string' && typeof article.url === 'string')
      .filter(article => {
        try {
          return ['http:', 'https:'].includes(new URL(article.url).protocol);
        } catch {
          return false;
        }
      })
      .slice(0, 10)
      .map(article => ({
        title: article.title,
        url: article.url,
        domain: typeof article.domain === 'string' ? article.domain : '',
        seendate: typeof article.seendate === 'string' ? article.seendate : '',
        sourcecountry: typeof article.sourcecountry === 'string' ? article.sourcecountry : ''
      }));

    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return responder(res, 200, { articles });
  } catch (erro) {
    console.error('Falha ao consultar GDELT:', erro.name || 'Erro');
    return responder(res, 502, {
      erro: 'O serviço de notícias não respondeu. Tente novamente mais tarde.'
    });
  }
};
