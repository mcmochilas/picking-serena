/* =====================================================================
   Picking Serena · AMBIENTE DE TESTE (homologação)
   Substitui js/backend.js na versão de teste publicada como artefato.
   Mesma forma do backend real (use de "db", "user" e "downloads"),
   mas os dados ficam só neste navegador, com pedidos de exemplo.
   Nada aqui fala com o Supabase nem com a Magazord.
   ===================================================================== */
(function(){
  const KEY = "ps-test-db-v4", UKEY = "ps-test-user";
  const mem = {};
  const ls = {
    get(k){ try{ return localStorage.getItem(k); }catch(e){ return mem[k] ?? null; } },
    set(k,v){ try{ localStorage.setItem(k,v); }catch(e){ mem[k]=v; } },
    del(k){ try{ localStorage.removeItem(k); }catch(e){} delete mem[k]; }
  };
  const clone = o => JSON.parse(JSON.stringify(o));
  const now = Date.now(), M = 60e3;

  /* ---------- dados de exemplo ---------- */
  const USERS0 = {
    "u-admin":  { name:"Admin Teste",      role:"admin",     active:true, ecommerce:true,  consultiva:true,  login:"admin" },
    "u-sep":    { name:"Separador Teste",  role:"separador", active:true, ecommerce:true,  consultiva:true,  login:"separador" },
    "u-sep2":   { name:"Separador Consultiva", role:"separador", active:true, ecommerce:false, consultiva:true, login:"separador2" },
    "u-com":    { name:"Comercial Teste",  role:"comercial", active:true, ecommerce:false, consultiva:true,  login:"comercial" },
    "u-cp":     { name:"Compras Teste",    role:"compras",   active:true, ecommerce:false, consultiva:false, login:"compras" },
    "u-est":    { name:"Estoque Teste",    role:"estoque",   active:true, ecommerce:false, consultiva:false, login:"estoque" },
    "u-tv":     { name:"Painel TV",        role:"painel",    active:true, ecommerce:false, consultiva:false, login:"tv" }
  };
  function seed(){
    const P = [
      ["13088","PUXADOR ANIELA 128MM NIQUEL","7908204701309"],
      ["12045","PUXADOR BELLA 96MM PRETO FOSCO","7908204712046"],
      ["14410","PUXADOR CONCHA 64MM INOX","7908204744108"],
      ["15002","PUXADOR PERFIL 2M ALUMINIO","7908204750024"],
      ["16120","PUXADOR ZEN 160MM DOURADO","7908204761204"],
      ["17333","PUXADOR ARCO 128MM ROSE","7908204773337"]
    ];
    const products = {}; P.forEach(([code,name,ean])=>products[code]={code,name,ean,loc:""});
    const it = (code,qty,enc=0)=>{ const p=products[code]; return {code, name:p.name, ean:p.ean, un:"PC", qty, price:12.5, loc:"", qtyEnc:enc, eta: enc?new Date(now+5*864e5).toISOString().slice(0,10):""}; };
    const base = { v2:true, remessa:1, date:"23/10/2026", time:"09:00", seller:"EVELIN", city:"PORTO BELO - SC", total:350 };
    const orders = [
      {...base, id:"PV-90001", num:"90001", client:"MARCENARIA PINHEIRO (EXEMPLO)", clientCode:"101", obs:"VEM RETIRAR", mode:"total", status:"aguardando", canal:"consultiva", retira:true, naLoja:true, transportadora:"", createdAt:now-12*M, items:[it("13088",4), it("12045",2)]},
      {...base, id:"PV-90002", num:"90002", client:"MÓVEIS SILVA (EXEMPLO)", clientCode:"102", obs:"RETIRA AMANHÃ", mode:"total", status:"aguardando", canal:"consultiva", retira:true, transportadora:"", createdAt:now-40*M, items:[it("14410",6)]},
      {...base, id:"PV-90003", num:"90003", client:"PLANEJADOS SOUZA (EXEMPLO)", clientCode:"103", obs:"AZUL CARGO - DE 5 À 6 DIAS ÚTEIS", mode:"total", status:"aguardando", canal:"consultiva", transportadora:"Azul Cargo", createdAt:now-95*M, items:[it("15002",2), it("16120",3), it("17333",1)]},
      {...base, id:"PV-90004", num:"90004", client:"ARQUITETURA LIMA (EXEMPLO)", clientCode:"104", obs:"DAYTONA EXPRESS - DE 2 À 3 DIAS ÚTEIS", mode:"parcial", status:"aguardando", canal:"consultiva", transportadora:"Daytona Express", createdAt:now-60*M, items:[it("13088",10,4), it("12045",5)]},
      {...base, id:"PV-90005", num:"90005", client:"CASA & CIA (EXEMPLO)", clientCode:"105", obs:"ENVIO DISK TENHA", mode:"aguarda", status:"na_colmeia", canal:"consultiva", transportadora:"Disk Tenha", colmeia:"CM-A1", createdAt:now-26*60*M, startedAt:now-25*60*M, pickedAt:now-25*60*M+6*M, storedAt:now-25*60*M+9*M, items:[it("16120",2), it("17333",6,6)], res:[{status:"ok",got:2},{status:"ok",got:0}]},
      {...base, id:"PV-90006", num:"90006", client:"MARMORARIA ROCHA (EXEMPLO)", clientCode:"106", obs:"AZUL CARGO - DE 10 À 11 DIAS ÚTEIS", mode:"total", status:"pronto_envio", canal:"consultiva", transportadora:"Azul Cargo", createdAt:now-180*M, startedAt:now-170*M, pickedAt:now-160*M, atMesaAt:now-160*M, items:[it("14410",3)], res:[{status:"ok",got:3}]},
      {...base, id:"PV-90007", num:"90007", client:"DECORA INTERIORES (EXEMPLO)", clientCode:"107", obs:"JADLOG - 3 A 5 DIAS ÚTEIS", mode:"encomenda", status:"encomenda", canal:"consultiva", transportadora:"Jadlog", createdAt:now-3*24*60*M, items:[it("15002",4,4), it("16120",10,10)]},
      {...base, id:"PV-90008", num:"90008", client:"MARCENARIA OLIVEIRA (EXEMPLO)", clientCode:"108", obs:"AZUL CARGO - DE 5 À 6 DIAS ÚTEIS", mode:"parcial", status:"pronto_envio", canal:"consultiva", transportadora:"Azul Cargo", createdAt:now-2*24*60*M, startedAt:now-2*24*60*M+20*M, pickedAt:now-2*24*60*M+30*M, atMesaAt:now-2*24*60*M+30*M, items:[it("13088",8), it("17333",12,12)], res:[{status:"ok",got:8},{status:"ok",got:0}]},
      {id:"MZ-50001", num:"0012610900001", client:"Fernanda Alves (exemplo)", canal:"ecommerce", origem:"Mercado Livre", transportadora:"Mercado Livre Coletas", mode:"total", status:"aguardando", v2:true, remessa:1, createdAt:now-30*M, items:[it("13088",1)]},
      {id:"MZ-50002", num:"0012610900002", client:"Ricardo Gomes (exemplo)", canal:"ecommerce", origem:"Mercado Livre", transportadora:"Mercado Livre Coletas", mode:"total", status:"aguardando", v2:true, remessa:1, createdAt:now-22*M, items:[it("12045",2)]},
      {id:"MZ-50003", num:"0012610900003", client:"Juliana Costa (exemplo)", canal:"ecommerce", origem:"Site", transportadora:"Correios", mode:"total", status:"aguardando", v2:true, remessa:1, createdAt:now-15*M, items:[it("17333",1), it("16120",1)]},
      {id:"MZ-50004", num:"0012610900004", client:"Paulo Mendes (exemplo)", canal:"ecommerce", origem:"Site", transportadora:"Azul Cargo", mode:"total", status:"aguardando", v2:true, remessa:1, createdAt:now-8*M, items:[it("14410",2)]},
      {id:"MZ-50005", num:"0012610900005", client:"Ana Ribeiro (exemplo)", canal:"ecommerce", origem:"Mercado Livre", transportadora:"Mercado Livre Coletas", mode:"total", status:"pronto_envio", v2:true, remessa:1, createdAt:now-90*M, startedAt:now-70*M, pickedAt:now-68*M, atMesaAt:now-68*M, items:[it("13088",1)], res:[{status:"ok",got:1}]}
    ];
    // pedidos ao fornecedor de exemplo: um atrasado e um no prazo
    const iso = ms => new Date(ms).toISOString().slice(0,10);
    const lateD = iso(now-2*864e5), okD = iso(now+6*864e5);
    const purchases = {
      "PC-ex1": { id:"PC-ex1", forn:"ZEN ACESSORIOS PARA MOVEIS LTDA", num:"", prev:lateD, createdAt:now-8*864e5, lines:[{code:"ZP0476.00003", name:"PUX.KEN 416MM BRONZE", qty:10, ped:"119193", entrega:"", sku:"13088", links:[{oid:"PV-90004", i:0, qty:4}]}] },
      "PC-ex2": { id:"PC-ex2", forn:"TORRALBA IND.COM.ART.METAIS PLAS", num:"53456", prev:okD, createdAt:now-1*864e5, lines:[{code:"7102577", name:"PUX 1689 OEIRAS DOURADO 128MM", qty:20, ped:"53456", entrega:"", sku:"17333", links:[{oid:"PV-90005", i:1, qty:6}]}] }
    };
    orders.find(o=>o.id==="PV-90004").items[0].compra = { links:[{pid:"PC-ex1", qty:4, ped:"119193", prev:lateD, fcode:"ZP0476.00003"}] };
    orders.find(o=>o.id==="PV-90005").items[1].compra = { links:[{pid:"PC-ex2", qty:6, ped:"53456", prev:okD, fcode:"7102577"}] };
    const users = clone(USERS0);
    Object.values(users).forEach(u=>u.addedAt=now-30*864e5);
    return {
      orders: Object.fromEntries(orders.map(o=>[o.id,o])),
      products,
      blocks: {},
      purchases,
      users,
      config: {
        picking: { useTray:true },
        mesas: { list:[{code:"MESA-001", desc:"Itens grandes / sem bandeja"}], cestas:[{code:"CESTA-001", desc:"Cesta de separação"}], colmeias:{cols:6, rows:4} },
        transportadoras: { list:{} },
        magazord_sync: {}
      }
    };
  }

  let DB;
  try{ DB = JSON.parse(ls.get(KEY) || "null"); }catch(e){ DB = null; }
  if(!DB || !DB.orders) DB = seed();
  const save = () => ls.set(KEY, JSON.stringify(DB));
  save();

  /* ---------- "banco" em memória com ouvintes ---------- */
  const listeners = new Map(); // tabela -> Set(fn)
  const table = t => (DB[t] ||= {});
  const emit = t => { const s = listeners.get(t); if(s) s.forEach(fn => setTimeout(fn, 0)); };
  function docCollection(t){
    return {
      onSnapshot(cb){
        const fn = () => cb({ docs: Object.entries(table(t)).map(([id,d]) => ({ id, exists:true, data:()=>clone(d) })) });
        if(!listeners.has(t)) listeners.set(t, new Set());
        listeners.get(t).add(fn); setTimeout(fn, 30);
        return () => listeners.get(t).delete(fn);
      },
      doc(id){ return docRef(t, id); }
    };
  }
  function docRef(t, id){
    return {
      async set(d){ table(t)[id] = clone(d); save(); emit(t); },
      async update(p){ table(t)[id] = { ...(table(t)[id] || {}), ...clone(p) }; save(); emit(t); },
      async delete(){ delete table(t)[id]; save(); emit(t); },
      onSnapshot(cb){
        return docCollection(t).onSnapshot(s => {
          const d = s.docs.find(x => x.id === id);
          cb(d ? { id, exists:true, data:d.data } : { id, exists:false, data:()=>undefined });
        });
      }
    };
  }
  const db = {
    collection(name){ return docCollection(name); },
    doc(path){ const [t, id] = String(path).split("/"); return docRef(t, id); }
  };

  /* ---------- usuário logado (troca pela barra de teste) ---------- */
  let meId = ls.get(UKEY) || "u-admin";
  if(!DB.users[meId]) meId = "u-admin";
  const COLORS = ["#2A5BC8","#1D845A","#B5651D","#8E44AD","#C0392B","#16A085","#7A5300","#34495E"];
  const colorOf = id => COLORS[[...String(id)].reduce((a,c)=>a + c.charCodeAt(0), 0) % COLORS.length];
  const initials = n => String(n||"?").trim().split(/\s+/).slice(0,2).map(s=>s[0]).join("").toUpperCase() || "?";
  const avatar = (n, c) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="${c}"/><text x="32" y="41" font-family="Arial" font-size="26" font-weight="700" fill="#fff" text-anchor="middle">${initials(n).replace(/[<&>]/g,"")}</text></svg>`);
  const prof = id => { const u = DB.users[id] || {}; return { id, name:u.name||"", email:null, avatarUrl:avatar(u.name, colorOf(id)), color:colorOf(id), isMe:id===meId, guest:false }; };
  const user = {
    async isOwner(){ return DB.users[meId]?.role === "admin"; },
    async canEdit(){ return DB.users[meId]?.role === "admin"; },
    async can(){ return null; },
    async id(){ return meId; },
    async me(){ const p = prof(meId), adm = DB.users[meId]?.role === "admin"; return { ...p, isOwner:adm, canEdit:adm }; },
    async profiles(ids){ const out = {}; [...new Set([].concat(ids))].forEach(i => out[i] = prof(i)); return out; },
    async search(q){ q = String(q||"").toLowerCase(); return Object.keys(DB.users).filter(i => (DB.users[i].name||"").toLowerCase().includes(q)).slice(0,8).map(prof); }
  };
  const downloads = {
    async save({ filename, data }){
      const blob = data instanceof Blob ? data : new Blob([data], { type: /\.pdf$/i.test(filename) ? "application/pdf" : "application/octet-stream" });
      const url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      return { saved:true };
    }
  };
  window.claude = { async use(name){ return name === "db" ? db : name === "user" ? user : name === "downloads" ? downloads : null; } };
  window.psRefresh = async () => { Object.keys(DB).forEach(emit); };
  window.psAdmin = {
    async createUser({ name, login, role, consultiva, ecommerce }){
      const id = "u-" + Math.random().toString(36).slice(2,8);
      DB.users[id] = { name, role, active:true, consultiva: consultiva !== false, ecommerce: !!ecommerce, login: String(login||"").toLowerCase(), addedAt: Date.now() };
      save(); emit("users"); return { id, login };
    },
    async setPassword(){ return { ok:true }; }
  };

  /* ---------- barra do ambiente de teste ---------- */
  const reset = () => { ls.del(KEY); location.reload(); };
  const switchTo = id => { ls.set(UKEY, id); location.reload(); };
  window.psLogout = () => { const p=document.getElementById("tstPanel"); if(p){ p.hidden=false; document.getElementById("tstUser")?.focus(); } };
  function bar(){
    if(document.getElementById("tstBar")) return;
    const st = document.createElement("style");
    st.textContent = `#tstBar{position:fixed;z-index:900;right:env(safe-area-inset-right,0px);top:38%;display:flex;flex-direction:column-reverse;align-items:flex-end;gap:6px;max-width:calc(100% - 20px);font:600 12px/1.2 system-ui,sans-serif}
#tstPill{border:0;border-radius:10px 0 0 10px;background:#7A1FA2;color:#fff;padding:7px 12px;font:700 12px system-ui,sans-serif;letter-spacing:.06em;box-shadow:0 4px 14px rgba(0,0,0,.3);cursor:pointer}
#tstPanel{margin-right:8px;background:#7A1FA2;color:#fff;border-radius:12px;padding:10px;display:flex;flex-direction:column;gap:8px;box-shadow:0 6px 20px rgba(0,0,0,.35);max-width:300px}
#tstPanel small{font-weight:500;opacity:.85;line-height:1.35}
#tstPanel select,#tstPanel button{font:600 13px system-ui,sans-serif;border-radius:8px;border:1px solid rgba(255,255,255,.45);background:rgba(255,255,255,.15);color:#fff;padding:7px 8px}
#tstPanel select option{color:#111}#tstPanel button{cursor:pointer}`;
    document.head.appendChild(st);
    const b = document.createElement("div"); b.id = "tstBar";
    const roleTxt = { admin:"Administrador", supervisor:"Supervisor", comercial:"Comercial", estoque:"Estoque", separador:"Separador", conferente:"Conferente", painel:"Painel TV" };
    const me = DB.users[meId] || {};
    b.innerHTML = `<div id="tstPanel" hidden><b>AMBIENTE DE TESTE</b><small>Os dados ficam só neste navegador. Nada aqui chega à produção.</small>
      <label for="tstUser"><small>Entrar como</small></label>
      <select id="tstUser">${Object.entries(DB.users).filter(([,u])=>u.role).map(([id,u])=>`<option value="${id}" ${id===meId?"selected":""}>${u.name} · ${roleTxt[u.role]||u.role}</option>`).join("")}</select>
      <button id="tstReset" title="Apaga tudo o que foi feito no teste e volta aos pedidos de exemplo">Restaurar pedidos de exemplo</button></div>
      <button id="tstPill" aria-expanded="false" title="Ambiente de teste · ${me.name || ""}">🧪 TESTE</button>`;
    document.body.appendChild(b);
    const panel = b.querySelector("#tstPanel"), pill = b.querySelector("#tstPill");
    pill.onclick = () => { panel.hidden = !panel.hidden; pill.setAttribute("aria-expanded", String(!panel.hidden)); };
    b.querySelector("#tstUser").onchange = e => switchTo(e.target.value);
    const rs = b.querySelector("#tstReset");
    rs.onclick = () => { if(!rs.dataset.c){ rs.dataset.c = "1"; rs.textContent = "Confirmar: apagar o teste"; return; } reset(); };
  }
  if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", bar); else bar();
})();
