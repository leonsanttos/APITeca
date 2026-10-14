import { buscarDados } from '../api.js';

const estadosBrasileiros = {
  AC: 'Acre',
  AL: 'Alagoas',
  AP: 'Amapá',
  AM: 'Amazonas',
  BA: 'Bahia',
  CE: 'Ceará',
  DF: 'Distrito Federal',
  ES: 'Espírito Santo',
  GO: 'Goiás',
  MA: 'Maranhão',
  MT: 'Mato Grosso',
  MS: 'Mato Grosso do Sul',
  MG: 'Minas Gerais',
  PA: 'Pará',
  PB: 'Paraíba',
  PR: 'Paraná',
  PE: 'Pernambuco',
  PI: 'Piauí',
  RJ: 'Rio de Janeiro',
  RN: 'Rio Grande do Norte',
  RS: 'Rio Grande do Sul',
  RO: 'Rondônia',
  RR: 'Roraima',
  SC: 'Santa Catarina',
  SP: 'São Paulo',
  SE: 'Sergipe',
  TO: 'Tocantins'
};

function normalizar(texto) {
  return texto.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

async function buscarLocalizacao(cidade, estado) {
  const parametros = new URLSearchParams({
    name: cidade,
    count: '100',
    language: 'pt',
    format: 'json',
    countryCode: 'BR'
  });
  const dados = await buscarDados(`https://geocoding-api.open-meteo.com/v1/search?${parametros}`);
  const estadoInformado = normalizar(estado);
  const sigla = estadoInformado.toLocaleUpperCase('pt-BR');
  const nomeEstado = estadosBrasileiros[sigla];
  const nomeEstadoInformado = normalizar(nomeEstado || estado);

  return dados.results?.find(local => {
    const estadoEncontrado = normalizar(local.admin1 || '');
    return estadoEncontrado === estadoInformado || estadoEncontrado === nomeEstadoInformado;
  });
}

function exibirClima(resultado, local, atual) {
  resultado.replaceChildren();

  const titulo = document.createElement('strong');
  titulo.textContent = `📍 ${local.name} - ${local.admin1}`;
  resultado.append(titulo, document.createElement('br'));

  const valores = [
    `🌡️ Temperatura: ${atual.temperature_2m}°C`,
    `💧 Umidade do ar: ${atual.relative_humidity_2m}%`,
    `💨 Vento: ${atual.wind_speed_10m} km/h`
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
  const inputEstado = document.getElementById('input-estado');
  const climaResultado = document.getElementById('clima-resultado');

  if (!climaForm || !btnClima || !inputCidade || !inputEstado || !climaResultado) return;

  climaForm.addEventListener('submit', async event => {
    event.preventDefault();
    climaResultado.textContent = "Buscando previsão do tempo...";
    btnClima.disabled = true;

    try {
      const local = await buscarLocalizacao(inputCidade.value, inputEstado.value);

      if (!local) {
        climaResultado.textContent = "Não encontramos essa cidade nesse estado. Confira os dados e tente novamente.";
        return;
      }

      const parametros = new URLSearchParams({
        latitude: local.latitude,
        longitude: local.longitude,
        current: 'temperature_2m,relative_humidity_2m,wind_speed_10m'
      });
      const dados = await buscarDados(`https://api.open-meteo.com/v1/forecast?${parametros}`);
      const atual = dados.current;

      if (atual) {
        exibirClima(climaResultado, local, atual);
      } else {
        climaResultado.textContent = "Não foi possível carregar os dados do clima.";
      }

    } catch (erro) {
      climaResultado.textContent = "Erro ao buscar a previsão do tempo. Verifique sua conexão.";
    } finally {
      btnClima.disabled = false;
    }
  });
}