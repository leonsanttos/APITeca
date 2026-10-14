import { initConselho } from './modules/conselho.js';

// ===============================================
// NAVEGAÇÃO ENTRE FERRAMENTAS (ABAS)
// ===============================================
function initNavegacao() {
  const navButtons = document.querySelectorAll('.nav-btn');
  const toolCards = document.querySelectorAll('.tool-card');

  navButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Atualiza botões ativos
      navButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');

      // Atualiza exibição do card selecionado
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
});