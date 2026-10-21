/* =====================================================================
   Picking Serena · camada de dados (Supabase)
   Fornece login e a interface de dados usada pelo app:
   claude.use("db" | "user" | "downloads") -> objetos com a mesma forma
   que o app já usa (collection().onSnapshot, doc().set/update/delete...).
   ===================================================================== */
(function(){
  const cfg = window.PS_CONFIG || {};
  if(!window.supabase || !cfg.SUPABASE_URL || /SEU-PROJETO/.test(cfg.SUPABASE_URL)){
    document.addEventListener("DOMContentLoaded", ()=>{ document.body.insertAdjacentHTML("afterbegin",
      `<div style="background:#C0392B;color:#fff;padding:12px 16px;font:600 14px system-ui">Configure o Supabase em js/config.js (URL e chave anon) antes de usar o sistema.</div>`); });
    window.claude = { use: async ()=>null };
    return;
  }
  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth:{ persistSession:true, autoRefreshToken:true, detectSessionInUrl:true } });
  window.psSupabase = sb;

  let session = null, profile = null, readyResolve;
  const ready = new Promise(r => readyResolve = r);
  const DOC_TABLES = ["orders","products","blocks","config"];

  const toErr = e => {
    const m = String(e?.message || e || "erro");
    const code = /fetch|network|Failed to fetch|timeout/i.test(m) ? "unavailable" : "invalid_argument";
    return { code, message: m };
  };
  const uid = () => Math.random().toString(36).slice(2);

  async function fetchAll(t, cols="id,data"){
    let out = [], from = 0;
    for(;;){
      const { data, error } = await sb.from(t).select(cols).order("id").range(from, from+999);
      if(error) throw error;
      out = out.concat(data);
      if(data.length < 1000) break;
      from += 1000;
    }
    return out;
  }

  /* ---------- coleções de documentos ---------- */
  function docCollection(t){
    return {
      onSnapshot(cb, onErr){
        const rows = new Map(); let loaded = false;
        const emit = () => { if(loaded) cb({ docs: [...rows].map(([id,d]) => ({ id, exists:true, data:()=>d })) }); };
        const ch = sb.channel(`rt-${t}-${uid()}`)
          .on("postgres_changes", { event:"*", schema:"public", table:t }, p => {
            if(p.eventType === "DELETE") rows.delete(p.old.id); else rows.set(p.new.id, p.new.data);
            emit();
          }).subscribe();
        fetchAll(t).then(d => { d.forEach(r => rows.set(r.id, r.data)); loaded = true; emit(); })
                   .catch(e => onErr && onErr(toErr(e)));
        return () => sb.removeChannel(ch);
      },
      doc(id){ return docRef(t, id); }
    };
  }
  function docRef(t, id){
    return {
      async set(d){ const { error } = await sb.from(t).upsert({ id, data:d, updated_at:new Date().toISOString() }); if(error) throw toErr(error); },
      async update(p){ const { error } = await sb.rpc("merge_doc", { t, doc_id:id, patch:p }); if(error) throw toErr(error); },
      async delete(){ const { error } = await sb.from(t).delete().eq("id", id); if(error) throw toErr(error); },
      onSnapshot(cb, onErr){
        return docCollection(t).onSnapshot(s => {
          const d = s.docs.find(x => x.id === id);
          cb(d ? { id, exists:true, data:d.data } : { id, exists:false, data:()=>undefined });
        }, onErr);
      }
    };
  }

  /* ---------- "users" = perfis com nível de acesso ---------- */
  function usersCollection(){
    return {
      onSnapshot(cb, onErr){
        const rows = new Map(); let loaded = false;
        const put = r => { if(r.role) rows.set(r.id, { role:r.role, active:r.active, addedAt: Date.parse(r.created_at)||0 }); else rows.delete(r.id); };
        const emit = () => { if(loaded) cb({ docs: [...rows].map(([id,d]) => ({ id, exists:true, data:()=>d })) }); };
        const ch = sb.channel(`rt-profiles-${uid()}`)
          .on("postgres_changes", { event:"*", schema:"public", table:"profiles" }, p => {
            if(p.eventType === "DELETE") rows.delete(p.old.id); else put(p.new);
            if(p.new?.id === session?.user?.id) profile = { ...profile, ...p.new };
            emit();
          }).subscribe();
        fetchAll("profiles", "id,role,active,created_at").then(d => { d.forEach(put); loaded = true; emit(); })
          .catch(e => onErr && onErr(toErr(e)));
        return () => sb.removeChannel(ch);
      },
      doc(id){
        const upd = async p => {
          const patch = {}; if("role" in p) patch.role = p.role; if("active" in p) patch.active = p.active;
          const { error } = await sb.from("profiles").update(patch).eq("id", id); if(error) throw toErr(error);
        };
        return { set: upd, update: upd, async delete(){ const { error } = await sb.from("profiles").update({ role:null }).eq("id", id); if(error) throw toErr(error); } };
      }
    };
  }

  const db = {
    collection(name){ return name === "users" ? usersCollection() : docCollection(name); },
    doc(path){ const [t, id] = String(path).split("/"); return docRef(t, id); }
  };

  /* ---------- usuário logado ---------- */
  const COLORS = ["#2A5BC8","#1D845A","#B5651D","#8E44AD","#C0392B","#16A085","#7A5300","#34495E"];
  const colorOf = id => COLORS[[...String(id)].reduce((a,c)=>a + c.charCodeAt(0), 0) % COLORS.length];
  const initials = n => String(n||"?").trim().split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase() || "?";
  const avatar = (n, c) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="${c}"/><text x="32" y="41" font-family="Arial" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">${initials(n).replace(/[<&>]/g,"")}</text></svg>`);
  const toProfile = (r, myId) => ({ id:r.id, name:r.name || r.email || "", email:r.email || null, avatarUrl:avatar(r.name||r.email, colorOf(r.id)), color:colorOf(r.id), isMe:r.id===myId, guest:false });

  const user = {
    async isOwner(){ return profile?.role === "admin"; },
    async canEdit(){ return profile?.role === "admin"; },
    async can(){ return null; },
    async id(){ return session?.user?.id || null; },
    async me(){
      const id = session?.user?.id || null, name = profile?.name || session?.user?.email || "";
      return { id, name, email:session?.user?.email || null, avatarUrl:avatar(name, colorOf(id)), color:colorOf(id), isOwner: profile?.role === "admin", canEdit: profile?.role === "admin" };
    },
    async profiles(ids){
      const list = [...new Set([].concat(ids))]; const out = {};
      list.forEach(i => out[i] = { id:i, name:"", email:null, avatarUrl:avatar("?", colorOf(i)), color:colorOf(i), isMe:i===session?.user?.id, guest:false });
      if(!list.length) return out;
      const { data } = await sb.from("profiles").select("id,name,email").in("id", list);
      (data||[]).forEach(r => out[r.id] = toProfile(r, session?.user?.id));
      return out;
    },
    async search(q){
      q = String(q||"").trim();
      let req = sb.from("profiles").select("id,name,email").order("name").limit(8);
      if(q) req = req.or(`name.ilike.%${q.replace(/[%,()]/g,"")}%,email.ilike.%${q.replace(/[%,()]/g,"")}%`);
      const { data } = await req;
      return (data||[]).map(r => toProfile(r, session?.user?.id));
    }
  };

  /* ---------- downloads (PDF de etiquetas, modelo CSV) ---------- */
  const downloads = {
    async save({ filename, data }){
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.pdf$/i.test(filename) ? "application/pdf" : /\.csv$/i.test(filename) ? "text/csv;charset=utf-8" : "application/octet-stream" });
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { saved:true };
    }
  };

  window.claude = {
    async use(name){
      await ready;
      if(name === "db") return db;
      if(name === "user") return user;
      if(name === "downloads") return downloads;
      return null;
    }
  };
  window.psLogout = async () => { await sb.auth.signOut(); location.reload(); };

  /* ---------- tela de login ---------- */
  async function loadProfile(){
    const { data } = await sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle();
    profile = data || { id:session.user.id, email:session.user.email, role:null };
  }
  function loginHTML(mode, msg, err){
    const t = { login:"Entrar", signup:"Criar conta", reset:"Recuperar senha", newpass:"Definir nova senha" }[mode];
    return `<div class="lg-card">
      <div class="lg-brand">Picking <span>Serena</span></div>
      <h1>${t}</h1>
      ${msg ? `<div class="lg-ok">${msg}</div>` : ""}${err ? `<div class="lg-err">${err}</div>` : ""}
      <form id="lgForm" autocomplete="on">
        ${mode==="signup" ? `<label>Nome<input id="lgName" required autocomplete="name"></label>` : ""}
        ${mode!=="newpass" ? `<label>E-mail<input id="lgEmail" type="email" required autocomplete="email" inputmode="email"></label>` : ""}
        ${mode!=="reset" ? `<label>Senha<input id="lgPass" type="password" required minlength="6" autocomplete="${mode==="login"?"current-password":"new-password"}"></label>` : ""}
        <button class="lg-btn" type="submit">${t}</button>
      </form>
      <div class="lg-links">
        ${mode==="login" ? `<button data-m="signup">Criar conta</button><button data-m="reset">Esqueci minha senha</button>` : `<button data-m="login">Voltar para o login</button>`}
      </div>
      ${mode==="signup" ? `<p class="lg-hint">Depois de criar a conta, o administrador libera o seu nível de acesso.</p>` : ""}
    </div>`;
  }
  function showLogin(mode="login", msg="", err=""){
    let ov = document.getElementById("lgOverlay");
    if(!ov){ ov = document.createElement("div"); ov.id = "lgOverlay"; document.body.appendChild(ov); }
    ov.innerHTML = loginHTML(mode, msg, err);
    ov.querySelectorAll("[data-m]").forEach(b => b.onclick = () => showLogin(b.dataset.m));
    const f = ov.querySelector("#lgForm"), btn = f.querySelector("button");
    f.onsubmit = async e => {
      e.preventDefault(); btn.disabled = true; btn.textContent = "Aguarde…";
      const email = ov.querySelector("#lgEmail")?.value.trim(), pass = ov.querySelector("#lgPass")?.value, name = ov.querySelector("#lgName")?.value.trim();
      try{
        if(mode === "login"){
          const { error } = await sb.auth.signInWithPassword({ email, password:pass });
          if(error) throw error;
        } else if(mode === "signup"){
          const { data, error } = await sb.auth.signUp({ email, password:pass, options:{ data:{ name }, emailRedirectTo: location.origin } });
          if(error) throw error;
          if(!data.session) return showLogin("login", "Conta criada. Confirme o e-mail que enviamos e depois entre.");
        } else if(mode === "reset"){
          const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
          if(error) throw error;
          return showLogin("login", "Enviamos um link para redefinir a senha no seu e-mail.");
        } else if(mode === "newpass"){
          const { error } = await sb.auth.updateUser({ password:pass });
          if(error) throw error;
          return showLogin("login", "Senha alterada. Entre com a nova senha.");
        }
      }catch(ex){
        const m = String(ex?.message||ex);
        const pt = /Invalid login/i.test(m) ? "E-mail ou senha incorretos." : /Email not confirmed/i.test(m) ? "Confirme o seu e-mail antes de entrar (veja a caixa de entrada)." : /already registered/i.test(m) ? "Este e-mail já tem conta. Use Entrar." : /Password should/i.test(m) ? "A senha precisa ter pelo menos 6 caracteres." : m;
        showLogin(mode, "", pt);
      }
    };
    setTimeout(() => ov.querySelector("input")?.focus(), 50);
  }
  function hideLogin(){ document.getElementById("lgOverlay")?.remove(); }

  let started = false;
  async function start(s){
    session = s; await loadProfile(); hideLogin();
    if(!started){ started = true; readyResolve(); } else location.reload();
  }
  sb.auth.onAuthStateChange((ev, s) => {
    if(ev === "PASSWORD_RECOVERY"){ session = s; showLogin("newpass"); return; }
    if(ev === "SIGNED_IN" && s && !started) start(s);
    if(ev === "SIGNED_OUT"){ location.reload(); }
  });
  sb.auth.getSession().then(({ data }) => {
    if(data.session && !/type=recovery/.test(location.hash)) start(data.session);
    else if(!/type=recovery/.test(location.hash)) document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => showLogin()) : showLogin();
  });
})();
