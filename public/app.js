
const produtos = [
  {
    nome: "Smartwatch Inteligente",
    categoria: "Tecnologia",
    preco: "129,90",
    vendedor: "João Eletrônicos",
    emoji: "⌚",
    link: "https://example.com/produto1",
    publicidade: false
  },
  {
    nome: "Fone Bluetooth Premium",
    categoria: "Tecnologia",
    preco: "89,90",
    vendedor: "Maria Tech",
    emoji: "🎧",
    link: "https://example.com/produto2",
    publicidade: true
  },
  {
    nome: "Kit Cuidados com a Pele",
    categoria: "Beleza",
    preco: "59,90",
    vendedor: "Ana Beleza",
    emoji: "🧴",
    link: "https://example.com/produto3",
    publicidade: true
  },
  {
    nome: "Luminária Decorativa",
    categoria: "Casa",
    preco: "79,90",
    vendedor: "Casa & Estilo",
    emoji: "💡",
    link: "https://example.com/produto4",
    publicidade: false
  },
  {
    nome: "Bolsa Feminina",
    categoria: "Moda",
    preco: "119,90",
    vendedor: "Moda Digital",
    emoji: "👜",
    link: "https://example.com/produto5",
    publicidade: true
  },
  {
    nome: "Caixa de Som Bluetooth",
    categoria: "Tecnologia",
    preco: "149,90",
    vendedor: "João Eletrônicos",
    emoji: "🔊",
    link: "https://example.com/produto6",
    publicidade: true
  },
  {
    nome: "Organizador de Cozinha",
    categoria: "Casa",
    preco: "39,90",
    vendedor: "Casa & Estilo",
    emoji: "🏠",
    link: "https://example.com/produto7",
    publicidade: true
  },
  {
    nome: "Óculos de Sol",
    categoria: "Moda",
    preco: "69,90",
    vendedor: "Moda Digital",
    emoji: "🕶️",
    link: "https://example.com/produto8",
    publicidade: false
  }
];

const grade = document.getElementById("productGrid");

function mostrarProdutos(categoria = "Todos") {
  const lista = categoria === "Todos"
    ? produtos
    : produtos.filter(p => p.categoria === categoria);

  grade.innerHTML = lista.map(produto => `
    <article class="product-card">
      <div class="product-image">
        <span>${produto.emoji}</span>
        ${produto.publicidade
          ? '<span class="product-badge">PARCEIRO DA REDE</span>'
          : ''}
      </div>
      <div class="product-info">
        <span class="category">${produto.categoria}</span>
        <h3>${produto.nome}</h3>
        <div class="price">R$ ${produto.preco}</div>
        <p class="seller">Vendido por: ${produto.vendedor}</p>
        <a href="${produto.link}" target="_blank"
           rel="noopener noreferrer">Ver produto →</a>
      </div>
    </article>
  `).join("");
}

function filtrar(categoria, botao) {
  document.querySelectorAll(".filter").forEach(item => {
    item.classList.remove("active");
  });

  botao.classList.add("active");
  mostrarProdutos(categoria);
}

function aviso(mensagem) {
  const elemento = document.getElementById("notice");
  elemento.textContent = mensagem;
  elemento.style.display = "block";

  clearTimeout(window.avisoTimer);
  window.avisoTimer = setTimeout(() => {
    elemento.style.display = "none";
  }, 3000);
}

function entrar() {
  aviso("Área de login: será desenvolvida na próxima etapa.");
}

function cadastrar() {
  aviso("Cadastro de vendedores: disponível na próxima etapa.");
}

function verProdutos() {
  mostrarProdutos();
  document.getElementById("produtos").scrollIntoView({
    behavior: "smooth"
  });

  document.querySelectorAll(".filter").forEach(item => {
    item.classList.remove("active");
  });

  document.querySelector(".filter").classList.add("active");
}

function toggleMenu() {
  document.querySelector(".header nav").classList.toggle("open");
}

// Inicialização
mostrarProdutos();
