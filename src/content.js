// EDITE OS TEXTOS E CONTATOS PADRÃO DO SITE NESTE ARQUIVO.
// A organização abaixo segue as telas e seções da aplicação.
export const DEFAULT_CONTACT = {
  instagram: "https://www.instagram.com/oticas.unidas1/",
  facebook: "",
  email: "oticasunidas@hotmail.com",
  whatsapp: "+55 92 8523-5308",
  phone: "",
};

export const DEFAULT_HOME_SLIDES = [
  {
    id: "welcome",
    active: true,
    image: "/hero-optica.png",
    imageFit: "cover",
    eyebrow: "ÓTICAS UNIDAS",
    title: "Seu olhar merece destaque",
    description: "Conheça nossas armações e encontre o modelo que combina com você.",
    buttonLabel: "Ver coleção",
    link: "catalog",
  },
];

export const TEXTS = {
  brand: { name: "ÓTICAS", suffix: "UNIDAS" },
  header: {
    announcement: "Frete grátis em compras acima de R$ 499",
    discount: "10% OFF no PIX",
    menu: { home: "Home", prescription: "Óculos de grau", sunglasses: "Óculos de sol", tryOn: "Provador virtual", about: "Sobre nós" },
  },
  home: {
    collectionLabel: "NOVA COLEÇÃO · 2026",
    title: "Enxergue o mundo",
    titleHighlight: "do seu jeito.",
    description: "Armações que traduzem quem você é.",
    descriptionSecondLine: "Conforto, estilo e personalidade em cada detalhe.",
    collectionButton: "Conheça a coleção",
    tryOnButton: "Experimentar virtualmente",
    imageTitle: "Feito para o seu olhar",
    imageSubtitle: "Design autoral • Conforto diário",
    benefits: [
      { title: "Provador virtual", description: "Experimente sem sair de casa" },
      { title: "Atendimento especialista", description: "Cuidado em cada escolha" },
    ],
    featuredLabel: "SELEÇÃO ESPECIAL",
    featuredTitle: "Armações que",
    featuredHighlight: "contam histórias.",
    featuredDescription: "Cada modelo foi escolhido para valorizar o que você tem de mais único.",
    seeAll: "Ver todas",
  },
  catalog: {
    label: "ENCONTRE O SEU",
    prescriptionTitle: "Óculos de grau",
    sunglassesTitle: "Óculos de sol",
    description: "Design, conforto e personalidade para acompanhar todos os seus dias.",
    searchPlaceholder: "Buscar armação...",
    sort: "Ordenar por",
    addToBag: "Adicionar à sacola",
  },
  about: {
    label: "QUEM SOMOS",
    title: "Cuidado com o seu olhar,",
    titleHighlight: "respeito por cada história.",
    introduction: "Na Óticas Unidas, acreditamos que enxergar bem transforma a forma como vivemos. Por isso, unimos qualidade, atendimento próximo e soluções acessíveis para cuidar de cada cliente.",
    mission: {
      title: "Missão",
      image: "/missao.png",
      highlight: "Cuidar da visão com excelência e humanidade.",
      description: "Oferecer soluções ópticas de qualidade, com atendimento personalizado, acolhedor e acessível, ajudando cada cliente a enxergar melhor e viver com mais confiança.",
    },
    vision: {
      title: "Visão",
      image: "/visao.png",
      highlight: "Ser referência em cuidado visual e atendimento humanizado.",
      description: "Ser reconhecida pela confiança, qualidade e experiência oferecida aos nossos clientes, tornando as Óticas Unidas uma marca cada vez mais presente na vida das famílias.",
    },
    values: {
      title: "Valores",
      image: "/valores.png",
      items: ["Cuidado", "Respeito", "Confiança", "Qualidade", "Ética", "Acolhimento"],
      description: "Valorizamos cada pessoa e acreditamos que um bom atendimento começa pela escuta. Trabalhamos com transparência, responsabilidade e dedicação para oferecer uma experiência que faça cada cliente se sentir único e bem cuidado.",
    },
  },
  tryOn: {
    label: "PROVADOR VIRTUAL",
    title: "Veja antes.",
    titleHighlight: "Apaixone-se depois.",
    description: "Envie uma foto de frente, escolha sua armação favorita e veja como ela combina com você.",
    uploadTitle: "Adicione uma foto sua",
    uploadHelp: "Use uma foto de frente, com boa iluminação e sem óculos para um resultado melhor.",
    photoTip: "Use uma foto de perfil nítida, olhando para a câmera e sorrindo.",
    galleryButton: "Escolher da galeria",
    cameraButton: "Usar câmera",
    chooseFrame: "Qual combina com você?",
    generateButton: "Gerar meu resultado",
  },
  cart: { label: "SUA ESCOLHA", title: "Minha sacola", emptyTitle: "Sua sacola está vazia", emptyDescription: "Que tal encontrar uma armação que seja a sua cara?", continueButton: "Continuar para entrega" },
  footer: { slogan: "Sua visão em primeiro lugar.", adminButton: "Área administrativa" },
  admin: { productsTitle: "Produtos", productsDescription: "Gerencie armações de grau e óculos de sol.", newProduct: "Novo produto", manageModels: "Gerenciar Modelos" },
};
