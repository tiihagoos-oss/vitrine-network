
const myProducts = document.getElementById("myProducts");
const partnerProducts = document.getElementById("partnerProducts");
const sellerName = document.getElementById("sellerName");

function criarCard(produto, parceiro = false) {
  const card = document.createElement("article");
  card.className = "public-card";

  if (parceiro) {
    const label = document.createElement("span");
    label.className = "partner-label";
    label.textContent = `PARCEIRO: ${produto.vendedor_nome}`;
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

async function carregarVitrine() {
  try {
    const slug = window.location.pathname.split("/").filter(Boolean).pop();

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

    sellerName.textContent = `Vitrine de ${data.vendedor.nome}`;

    myProducts.replaceChildren();
    partnerProducts.replaceChildren();

    if (data.produtos.length === 0) {
      myProducts.textContent = "Este vendedor ainda não cadastrou produtos.";
    } else {
      data.produtos.forEach(produto => {
        myProducts.appendChild(criarCard(produto));
      });
    }

    if (data.parceiros.length === 0) {
      partnerProducts.textContent = "Ainda não há produtos de parceiros.";
    } else {
      data.parceiros.forEach(produto => {
        partnerProducts.appendChild(criarCard(produto, true));
      });
    }

    document.title = `Vitrine de ${data.vendedor.nome} | Vitrine Network`;

  } catch (error) {
    document.querySelector("main").innerHTML = "";

    const mensagem = document.createElement("h2");
    mensagem.textContent = error.message;
    mensagem.className = "error-message";

    document.querySelector("main").appendChild(mensagem);
  }
}

carregarVitrine();
