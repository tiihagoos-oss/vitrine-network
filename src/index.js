
const SESSION_DAYS = 7;
const PASSWORD_ITERATIONS = 10000;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers
    }
  });
}

function bytesToHex(bytes) {
  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function base64url(bytes) {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hashToken(token) {
  const data = new TextEncoder().encode(token);
  return bytesToHex(await crypto.subtle.digest("SHA-256", data));
}

async function hashPassword(password, salt) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: PASSWORD_ITERATIONS,
      hash: "SHA-256"
    },
    key,
    256
  );

  return bytesToHex(bits);
}

function getCookie(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  const item = cookie.split(";").map(v => v.trim())
    .find(v => v.startsWith(name + "="));
  return item ? item.substring(name.length + 1) : null;
}

function sessionCookie(token) {
  return `vn_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`;
}

function clearCookie() {
  return "vn_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
}

async function createSession(env, vendedorId) {
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = base64url(tokenBytes);
  const tokenHash = await hashToken(token);
  const expires = Math.floor(Date.now() / 1000) + SESSION_DAYS * 86400;

  await env.DB.prepare(`
    INSERT INTO sessoes (vendedor_id, token_hash, expira_em)
    VALUES (?, ?, ?)
  `).bind(vendedorId, tokenHash, expires).run();

  return token;
}

async function currentUser(request, env) {
  const token = getCookie(request, "vn_session");
  if (!token) return null;

  const tokenHash = await hashToken(token);
  const now = Math.floor(Date.now() / 1000);

  const result = await env.DB.prepare(`
    SELECT v.id, v.nome, v.email
    FROM sessoes s
    JOIN vendedores v ON v.id = s.vendedor_id
    WHERE s.token_hash = ?
      AND s.expira_em > ?
      AND v.ativo = 1
    LIMIT 1
  `).bind(tokenHash, now).first();

  return result || null;
}

async function handleAPI(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  if (method === "GET" && path === "/api/status") {
    const result = await env.DB.prepare(`
      SELECT name FROM sqlite_master
      WHERE type = 'table' ORDER BY name
    `).all();

    return json({
      status: "Conectado!",
      application: "Vitrine Network",
      tables: result.results
    });
  }

  if (method === "POST" &&
      ["/api/register", "/api/login", "/api/logout"].includes(path)) {
    const origin = request.headers.get("Origin");
    if (origin && origin !== url.origin) {
      return json({ error: "Origem não permitida." }, 403);
    }
  }

  if (method === "POST" && path === "/api/register") {
    let data;
    try {
      data = await request.json();
    } catch {
      return json({ error: "Dados inválidos." }, 400);
    }

    const nome = String(data.nome || "").trim();
    const email = String(data.email || "").trim().toLowerCase();
    const senha = String(data.senha || "");

    if (nome.length < 2 || nome.length > 100) {
      return json({ error: "Informe um nome válido." }, 400);
    }

    if (email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: "Informe um e-mail válido." }, 400);
    }

    if (senha.length < 10 || senha.length > 128) {
      return json({
        error: "A senha deve ter entre 10 e 128 caracteres."
      }, 400);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const senhaSalt = base64url(salt);
    const senhaHash = await hashPassword(senha, salt);

    try {
      const inserted = await env.DB.prepare(`
        INSERT INTO vendedores (nome, email, senha_hash, senha_salt)
        VALUES (?, ?, ?, ?)
      `).bind(nome, email, senhaHash, senhaSalt).run();



const vendedorId = inserted.meta.last_row_id;

const slugBase = nome
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "")
  .slice(0, 50) || "vendedor";

const slug = `${slugBase}-${vendedorId}`;

await env.DB.prepare(`
  UPDATE vendedores
  SET slug = ?
  WHERE id = ?
`).bind(slug, vendedorId).run();

const token = await createSession(env, vendedorId);


      

      return json({
        sucesso: true,
        mensagem: "Conta criada com sucesso!"
      }, 201, {
        "Set-Cookie": sessionCookie(token)
      });

      
    } catch (error) {
      if (String(error.message).toLowerCase().includes("unique")) {
        return json({ error: "Este e-mail já está cadastrado." }, 409);
      }
      return json({ error: "Não foi possível criar a conta." }, 500);
    }

    
  }

  if (method === "POST" && path === "/api/login") {
    let data;
    try {
      data = await request.json();
    } catch {
      return json({ error: "Dados inválidos." }, 400);
    }

    const email = String(data.email || "").trim().toLowerCase();
    const senha = String(data.senha || "");

    if (!email || !senha || email.length > 254 || senha.length > 128) {
      return json({ error: "Informe e-mail e senha." }, 400);
    }

    const vendedor = await env.DB.prepare(`
      SELECT id, nome, email, senha_hash, senha_salt
      FROM vendedores
      WHERE email = ? AND ativo = 1
      LIMIT 1
    `).bind(email).first();

    if (!vendedor) {
      return json({ error: "E-mail ou senha incorretos." }, 401);
    }

    let salt;
    try {
      const decoded = atob(
        vendedor.senha_salt.replace(/-/g, "+").replace(/_/g, "/") +
        "=".repeat((4 - vendedor.senha_salt.length % 4) % 4)
      );
      salt = Uint8Array.from(decoded, c => c.charCodeAt(0));
    } catch {
      return json({ error: "Não foi possível validar o acesso." }, 500);
    }

    const calculatedHash = await hashPassword(senha, salt);

    if (calculatedHash !== vendedor.senha_hash) {
      return json({ error: "E-mail ou senha incorretos." }, 401);
    }

    const token = await createSession(env, vendedor.id);

    return json({
      sucesso: true,
      mensagem: "Login realizado!"
    }, 200, {
      "Set-Cookie": sessionCookie(token)
    });
  }

  if (method === "GET" && path === "/api/me") {
    const user = await currentUser(request, env);
    if (!user) return json({ autenticado: false }, 401);

    return json({ autenticado: true, vendedor: user });
  }

  if (method === "POST" && path === "/api/logout") {
    const token = getCookie(request, "vn_session");

    if (token) {
      const tokenHash = await hashToken(token);
      await env.DB.prepare(
        "DELETE FROM sessoes WHERE token_hash = ?"
      ).bind(tokenHash).run();
    }

    return json({ sucesso: true }, 200, {
      "Set-Cookie": clearCookie()
    });
  }


  // LISTAR PRODUTOS DO VENDEDOR
  if (method === "GET" && path === "/api/products") {
    const user = await currentUser(request, env);

    if (!user) {
      return json({ error: "Faça login para continuar." }, 401);
    }

    const result = await env.DB.prepare(`
      SELECT id, nome, descricao, imagem_url, link_url, ativo, criado_em
      FROM produtos
      WHERE vendedor_id = ?
      ORDER BY id DESC
    `).bind(user.id).all();

    return json({ produtos: result.results });
  }

  // CADASTRAR PRODUTO
  if (method === "POST" && path === "/api/products") {
    const origin = request.headers.get("Origin");

    if (origin && origin !== url.origin) {
      return json({ error: "Origem não permitida." }, 403);
    }

    const user = await currentUser(request, env);

    if (!user) {
      return json({ error: "Faça login para continuar." }, 401);
    }

    let data;

    try {
      data = await request.json();
    } catch {
      return json({ error: "Dados inválidos." }, 400);
    }

    const nome = String(data.nome || "").trim();
    const descricao = String(data.descricao || "").trim();
    const imagem = String(data.imagem_url || "").trim();
    const link = String(data.link_url || "").trim();

    if (nome.length < 2 || nome.length > 120) {
      return json({ error: "Nome do produto inválido." }, 400);
    }

    if (descricao.length > 500) {
      return json({ error: "Descrição muito longa." }, 400);
    }

    if (link.length > 2048 || imagem.length > 2048) {
      return json({ error: "Endereço muito longo." }, 400);
    }

    try {
      const linkURL = new URL(link);

      if (!["https:", "http:"].includes(linkURL.protocol)) {
        throw new Error("Link inválido.");
      }

      if (imagem) {
        const imagemURL = new URL(imagem);

        if (!["https:", "http:"].includes(imagemURL.protocol)) {
          throw new Error("Imagem inválida.");
        }
      }
    } catch {
      return json({
        error: "Informe links válidos começando com https:// ou http://."
      }, 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO produtos
      (vendedor_id, nome, descricao, imagem_url, link_url)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      user.id,
      nome,
      descricao,
      imagem || null,
      link
    ).run();

    return json({
      sucesso: true,
      mensagem: "Produto cadastrado!",
      id: result.meta.last_row_id
    }, 201);
  }

  // EXCLUIR PRODUTO
  if (method === "DELETE" && /^\/api\/products\/\d+$/.test(path)) {
    const origin = request.headers.get("Origin");

    if (origin && origin !== url.origin) {
      return json({ error: "Origem não permitida." }, 403);
    }

    const user = await currentUser(request, env);

    if (!user) {
      return json({ error: "Faça login para continuar." }, 401);
    }

    const id = Number(path.split("/").pop());

    const result = await env.DB.prepare(`
      DELETE FROM produtos
      WHERE id = ? AND vendedor_id = ?
    `).bind(id, user.id).run();

    if (!result.meta.changes) {
      return json({ error: "Produto não encontrado." }, 404);
    }

    return json({
      sucesso: true,
      mensagem: "Produto excluído."
    });
  }


  
  

  
  return json({ error: "Rota não encontrada." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/")) {
      try {
        return await handleAPI(request, env);
      } catch (error) {
        console.error("ERRO GERAL DO WORKER:", error);

        return json({
          error: "Erro interno no servidor.",
          codigo: "WORKER_ERROR",
          detalhe: String(error.message || error)
        }, 500);
      }
    }

    return env.ASSETS.fetch(request);
  }
};
