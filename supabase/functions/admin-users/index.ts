// Picking Serena · gestão de usuários pelo Administrador (sem depender de e-mail)
//  POST {action:"create", name, login, password, role} -> cria a conta já confirmada e com nível
//  POST {action:"password", id, password}             -> define uma nova senha para a pessoa
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const URL_ = Deno.env.get("SUPABASE_URL")!;
let KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!KEY) { try { KEY = Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"))[0] as string; } catch { /* */ } }
const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const ROLES = ["admin", "supervisor", "comercial", "estoque", "separador", "conferente", "painel"];
const USER_DOMAIN = "usuarios.picking-serena.invalid"; // domínio reservado: nunca recebe e-mail
const toEmail = (login: string) => {
  const l = String(login || "").trim().toLowerCase();
  if (l.includes("@")) return l;
  const slug = l.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9._-]+/g, ".").replace(/^\.+|\.+$/g, "");
  return slug ? `${slug}@${USER_DOMAIN}` : "";
};
const PT: [RegExp, string][] = [
  [/already (been )?registered|already exists/i, "Já existe uma conta com esse e-mail/usuário."],
  [/Password should|weak/i, "A senha precisa ter pelo menos 6 caracteres."],
  [/invalid.*email|email.*invalid/i, "E-mail/usuário inválido."],
];
const pt = (m: string) => (PT.find(([r]) => r.test(m))?.[1]) || m;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) return json({ error: "Faça login novamente." }, 401);
    const { data: me } = await sb.from("profiles").select("role,active").eq("id", u.user.id).maybeSingle();
    if (me?.role !== "admin" || me?.active === false) return json({ error: "Só o Administrador pode fazer isso." }, 403);

    const b = await req.json().catch(() => ({}));
    if (b.action === "create") {
      const name = String(b.name || "").trim(), email = toEmail(b.login), password = String(b.password || "");
      if (!name) return json({ error: "Informe o nome." }, 400);
      if (!email) return json({ error: "Informe o e-mail ou um nome de usuário." }, 400);
      if (password.length < 6) return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
      if (!ROLES.includes(b.role)) return json({ error: "Nível de acesso inválido." }, 400);
      const { data, error } = await sb.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { name } });
      if (error) return json({ error: pt(error.message) }, 400);
      const id = data.user!.id;
      // o gatilho do banco cria o perfil; aqui definimos nome e nível
      const { error: e2 } = await sb.from("profiles").upsert({ id, email, name, role: b.role, active: true }, { onConflict: "id" });
      if (e2) return json({ error: e2.message }, 500);
      return json({ id, email, login: email.endsWith("@" + USER_DOMAIN) ? email.split("@")[0] : email });
    }
    if (b.action === "password") {
      const password = String(b.password || "");
      if (password.length < 6) return json({ error: "A senha precisa ter pelo menos 6 caracteres." }, 400);
      const { error } = await sb.auth.admin.updateUserById(String(b.id), { password });
      if (error) return json({ error: pt(error.message) }, 400);
      return json({ ok: true });
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
