import { buscarDados } from '../api.js';

export function initCotacao() {
  const btnCotacao = document.getElementById('btn-cotacao');
  const selectMoeda = document.getElementById('select-moeda');
  const resultadoBox = document.getElementById('cotacao-resultado');

  if (!btnCotacao || !selectMoeda || !resultadoBox) return;

  btnCotacao.addEventListener('click', async () => {
    const moedaSelecionada = selectMoeda.value; // Ex: "USD-BRL"
    resultadoBox.textContent = "Buscando cotação...";

    try {
      // Montamos a URL dinâmica da AwesomeAPI
      const url = `https://economia.awesomeapi.com.br/json/last/${moedaSelecionada}`;
      
      const dados = await buscarDados(url);
      
      // A AwesomeAPI retorna um objeto cujo nome da chave muda conforme a moeda (ex: USDBRL, EURBRL)
      // Usamos o replace('-', '') para transformar "USD-BRL" em "USDBRL"
      const chaveObjeto = moedaSelecionada.replace('-', '');
      const infoMoeda = dados[chaveObjeto];

      if (infoMoeda) {
        const valorFormatado = Number(infoMoeda.bid).toFixed(2);
        resultadoBox.innerHTML = `
          <strong>${infoMoeda.name}</strong><br>
          Compra: R$ ${valorFormatado}<br>
          <small>Máxima do dia: R$ ${Number(infoMoeda.high).toFixed(2)} | Mínima: R$ ${Number(infoMoeda.low).toFixed(2)}</small>
        `;
      } else {
        resultadoBox.textContent = "Não foi possível encontrar os dados dessa moeda.";
      }

    } catch (erro) {
      resultadoBox.textContent = "Erro ao buscar a cotação. Verifique sua conexão.";
    }
  });
}