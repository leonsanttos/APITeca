import { initConselho } from './modules/conselho.js';
import { initCotacao } from './modules/cotacao.js';
import { initClima } from './modules/clima.js'; // <-- 1. Importa o módulo de clima

// ===============================================
// NAVEGAÇÃO ENTRE FERRAMENTAS (ABAS)
// ===============================================
function initNavegacao() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const toolCards = document.querySelectorAll('.tool-card');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      toolCards.forEach(card => card.classList.add('hidden'));

      const selectedTool = button.getAttribute('data-tool');
      const targetCard = document.getElementById(`tool-${selectedTool}`);
      if (targetCard) {
        targetCard.classList.remove('hidden');
      }
    });
  });
}

// ===============================================
// INICIALIZAÇÃO DO APLICATIVO
// ===============================================
document.addEventListener('DOMContentLoaded', () => {
  initNavegacao();
  initConselho();
  initCotacao();
  initClima(); // <-- 2. Inicializa o clima ao carregar a página
});