// Picking Serena · envio de notificações push
//  GET  ?key            -> chave pública (VAPID) para o celular se inscrever
//  POST {action:"test"} -> notificação de teste para o próprio usuário (precisa estar logado)
//  POST {order:{...}}   -> chamado pelo banco quando entra um pedido para separar (x-push-secret)
import webpush from "npm:web-push@3.6.7";
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const URL_ = Deno.env.get("SUPABASE_URL")!;
let KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!KEY) { try { KEY = Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"))[0] as string; } catch { /* */ } }
const sb = createClient(URL_, KEY, { auth: { persistSession: false } });

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "GET, POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const NOTIFY_ROLES = ["admin", "supervisor", "separador"];
const MODES: Record<string, string> = { total: "envio total", parcial: "envio parcial", aguarda: "aguarda encomenda" };

async function secret(name: string) {
  const { data } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  return data?.value as string | undefined;
}
let vapid: { publicKey: string; privateKey: string } | null = null;
async function getVapid() {
  if (vapid) return vapid;
  let pub = await secret("vapid_public"), priv = await secret("vapid_private");
  if (!pub || !priv) { // primeira vez: cria as chaves e guarda no banco
    const k = webpush.generateVAPIDKeys();
    await sb.from("app_secrets").upsert([{ name: "vapid_public", value: k.publicKey }, { name: "vapid_private", value: k.privateKey }], { onConflict: "name", ignoreDuplicates: true });
    pub = await secret("vapid_public"); priv = await secret("vapid_private");
  }
  vapid = { publicKey: pub!, privateKey: priv! };
  webpush.setVapidDetails("https://picking-serena.vercel.app", vapid.publicKey, vapid.privateKey);
  return vapid;
}

async function sendTo(userIds: string[], payload: Record<string, unknown>) {
  if (!userIds.length) return { sent: 0, failed: 0 };
  await getVapid();
  const { data: subs } = await sb.from("push_subscriptions").select("endpoint,p256dh,auth").in("user_id", userIds);
  let sent = 0, failed = 0; const errors: string[] = [];
  await Promise.all((subs || []).map(async (s) => {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600, urgency: "high" });
      sent++;
    } catch (e) {
      failed++; const code = (e as { statusCode?: number }).statusCode;
      errors.push(String(code || (e as Error).message));
      if (code === 404 || code === 410) await sb.from("push_subscriptions").delete().eq("endpoint", s.endpoint); // inscrição vencida
    }
  }));
  return { sent, failed, subs: subs?.length || 0, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    if (req.method === "GET") return json({ publicKey: (await getVapid()).publicKey });
    const body = await req.json().catch(() => ({}));

    if (body.action === "test") {
      const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
      const { data: u } = await sb.auth.getUser(token);
      if (!u?.user) return json({ error: "login necessário" }, 401);
      const r = await sendTo([u.user.id], { title: "Picking Serena", body: "Notificações ligadas. Você será avisado a cada novo pedido para separar.", tag: "teste", url: "/#expedicao" });
      return json(r);
    }

    if (body.action === "selftest") { // diagnóstico interno: criptografa e tenta enviar para um endereço falso
      if (req.headers.get("x-push-secret") !== await secret("push_webhook")) return json({ error: "não autorizado" }, 401);
      await getVapid();
      const fake = { endpoint: "https://push.invalid/x", keys: { p256dh: webpush.generateVAPIDKeys().publicKey, auth: btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(16)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") } };
      try { await webpush.sendNotification(fake, "{}", { TTL: 60 }); return json({ ok: true }); }
      catch (e) { return json({ reached: "envio", error: String((e as Error).message || e).slice(0, 200), key: !!KEY }); }
    }

    if (body.order) {
      if (req.headers.get("x-push-secret") !== await secret("push_webhook")) return json({ error: "não autorizado" }, 401);
      const o = body.order;
      const eco = o.canal === "ecommerce";
      const { data: people } = await sb.from("profiles").select("id,ecommerce").eq("active", true).in("role", NOTIFY_ROLES);
      // pedido do e-commerce: só avisa quem está liberado para separar e-commerce
      const ids = (people || []).filter((p) => !eco || p.ecommerce).map((p) => p.id as string).filter((id) => id !== o.createdBy);
      const r = await sendTo(ids, {
        title: eco ? `Novo pedido e-commerce · ${o.origem || "Site"}` : "Novo pedido para separar",
        body: eco ? `#${o.num}${o.transportadora ? ` · ${o.transportadora}` : ""}${o.refs ? ` · ${o.refs} ref.` : ""}`
                  : `#${o.num} · ${o.client}${o.refs ? ` · ${o.refs} ref.` : ""}${MODES[o.mode] ? ` · ${MODES[o.mode]}` : ""}`,
        tag: `pedido-${o.id}`, url: "/#expedicao",
      });
      return json(r);
    }
    return json({ error: "requisição inválida" }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
