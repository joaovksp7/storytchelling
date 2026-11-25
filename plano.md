Você vai me ajudar num projeto acadêmico da disciplina Experiência do Usuário e Storytelling (UNISC). O tema é o redesign da jornada de busca e solicitação de um serviço no gov.br, do login até a conclusão do pedido. A proto-persona é o Seu Carlos, 62 anos, aposentado, que usa o celular quase só pro WhatsApp. Ele esquece a senha, se perde nos menus, tem dificuldade com letra pequena e quer resolver sozinho.

O serviço de exemplo é a RENOVAÇÃO DA CARTEIRA DE MOTORISTA (CNH).

Crie um protótipo navegável em HTML, CSS e JS puro. Sem framework e sem build. Só index.html, css/style.css, js/app.js e js/dados.js. Precisa abrir direto no navegador. Me mostre o plano antes de começar a escrever código.

No topo de todas as telas, coloque uma faixa fixa: "Protótipo acadêmico – UNISC. Este não é o site oficial do gov.br." Não use o logo oficial do gov.br. Use um nome neutro, tipo "Portal de Serviços (protótipo)". As cores podem lembrar o padrão do governo: azul #1351B4, amarelo #FFCD07, fundo #FDFDFC, texto #1B1B1B.

Simule a jornada completa em telas que trocam via JS (SPA simples com hash na URL, tipo #inicio, #servico, #etapa-1):

1. Início: uma busca grande no centro, com placeholder em linguagem simples ("O que você precisa resolver?"). Abaixo, os 6 serviços mais procurados como botões grandes com ícone e texto.
2. Busca: sugestões enquanto digita, que aceitam sinônimos e erros comuns ("cnh", "carteira de motorista", "habilitação" e "renovar carta" levam ao mesmo serviço). Resultado com título claro e uma linha explicando o serviço.
3. Página do serviço, inspirada no GOV.UK: o que é, quem pode pedir, quanto custa, quanto tempo demora, documentos que precisa ter em mãos, passo a passo numerado e um botão grande "Começar agora".
4. Login simplificado: explique em uma frase pra que serve o login. Mostre as opções com o mesmo peso visual. Deixe "Esqueci minha senha" bem visível e com texto de ajuda.
5. Formulário em etapas, uma pergunta por tela (padrão "one thing per page" do GOV.UK). Tenha barra de progresso ("Etapa 2 de 4"), botão Voltar, validação com mensagem clara ao lado do campo e um resumo no fim pra revisar e corrigir antes de enviar.
6. Confirmação: mensagem grande de sucesso, número de protocolo, o que acontece agora, prazo e botão pra compartilhar no WhatsApp.

Acessibilidade (o público é idoso e diverso):
- Barra de acessibilidade com A+ / A- (ajusta a fonte base e guarda em localStorage dentro de try/catch) e modo alto contraste.
- Fonte base de pelo menos 18px, área de toque de pelo menos 48px, contraste mínimo de 4.5:1.
- HTML semântico, labels em todos os campos, foco visível, navegação completa por teclado, aria-live nas mensagens de erro e de sucesso.
- Mobile first. Teste em 390px e 1440px.
- Linguagem simples em tudo.

Dados mockados em js/dados.js (serviços, sinônimos, etapas do formulário). Nada de chamada a API real.

No fim, me entregue um README.md curto com: como abrir o projeto e uma tabela com as decisões de design e qual heurística de Nielsen cada uma resolve.