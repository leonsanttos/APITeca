# APITeca

## Clima e notícias

Uma única busca por cidade e país consulta o clima atual pela Open-Meteo e procura notícias relacionadas na API gratuita da [GDELT](https://www.gdeltproject.org/), sem chave. As notícias são limitadas a publicações em português dos últimos sete dias; fontes em outros idiomas não são traduzidas nesta versão. Cada manchete mostra veículo e horário de indexação e leva à publicação original. A GDELT agrega publicações, mas não verifica o conteúdo; confira as informações diretamente nas fontes.

## Publicação na Vercel

O projeto pode ser importado do GitHub como site estático, mantendo o diretório `api/` na raiz. A Vercel publica `api/noticias.js` como uma função serverless para consultar a GDELT sem expor a chamada direta no navegador. Essa integração não usa tokens, chaves ou variáveis secretas; não configure credenciais para ela. A rota é pública e valida os parâmetros de cidade e país, limita os resultados a dez e permite cache na CDN da Vercel.