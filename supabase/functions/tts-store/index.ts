// Copia áudios gerados no Fish Audio (platform.r2.fish.audio) para o bucket público 'tts'.
// Protegido pelo segredo push_webhook (header x-push-secret). Usado para a voz do aviso da TV (tts/tv/*).
import { createClient } from "jsr:@supabase/supabase-js@2";
const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
Deno.serve(async (req) => {
  const { data: sec } = await sb.from("app_secrets").select("value").eq("name", "push_webhook").maybeSingle();
  if (!sec?.value || req.headers.get("x-push-secret") !== sec.value) return new Response("forbidden", { status: 403 });
  const body = await req.json().catch(() => ({}));
  const files: Record<string, string> = body.files || {};
  const out: Record<string, unknown> = {};
  for (const [name, url] of Object.entries(files)) {
    try {
      const u = new URL(url);
      if (u.hostname !== "platform.r2.fish.audio" || !/^[\w\-\/]+\.mp3$/.test(name)) { out[name] = "rejeitado"; continue; }
      const r = await fetch(u);
      if (!r.ok) { out[name] = "http " + r.status; continue; }
      const buf = new Uint8Array(await r.arrayBuffer());
      const { error } = await sb.storage.from("tts").upload(name, buf, { contentType: "audio/mpeg", upsert: true, cacheControl: "31536000" });
      out[name] = error ? error.message : buf.length;
    } catch (e) { out[name] = String(e); }
  }
  return new Response(JSON.stringify(out), { headers: { "content-type": "application/json" } });
});
