
async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Não foi possível concluir a operação.");
  }

  return data;
}

function mostrarMensagem(texto, erro = false) {
  const elemento = document.getElementById("mensagem");
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.style.color = erro ? "#c0392b" : "#168451";
}

const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = registerForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Criando conta...";

    try {
      const data = await api("/api/register", {
        method: "POST",
        body: JSON.stringify({
          nome: document.getElementById("nome").value,
          email: document.getElementById("email").value,
          senha: document.getElementById("senha").value
        })
      });

      mostrarMensagem(data.mensagem);
      window.location.href = "/dashboard.html";
    } catch (error) {
      mostrarMensagem(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Criar minha conta";
    }
  });
}

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = loginForm.querySelector("button");
    button.disabled = true;
    button.textContent = "Entrando...";

    try {
      const data = await api("/api/login", {
        method: "POST",
        body: JSON.stringify({
          email: document.getElementById("email").value,
          senha: document.getElementById("senha").value
        })
      });

      mostrarMensagem(data.mensagem);
      window.location.href = "/dashboard.html";
    } catch (error) {
      mostrarMensagem(error.message, true);
    } finally {
      button.disabled = false;
      button.textContent = "Entrar na minha conta";
    }
  });
}

async function verificarLogin() {
  const response = await fetch("/api/me", {
    credentials: "same-origin"
  });

  if (response.status === 401) {
    window.location.replace("/login.html");
    return;
  }

  if (!response.ok) {
    mostrarMensagem("Não foi possível verificar seu acesso.", true);
    return;
  }

  const data = await response.json();

  if (data.autenticado) {
    document.getElementById("sellerName").textContent =
      data.vendedor.nome;

    document.getElementById("sellerEmail").textContent =
      data.vendedor.email;
  }
}

if (document.getElementById("sellerName")) {
  verificarLogin();
}

const logoutButton = document.getElementById("logoutButton");

if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    logoutButton.disabled = true;

    try {
      await api("/api/logout", { method: "POST" });
      window.location.replace("/login.html");
    } catch (error) {
      mostrarMensagem(error.message, true);
      logoutButton.disabled = false;
    }
  });
}
