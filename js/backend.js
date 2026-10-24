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

  /* Saída da colmeia pelo celular sem login: link de uso único (#cm=<código>) gerado por quem está logado no computador */
  const rpcJ = async (fn, args) => { const { data, error } = await sb.rpc(fn, args); if(error) throw new Error(error.message || "Falha de conexão"); return data; };
  const HV_TOKEN = (location.hash.match(/^#cm=([A-Za-z0-9_-]{20,})$/) || [])[1] || null;
  window.psHive = {
    token: HV_TOKEN,
    create: (oid, how) => rpcJ("create_hive_token", { p_oid: oid, p_how: how }),
    info: t => rpcJ("hive_token_info", { p_token: t }),
    confirm: (t, colmeia) => rpcJ("hive_token_confirm", { p_token: t, p_colmeia: colmeia })
  };
  /* Recebimento de UMA nota pelo celular sem login (#rc=<código>) */
  const RC_TOKEN = (location.hash.match(/^#rc=([A-Za-z0-9_-]{20,})$/) || [])[1] || null;
  window.psRc = {
    token: RC_TOKEN,
    create: nf => rpcJ("create_nf_token", { p_nf: nf }),
    info: t => rpcJ("nf_token_info", { p_token: t }),
    write: (t, table, id, data) => rpcJ("nf_token_write", { p_token: t, p_table: table, p_id: id, p_data: data })
  };
  if(HV_TOKEN || RC_TOKEN){ window.claude = { use: async () => null }; return; } // sem tela de login: só a conferência pelo link

  let session = null, profile = null, readyResolve;
  const ready = new Promise(r => readyResolve = r);
  const DOC_TABLES = ["orders","products","blocks","config"];
  /* Usuário sem e-mail: "joao.silva" vira joao.silva@usuarios.picking-serena.invalid (domínio que nunca recebe e-mail) */
  const USER_DOMAIN = "usuarios.picking-serena.invalid";
  const loginToEmail = l => { l = String(l||"").trim().toLowerCase(); if(l.includes("@")) return l;
    const slug = l.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9._-]+/g,".").replace(/^\.+|\.+$/g,""); return slug ? `${slug}@${USER_DOMAIN}` : ""; };
  const emailToLogin = e => String(e||"").replace("@"+USER_DOMAIN, "");

  const toErr = e => {
    const m = String(e?.message || e || "erro");
    const code = /fetch|network|Failed to fetch|timeout/i.test(m) ? "unavailable" : "invalid_argument";
    return { code, message: m };
  };
  const uid = () => Math.random().toString(36).slice(2);

  const refreshers = new Set();
  window.psRefresh = async () => { await Promise.all([...refreshers].map(f => f())); };
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
        const listen = () => sb.channel(`rt-${t}-${uid()}`)
          .on("postgres_changes", { event:"*", schema:"public", table:t }, p => {
            if(p.eventType === "DELETE") rows.delete(p.old.id); else rows.set(p.new.id, p.new.data);
            emit();
          }).subscribe();
        let ch = listen();
        const load = () => fetchAll(t).then(d => { rows.clear(); d.forEach(r => rows.set(r.id, r.data)); loaded = true; emit(); });
        load().catch(e => onErr && onErr(toErr(e)));
        /* "Atualizar": busca tudo de novo no servidor e reabre o tempo real se ele caiu */
        const refresh = async () => { if(ch.state !== "joined"){ sb.removeChannel(ch); ch = listen(); } await load(); };
        refreshers.add(refresh);
        return () => { refreshers.delete(refresh); sb.removeChannel(ch); };
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
        const put = r => { if(r.role) rows.set(r.id, { role:r.role, roles: Array.isArray(r.roles) && r.roles.length ? r.roles : [r.role], active:r.active, addedAt: Date.parse(r.created_at)||0, login: emailToLogin(r.email), ecommerce: !!r.ecommerce, consultiva: !!r.consultiva }); else rows.delete(r.id); };
        const emit = () => { if(loaded) cb({ docs: [...rows].map(([id,d]) => ({ id, exists:true, data:()=>d })) }); };
        const ch = sb.channel(`rt-profiles-${uid()}`)
          .on("postgres_changes", { event:"*", schema:"public", table:"profiles" }, p => {
            if(p.eventType === "DELETE") rows.delete(p.old.id); else put(p.new);
            if(p.new?.id === session?.user?.id) profile = { ...profile, ...p.new };
            emit();
          }).subscribe();
        fetchAll("profiles", "id,role,roles,active,created_at,email,ecommerce,consultiva").then(d => { d.forEach(put); loaded = true; emit(); })
          .catch(e => onErr && onErr(toErr(e)));
        return () => sb.removeChannel(ch);
      },
      doc(id){
        const upd = async p => {
          const patch = {}; if("role" in p) patch.role = p.role; if("roles" in p) patch.roles = p.roles; if("active" in p) patch.active = p.active; if("ecommerce" in p) patch.ecommerce = !!p.ecommerce; if("consultiva" in p) patch.consultiva = !!p.consultiva;
          const { error } = await sb.from("profiles").update(patch).eq("id", id); if(error) throw toErr(error);
        };
        return { set: upd, update: upd, async delete(){ const { error } = await sb.from("profiles").update({ role:null, roles:[] }).eq("id", id); if(error) throw toErr(error); } };
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
  const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]);
  async function loadProfile(){
    let data = null;
    for(let i = 0; i < 3 && !data; i++){
      try{ ({ data } = await withTimeout(sb.from("profiles").select("*").eq("id", session.user.id).maybeSingle(), 8000)); }
      catch(e){ await new Promise(r => setTimeout(r, 1000)); }
    }
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
        ${mode==="login" ? `<label>E-mail ou usuário<input id="lgEmail" type="text" required autocomplete="username" autocapitalize="none" spellcheck="false"></label>`
          : mode!=="newpass" ? `<label>E-mail<input id="lgEmail" type="email" required autocomplete="email" inputmode="email"></label>` : ""}
        ${mode!=="reset" ? `<label>Senha<input id="lgPass" type="password" required minlength="6" autocomplete="${mode==="login"?"current-password":"new-password"}"></label>` : ""}
        <button class="lg-btn" type="submit">${t}</button>
      </form>
      <div class="lg-links">
        ${mode==="login" ? `<button data-m="signup">Criar conta</button><button data-m="reset">Esqueci minha senha</button>` : `<button data-m="login">Voltar para o login</button>`}
      </div>
      ${mode==="signup" ? `<p class="lg-hint">Depois de criar a conta, o administrador libera o seu nível de acesso. Também é possível o administrador criar a conta direto em Usuários.</p>` : ""}
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
          const { error } = await sb.auth.signInWithPassword({ email: loginToEmail(email), password:pass });
          if(error) throw error;
        } else if(mode === "signup"){
          const { data, error } = await sb.auth.signUp({ email, password:pass, options:{ data:{ name }, emailRedirectTo: location.origin } });
          if(error) throw error;
          if(!data.session) return showLogin("login", "Conta criada. Confirme o e-mail que enviamos e depois entre.");
        } else if(mode === "reset"){
          if(!email.includes("@")) throw new Error("Quem entra com usuário (sem e-mail) pede uma nova senha ao administrador.");
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
        const pt = /Invalid login/i.test(m) ? "E-mail ou senha incorretos." : /Email not confirmed/i.test(m) ? "Confirme o seu e-mail antes de entrar (veja a caixa de entrada)." : /already registered/i.test(m) ? "Este e-mail já tem conta. Use Entrar." : /rate limit/i.test(m) ? "O sistema atingiu o limite de e-mails por hora. Peça ao administrador para criar a sua conta em Usuários → Criar usuário (não precisa de e-mail)." : /Password should/i.test(m) ? "A senha precisa ter pelo menos 6 caracteres." : m;
        showLogin(mode, "", pt);
      }
    };
    setTimeout(() => ov.querySelector("input")?.focus(), 50);
  }
  function hideLogin(){ document.getElementById("lgOverlay")?.remove(); }

  /* Início único: mesmo que o Supabase avise várias vezes (abrir, voltar ao app,
     renovar o acesso), o sistema só inicia uma vez e nunca fica esperando. */
  let starting = null, recovering = /type=recovery/.test(location.hash);
  const whenDom = fn => document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", fn) : fn();
  function start(s){
    if(starting){ if(session && s && s.user.id !== session.user.id) location.reload(); else session = s || session; return starting; }
    session = s;
    starting = (async () => { await loadProfile(); whenDom(hideLogin); readyResolve(); })();
    return starting;
  }
  sb.auth.onAuthStateChange((ev, s) => {
    /* nada de esperar o Supabase aqui dentro (evita a trava): agenda para depois */
    setTimeout(() => {
      if(ev === "PASSWORD_RECOVERY"){ recovering = true; session = s; whenDom(() => showLogin("newpass")); return; }
      if(ev === "SIGNED_OUT"){ if(starting) location.reload(); else whenDom(() => showLogin()); return; }
      if(recovering) return;
      if(s) start(s);
      else if(ev === "INITIAL_SESSION") whenDom(() => showLogin());
    }, 0);
  });

  /* Rede de segurança: se em 20 s nada carregou, oferece tentar de novo ou sair. */
  setTimeout(() => {
    const w = document.querySelector(".done .want");
    if(document.getElementById("lgOverlay") || !w || !/Carregando/.test(w.textContent)) return;
    {
      document.body.insertAdjacentHTML("beforeend", `<div id="psStuck" style="position:fixed;left:16px;right:16px;bottom:24px;z-index:99999;background:#1b2330;color:#e8edf3;border:1px solid #33404f;border-radius:12px;padding:14px 16px;font:14px system-ui;box-shadow:0 8px 24px rgba(0,0,0,.4)">
        Está demorando para carregar. Verifique a internet.
        <div style="display:flex;gap:8px;margin-top:10px"><button onclick="location.reload()" style="flex:1;padding:10px;border-radius:8px;border:0;background:#2f6fed;color:#fff;font-weight:600">Tentar de novo</button><button onclick="psLogout()" style="flex:1;padding:10px;border-radius:8px;border:1px solid #33404f;background:transparent;color:#e8edf3">Sair</button></div></div>`);
    }
  }, 20000);

  /* ---------- Notificações push (novo pedido para separar) ---------- */
  const FN = cfg.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/push";
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const pushSupported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const swReady = "serviceWorker" in navigator ? navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).catch(() => null) : Promise.resolve(null);
  const b64ToBytes = s => { const p = "=".repeat((4 - s.length % 4) % 4), b = atob((s + p).replace(/-/g, "+").replace(/_/g, "/")); return Uint8Array.from(b, c => c.charCodeAt(0)); };
  let pushState = !pushSupported ? (isIOS && !standalone ? "ios-install" : "unsupported") : Notification.permission === "denied" ? "denied" : "checking";
  const setState = s => { pushState = s; window.dispatchEvent(new Event("pspush")); };

  async function saveSub(sub){
    const j = sub.toJSON();
    const { error } = await sb.from("push_subscriptions").upsert({ endpoint: j.endpoint, p256dh: j.keys.p256dh, auth: j.keys.auth, user_id: session.user.id, ua: navigator.userAgent.slice(0, 200) }, { onConflict: "endpoint" });
    if(error) throw error;
  }
  async function refreshPush(){
    if(!pushSupported || !session) return;
    if(Notification.permission === "denied") return setState("denied");
    const reg = await swReady; if(!reg) return setState("unsupported");
    const sub = await reg.pushManager.getSubscription();
    if(sub && Notification.permission === "granted"){ try{ await saveSub(sub); }catch(e){} return setState("on"); }
    setState("off");
  }
  ready.then(() => refreshPush());

  window.psPush = {
    get state(){ return pushState; },
    isIOS,
    async enable(){
      if(!pushSupported) return pushState;
      const perm = await Notification.requestPermission();
      if(perm !== "granted"){ setState(perm === "denied" ? "denied" : "off"); return pushState; }
      const reg = await swReady; if(!reg){ setState("unsupported"); return pushState; }
      const { publicKey } = await (await fetch(FN)).json();
      let sub = await reg.pushManager.getSubscription();
      if(sub && sub.options?.applicationServerKey){ // inscrição antiga com outra chave: refaz
        const cur = new Uint8Array(sub.options.applicationServerKey), want = b64ToBytes(publicKey);
        if(cur.length !== want.length || cur.some((v, i) => v !== want[i])){ await sub.unsubscribe(); sub = null; }
      }
      if(!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(publicKey) });
      await saveSub(sub);
      setState("on");
      return pushState;
    },
    async disable(){
      const reg = await swReady, sub = reg && await reg.pushManager.getSubscription();
      if(sub){ await sb.from("push_subscriptions").delete().eq("endpoint", sub.endpoint); await sub.unsubscribe(); }
      setState("off"); return pushState;
    },
    async test(){
      const { data } = await sb.auth.getSession();
      const r = await fetch(FN, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + (data.session?.access_token || "") }, body: JSON.stringify({ action: "test" }) });
      return r.json();
    }
  };
  /* Administrador: criar usuários e trocar senhas sem e-mail */
  const callFn = async (fn, body) => {
    const { data } = await sb.auth.getSession();
    const r = await fetch(cfg.SUPABASE_URL.replace(/\/$/,"") + "/functions/v1/" + fn, { method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:"Bearer " + (data.session?.access_token || "") }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ error:"Falha de conexão" }));
    if(!r.ok || j.error) throw new Error(j.error || "Falha");
    return j;
  };
  window.psMagazord = body => callFn("magazord", body);
  /* Lucas, o assistente: a chave da API fica no servidor */
  window.psLucas = {
    status: () => callFn("lucas", { action:"status" }),
    config: b => callFn("lucas", { action:"config", ...b }),
    chat: (messages, context) => callFn("lucas", { action:"chat", messages, context })
  };
  const adminFn = async body => {
    const { data } = await sb.auth.getSession();
    const r = await fetch(cfg.SUPABASE_URL.replace(/\/$/,"") + "/functions/v1/admin-users", { method:"POST",
      headers:{ "Content-Type":"application/json", Authorization:"Bearer " + (data.session?.access_token || "") }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({ error:"Falha de conexão" }));
    if(!r.ok || j.error) throw new Error(j.error || "Falha");
    return j;
  };
  window.psAdmin = {
    createUser: ({ name, login, password, role, consultiva, ecommerce }) => adminFn({ action:"create", name, login, password, role, consultiva, ecommerce }),
    setPassword: (id, password) => adminFn({ action:"password", id, password })
  };

  /* Toque na notificação com o app aberto: vai para a Separação */
  if("serviceWorker" in navigator) navigator.serviceWorker.addEventListener("message", e => {
    if(e.data?.type === "ps-open") window.dispatchEvent(new CustomEvent("psopen", { detail: e.data.url }));
  });
})();
