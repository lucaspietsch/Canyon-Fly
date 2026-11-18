# Integração na versão principal do jogo

Integração das atualizações de `codex/personagens-mais-realistas` até `f19259b` com a versão publicada da cidade em `origin/main` (`280e2f2`). As alterações da cidade e do portal foram preservadas. O único conflito textual foi o bundle compilado, que foi reconstruído a partir dos fontes unidos.

Inclui Pit (transformação imediata, voo e resolução), fauna/personagens, centro, Atiara em 2071, Anhangá, Olaria/lobisomem, gaúchos/caminhões, traçador de dois homens com quatro dias do jogo e Capa Preta. As frentes de extração continuam aguardando as coordenadas do usuário.

O build agora gera automaticamente uma versão SHA-256 curta no endereço do bundle em `index.html`, evitando reutilizar o arquivo antigo com `force-cache`. `npm --prefix t3d run build` recompila e atualiza essa referência. Os testes de navegador aceitam `GAME_URL` e `CAPTURE_OUT`, permitindo verificar a versão integrada em servidor separado sem substituir as galerias já entregues.

Validação da integração: 80 testes unitários passaram; no bundle integrado passaram os testes de mobilidade/resolução do Pit, Capa Preta junto à fábrica e gaúchos/extração/traçador nas três vilas, sem erros JavaScript.

## Bloqueio de hospedagem encontrado

O endereço previsto é `https://lucaspietsch.github.io/Canyon-Fly/`. A consulta pública retornou HTTP 404 e o repositório informou `has_pages: false`. As execuções anteriores do workflow falharam em `actions/configure-pages@v5` porque Pages não estava habilitado. A tentativa de habilitar Pages pela credencial disponível foi recusada pelo GitHub com HTTP 403 (`Resource not accessible by integration`).

A ativação exige uma conta com permissão de administração/Pages: **Settings → Pages → Build and deployment → Source → GitHub Actions**. Depois, executar/reexecutar o workflow **Publicar no GitHub Pages**. O desktop da sessão não disponibilizou ferramenta de interação com a conta do usuário para realizar essa configuração pela interface.
