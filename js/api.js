/**
 * Helper utilitário para fazer requisições genéricas (fetch)
 * @param {string} url - URL da API
 * @returns {Promise<any>}
 */
export async function buscarDados(url) {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) {
      throw new Error(`Erro na requisição HTTP! Status: ${resposta.status}`);
    }
    return await resposta.json();
  } catch (erro) {
    console.error("Erro ao conectar com a API:", erro);
    throw erro; // Repassa o erro para ser tratado no módulo específico
  }
}