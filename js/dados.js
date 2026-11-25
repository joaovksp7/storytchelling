/*
 * Dados mockados do protótipo. Nada aqui vem de sistema real.
 * Os serviços e os textos são de exemplo; só a CNH tem a jornada completa.
 *
 * servicos[].sinonimos: jeitos de falar e erros comuns que a busca aceita.
 * A busca já ignora acento, maiúscula e palavras vazias ("de", "a", "meu"),
 * e tolera um erro de digitação por palavra.
 */
window.PORTAL_DADOS = {
  servicos: [
    {
      id: 'cnh',
      titulo: 'Renovar a carteira de motorista (CNH)',
      resumo: 'Peça a nova CNH quando a sua estiver perto de vencer ou já tiver vencido.',
      icone: 'volante',
      disponivel: true,
      sinonimos: [
        'cnh',
        'renovar cnh',
        'carteira de motorista',
        'carta de motorista',
        'renovar carta',
        'carteira de habilitação',
        'habilitação',
        'renovar habilitação',
        'renovação da cnh',
        'carteira de dirigir',
        'licença para dirigir',
        'documento de motorista',
        'cnh vencida',
        'carteira vencida',
        'exame de vista cnh',
        'detran'
      ],
      // Página do serviço (padrão GOV.UK). Valores e prazos são de exemplo.
      pagina: {
        resumo: 'Peça a nova carteira de motorista pela internet. Depois, é só fazer o exame médico.',
        oQueE: [
          'A carteira de motorista tem prazo de validade. Quando ela está perto de vencer, ou já venceu, você precisa renovar para continuar dirigindo.',
          'Na renovação você faz um exame médico. Se estiver tudo certo, você recebe a carteira nova.'
        ],
        quemPode: [
          'Quem tem carteira de motorista que vence nos próximos 30 dias.',
          'Quem tem carteira de motorista vencida, mesmo que tenha vencido há muito tempo.'
        ],
        quemNaoPode: [
          'Quem está com a carteira suspensa ou cassada. Nesse caso, procure o Detran do seu estado.'
        ],
        custo: {
          partes: [
            ['Taxa de renovação', 'R$ 100,00'],
            ['Exame médico', 'R$ 80,00']
          ],
          total: 'R$ 180,00',
          comoPagar: 'Você paga com Pix ou boleto, depois de enviar o pedido.'
        },
        // soImpressa: some da confirmação quando a pessoa não pediu a carteira impressa.
        prazo: [
          { rotulo: 'Exame médico', texto: 'marcado para até 7 dias depois do pagamento.' },
          { rotulo: 'Carteira digital', texto: 'fica pronta no celular em até 5 dias úteis depois do exame.' },
          { rotulo: 'Carteira impressa', texto: 'chega pelo correio em até 15 dias úteis depois do exame.', soImpressa: true }
        ],
        documentos: [
          'O número do seu CPF.',
          'A sua carteira de motorista atual, mesmo vencida.',
          'Um comprovante de endereço com menos de 3 meses (conta de luz, água ou telefone).',
          'Seus óculos ou lentes, se você usa. Eles servem para o exame de vista.'
        ],
        passos: [
          ['Entre na sua conta', 'Com CPF e senha, pelo aplicativo do banco ou com um código no celular.'],
          ['Responda 4 perguntas', 'Uma pergunta por tela.'],
          ['Confira e envie', 'Você vê tudo o que respondeu e pode corrigir antes de enviar.'],
          ['Pague', 'Com Pix ou boleto.'],
          ['Faça o exame médico', 'Na clínica e no dia que você escolher.'],
          ['Receba a carteira nova', 'Primeiro no celular. Depois impressa, se você pedir.']
        ]
      }
    },
    {
      id: 'identidade',
      titulo: 'Tirar a nova carteira de identidade',
      resumo: 'Agende a emissão da Carteira de Identidade Nacional, a nova identidade.',
      icone: 'identidade',
      disponivel: false,
      sinonimos: [
        'rg',
        'identidade',
        'carteira de identidade',
        'cin',
        'documento de identidade',
        'registro geral',
        'segunda via rg'
      ]
    },
    {
      id: 'inss',
      titulo: 'Consultar meu benefício do INSS',
      resumo: 'Veja quanto e quando você recebe a aposentadoria ou a pensão.',
      icone: 'moeda',
      disponivel: false,
      sinonimos: [
        'inss',
        'meu inss',
        'aposentadoria',
        'pensão',
        'benefício',
        'extrato do inss',
        'extrato de pagamento',
        'quanto vou receber'
      ]
    },
    {
      id: 'cpf',
      titulo: 'Consultar a situação do CPF',
      resumo: 'Veja se o seu CPF está regular e tire o comprovante.',
      icone: 'documento',
      disponivel: false,
      sinonimos: [
        'cpf',
        'situação do cpf',
        'comprovante do cpf',
        'cpf regular',
        'cpf irregular',
        'cadastro de pessoa física'
      ]
    },
    {
      id: 'vacina',
      titulo: 'Ver minha carteira de vacinação',
      resumo: 'Confira as vacinas que você já tomou e as que estão faltando.',
      icone: 'saude',
      disponivel: false,
      sinonimos: [
        'vacina',
        'vacinação',
        'carteira de vacina',
        'cartão de vacina',
        'sus',
        'conecte sus',
        'saúde'
      ]
    },
    {
      id: 'valores',
      titulo: 'Ver se tenho dinheiro esquecido no banco',
      resumo: 'Consulte valores a receber de contas antigas, tarifas e consórcios.',
      icone: 'carteira',
      disponivel: false,
      sinonimos: [
        'valores a receber',
        'dinheiro esquecido',
        'dinheiro no banco',
        'banco central',
        'svr',
        'conta antiga'
      ]
    }
  ],

  // Formas de entrar. Só "senha" tem formulário; as outras são simuladas no protótipo.
  login: [
    {
      id: 'senha',
      titulo: 'Com CPF e senha',
      descricao: 'Use o número do seu CPF e a senha que você criou.',
      icone: 'chave'
    },
    {
      id: 'banco',
      titulo: 'Com o aplicativo do seu banco',
      descricao: 'Confirme quem você é no aplicativo do banco que você já usa.',
      icone: 'banco',
      comoSeria: 'no aplicativo do seu banco'
    },
    {
      id: 'sms',
      titulo: 'Com um código no celular',
      descricao: 'Receba um código por SMS e digite aqui.',
      icone: 'celular',
      comoSeria: 'com um código que chega por SMS no seu celular'
    }
  ],

  // Pessoa de exemplo. O CPF de teste passa na conta dos dígitos, mas não é de ninguém.
  usuarioExemplo: {
    nome: 'Carlos',
    cpfTeste: '123.456.789-09',
    celularFinal: '12',
    endereco: 'Rua de Exemplo, 100, Centro, Santa Cruz do Sul – RS'
  },

  // Formulário da renovação: uma pergunta por tela (padrão GOV.UK "one thing per page").
  // tipo "opcoes": escolha única. tipo "celular": campo de telefone com DDD.
  // revisao: rótulo na tela de revisão. mudar: completa "Mudar ..." para o leitor de tela.
  // bloqueia: a opção existe, mas não deixa seguir (mostra a mensagem como erro).
  formulario: {
    etapas: [
      {
        id: 'vencimento',
        tipo: 'opcoes',
        pergunta: 'Quando vence a sua carteira de motorista?',
        dica: 'Olhe a data de validade escrita na sua carteira.',
        opcoes: [
          { valor: 'venceu', texto: 'Já venceu' },
          { valor: 'ate-30', texto: 'Vence nos próximos 30 dias' },
          {
            valor: 'mais-30',
            texto: 'Vence daqui a mais de 30 dias',
            bloqueia: 'Ainda não dá para renovar. Volte quando faltarem 30 dias ou menos para vencer.'
          }
        ],
        erroVazio: 'Escolha quando vence a sua carteira.',
        revisao: 'Quando vence a carteira',
        mudar: 'quando vence a carteira'
      },
      {
        id: 'cidade',
        tipo: 'opcoes',
        pergunta: 'Em qual cidade você quer fazer o exame médico?',
        dica: 'O exame é feito numa clínica credenciada. As clínicas são de exemplo.',
        opcoes: [
          { valor: 'santa-cruz', texto: 'Santa Cruz do Sul', detalhe: 'Clínica de exemplo, no Centro' },
          { valor: 'venancio', texto: 'Venâncio Aires', detalhe: 'Clínica de exemplo, no Centro' },
          { valor: 'vera-cruz', texto: 'Vera Cruz', detalhe: 'Clínica de exemplo, no Centro' },
          { valor: 'rio-pardo', texto: 'Rio Pardo', detalhe: 'Clínica de exemplo, no Centro' }
        ],
        erroVazio: 'Escolha a cidade do exame.',
        revisao: 'Cidade do exame médico',
        mudar: 'a cidade do exame'
      },
      {
        id: 'impressa',
        tipo: 'opcoes',
        pergunta: 'Você quer receber a carteira impressa em casa?',
        dica: 'A carteira digital fica no seu celular de qualquer jeito.',
        opcoes: [
          {
            valor: 'sim',
            texto: 'Sim, quero receber pelo correio',
            detalhe: 'Vai para o endereço do seu cadastro: Rua de Exemplo, 100, Centro, Santa Cruz do Sul – RS (exemplo).'
          },
          { valor: 'nao', texto: 'Não, só a digital no celular' }
        ],
        erroVazio: 'Escolha se você quer a carteira impressa.',
        revisao: 'Carteira impressa',
        mudar: 'se quer a carteira impressa'
      },
      {
        id: 'celular',
        tipo: 'celular',
        pergunta: 'Qual é o número do seu celular?',
        dica: 'Com DDD. Vamos mandar avisos sobre o seu pedido por SMS.',
        erroVazio: 'Digite o seu celular com DDD.',
        revisao: 'Celular para avisos',
        mudar: 'o celular'
      }
    ],

    // Confirmação. {celular}, {cidade} e {total} são trocados pelas respostas.
    proximosPassos: [
      ['Pague a taxa', 'O código do Pix e o boleto chegam por SMS no celular {celular}. Valor: {total} (exemplo).'],
      ['Espere a data do exame', 'Vamos marcar o exame médico em {cidade}. A data e o endereço da clínica chegam por SMS.'],
      ['Faça o exame médico', 'Leve a sua carteira atual e, se usa, seus óculos ou lentes.'],
      ['Receba a carteira nova', {
        impressa: 'Primeiro ela aparece no seu celular. Depois a impressa chega pelo correio.',
        digital: 'Ela aparece no seu celular. Você pode mostrar a carteira digital numa blitz.'
      }]
    ],

    textoWhatsApp: 'Fiz o pedido de renovação da minha carteira de motorista. Protocolo: {protocolo}. (Protótipo acadêmico – UNISC)'
  }
};
