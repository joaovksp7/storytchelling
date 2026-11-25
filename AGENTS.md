# AGENTS.md

Protótipo acadêmico da disciplina **Experiência do Usuário e Storytelling (UNISC)**.
Tema: redesign da jornada de busca e solicitação de um serviço num portal de governo
(inspirado no gov.br), do login até a conclusão do pedido. Serviço de exemplo:
**renovação da carteira de motorista (CNH)**.

Este arquivo é a fonte única de instruções para agentes de IA; o `CLAUDE.md` só o importa.
Editar aqui, não lá. Pedido original: [`plano.md`](plano.md). Tarefa separada de prints de
comparação: [`prints.md`](prints.md).

## Persona

**Seu Carlos**, 62 anos, aposentado. Usa o celular quase só para o WhatsApp. Esquece a
senha, se perde nos menus, tem dificuldade com letra pequena e quer resolver sozinho, sem
pedir ajuda ao neto. Toda decisão de tela se justifica por ele.

## Estado

| Fase | Escopo | Situação |
|---|---|---|
| 1. Base e entrada | Estrutura comum (faixa de aviso, cabeçalho, barra de acessibilidade, rodapé), roteador por hash, `dados.js` (serviços e sinônimos), telas Início e Busca, telas de apoio (fora do protótipo, em construção, não encontrada) | Feita (25/11/2026) |
| 2. Serviço e login | Página do serviço (padrão GOV.UK), escolha da forma de entrar (CPF e senha, app do banco e SMS, os dois últimos simulados), CPF e senha com validação, "Esqueci minha senha" em uma tela, sessão "Você entrou como Carlos / Sair" | Feita (25/11/2026) |
| 3. Formulário | 4 perguntas, uma por tela (vencimento, cidade do exame, carteira impressa, celular), barra de progresso, validação, revisão com "Mudar", confirmação com protocolo, próximos passos, prazos, WhatsApp e "Copiar" | Feita (25/11/2026) |
| 4. Revisão e entrega | Testes 390/1440px, teclado, contraste, `README.md` com a tabela de heurísticas de Nielsen | A fazer |
| Prints de comparação | Script Playwright do `prints.md` (gov.br, GOV.UK, gov.pt). Pasta própria, não mistura com o protótipo | A fazer, quando pedido |

## Stack

HTML + CSS + JavaScript puro. **Sem framework, sem npm, sem build, sem CDN.** Abre com dois
cliques no `index.html` (`file://`). Sem ES modules (o `file://` bloqueia): os scripts são
clássicos e o `dados.js` expõe `window.PORTAL_DADOS`. Fonte do sistema, sem Google Fonts,
para funcionar sem internet.

```
index.html        estrutura de todas as telas (uma <section data-tela> por tela)
css/style.css     tokens no :root (cor, espaço, raio), tema de alto contraste, layout e componentes
js/dados.js       dados mockados: serviços, sinônimos e (fase 3) etapas do formulário
js/app.js         preferências (fonte, contraste), roteador por hash, busca, telas
README.md         (fase 4) como abrir + decisões de design x heurísticas de Nielsen
```

Só esses arquivos. Não criar outros sem pedido. Os dois scripts entram no `<head>` sem
`defer` (dados, depois app) para aplicar fonte e contraste salvos antes de pintar a tela; o
resto do `app.js` roda no `DOMContentLoaded`.

## Identidade

- **Faixa fixa no topo de todas as telas:** "Protótipo acadêmico – UNISC. Este não é o site
  oficial do gov.br." Nunca remover.
- **Nome:** "Portal de Serviços (protótipo)". **Não usar o logo, o brasão nem a marca do
  gov.br**, nem imitar a página oficial a ponto de passar por ela.
- **Cores** (tokens no topo do `style.css`): azul `#1351B4`, amarelo `#FFCD07`, fundo
  `#FDFDFC`, texto `#1B1B1B`. O amarelo é só fundo com texto escuro ou anel de foco (texto
  amarelo sobre fundo claro reprova no contraste).
- **Alto contraste:** `html[data-contraste="alto"]` troca os tokens (fundo preto, texto
  branco, ação em amarelo).

## Jornada e rotas

SPA simples: o hash da URL decide a tela. Rota com parâmetro usa `?` dentro do hash.

| Rota | Tela | Fase |
|---|---|---|
| `#inicio` (ou vazio) | Busca grande + 6 serviços mais procurados | 1 |
| `#busca?q=...` | Resultado da busca | 1 |
| `#indisponivel?s=<id>` | Serviço que não faz parte do protótipo | 1 |
| `#servico` | Página do serviço (renovação da CNH) | 2 |
| `#entrar` | Escolha da forma de entrar (3 opções com o mesmo peso) | 2 |
| `#entrar-senha` | CPF e senha, com "Esqueci minha senha" visível | 2 |
| `#esqueci-senha` | Criar uma senha nova (CPF e mensagem de sucesso) | 2 |
| `#etapa-1` a `#etapa-4` | Uma pergunta por tela (a mesma `#tela-etapa`, montada a partir de `dados.js`). `?voltar=revisar` faz o "Continuar" voltar à revisão | 3 |
| `#revisar` | Respostas com "Mudar" e o botão "Enviar pedido" | 3 |
| `#confirmacao` | Pedido enviado, protocolo, próximos passos, prazos, WhatsApp | 3 |

A cada troca de tela: atualizar o `document.title`, rolar ao topo e mover o foco para o `h1`
da tela (`tabindex="-1"`). Na primeira carga, não mover o foco.

**Sessão:** depois de entrar, `sessionStorage` (em `try/catch`) guarda só o nome do usuário de
exemplo; o cabeçalho mostra "Você entrou como Carlos" e "Sair". "Começar agora" leva a
`#entrar` ou, com sessão, direto a `#etapa-1`.

**Pedido:** as respostas e o protocolo ficam em `sessionStorage` (`portal-prototipo:pedido`,
em `try/catch`); "Sair" apaga tudo. `desvioDoPedido()` protege as rotas com
`location.replace` (sem empilhar no histórico): sem sessão vai para `#entrar`; etapa pulada
volta para a primeira sem resposta; pedido enviado leva etapas e revisão para `#confirmacao`.
O protocolo é inventado na hora (`AAAA-CNH-######`). O botão do WhatsApp é o único link
externo do protótipo (`wa.me`, autorizado).

**Formulários:** validação no padrão GOV.UK, com `validar(tela, regras)` no `app.js`: resumo
"Corrija estes pontos" no topo (recebe o foco, links levam ao campo), erro junto do campo com
"Erro:" oculto para leitor de tela, `aria-invalid` e "Erro: " no título da aba. A fase 3 usa
a mesma função. Links de âncora para campos não podem mudar o hash (o hash é a rota).

**Busca:** normaliza (minúsculas, sem acento, sem palavras vazias como "de", "a", "meu"),
procura no título e nos sinônimos do `dados.js`, aceita prefixo (enquanto digita) e um erro
de digitação por palavra. "cnh", "carteira de motorista", "habilitação" e "renovar carta"
levam ao mesmo serviço. Sugestões no padrão combobox do ARIA (setas, Enter, Esc).

## Acessibilidade (o público é idoso e diverso)

- Fonte base de **18px** (`html` em 112,5%), tudo em `rem`. A+ / A- trocam
  `html[data-fonte="0..3"]` (100%, 115%, 130%, 150%) e guardam em `localStorage` **sempre em
  `try/catch`**. O alto contraste é guardado do mesmo jeito.
- Área de toque de **pelo menos 48px** (`min-height: 3rem`) em botão, link de ação e campo.
- Contraste de texto de **pelo menos 4,5:1** nos dois temas; bordas de campo e foco, 3:1.
  O contraste vai anotado ao lado de cada token.
- HTML semântico, `label` visível em todo campo (placeholder não é label), skip-link, foco
  visível (anel amarelo + contorno escuro), navegação completa por teclado.
- `aria-live` nas mensagens de erro, de sucesso, nas sugestões da busca e nos avisos da
  barra de acessibilidade.
- Erro: mensagem clara junto do campo, `aria-invalid`, ligada por `aria-describedby`.
- Celular primeiro: 390px sem rolagem horizontal, conferir também em 1440px. Breakpoints
  600 / 1024px. Grid com `minmax(0, 1fr)`.

## Linguagem

Linguagem simples em tudo: frases curtas, voz ativa, "você", verbos no lugar de
substantivos ("renovar" e não "renovação de"), sem sigla sem explicação, sem jargão
(nada de "autenticação", "requerimento", "submeter"). Sem emoji, sem texto com cara de
gerado por IA.

## Regras rígidas

- **HTML só com estrutura e conteúdo.** Estilo no `style.css`, comportamento no `app.js`.
  Nada de `style="..."`, `<style>` nem `<script>` com lógica no HTML.
- **Cores e medidas só pelos tokens.** Nada de hex ou `rgb()` solto fora do bloco de tokens.
  SVG inline usa `currentColor`. Translúcido: `color-mix(in srgb, var(--x) 70%, transparent)`.
- **Dados mockados e assumidos como exemplo.** Preço, prazo, protocolo e serviços são
  fictícios e a tela diz isso quando mostra valor. Nada de chamada a API real, nada de
  coleta de dado de verdade.
- **Texto que vem do usuário entra por `textContent`**, nunca por `innerHTML`.
- **Nada de requisição externa** no protótipo. A única saída é o link do WhatsApp na
  confirmação, que só abre quando a pessoa clica.

## Prints de comparação (tarefa separada)

Pedido em [`prints.md`](prints.md). Script Node + Playwright, fora da pasta do protótipo, saída
em `prints/` (`<portal>_<pagina>_<desktop|mobile>.png` + `prints/urls.md`). É a única parte
que pode usar npm (`npm i playwright`, avisando antes). Só páginas públicas, sem login e sem
enviar formulário.

## Ao terminar uma mudança

- Abrir o `index.html` direto no navegador (`file://`). Nenhum erro no console.
- Conferir em 390px e 1440px, nos dois temas e com a fonte em 150%. Sem rolagem horizontal.
  Captura automática: Chrome `--headless=new --screenshot`. A janela headless não fica
  menor que ~500px, então para 390px abrir a página dentro de um `<iframe width="390">`
  numa página de teste na pasta temporária (nunca no projeto).
- Navegar só pelo teclado: skip-link, barra de acessibilidade, busca com sugestões, todos
  os links e botões.
- Percorrer as rotas da tabela acima, inclusive voltar pelo botão do navegador.

---

## Fluxo obrigatório

Para toda instrução, seguir nesta ordem — sem exceção:

1. **Ler** — identificar e ler todos os arquivos relacionados à instrução.
2. **Confirmar** — responder com:
   - **Entendi:** (resumo de 2–3 frases do que foi pedido)
   - **Arquivos que vou alterar:** (nome e caminho de cada um)
   - **O que muda em cada um:** (descrição breve por arquivo)
3. **Aguardar** — não fazer nenhuma alteração até receber confirmação explícita
   ("ok", "pode ir", "sim" ou equivalente).
4. **Executar** — só depois da confirmação, implementar exatamente o combinado.
   Não ampliar escopo sem avisar antes.

Se qualquer parte da instrução estiver ambígua, perguntar antes de ler os arquivos.

## Regras

**Fazer:** seguir os padrões existentes do projeto; ficar no escopo estrito do pedido;
relatar problemas fora do escopo antes de agir; conferir dependências afetadas; avisar se
uma mudança pode quebrar algo em outro lugar.

**Não fazer:** alterar arquivos sem apresentar o plano e aguardar confirmação; assumir o
que não foi dito; refatorar além do pedido; renomear, mover ou apagar arquivos sem
aprovação; instalar dependências sem avisar; criar arquivos sem avisar; reescrever lógica
funcional ao corrigir algo simples.
