export const VALID_WORDS: string[] = [
  'celular', 'smartphone', 'aparelho', 'telefone', 'iphone', 'samsung', 'xiaomi', 'motorola', 'apple', 'galaxy',
  'tela', 'amoled', 'bateria', 'ram', 'gb', 'carregador', 'capinha', 'pelicula', 'sedex', 'pac',
  'estorno', 'nfe', 'nota', 'fiscal', 'cabo', 'fone', 'bluetooth', 'camera', 'lente', 'processador',
  'memoria', 'armazenamento', 'garantia', 'defeito', 'assistencia', 'reparo', 'conserto', 'troca', 'devolucao', 'reembolso',
  'compra', 'pedido', 'carrinho', 'pagamento', 'pix', 'cartao', 'boleto', 'parcela', 'juros', 'desconto',
  'promocao', 'cupom', 'oferta', 'frete', 'entrega', 'rastreio', 'codigo', 'transportadora', 'correios', 'prazo',
  'atraso', 'chegou', 'recebi', 'veio', 'novo', 'usado', 'seminovo', 'vitrine', 'recondicionado', 'lacrado',
  'original', 'falsificado', 'paralelo', 'película', 'vidro', '3d', 'privacidade', 'capa', 'silicone', 'anti-impacto',
  'fonte', 'usb', 'tipo', 'c', 'lightning', 'bivolt', 'turbo', 'fast', 'charge', 'sem', 'fio',
  'wireless', 'magsafe', 'airpods', 'galaxybuds', 'watch', 'smartwatch', 'applewatch', 'band', 'pulseira', 'tela',
  'quebrada', 'trincada', 'riscada', 'mancha', 'pixel', 'morto', 'bateria', 'viciada', 'descarregando', 'rapido',
  'esquentando', 'travando', 'lento', 'reiniciando', 'nao', 'liga', 'apaga', 'som', 'microfone', 'alto-falante',
  'audio', 'chiado', 'baixo', 'wifi', 'sinal', 'rede', 'chip', 'sim', 'esim', 'gaveta',
  'botao', 'volume', 'power', 'biometria', 'digital', 'face', 'id', 'facial', 'suporte', 'atendimento'
];

export const ABBREVIATIONS: Record<string, string> = {
  // Comuns
  vc: 'você', vcs: 'vocês', pq: 'porque', pk: 'porque', q: 'que', tb: 'também', tbm: 'também', obg: 'obrigado',
  obgd: 'obrigado', vlw: 'valeu', msg: 'mensagem', cel: 'celular', ap: 'aparelho', ip: 'iphone', pix: 'pix',
  cart: 'cartão', n: 'não', naum: 'não', naoo: 'não', xegou: 'chegou', chego: 'chegou', qro: 'quero',
  qr: 'quero', qria: 'queria', pf: 'por favor', pfv: 'por favor', pls: 'por favor', blz: 'beleza', fds: 'final de semana',
  tmj: 'tamo junto', flw: 'falou', kd: 'cadê', cade: 'cadê', p: 'para', pra: 'para', pro: 'para o',
  mt: 'muito', mto: 'muito', nd: 'nada', oq: 'o que', ctz: 'certeza', tlgd: 'tá ligado', pdc: 'pode crer',
  vdd: 'verdade', c: 'com', cmg: 'comigo', ctg: 'contigo', dps: 'depois', add: 'adicionar', att: 'atualizar',
  glr: 'galera', rast: 'rastreio', cc: 'cartão de crédito', pc: 'computador', note: 'notebook', zap: 'whatsapp', wpp: 'whatsapp',
  wts: 'whatsapp', insta: 'instagram', face: 'facebook', tt: 'twitter', dm: 'mensagem direta', pv: 'privado', rs: 'risos',
  kkk: 'risos', kkkk: 'risos', hahaha: 'risos', ahaha: 'risos', lol: 'risos', slc: 'se loco', mds: 'meu deus',
  pqp: 'puta que pariu', fdp: 'filho da puta', krl: 'caralho', vtnc: 'vai tomar no cu', vsf: 'vai se foder', tnc: 'tomar no cu',
  tomanocu: 'tomar no cu', crlh: 'caralho', kra: 'cara', man: 'mano', mn: 'mano', bro: 'brother', s: 'sim',
  ss: 'sim', y: 'sim', yep: 'sim', ofc: 'claro', crtz: 'certeza', bl: 'beleza', fmz: 'firmeza', sdds: 'saudades',
  bj: 'beijo', bjs: 'beijos', abs: 'abraços', flws: 'falou', 'te+': 'até mais', 't+': 'até mais', dnd: 'de nada',
  magina: 'imagina', dmr: 'demorou', partiu: 'fui', gg: 'good game', wp: 'well played', np: 'no problem', rlx: 'relaxa',
  sussa: 'suave', suave: 'tranquilo', deboa: 'tranquilo', vddr: 'verdadeiro', fka: 'falso', fake: 'falso', br: 'brasil',
  pt: 'português', en: 'inglês', sp: 'são paulo', rj: 'rio de janeiro', mg: 'minas gerais', rsrs: 'risos', hehe: 'risos',
  aff: 'chateado', ufa: 'alívio', eca: 'nojo', credo: 'nojo', puts: 'nossa', vish: 'nossa', eita: 'nossa', oxe: 'nossa',
  oxente: 'nossa', uai: 'nossa', bah: 'nossa', tche: 'nossa', sô: 'nossa', ué: 'nossa', hmm: 'pensando', hum: 'pensando',
  opa: 'olá', oie: 'olá', eai: 'olá', coé: 'qual é', qualé: 'qual é', falae: 'fala aí', bora: 'vamos',
  partio: 'fomos', vamo: 'vamos', simbora: 'vamos embora', go: 'vamos', letgo: 'vamos', asap: 'o mais rápido possível', fyi: 'para sua informação',
  btw: 'por falar nisso', idc: 'não me importo', idk: 'não sei', imo: 'na minha opinião', imho: 'na minha humilde opinião', tbqh: 'para ser sincero',
  omg: 'meu deus', wtf: 'que porra é essa', stfu: 'cala a boca', brb: 'já volto', afk: 'longe do teclado', nvm: 'deixa pra lá',
  smh: 'balançando a cabeça', tbh: 'para ser honesto', 'tl;dr': 'muito longo; não li', fomo: 'medo de ficar de fora', yolo: 'só se vive uma vez',
  bae: 'amor', bff: 'melhor amigo', diy: 'faça você mesmo', faq: 'perguntas frequentes', eta: 'tempo estimado de chegada', tba: 'a ser anunciado',
  tbd: 'a ser determinado', fwiw: 'pelo que vale', icymi: 'caso você tenha perdido', tbhq: 'para ser honesto', rofl: 'rolando no chão de rir', lmfao: 'rindo muito',
  ily: 'eu te amo', xoxo: 'beijos e abraços', ty: 'obrigado', thx: 'obrigado', tyvm: 'muito obrigado', yw: 'de nada', np: 'sem problema',
  gl: 'boa sorte', hf: 'divirta-se', ggwp: 'bom jogo bem jogado', noob: 'novato', n00b: 'novato', hack: 'trapaça',
  cheat: 'trapaça', lag: 'atraso', bug: 'erro', glitch: 'falha', crash: 'travamento', freeze: 'congelamento', fps: 'quadros por segundo',
  ping: 'latência', dc: 'desconectado', afk: 'ausente', brb: 'já volto', g2g: 'tenho que ir', cya: 'até logo', l8r: 'mais tarde',
  b4: 'antes', 2: 'para', 4: 'por', u: 'você', r: 'são', y: 'por que', 'w/': 'com', 'w/o': 'sem',
  'n/a': 'não aplicável', tbh: 'para ser honesto', imo: 'na minha opinião', jk: 'brincadeira', lol: 'rindo', omg: 'meu deus', wtf: 'o que é isso',
  pqp: 'meu deus', aff: 'chateado', puts: 'nossa', eita: 'nossa', oxe: 'nossa', ué: 'nossa', vish: 'nossa',
  pdc: 'pode crer', tlgd: 'ta ligado', fmz: 'firmeza', blz: 'beleza', sussa: 'suave', rlx: 'relaxa', partiu: 'vamos',
  bora: 'vamos', vamo: 'vamos', tmj: 'tamo junto', flw: 'falou', vlw: 'valeu', obg: 'obrigado', dnd: 'de nada',
  magina: 'imagina', ctz: 'certeza', vdd: 'verdade', sdds: 'saudades', fds: 'final de semana', hj: 'hoje', amanh: 'amanhã',
  dps: 'depois', smp: 'sempre', nnc: 'nunca', alg: 'alguém', ngm: 'ninguém', td: 'tudo', nd: 'nada',
  oq: 'o que', pq: 'por que', qnd: 'quando', cm: 'como', qm: 'quem', ql: 'qual', qnt: 'quanto',
  onde: 'onde', kd: 'cadê', aq: 'aqui', ali: 'ali', la: 'lá', agr: 'agora', ja: 'já',
  tb: 'também', n: 'não', s: 'sim', c: 'com', 's/': 'sem', 'p/': 'para', q: 'que',
  mt: 'muito', mto: 'muito', pco: 'pouco', '+': 'mais', '-': 'menos', '=': 'igual', vcs: 'vocês',
  nós: 'nós', eles: 'eles', elas: 'elas', ele: 'ele', ela: 'ela', mim: 'mim', te: 'te',
  me: 'me', se: 'se', lhe: 'lhe', lhes: 'lhes', o: 'o', a: 'a', os: 'os', as: 'as',
  um: 'um', uma: 'uma', uns: 'uns', umas: 'umas', esse: 'esse', essa: 'essa', esses: 'esses', essas: 'essas',
  este: 'este', esta: 'esta', estes: 'estes', estas: 'estas', aquele: 'aquele', aquela: 'aquela', aqueles: 'aqueles', aquelas: 'aquelas'
};

export const SYNONYMS: Record<string, string[]> = {
  comprar: [
    'adquirir', 'pegar', 'levar', 'quero', 'interessa', 'preciso', 'gostaria', 'procurando', 'compro', 'comprando',
    'fechar negócio', 'encomendar', 'obter', 'fazer pedido', 'botar no carrinho', 'comprar agora', 'levar hoje'
  ],
  pagamento: [
    'pix', 'cartão', 'boleto', 'parcela', 'parcelamento', 'pagar', 'valor', 'preço', 'custa', 'dinheiro',
    'vista', 'juros', 'transferência', 'cobrança', 'fatura', 'débito', 'crédito', 'cotação', 'custo'
  ],
  garantia: [
    'defeito', 'estragou', 'quebrou', 'não liga', 'bugou', 'problema', 'assistência', 'falha', 'pifou', 'ruim',
    'garantir', 'conserto', 'reparo', 'arrumar', 'técnico', 'manutenção', 'vício', 'trincou', 'pane', 'queimou'
  ],
  troca: [
    'devolução', 'trocar', 'substituir', 'reembolso', 'cancelamento', 'devolver', 'arrepender', 'arrependimento', 'estorno', 'dinheiro de volta',
    'desistir', 'desistência', 'voltar atrás', 'mandar de volta', 'ressarcimento', 'substituição'
  ],
  rastreamento: [
    'rastreio', 'cade', 'onde', 'chegar', 'chegou', 'correios', 'transportadora', 'entregar', 'entrega', 'caminho',
    'código de rastreio', 'status', 'acompanhar', 'encomenda', 'pacote', 'logística', 'frete', 'demora', 'prazo'
  ],
  produto: [
    'celular', 'aparelho', 'smartphone', 'iphone', 'samsung', 'motorola', 'telefone', 'mobile', 'dispositivo', 'gadget',
    'eletrônico', 'equipamento', 'máquina', 'telefone celular', 'android', 'ios'
  ],
  suporte: [
    'ajuda', 'atendente', 'humano', 'pessoa', 'falar com alguém', 'atendimento', 'especialista', 'ticket', 'chamado',
    'reclamação', 'ouvidoria', 'contato', 'falar com vcs', 'falar com atendente', 'ajuda humana', 'suporte técnico'
  ]
};

export const EMOTION_KEYWORDS = {
  angry: [
    'ódio', 'raiva', 'merda', 'lixo', 'bosta', 'procon', 'processo', 'advogado', 'absurdo', 'palhaçada',
    'desrespeito', 'pqp', 'porra', 'caralho', 'enganado', 'roubado', 'golpe', 'demora', 'decepcionado', 'falsificado',
    'incompetência', 'ridículo', 'fraude', 'lesado', 'justiça', 'reclamar', 'péssimo', 'horrível', 'descaso', 'vergonha',
    'lamentável', 'irritado', 'frustrado', 'enganação', 'mentira', 'safadeza', 'desonesto'
  ],
  happy: [
    'ótimo', 'maravilhoso', 'perfeito', 'amei', 'lindo', 'melhor', 'show', 'top', 'incrível', 'excelente',
    'obrigado', 'vlw', 'valeu', 'feliz', 'ansioso', 'chegou', 'recomendo', 'recomendo muito', 'rápido', 'rapidez',
    'lindo', 'apaixonado', 'surpreendeu', 'qualidade', 'bom', 'muito bom', 'gostei', 'satisfeito', 'adoro', 'adorei',
    'parabéns', 'nota 10', 'sucesso', 'alegria', 'gratidão', 'agradeço'
  ]
};
