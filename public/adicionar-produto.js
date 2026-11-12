
const productForm = document.getElementById("productForm");
const mensagemProduto = document.getElementById("mensagemProduto");
const saveButton = document.getElementById("saveProductButton");

async function verificarVendedor() {
  const response = await fetch("/api/me", {
    credentials: "same-origin",
    cache: "no-store"
  });

  if (response.status === 401) {
    window.location.replace("/login.html");
    return;
  }

  if (!response.ok) {
    throw new Error("Não foi possível verificar seu acesso.");
  }

  const data = await response.json();

  document.getElementById("sellerName").textContent =
    data.vendedor.nome;
}

function mostrarMensagem(texto, erro = false) {
  mensagemProduto.textContent = texto;
  mensagemProduto.style.color = erro ? "#c0392b" : "#168451";
}

productForm.addEventListener("submit", async event => {
  event.preventDefault();

  saveButton.disabled = true;
  saveButton.textContent = "Salvando...";

  try {
    const response = await fetch("/api/products", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nome: document.getElementById("nomeProduto").value.trim(),
        descricao: document.getElementById("descricaoProduto").value.trim(),
        imagem_url: document.getElementById("imagemProduto").value.trim(),
        link_url: document.getElementById("linkProduto").value.trim()
      })
    });

    const data = await response.json();

    if (response.status === 401) {
      window.location.replace("/login.html");
      return;
    }

    if (!response.ok) {
      throw new Error(data.error || "Não foi possível cadastrar o produto.");
    }

    mostrarMensagem("Produto cadastrado com sucesso!");

    productForm.reset();

    setTimeout(() => {
      window.location.href = "/minha-vitrine";
    }, 1200);

  } catch (error) {
    mostrarMensagem(error.message, true);

  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Cadastrar produto";
  }
});

async function iniciarCadastro() {
  try {
    await verificarVendedor();
  } catch (error) {
    mostrarMensagem(error.message, true);
    saveButton.disabled = true;
  }
}

iniciarCadastro();
