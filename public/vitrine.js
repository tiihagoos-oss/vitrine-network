
const productsList = document.getElementById("productsList");
const productCount = document.getElementById("productCount");

const publicVitrineLink = document.getElementById("publicVitrineLink");
const copyVitrineLink = document.getElementById("copyVitrineLink");
const openVitrineLink = document.getElementById("openVitrineLink");
const vitrineLinkMessage = document.getElementById("vitrineLinkMessage");

let enderecoVitrine = "";

async function requisicao(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (response.status === 401) {
    window.location.replace("/login.html");
    throw new Error("Faça login novamente.");
  }

  if (!response.ok) {
    throw new Error(data.error || "Erro na operação.");
  }

  return data;
}

// CARREGAR VENDEDOR
async function carregarVendedor() {
  const response = await fetch("/api/me", {
    credentials: "same-origin",
    cache: "no-store"
  });

  if (response.status === 401) {
    window.location.replace("/login.html");
    return;
  }

  if (!response.ok) {
    throw new Error("Não foi possível verificar o vendedor.");
  }

  const data = await response.json();
  const vendedor = data.vendedor;

  document.getElementById("sellerName").textContent =
    vendedor.nome;

  if (!vendedor.slug) {
    publicVitrineLink.value = "";

    vitrineLinkMessage.textContent =
      "Seu endereço público ainda não foi criado.";

    return;
  }

  enderecoVitrine =
    `${window.location.origin}/vitrine/${encodeURIComponent(vendedor.slug)}`;

  publicVitrineLink.value = enderecoVitrine;

  copyVitrineLink.disabled = false;
  openVitrineLink.disabled = false;

  vitrineLinkMessage.textContent =
    "Sua vitrine está pronta para ser compartilhada!";
}

// COPIAR LINK
copyVitrineLink.addEventListener("click", async () => {
  if (!enderecoVitrine) return;

  try {
    await navigator.clipboard.writeText(enderecoVitrine);

    vitrineLinkMessage.textContent =
      "Link copiado! Compartilhe sua vitrine.";

    vitrineLinkMessage.style.color = "#168451";

    copyVitrineLink.textContent = "Link copiado!";

    setTimeout(() => {
      copyVitrineLink.textContent = "Copiar link";
    }, 2000);

  } catch (error) {
    publicVitrineLink.select();

    const copiou = document.execCommand("copy");

    vitrineLinkMessage.textContent = copiou
      ? "Link copiado com sucesso!"
      : "Selecione e copie o endereço manualmente.";
  }
});

// VISUALIZAR VITRINE
openVitrineLink.addEventListener("click", () => {
  if (!enderecoVitrine) return;

  window.open(
    enderecoVitrine,
    "_blank",
    "noopener,noreferrer"
  );
});

// CRIAR ELEMENTOS DE TEXTO
function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);

  elemento.textContent = texto;

  if (classe) {
    elemento.className = classe;
  }

  return elemento;
}

// MONTAR CARTÃO DO PRODUTO
function montarProduto(produto) {
  const card = document.createElement("article");
  card.className = "product-card";

  if (produto.imagem_url) {
    const imagem = document.createElement("img");

    imagem.src = produto.imagem_url;
    imagem.alt = produto.nome;
    imagem.loading = "lazy";
    imagem.referrerPolicy = "no-referrer";
    imagem.onerror = () => imagem.remove();

    card.appendChild(imagem);
  }

  card.appendChild(
    criarElemento("h3", produto.nome)
  );

  if (produto.descricao) {
    card.appendChild(
      criarElemento("p", produto.descricao)
    );
  }

  const link = document.createElement("a");

  link.href = produto.link_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ver produto ↗";
  link.className = "product-link";

  card.appendChild(link);

  // EXCLUIR PRODUTO
  const excluir = document.createElement("button");

  excluir.type = "button";
  excluir.textContent = "Excluir produto";
  excluir.className = "delete-product";

  excluir.addEventListener("click", async () => {
    if (!confirm("Deseja realmente excluir este produto?")) {
      return;
    }

    excluir.disabled = true;

    try {
      await requisicao(`/api/products/${produto.id}`, {
        method: "DELETE"
      });

      await carregarProdutos();

    } catch (error) {
      alert(error.message);
      excluir.disabled = false;
    }
  });

  card.appendChild(excluir);

  return card;
}

// CARREGAR PRODUTOS DO VENDEDOR
async function carregarProdutos() {
  try {
    productsList.textContent = "Carregando produtos...";

    const data = await requisicao("/api/products");

    productsList.replaceChildren();

    productCount.textContent =
      `${data.produtos.length} produtos`;

    if (data.produtos.length === 0) {
      productsList.textContent =
        "Você ainda não cadastrou produtos. Clique em Adicionar produto para começar.";

      return;
    }

    data.produtos.forEach(produto => {
      productsList.appendChild(
        montarProduto(produto)
      );
    });

  } catch (error) {
    productsList.textContent = error.message;
  }
}

// INICIAR PAINEL
async function iniciarVitrine() {
  try {
    await carregarVendedor();
    await carregarProdutos();

  } catch (error) {
    productsList.textContent = error.message;
  }
}

iniciarVitrine();
