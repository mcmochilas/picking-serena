// Picking Serena · integração Magazord (e-commerce)
//  Administrador (JWT):  {action:"config", url, token, senha}  -> guarda as credenciais no servidor
//                        {action:"status"}                      -> mostra se está configurado (sem revelar a senha)
//                        {action:"test"}                        -> testa a conexão e resume os pedidos recentes
//  Interno (x-push-secret): {action:"probe"}                    -> estrutura dos campos (sem dados pessoais) para o mapeamento
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const URL_ = Deno.env.get("SUPABASE_URL")!;
let KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!KEY) { try { KEY = Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"))[0] as string; } catch { /* */ } }
const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });

async function getSecret(name: string) { const { data } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle(); return data?.value as string | undefined; }
async function setSecret(name: string, value: string) { const { error } = await sb.from("app_secrets").upsert({ name, value }, { onConflict: "name" }); if (error) throw error; }

function baseUrl(u: string) {
  let s = String(u || "").trim().replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  s = s.replace(/\/api(\/.*)?$/i, "");
  return s;
}
async function creds() {
  const url = await getSecret("magazord_url"), token = await getSecret("magazord_token"), senha = await getSecret("magazord_senha");
  if (!url || !token || !senha) throw new Error("Integração Magazord não configurada.");
  return { url: baseUrl(url), auth: "Basic " + btoa(`${token}:${senha}`) };
}
async function mz(path: string) {
  const c = await creds();
  const r = await fetch(c.url + "/api" + path, { headers: { Authorization: c.auth, Accept: "application/json" } });
  const text = await r.text(); let body: unknown = text;
  try { body = JSON.parse(text); } catch { /* texto */ }
  return { status: r.status, body };
}

// Estrutura sem dados pessoais: mostra só nomes de campos e tipos; valores apenas de campos "de classificação"
const SHOW = /situac|status|transport|frete|entrega|servico|loja|origem|marketplace|canal|plataforma|tipo|forma|codigo$|^id$|sku|ean|gtin|quantidade|qtd|^data|deposito|nome$/i;
const PII = /pessoa|cliente|cpf|cnpj|email|telefone|fone|celular|endereco|logradouro|cep|bairro|numero|complemento|documento|rg|nascimento|ip/i;
function shape(v: unknown, key = "", depth = 0, path = ""): unknown {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v)) return v.length ? [shape(v[0], key, depth + 1, path + "[]"), `(${v.length} itens)`] : [];
  if (typeof v === "object") {
    if (depth > 5) return "{…}";
    const o: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) o[k] = PII.test(path + "." + k) && typeof x !== "object" ? `<${typeof x}>` : shape(x, k, depth + 1, path + "." + k);
    return o;
  }
  if (typeof v === "string") return SHOW.test(key) && !PII.test(path) && v.length <= 80 ? v : `<string>`;
  return SHOW.test(key) && !PII.test(path) ? v : `<${typeof v}>`;
}
function listOf(body: any): any[] {
  const d = body?.data ?? body;
  if (Array.isArray(d)) return d;
  for (const k of ["items", "itens", "pedidos", "data", "results", "registros"]) if (Array.isArray(d?.[k])) return d[k];
  return [];
}
// valores distintos de campos de classificação nos pedidos recentes (para o administrador ver situações, transportadoras e lojas)
function distinct(list: any[]) {
  const out: Record<string, Record<string, number>> = {};
  const walk = (v: any, path: string, depth: number) => {
    if (v == null || depth > 3) return;
    if (Array.isArray(v)) return;
    if (typeof v === "object") { for (const [k, x] of Object.entries(v)) walk(x, path ? path + "." + k : k, depth + 1); return; }
    const leaf = path.split(".").pop() || "";
    if (/situac|status|transport|loja|origem|marketplace|canal|plataforma|servico|formaEntrega|frete/i.test(path) && !PII.test(path) && String(v).length <= 80 && !/^(id|codigo)$/i.test(leaf) || /(situacao|loja|transportadora|marketplace|origem).*(nome|descricao|id|codigo)$/i.test(path)) {
      (out[path] ||= {})[String(v)] = ((out[path] ||= {})[String(v)] || 0) + 1;
    }
  };
  list.forEach((o) => walk(o, "", 0));
  return out;
}

async function isAdmin(req: Request) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  const { data: u } = await sb.auth.getUser(token);
  if (!u?.user) return false;
  const { data: me } = await sb.from("profiles").select("role,active").eq("id", u.user.id).maybeSingle();
  return me?.role === "admin" && me?.active !== false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const b = await req.json().catch(() => ({}));
    const internal = req.headers.get("x-push-secret") && req.headers.get("x-push-secret") === await getSecret("push_webhook");
    if (!internal && !(await isAdmin(req))) return json({ error: "Só o Administrador pode acessar a integração." }, 403);

    if (b.action === "config") {
      if (!b.url) return json({ error: "Informe o endereço do painel Magazord." }, 400);
      await setSecret("magazord_url", baseUrl(b.url));
      if (b.token) await setSecret("magazord_token", String(b.token).trim());
      if (b.senha) await setSecret("magazord_senha", String(b.senha).trim());
      return json({ ok: true });
    }
    if (b.action === "status") {
      const url = await getSecret("magazord_url"), token = await getSecret("magazord_token"), senha = await getSecret("magazord_senha");
      return json({ configured: !!(url && token && senha), url: url || "", token: token ? token.slice(0, 4) + "…" : "", senha: !!senha });
    }
    if (b.action === "test" || b.action === "probe") {
      const q = b.query || "?limit=50&page=1";
      const r = await mz("/v2/site/pedido" + q);
      if (r.status === 401 || r.status === 403) return json({ ok: false, error: "A Magazord recusou o token/senha (erro " + r.status + "). Confira as credenciais e as permissões do token para /api/v2/site/pedido." });
      if (r.status >= 400) return json({ ok: false, error: `A Magazord respondeu erro ${r.status}.`, body: typeof r.body === "string" ? r.body.slice(0, 300) : shape(r.body) });
      const list = listOf(r.body);
      const res: Record<string, unknown> = { ok: true, count: list.length, distinct: distinct(list) };
      if (b.action === "probe") {
        res.top = shape(typeof r.body === "object" && r.body ? { ...(r.body as Record<string, unknown>), data: undefined } : r.body);
        res.list0 = shape(list[0]);
        const id = list[0]?.codigo ?? list[0]?.id;
        if (id != null) { const d = await mz(`/v2/site/pedido/${encodeURIComponent(String(id))}`); res.detailStatus = d.status; res.detail = shape((d.body as any)?.data ?? d.body); }
      }
      return json(res);
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
