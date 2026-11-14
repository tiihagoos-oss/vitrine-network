
const productsList = document.getElementById("productsList");
const productCount = document.getElementById("productCount");

const partnerProducts = document.getElementById("partnerProducts");

const publicVitrineLink = document.getElementById("publicVitrineLink");
const copyVitrineLink = document.getElementById("copyVitrineLink");
const openVitrineLink = document.getElementById("openVitrineLink");
const vitrineLinkMessage = document.getElementById("vitrineLinkMessage");

let enderecoVitrine = "";


// ELEMENTOS DE EDICAO DO PERFIL
const editProfileButton = document.getElementById("editProfileButton");
const editProfileForm = document.getElementById("editProfileForm");
const profileForm = document.getElementById("profileForm");
const cancelProfileEdit = document.getElementById("cancelProfileEdit");
const profileMessage = document.getElementById("profileMessage");

let perfilAtual = null;


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
  vendedor.nome_exibicao || vendedor.nome;

perfilAtual = vendedor;

const avatar = document.querySelector(
  ".social-profile .profile-avatar"
);

if (avatar) {
  avatar.replaceChildren();

  if (vendedor.foto_perfil) {
    const img = document.createElement("img");
    img.src = vendedor.foto_perfil;
    img.alt = "Foto do perfil";
    img.onerror = () => {
      avatar.textContent = vendedor.nome
        .split(/\s+/)
        .slice(0, 2)
        .map(p => p[0].toUpperCase())
        .join("");
    };
    avatar.appendChild(img);
  } else {
    avatar.textContent = vendedor.nome
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join("");
  }
}

const capa = document.querySelector(
  ".social-profile .profile-cover"
);

if (capa && vendedor.foto_capa) {
  capa.style.backgroundImage =
    `url("${vendedor.foto_capa.replace(/["\\]/g, "")}")`;
}

const bio = document.querySelector(
  ".social-profile .profile-information p"
);

if (bio && vendedor.bio) {
  bio.textContent = vendedor.bio;
}

  





  

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

function montarProduto(produto, parceiro = false) {
  const card = document.createElement("article");
  card.className = "product-card";

  // IDENTIFICAÇÃO DO VENDEDOR PARCEIRO
  if (parceiro) {
    const identificacao = document.createElement("div");
    identificacao.className = "partner-label";

    identificacao.appendChild(
      document.createTextNode("PARCEIRO: ")
    );

    const vendedor = document.createElement("a");

    vendedor.textContent =
      produto.vendedor_nome_exibicao ||
      produto.vendedor_nome ||
      "Vendedor";

    if (produto.vendedor_slug) {
      vendedor.href =
        `/vitrine/${encodeURIComponent(produto.vendedor_slug)}`;
    }

    identificacao.appendChild(vendedor);
    card.appendChild(identificacao);
  }

  // IMAGEM
  if (produto.imagem_url) {
    const imagem = document.createElement("img");

    imagem.src = produto.imagem_url;
    imagem.alt = produto.nome;
    imagem.loading = "lazy";
    imagem.referrerPolicy = "no-referrer";
    imagem.onerror = () => imagem.remove();

    card.appendChild(imagem);
  }

  // NOME
  card.appendChild(
    criarElemento("h3", produto.nome)
  );

  // DESCRIÇÃO
  if (produto.descricao) {
    card.appendChild(
      criarElemento("p", produto.descricao)
    );
  }

  // LINK DO PRODUTO
  const link = document.createElement("a");

  link.href = produto.link_url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.textContent = "Ver produto ↗";
  link.className = "product-link";

  card.appendChild(link);

  // EXCLUIR SOMENTE PRODUTOS PRÓPRIOS
  if (!parceiro) {
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
  }

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



// ======================================
// EDIÇÃO DO PERFIL DO VENDEDOR
// ======================================


async function preencherFormularioPerfil() {
  try {
    const data = await requisicao("/api/profile");
    const perfil = data.perfil;

    perfilAtual = perfil;

    document.getElementById("nomeExibicao").value =
      perfil.nome_exibicao || "";

    document.getElementById("bioPerfil").value =
      perfil.bio || "";

    document.getElementById("fotoPerfil").value =
      perfil.foto_perfil || "";

    document.getElementById("fotoCapa").value =
      perfil.foto_capa || "";

  } catch (error) {
    profileMessage.style.color = "#c0392b";
    profileMessage.textContent = error.message;
  }
}


editProfileButton.addEventListener("click", async () => {
  await preencherFormularioPerfil();

  editProfileForm.hidden = false;

  editProfileForm.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

cancelProfileEdit.addEventListener("click", () => {
  editProfileForm.hidden = true;
  profileMessage.textContent = "";
});

profileForm.addEventListener("submit", async event => {
  event.preventDefault();

  const button = profileForm.querySelector('button[type="submit"]');

  button.disabled = true;
  button.textContent = "Salvando...";

  profileMessage.textContent = "";

  try {
    const resultado = await requisicao("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        nome_exibicao: document.getElementById("nomeExibicao").value,
        bio: document.getElementById("bioPerfil").value,
        foto_perfil: document.getElementById("fotoPerfil").value,
        foto_capa: document.getElementById("fotoCapa").value
      })
    });

    profileMessage.style.color = "#168451";
    profileMessage.textContent =
      resultado.mensagem || "Perfil atualizado com sucesso!";

    // ATUALIZAR PERFIL NA TELA
    await carregarVendedor();

    editProfileForm.hidden = true;

  } catch (error) {
    profileMessage.style.color = "#c0392b";
    profileMessage.textContent = error.message;

  } finally {
    button.disabled = false;
    button.textContent = "Salvar alterações";
  }
});

// INICIAR PAINEL
iniciarVitrine();
