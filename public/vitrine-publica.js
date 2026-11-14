
const myProducts = document.getElementById("myProducts");
const partnerProducts = document.getElementById("partnerProducts");
const sellerName = document.getElementById("sellerName");

let visitanteLogado = false;

// INICIAIS DO VENDEDOR
function gerarIniciais(nome) {
  return String(nome || "Vendedor")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(parte => parte.charAt(0).toUpperCase())
    .join("");
}

// CARREGAR PERFIL
function carregarPerfil(vendedor) {
  const nome = vendedor.nome_exibicao || vendedor.nome;
  const avatar = document.getElementById("profileAvatar");
  const capa = document.getElementById("profileCover");
  const bio = document.getElementById("sellerBio");

  sellerName.textContent = nome;

  bio.textContent = vendedor.bio ||
    "Confira meus produtos e ofertas!";

  // FOTO DE PERFIL
  if (vendedor.foto_perfil) {
    avatar.replaceChildren();

    const imagem = document.createElement("img");
    imagem.src = vendedor.foto_perfil;
    imagem.alt = `Foto de ${nome}`;
    imagem.onerror = () => {
      avatar.textContent = gerarIniciais(nome);
    };

    avatar.appendChild(imagem);
  } else {
    avatar.textContent = gerarIniciais(nome);
  }

  // FOTO DE CAPA
  if (vendedor.foto_capa) {
    capa.style.backgroundImage =
      `url("${vendedor.foto_capa.replace(/["\\]/g, "")}")`;

    capa.classList.add("has-cover");
  }

  document.title = `${nome} | Vitrine Network`;
}

// MONTAR CARTÃO DO PRODUTO
function criarCard(produto, parceiro = false) {
  const card = document.createElement("article");
  card.className = "public-card";

if (parceiro) {
  const label = document.createElement("span");
  label.className = "partner-label";

  label.append("PARCEIRO: ");

  const linkVendedor = document.createElement("a");

  linkVendedor.textContent =
    produto.vendedor_nome || "Vendedor";

  linkVendedor.href =
    `/vitrine/${encodeURIComponent(produto.vendedor_slug)}`;

  linkVendedor.addEventListener("click", (event) => {
    if (!visitanteLogado) {
      event.preventDefault();

      window.open(
        linkVendedor.href,
        "_blank",
        "noopener,noreferrer"
      );
    }
  });

  label.appendChild(linkVendedor);
  card.appendChild(label);
}

  if (produto.imagem_url) {
    const imagem = document.createElement("img");

    imagem.src = produto.imagem_url;
    imagem.alt = produto.nome;
    imagem.loading = "lazy";
    imagem.referrerPolicy = "no-referrer";
    imagem.onerror = () => imagem.remove();

    card.appendChild(imagem);
  }

  const nome = document.createElement("h3");
  nome.textContent = produto.nome;
  card.appendChild(nome);

  if (produto.descricao) {
    const descricao = document.createElement("p");
    descricao.textContent = produto.descricao;
    card.appendChild(descricao);
  }

  const link = document.createElement("a");
  link.href = produto.link_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ver produto ↗";

  card.appendChild(link);

  return card;
}

// CARREGAR VITRINE PÚBLICA
async function carregarVitrine() {
  try {

// VERIFICAR SE O VISITANTE ESTÁ LOGADO
try {
  const sessao = await fetch("/api/me", {
    credentials: "same-origin",
    cache: "no-store"
  });

  visitanteLogado = sessao.ok;
} catch (error) {
  visitanteLogado = false;
}

    
    const slug = window.location.pathname
      .split("/")
      .filter(Boolean)
      .pop();

    if (!slug || slug === "vitrine") {
      throw new Error("Endereço da vitrine inválido.");
    }

    const response = await fetch(
      `/api/vitrine/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Vitrine não encontrada.");
    }

    // PERFIL DO VENDEDOR
    carregarPerfil(data.vendedor);

    // PRODUTOS
    const produtos = Array.isArray(data.produtos)
      ? data.produtos
      : [];

    const parceiros = Array.isArray(data.parceiros)
      ? data.parceiros
      : [];

    myProducts.replaceChildren();
    partnerProducts.replaceChildren();

    if (produtos.length === 0) {
      myProducts.textContent =
        "Este vendedor ainda não cadastrou produtos.";
    } else {
      produtos.forEach(produto => {
        myProducts.appendChild(criarCard(produto));
      });
    }

    if (parceiros.length === 0) {
      partnerProducts.textContent =
        "Ainda não há produtos de parceiros.";
    } else {
      parceiros.forEach(produto => {
        partnerProducts.appendChild(
          criarCard(produto, true)
        );
      });
    }

  } catch (error) {
    document.querySelector("main").innerHTML = "";

    const mensagem = document.createElement("h2");
    mensagem.textContent = error.message;
    mensagem.className = "error-message";

    document.querySelector("main").appendChild(mensagem);
  }
}

carregarVitrine();
