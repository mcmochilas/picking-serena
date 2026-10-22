// Picking Serena · integração Magazord (e-commerce)
//  Administrador (JWT):  {action:"config", url, token, senha}  -> guarda as credenciais no servidor
//                        {action:"status"}                      -> mostra se está configurado (sem revelar a senha)
//                        {action:"test"}                        -> testa a conexão e resume os pedidos recentes
//                        {action:"sync"}                        -> importa agora
//  Interno (x-push-secret): {action:"sync"}                     -> importação automática (agendada a cada 2 min)
//                           {action:"probe"|"meta"}             -> estrutura dos campos (sem dados pessoais) para o mapeamento
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

/* ================== Importação dos pedidos ================== */
const SITUACAO_IMPORTAR = 5;             // Crédito e Cadastro Aprovados
const IGNORAR_CANAL = /full/i;           // Mercado Livre Full: sai do armazém do Mercado Livre
const eanNorm = (e: unknown) => { let s = String(e ?? "").replace(/\D/g, ""); while (s.length > 13 && s.startsWith("0")) s = s.slice(1); return s; };
const toMs = (d: unknown) => { const t = Date.parse(String(d || "").replace(" ", "T").replace(/([+-]\d\d)$/, "$1:00")); return isNaN(t) ? Date.now() : t; };

async function productIndex() {
  const all: any[] = []; let from = 0;
  for (;;) { const { data, error } = await sb.from("products").select("id,data").range(from, from + 999); if (error) throw error; all.push(...data); if (data.length < 1000) break; from += 1000; }
  const byEan = new Map<string, any>(), byId = new Map<string, any>();
  for (const p of all) { byId.set(p.id, p); const e = eanNorm(p.data?.ean); if (e) byEan.set(e, p); }
  return { byEan, byId };
}
function mapOrder(d: any, idx: { byEan: Map<string, any>; byId: Map<string, any> }) {
  const rastreios = (d.arrayPedidoRastreio || []).filter((r: any) => r && typeof r === "object");
  const r0 = rastreios[0] || {};
  const items = new Map<string, any>();
  for (const r of rastreios) for (const it of (r.pedidoItem || [])) {
    if (!it || typeof it !== "object") continue;
    const sku = String(it.produtoDerivacaoCodigo || ""), ean = eanNorm(it.ean);
    // produto do Picking Serena: pelo EAN (sem o zero da frente) ou pelo início do código (13088-001-U -> 13088)
    const p = (ean && idx.byEan.get(ean)) || idx.byId.get(sku) || idx.byId.get(sku.split("-")[0]);
    const code = p ? p.id : (sku || ean || String(it.id));
    const q = Number(it.quantidade) || 0;
    const cur = items.get(code);
    if (cur) { cur.qty += q; continue; }
    items.set(code, { code, name: p?.data?.name || [it.produtoNome, it.produtoDerivacaoNome].filter(Boolean).join(" · "), ean: p?.data?.ean || ean,
      un: "UN", qty: q, price: Number(it.valorUnitario) || 0, loc: p?.data?.loc || "", qtyEnc: 0, eta: "", sku, ...(p ? {} : { semCadastro: true }) });
  }
  return {
    id: "MZ-" + d.id, num: String(d.codigo || d.id), mzId: d.id, codigoMarketplace: d.codigoMarketplace || "",
    client: d.pessoaNome || d.nomeDestinatario || "", city: d.cidadeNome || "", obs: "",
    canal: "ecommerce", origem: d.lojaDoMarketplaceNome || d.marketplaceNome || "Site",
    transportadora: r0.transportadoraNome || "", servico: r0.transportadoraServicoDescricao || "",
    mode: "total", v2: true, remessa: 1, status: "aguardando", items: [...items.values()],
    createdAt: toMs(d.dataHora), importedAt: Date.now(), mzSituacao: d.pedidoSituacao, createdBy: "",
  };
}
async function patchOrder(id: string, data: any, patch: Record<string, unknown>) {
  await sb.from("orders").update({ data: { ...data, ...patch }, updated_at: new Date().toISOString() }).eq("id", id);
}
async function sync() {
  const t0 = Date.now(), idx = await productIndex();
  const fetched: any[] = [];
  for (let page = 1; page <= 5; page++) {
    const r = await mz(`/v2/site/pedido?limit=100&page=${page}&orderDirection=desc&situacao=${SITUACAO_IMPORTAR}`);
    if (r.status >= 400) throw new Error(`A Magazord respondeu erro ${r.status}`);
    fetched.push(...listOf(r.body));
    if (!(r.body as any)?.data?.has_more) break;
  }
  const eligible = fetched.filter((o) => !IGNORAR_CANAL.test(String(o.lojaDoMarketplaceNome || "")));
  const ids = eligible.map((o) => "MZ-" + o.id);
  const have = new Set<string>();
  for (let i = 0; i < ids.length; i += 200) { const { data } = await sb.from("orders").select("id").in("id", ids.slice(i, i + 200)); (data || []).forEach((x) => have.add(x.id)); }
  let imported = 0, cancelled = 0; const errors: string[] = [];
  for (const o of eligible) {
    if (have.has("MZ-" + o.id)) continue;
    try {
      const d = await mz(`/v2/site/pedido/${encodeURIComponent(String(o.codigo))}`);
      const det = (d.body as any)?.data ?? d.body;
      if (d.status >= 400 || !det || typeof det !== "object") throw new Error("detalhe " + d.status);
      const ord = mapOrder(det, idx);
      if (!ord.items.length) continue;
      const { error } = await sb.from("orders").insert({ id: ord.id, data: ord });
      if (error) { if (!/duplicate|unique/i.test(error.message)) throw error; } else imported++;
    } catch (e) { errors.push(`${o.codigo}: ${(e as Error).message}`); }
  }
  // pedidos do e-commerce ainda na fila que saíram da situação 5: cancelados saem da fila
  const elig = new Set(ids);
  const { data: active } = await sb.from("orders").select("id,data").like("id", "MZ-%").filter("data->>status", "in", "(aguardando,separando)");
  for (const row of (active || [])) {
    if (elig.has(row.id)) continue;
    try {
      const d = await mz(`/v2/site/pedido/${encodeURIComponent(String(row.data.num))}`);
      const det = (d.body as any)?.data; if (!det) continue;
      const sit = Number(det.pedidoSituacao), desc = det.pedidoSituacaoDescricao || "";
      if (sit === 2) {
        cancelled++;
        if (row.data.status === "aguardando") await patchOrder(row.id, row.data, { status: "excluido", deletedAt: Date.now(), deletedBy: "", deleteReason: "Cancelado na Magazord", mzSituacao: sit });
        else await patchOrder(row.id, row.data, { mzCancelado: true, mzSituacao: sit, mzSituacaoDesc: desc });
      } else if (row.data.mzSituacao !== sit) await patchOrder(row.id, row.data, { mzSituacao: sit, mzSituacaoDesc: desc });
    } catch (e) { errors.push(`${row.data.num}: ${(e as Error).message}`); }
  }
  const info = { lastRun: Date.now(), ms: Date.now() - t0, found: eligible.length, full: fetched.length - eligible.length, imported, cancelled, errors: errors.slice(0, 5) };
  await sb.from("config").upsert({ id: "magazord_sync", data: info, updated_at: new Date().toISOString() }, { onConflict: "id" });
  return info;
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
    if (b.action === "sync") return json({ ok: true, ...(await sync()) });
    if (b.action === "meta" && internal) { // diagnóstico: paginação e filtros, sem dados pessoais
      const out: Record<string, unknown> = {};
      for (const q of (b.queries || ["?limit=5&page=1"])) {
        const r = await mz("/v2/site/pedido" + q); const body: any = r.body; const d = body?.data;
        const meta = d && typeof d === "object" && !Array.isArray(d) ? Object.fromEntries(Object.entries(d).filter(([, v]) => !Array.isArray(v))) : null;
        out[q] = { status: r.status, meta, rows: listOf(body).map((o: any) => [o.id, o.dataHora, o.pedidoSituacao, o.pedidoSituacaoDescricao, o.lojaDoMarketplaceNome]), err: r.status >= 400 ? (typeof body === "string" ? body.slice(0, 200) : body?.message || body?.error) : undefined };
      }
      return json(out);
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
