
const productForm = document.getElementById("productForm");
const productsList = document.getElementById("productsList");
const productCount = document.getElementById("productCount");
const mensagemProduto = document.getElementById("mensagemProduto");

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

function mensagem(texto, erro = false) {
  mensagemProduto.textContent = texto;
  mensagemProduto.style.color = erro ? "#c0392b" : "#168451";
}

async function carregarVendedor() {
  const response = await fetch("/api/me", {
    credentials: "same-origin"
  });

  if (response.status === 401) {
    window.location.replace("/login.html");
    return;
  }

  if (!response.ok) {
    throw new Error("Não foi possível verificar o vendedor.");
  }

  const data = await response.json();

  document.getElementById("sellerName").textContent =
    data.vendedor.nome;
}

function criarElemento(tag, texto, classe) {
  const elemento = document.createElement(tag);
  elemento.textContent = texto;
  if (classe) elemento.className = classe;
  return elemento;
}

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

async function carregarProdutos() {
  try {
    productsList.textContent = "Carregando produtos...";

    const data = await requisicao("/api/products");

    productsList.replaceChildren();

    productCount.textContent =
      `${data.produtos.length} produtos`;

    if (data.produtos.length === 0) {
      productsList.textContent =
        "Você ainda não cadastrou produtos.";
      return;
    }

    data.produtos.forEach(produto => {
      productsList.appendChild(montarProduto(produto));
    });

  } catch (error) {
    productsList.textContent = error.message;
  }
}

productForm.addEventListener("submit", async event => {
  event.preventDefault();

  const button = productForm.querySelector("button");
  button.disabled = true;
  button.textContent = "Salvando...";

  try {
    await requisicao("/api/products", {
      method: "POST",
      body: JSON.stringify({
        nome: document.getElementById("nomeProduto").value,
        descricao: document.getElementById("descricaoProduto").value,
        imagem_url: document.getElementById("imagemProduto").value,
        link_url: document.getElementById("linkProduto").value
      })
    });

    mensagem("Produto cadastrado com sucesso!");
    productForm.reset();

    await carregarProdutos();

  } catch (error) {
    mensagem(error.message, true);
  } finally {
    button.disabled = false;
    button.textContent = "Cadastrar produto";
  }
});

async function iniciarVitrine() {
  try {
    await carregarVendedor();
    await carregarProdutos();
  } catch (error) {
    productsList.textContent = error.message;
  }
}

iniciarVitrine();

