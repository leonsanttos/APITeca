import { buscarDados } from '../api.js';

export function initConselho() {
  const btnConselho = document.getElementById('btn-conselho');
  const conselhoTexto = document.getElementById('conselho-texto');

  if (!btnConselho || !conselhoTexto) return;

  btnConselho.addEventListener('click', async () => {
    conselhoTexto.textContent = "Carregando conselho...";

    try {
      const dados = await buscarDados('https://api.adviceslip.com/advice');
      conselhoTexto.textContent = `"${dados.slip.advice}"`;
    } catch (erro) {
      conselhoTexto.textContent = "Ops! Não foi possível carregar um conselho agora.";
    }
  });
}