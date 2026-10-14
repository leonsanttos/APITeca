import { buscarDados } from '../api.js';

function normalizar(texto) {
  return texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

async function buscarLocalizacao(cidade, pais) {
  const paisInformado = normalizar(pais);
  const parametros = new URLSearchParams({
    name: cidade,
    count: '100',
    language: 'pt',
    format: 'json'
  });
  if (/^[a-z]{2}$/i.test(pais.trim())) {
    parametros.set('countryCode', pais.trim().toUpperCase());
  }

  const dados = await buscarDados(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`);

  return dados.results?.find(local => {
    return normalizar(local.country || '') === paisInformado
      || normalizar(local.country_code || '') === paisInformado;
  });
}

function exibirClima(resultado, local, atual, fusoHorario) {
  resultado.replaceChildren();

  const titulo = document.createElement('strong');
  titulo.textContent = [local.name, local.admin1, local.country]
    .filter(Boolean)
    .join(' - ');
  resultado.append(titulo, document.createElement('br'));

  const horario = atual.time?.split('T')[1]?.slice(0, 5);
  const valores = [
    `Horário local: ${horario || 'indisponível'}${fusoHorario ? ` (${fusoHorario})` : ''}`,
    `Temperatura: ${atual.temperature_2m}°C`,
    `Umidade do ar: ${atual.relative_humidity_2m}%`,
    `Vento: ${atual.wind_speed_10m} km/h`
  ];

  valores.forEach((valor, indice) => {
    if (indice > 0) resultado.append(document.createElement('br'));
    resultado.append(document.createTextNode(valor));
  });
}

export function initClima() {
  const climaForm = document.getElementById('clima-form');
  const btnClima = document.getElementById('btn-clima');
  const inputCidade = document.getElementById('input-cidade');
  const inputPais = document.getElementById('input-pais');
  const climaResultado = document.getElementById('clima-resultado');

  if (!climaForm || !btnClima || !inputCidade || !inputPais || !climaResultado) return;

  climaForm.addEventListener('submit', async event => {
    event.preventDefault();
    climaResultado.textContent = "Buscando previsão do tempo...";
    btnClima.disabled = true;
    let localizacaoEncontrada = false;

    try {
      const local = await buscarLocalizacao(inputCidade.value, inputPais.value);

      if (!local) {
        climaResultado.textContent = "Não encontramos essa cidade nesse país. Confira os dados e tente novamente.";
        document.dispatchEvent(new CustomEvent('localidade:nao-encontrada'));
        return;
      }
      localizacaoEncontrada = true;

      document.dispatchEvent(new CustomEvent('localidade:encontrada', {
        detail: {
          cidade: local.name,
          pais: local.country,
          codigoPais: local.country_code
        }
      }));

      const parametros = new URLSearchParams({
        latitude: local.latitude,
        longitude: local.longitude,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
        timezone: 'auto'
      });
      const dados = await buscarDados(`https://api.open-meteo.com/v1/forecast?${parametros}`);
      const atual = dados.current;

      if (atual) {
        exibirClima(climaResultado, local, atual, dados.timezone_abbreviation);
      } else {
        climaResultado.textContent = "Não foi possível carregar os dados do clima.";
      }

    } catch (erro) {
      climaResultado.textContent = "Erro ao buscar a previsão do tempo. Verifique sua conexão.";
      if (!localizacaoEncontrada) {
        document.dispatchEvent(new CustomEvent('localidade:falha'));
      }
    } finally {
      btnClima.disabled = false;
    }
  });
}