# CodeSaga

RPG educacional com o Vale dos Dados jogável em Python, Java e JavaScript. O projeto usa React no front-end, Node.js com Express na API e PostgreSQL para contas, sessões, tentativas, vidas, progresso e ranking.

O Mundo 1 tem cinco missões e quinze atividades por linguagem. Os outros três mundos aparecem no mapa como “Em breve”.

## Abrir e testar no VS Code

1. Instale o Node.js 24 LTS. O projeto requer pelo menos Node.js 22.12.
2. Extraia o ZIP e abra a pasta `codesaga` no VS Code. Abra a pasta que contém este README e o `package.json` principal.
3. No menu Terminal, escolha Novo Terminal e execute os comandos abaixo, um de cada vez.

```bash
npm install
npm run setup
npm run dev
```

4. Abra [http://localhost:5173](http://localhost:5173).
5. Escolha uma linguagem, crie uma conta e confira o código de seis dígitos no terminal do VS Code. Ele aparece no bloco “CODESAGA - E-MAIL LOCAL”. Digite o código na tela de confirmação.
6. Percorra o tutorial e comece a primeira missão. O progresso é salvo no banco e pode ser recuperado após sair e entrar novamente.

O comando `npm run setup` cria seu `.env` com uma chave aleatória. O banco local é iniciado automaticamente e salvo em `.local/database`. Esse modo usa PGlite, uma distribuição embarcada do PostgreSQL. Para o primeiro teste, basta instalar o Node.js.

Os e-mails do modo local são exibidos no terminal. Para recebê-los em uma caixa de e-mail real, siga a configuração do Gmail abaixo.

Se o PowerShell bloquear `npm.ps1`, use `npm.cmd install`, `npm.cmd run setup` e `npm.cmd run dev` no mesmo terminal. Encerre os servidores com Ctrl + C.

## Enviar o código para um e-mail real

### Gmail

Uma conta Gmail será o remetente dos códigos do CodeSaga. Cada jogador receberá o código no endereço que informar no cadastro.

1. Na Conta Google que enviará as mensagens, ative a verificação em duas etapas e gere uma senha de app chamada `CodeSaga`. Essa senha é exclusiva para a conexão do projeto ao Gmail. A opção de senha de app depende da configuração da conta. [Instruções oficiais do Google](https://support.google.com/accounts/answer/185833?hl=pt-BR).
2. No terminal do VS Code, na pasta principal do projeto, execute os comandos abaixo. Se as dependências já estiverem instaladas, basta o segundo comando.

```bash
npm install
npm run setup:gmail
```

3. Abra o `.env` criado ou atualizado na pasta principal. O comando já preenche `MAIL_MODE=smtp`, `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=465` e `SMTP_SECURE=true`. Substitua os três campos abaixo pelos dados da conta remetente.

```dotenv
SMTP_USER=SEU_GMAIL@gmail.com
SMTP_PASS=COLE_A_SENHA_DE_APP_DO_GOOGLE
MAIL_FROM=CodeSaga <SEU_GMAIL@gmail.com>
```

Cole a senha de app gerada pelo Google em `SMTP_PASS`. O envio pelo Gmail remove os espaços de separação que podem acompanhar essa senha. O banco e o segredo da aplicação são preservados pelo comando de preparação. Uma configuração anterior com credenciais preenchidas também é preservada.

4. Salve o `.env` e confira a conexão.

```bash
npm run email:check
```

O resultado esperado é `Conexão SMTP autenticada.`. Esse comando verifica a conexão e a autenticação. A etapa seguinte confirma a entrega na caixa de entrada.

5. Execute `npm run dev`, abra [http://localhost:5173](http://localhost:5173) e crie uma conta no jogo. Confira a caixa de entrada e o spam do e-mail usado no cadastro. Se a conta já estiver pendente, use o reenvio de código na tela de confirmação.

Ao atualizar uma instalação existente, encerre o servidor com Ctrl + C antes de reiniciar. Guarde as credenciais no `.env` do seu computador ou nas variáveis privadas da hospedagem da API. O `.gitignore` já protege o arquivo `.env`.

Se aparecer um erro de autenticação, confira o Gmail usado em `SMTP_USER` e a senha de app em `SMTP_PASS`. Consulte as instruções oficiais do Google quando a opção de senha de app estiver indisponível. O envio depende de a conexão ser aceita pelo Gmail e da confirmação de chegada do código ao destinatário.

### Outro provedor SMTP

Abra o arquivo `.env`, criado pelo setup, e configure o serviço SMTP de sua conta ou provedor de envio.

```dotenv
MAIL_MODE=smtp
SMTP_HOST=servidor-smtp-do-seu-provedor
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=seu-usuario-smtp
SMTP_PASS=sua-credencial-smtp
MAIL_FROM=CodeSaga <seu-remetente-verificado@seudominio.com>
```

Use os dados fornecidos pelo provedor. Na porta 465, use `SMTP_SECURE=true`. Na porta 587, use `SMTP_SECURE=false`, com negociação STARTTLS. Alguns provedores exigem senha de aplicativo ou remetente previamente verificado.

Após alterar `.env`, encerre com Ctrl + C e execute `npm run dev` novamente. Crie uma conta com um endereço que você consegue acessar. Se já houver uma conta pendente, use “Confirmar e-mail” na tela de login e peça o reenvio.

O código tem seis dígitos, vale por dez minutos e aceita até cinco tentativas. O reenvio fica disponível após 45 segundos. Um novo código substitui o anterior.

## Recuperar e alterar a senha

| Acesso | Como funciona |
| --- | --- |
| Login > Esqueci minha senha | A pessoa informa o e-mail cadastrado e solicita um código de recuperação. |
| Recuperação de acesso | A pessoa digita o código recebido, a nova senha e sua confirmação. A tela também permite reenviar o código. |
| Meu perfil > Alterar senha | A pessoa recebe um código no e-mail confirmado da própria conta e usa esse código para salvar a nova senha. |

Os dois fluxos usam a mesma configuração Gmail/SMTP do cadastro. Com o envio configurado, cada pessoa recebe os códigos no endereço de sua conta. No modo `console`, os códigos ficam no terminal para o teste local.

O código de recuperação vale por dez minutos, permite até cinco tentativas e é consumido ao concluir a troca. Após salvar a nova senha, as sessões da conta são encerradas e a pessoa entra novamente pela tela de login. O código de confirmação do cadastro e o de recuperação têm finalidades separadas.

## Usar PostgreSQL convencional

O PostgreSQL embarcado facilita o teste inicial. A aplicação também se conecta a um servidor PostgreSQL pelo driver `pg`.

Com o Docker Desktop instalado e em execução, rode na pasta principal.

```bash
docker compose up -d
```

No `.env`, preencha a URL do banco local.

```dotenv
DATABASE_URL=postgresql://codesaga:codesaga_local@localhost:5432/codesaga
DATABASE_SSL=false
```

Reinicie a API. Ela cria as tabelas automaticamente e anuncia “PostgreSQL” no terminal. Se você já tiver um PostgreSQL instalado, crie um banco vazio e informe sua própria URL em `DATABASE_URL`.

Cada configuração aponta para um banco independente. As contas criadas no modo embarcado permanecem em `.local/database`. Ao trocar a URL, entre ou crie a conta no banco selecionado.

## Conteúdo e regras do jogo

| Missão | O que o jogador aprende |
| --- | --- |
| O primeiro baú | Variáveis e atribuição de valores |
| Tipos de dados | Textos, números e reconhecimento de tipos |
| O valor pode mudar | Reatribuição e operações simples |
| Verdadeiro ou falso | Valores lógicos |
| Guardião dos dados | Soma de variáveis e impressão do resultado |

- Cada missão contém quiz, resposta digitada e desafio de código.
- O primeiro acerto em cada atividade concede 20 XP. São 300 XP por linguagem e 900 XP possíveis no MVP completo.
- Revisar uma atividade concluída mantém o XP e as vidas. O sistema concede pontos uma vez por atividade e linguagem.
- A conta começa com cinco vidas. Uma resposta incorreta em uma atividade nova consome uma vida. Ao esgotar todas, a conta pausa as novas atividades por uma hora e recupera as cinco vidas ao final.
- O progresso é separado por linguagem. As vidas e o XP total pertencem à conta.
- O ranking usa os pontos reais de contas com e-mail confirmado. Empates compartilham a posição.
- O tutorial abre após o primeiro cadastro confirmado e pode ser revisto em “Como jogar”.

## Como funcionam os desafios de código

O laboratório do Mundo 1 usa um interpretador didático separado, no servidor. Ele entende um subconjunto das três linguagens adequado a variáveis e tipos.

| Linguagem | Declaração | Impressão |
| --- | --- | --- |
| Python | `moedas = 10` | `print(moedas)` |
| Java | `int moedas = 10;` | `System.out.println(moedas);` |
| JavaScript | `let moedas = 10;` | `console.log(moedas);` |

São aceitos valores numéricos, textos, booleanos, variáveis, atribuições, parênteses e operações `+`, `-`, `*` e `/`. Em Java, escreva as instruções que ficariam dentro do método `main`. Há exemplos dentro de cada missão.

O laboratório valida esse conjunto de instruções. Laços, funções, bibliotecas, acesso a arquivos e recursos externos ficam para uma futura etapa com um ambiente de execução próprio. A aplicação recebe até 2.000 caracteres e 25 instruções por solução. O Node.js interpreta a gramática permitida sem executar o programa enviado pelo jogador.

## Publicar no GitHub Pages

O front-end pode ser publicado no GitHub Pages. A API Node.js, o PostgreSQL e o envio SMTP precisam de serviços acessíveis pela internet. A pasta já inclui um workflow de publicação das telas.

1. Crie seu repositório no GitHub e envie o conteúdo desta pasta. Inclua `package-lock.json`, `.github/workflows/pages.yml`, `client` e `server`. O `.gitignore` protege `.env`, `.local` e `node_modules`.
2. Publique a API em um serviço que execute Node.js 24 ou Docker. O `Dockerfile` incluído gera uma imagem que atende API e front-end. Para usar somente a API, o processo principal é `npm start`.
3. Configure na hospedagem da API os valores de produção abaixo, com suas credenciais.

```dotenv
NODE_ENV=production
API_PORT=4000
APP_SECRET=uma-chave-aleatoria-com-pelo-menos-32-caracteres
DATABASE_URL=postgresql://usuario:senha@host:5432/codesaga
DATABASE_SSL=true
CLIENT_ORIGINS=https://SEU-USUARIO.github.io
MAIL_MODE=smtp
SMTP_HOST=host-do-provedor
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario-smtp
SMTP_PASS=credencial-smtp
MAIL_FROM=CodeSaga <remetente-verificado@seudominio.com>
```

O host da API precisa disponibilizar HTTPS. A aplicação usa `API_PORT`, depois `PORT` e, por padrão, a porta 4000. Se a plataforma gerenciar a porta por `PORT`, omita `API_PORT`. O driver valida o certificado do banco quando `DATABASE_SSL=true`. Siga a configuração TLS fornecida pelo serviço PostgreSQL.

4. No repositório, abra Settings > Secrets and variables > Actions > Variables. Crie `VITE_API_URL` com a URL HTTPS pública da API, terminada em `/api`. Exemplo `https://api.seudominio.com/api`.
5. Em Settings > Pages, escolha GitHub Actions como Source.
6. Envie um commit à branch `main` ou execute o workflow manualmente em Actions. O GitHub mostrará o endereço do site ao finalizar.
7. Abra o site publicado, crie uma conta, receba o e-mail e conclua uma atividade. Confirme a pontuação no perfil e no ranking.

O roteamento usa hash e os arquivos têm caminhos relativos, para funcionar em um endereço como `SEU-USUARIO.github.io/codesaga/`. O endereço da API é público. Senhas, segredo da aplicação, credenciais SMTP e URL do banco ficam somente no servidor.

Para testar o build local, execute `npm run build`. O comando gera as telas em `client/dist`. Na produção, `npm start` também serve essa pasta quando ela existir. As configurações de banco e SMTP continuam necessárias.

## Organização dos arquivos

| Caminho | Responsabilidade |
| --- | --- |
| `client/src/App.jsx` | Navegação, sessão e estrutura das telas |
| `client/src/components/Auth.jsx` | Login, cadastro, código e recuperação de senha |
| `client/src/components/Tutorial.jsx` | Tutorial guiado em sete etapas |
| `client/src/components/Journey.jsx` | Missões, questões e editor de código |
| `client/src/components/Dashboard.jsx` | Mapa, perfil, ranking e equipe |
| `client/src/styles.css` | Visual, animações leves e responsividade |
| `server/src/curriculum.js` | Atividades e validação de respostas |
| `server/src/validator.js` | Interpretador do laboratório de código |
| `server/src/service.js` | Regras de autenticação, progresso, XP e vidas |
| `server/src/db.js` | Conexão, tabelas e transações PostgreSQL |
| `server/src/mailer.js` | E-mail SMTP e saída local no terminal |
| `scripts/setup-gmail.mjs` | Preparação do `.env` para envio pelo Gmail |
| `server/src/check-email.js` | Teste de conexão e autenticação SMTP |
| `server/test` | Testes automatizados de integração e validação |

## Verificação

```bash
npm test
npm run build
```

Os testes verificam cadastro, confirmação de e-mail, limite e reenvio de código, login, recuperação de senha, ranking, conclusão das três trilhas, pausa e recuperação de vidas, tentativas concorrentes, repetição de requisições e validação do código. A configuração SMTP do seu provedor deve ser testada com suas credenciais.

## Problemas comuns

| Situação | Como resolver |
| --- | --- |
| `npm` não é reconhecido | Instale Node.js 24 LTS e reinicie o VS Code. |
| O navegador mostra uma lista de arquivos | Execute `npm run dev` no terminal e abra a porta 5173. |
| Não consigo conectar à API | Mantenha o terminal do projeto aberto. Confira os erros da API na porta 4000. |
| Código de e-mail não chegou | Em `MAIL_MODE=console`, consulte o terminal. Em `smtp`, confira spam, remetente e as credenciais do provedor. |
| O e-mail já tem cadastro | Entre com a senha ou use “Confirmar e-mail” para reenviar o código. |
| Uma porta está ocupada | Encerre o processo anterior. O teste local usa as portas 5173 e 4000. |
| O PostgreSQL convencional não conecta | Confira URL, serviço do banco, usuário, senha e configuração TLS. |
| O Pages abre, mas o login falha | Confira a URL HTTPS da API, o CORS em `CLIENT_ORIGINS` e faça um novo build após alterar `VITE_API_URL`. |
| Quero apresentar sem esperar uma hora | Antes do teste local, ajuste `LIFE_COOLDOWN_SECONDS=10` no `.env` e reinicie a API. Produção sempre aplica uma hora. |

## Equipe

Wilson Cabral, Bernardo Botelho, Lucas Reis e Marlon Gabriel.

Engenharia de Software. Tópico de Engenharia de Software I. Professora Dianne Dias Silva.

## Documentação de referência

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Publicação de aplicações Vite](https://vite.dev/guide/static-deploy)
- [Nodemailer e SMTP](https://nodemailer.com/smtp)
- [PGlite, PostgreSQL embarcado](https://pglite.dev/docs/api)
- [Node.js e instalação](https://nodejs.org/)

As ilustrações foram criadas para este projeto. As fontes Nunito e Outfit são empacotadas com as dependências do front-end e têm suas licenças nos respectivos pacotes Fontsource.
