// Picking Serena · Lucas, o assistente do sistema
//  POST {action:"status"}                         -> {configured, model, kbUpdated} (qualquer usuário logado)
//  POST {action:"config", key?, model?}           -> grava a chave da API e o modelo (só Administrador)
//  POST {action:"chat", messages:[...], context}  -> resposta do Lucas
// A chave da API fica só no servidor (app_secrets) e nunca volta para o navegador.
import { createClient } from "npm:@supabase/supabase-js@2.117.3";

const URL_ = Deno.env.get("SUPABASE_URL")!;
let KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
if (!KEY) { try { KEY = Object.values(JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") || "{}"))[0] as string; } catch { /* */ } }
const sb = createClient(URL_, KEY, { auth: { persistSession: false, autoRefreshToken: false } });

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info", "Access-Control-Allow-Methods": "POST, OPTIONS" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...CORS, "Content-Type": "application/json" } });
const MODELS = ["claude-sonnet-5-5", "claude-haiku-5-5", "claude-opus-5-5"];
const DAILY_LIMIT = 150; // mensagens por pessoa por dia
const ROLE_T: Record<string, string> = { admin: "Administrador", supervisor: "Supervisor", comercial: "Comercial", compras: "Compras", estoque: "Estoque", separador: "Separador", conferente: "Conferente", painel: "Painel TV" };

async function secret(name: string) {
  const { data } = await sb.from("app_secrets").select("value").eq("name", name).maybeSingle();
  return data?.value as string | undefined;
}

const PERSONA = `Você é o Lucas, assistente virtual do Picking Serena, o sistema de separação, expedição, colmeias, compras e recebimento da Serena (CD Porto Belo).
Seu trabalho é tirar dúvidas dos funcionários sobre como usar o sistema, 24 horas por dia.

Como responder:
- Sempre em português do Brasil, de forma simples, gentil e direta, como um colega experiente explicando.
- Baseie-se SOMENTE no manual abaixo. Não invente telas, botões ou funções que não estejam nele. Se a resposta não estiver no manual, diga com sinceridade que não sabe e oriente a pessoa a falar com o Administrador do sistema.
- Use o nome exato das abas e botões em negrito (ex.: **Separados**, **Confirmar recebimento**).
- Para "como faço", responda em passos numerados curtos. Para dúvidas rápidas, responda em 1 a 3 frases.
- Leve em conta o nível de acesso da pessoa e a tela em que ela está (informados no contexto). Se ela não tiver acesso a uma função, explique quem tem e que o Administrador pode liberar.
- Se a pessoa mandar um print da tela, olhe a imagem com atenção, identifique a tela e os avisos que aparecem e explique o que fazer a partir dela.
- A mensagem pode ter vindo de um áudio transcrito: entenda erros de transcrição pelo contexto.
- Você não executa ações no sistema e não altera pedidos; você só orienta.
- Nunca peça nem aceite senhas, chaves ou dados de acesso.
- Assuntos fora do sistema: responda educadamente que você só ajuda com o Picking Serena.`;

type InMsg = { role: "user" | "assistant"; text?: string; images?: { media_type: string; data: string }[] };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: u } = await sb.auth.getUser(token);
    if (!u?.user) return json({ error: "Faça login novamente." }, 401);
    const { data: me } = await sb.from("profiles").select("role,roles,active,name").eq("id", u.user.id).maybeSingle();
    const roles: string[] = [me?.role, ...((me?.roles as string[]) || [])].filter(Boolean) as string[];
    if (!me || me.active === false || !roles.length) return json({ error: "Seu usuário não tem acesso ao sistema." }, 403);
    const b = await req.json().catch(() => ({}));

    if (b.action === "status") {
      const [k, m, kb] = await Promise.all([secret("anthropic_api_key"), secret("lucas_model"), sb.from("assistant_kb").select("updated_at").eq("id", "manual").maybeSingle()]);
      return json({ configured: !!k, model: m || MODELS[0], kbUpdated: kb.data?.updated_at || null, models: MODELS });
    }

    if (b.action === "config") {
      if (!roles.includes("admin")) return json({ error: "Só o Administrador pode configurar o Lucas." }, 403);
      const rows: { name: string; value: string }[] = [];
      if (typeof b.key === "string" && b.key.trim()) {
        const k = b.key.trim();
        if (!/^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k)) return json({ error: "Essa não parece uma chave da API da Anthropic (começa com sk-ant-)." }, 400);
        // testa a chave antes de salvar
        const t = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": k, "anthropic-version": "2023-06-01" } });
        if (t.status === 401 || t.status === 403) return json({ error: "A Anthropic recusou essa chave. Confira se ela está ativa." }, 400);
        rows.push({ name: "anthropic_api_key", value: k });
      }
      if (typeof b.model === "string" && b.model) {
        if (!MODELS.includes(b.model)) return json({ error: "Modelo inválido." }, 400);
        rows.push({ name: "lucas_model", value: b.model });
      }
      if (b.removeKey === true) { await sb.from("app_secrets").delete().eq("name", "anthropic_api_key"); }
      if (rows.length) { const { error } = await sb.from("app_secrets").upsert(rows, { onConflict: "name" }); if (error) return json({ error: error.message }, 500); }
      return json({ ok: true });
    }

    if (b.action === "chat") {
      const apiKey = await secret("anthropic_api_key");
      if (!apiKey) return json({ error: "O Lucas ainda não foi ativado. Peça ao Administrador para configurar em Usuários → Assistente Lucas." }, 503);
      const since = new Date(Date.now() - 24 * 3600e3).toISOString();
      const { count } = await sb.from("assistant_log").select("id", { count: "exact", head: true }).eq("user_id", u.user.id).gte("at", since);
      if ((count || 0) >= DAILY_LIMIT) return json({ error: "Você atingiu o limite de perguntas das últimas 24 horas. Tente mais tarde ou fale com o Administrador." }, 429);

      const model = (await secret("lucas_model")) || MODELS[0];
      const { data: kb } = await sb.from("assistant_kb").select("content").eq("id", "manual").maybeSingle();
      const manual = kb?.content || "(manual ainda não carregado)";
      const ctx = b.context || {};
      const contexto = `Contexto da conversa: pessoa = ${me.name || "usuário"}; níveis de acesso = ${roles.map((r) => ROLE_T[r] || r).join(" + ")}; tela atual = ${String(ctx.screen || "não informada").slice(0, 120)}; aparelho = ${ctx.device === "mobile" ? "celular" : "computador"}; data/hora = ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}.`;

      // últimas mensagens; imagens só nas 2 últimas mensagens do usuário (economia)
      const raw: InMsg[] = Array.isArray(b.messages) ? b.messages.slice(-16) : [];
      let imgBudget = 2;
      const msgs = raw.map((m, idx) => ({ m, idx })).reverse().map(({ m }) => {
        const content: unknown[] = [];
        if (m.role === "user" && Array.isArray(m.images) && imgBudget > 0) {
          imgBudget--;
          for (const im of m.images.slice(0, 3)) {
            if (/^image\/(png|jpeg|webp|gif)$/.test(im.media_type) && typeof im.data === "string" && im.data.length < 5_000_000)
              content.push({ type: "image", source: { type: "base64", media_type: im.media_type, data: im.data } });
          }
        }
        const text = String(m.text || "").slice(0, 4000) || (content.length ? "(veja o print)" : "...");
        content.push({ type: "text", text });
        return { role: m.role === "assistant" ? "assistant" : "user", content };
      }).reverse();
      while (msgs.length && msgs[0].role !== "user") msgs.shift();
      if (!msgs.length) return json({ error: "Mensagem vazia." }, 400);

      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model, max_tokens: 1200,
          system: [
            { type: "text", text: PERSONA },
            { type: "text", text: "# MANUAL DO SISTEMA\n\n" + manual, cache_control: { type: "ephemeral" } },
            { type: "text", text: contexto },
          ],
          messages: msgs,
        }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        const m = String(j?.error?.message || r.status);
        return json({ error: r.status === 429 || r.status === 529 ? "O Lucas está com muitas conversas agora. Tente de novo em instantes." : r.status === 401 ? "A chave da API do Lucas não é mais válida. Avise o Administrador." : "O Lucas não conseguiu responder agora (" + m.slice(0, 120) + ")." }, 502);
      }
      const answer = (j.content || []).filter((c: { type: string }) => c.type === "text").map((c: { text: string }) => c.text).join("\n").trim();
      const last = raw[raw.length - 1];
      await sb.from("assistant_log").insert({ user_id: u.user.id, question: String(last?.text || "").slice(0, 2000), answer: answer.slice(0, 4000), screen: String(ctx.screen || "").slice(0, 120),
        images: Array.isArray(last?.images) ? last.images.length : 0, input_tokens: j.usage?.input_tokens ?? null, output_tokens: j.usage?.output_tokens ?? null });
      return json({ text: answer || "Desculpe, não consegui formular uma resposta. Pode reformular a pergunta?" });
    }
    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    return json({ error: String((e as Error).message || e) }, 500);
  }
});
