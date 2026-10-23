/* =====================================================================
   Picking Serena · AMBIENTE DE TESTE (homologação)
   Substitui js/backend.js na versão de teste publicada como artefato.
   Mesma forma do backend real (use de "db", "user" e "downloads"),
   mas os dados ficam só neste navegador, com pedidos de exemplo.
   Nada aqui fala com o Supabase nem com a Magazord.
   ===================================================================== */
(function(){
  const KEY = "ps-test-db-v7", UKEY = "ps-test-user";
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
      {...base, id:"PV-90009", num:"90009", client:"ATELIÊ MADEIRA NOBRE (EXEMPLO)", clientCode:"109", obs:"AZUL CARGO - DE 5 À 6 DIAS ÚTEIS", mode:"aguarda", modeCom:"aguarda", status:"analise_compras", canal:"consultiva", transportadora:"Azul Cargo", createdAt:now-20*M, items:[it("13088",6), it("16120",8,8), it("12045",4)]},
      {...base, id:"PV-90010", num:"90010", client:"CASA LINDA PLANEJADOS (EXEMPLO)", clientCode:"110", obs:"VEM RETIRAR", mode:"encomenda", modeCom:"encomenda", status:"analise_compras", canal:"consultiva", retira:true, transportadora:"", createdAt:now-50*M, items:[it("14410",10,10), it("17333",2,2)]},
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
    // nota fiscal de exemplo (Torralba) ainda não recebida, amarrada à pré-venda 90005
    const invoices = { "NF-43261002923986000105550010000282551000000010": { id:"NF-43261002923986000105550010000282551000000010", chave:"43261002923986000105550010000282551000000010", num:"28255", serie:"1", emissao:iso(now-2*864e5), cnpj:"02923986000105", forn:"TORRALBA IND.COM.ART.METAIS PLAS", vols:3,
      lines:[{code:"7102577", name:"PUX 1689 OEIRAS DOURADO 128MM", qty:20, un:"PC", ped:"53456", sku:"17333", alloc:[{oid:"PV-90005", i:1, qty:6}]},
        {code:"7105213", name:"PUX 1688 OEIRAS PRETO FOS 96MM", qty:50, un:"PC", ped:"53456", sku:"", alloc:[]},
        {code:"7101633", name:"PUX 200 TUCSON DOURADO", qty:40, un:"PC", ped:"53456", sku:"", alloc:[]}], received:null, createdAt:now-864e5 } };
    orders.find(o=>o.id==="PV-90005").items[1].compra.nf = [{id:"NF-43261002923986000105550010000282551000000010", num:"28255", qty:6, key:"PV-90005:1"}];
    const users = clone(USERS0);
    Object.values(users).forEach(u=>u.addedAt=now-30*864e5);
    return {
      orders: Object.fromEntries(orders.map(o=>[o.id,o])),
      products,
      blocks: {},
      purchases,
      invoices,
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
  /* saída da colmeia pelo celular sem login (mesma regra das funções do Supabase) */
  const HV_TOKEN = (location.hash.match(/^#cm=([A-Za-z0-9_-]{20,})$/) || [])[1] || null;
  const tokOk = t => { const k = (DB.hive_tokens ||= {})[t]; if(!k) return [null, "Link inválido."]; if(k.used_at) return [null, "Este link já foi usado."]; if(k.expires_at < Date.now()) return [null, "Este link expirou. Gere um novo QR code no computador."]; return [k, null]; };
  window.psHive = {
    token: HV_TOKEN,
    async create(oid, how){ const o = DB.orders[oid]; if(!o || !o.colmeia) throw new Error("O pedido não está em uma colmeia");
      const t = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2,"0")).join("");
      (DB.hive_tokens ||= {})[t] = { oid, how, created_by: meId, expires_at: Date.now() + 2*3600e3 }; save(); return t; },
    async info(t){ const [k, err] = tokOk(t); if(err) return { error: err };
      const o = DB.orders[k.oid]; if(!o) return { error:"Pedido não encontrado." }; if(!o.colmeia) return { error:"Este pedido não está mais na colmeia." };
      return { how:k.how, by: DB.users[k.created_by]?.name || "", order: { id:o.id, num:o.num, client:o.client, colmeia:o.colmeia, status:o.status, mode:o.mode, remessa:o.remessa, arrivedAt:o.arrivedAt||null, retira:o.retira, obs:o.obs, hiveManual:o.hiveManual,
        items:(o.items||[]).map(i=>({ code:i.code, name:i.name, ean:i.ean, qty:i.qty, qtyEnc:i.qtyEnc||0, eta:i.eta, compra:i.compra })) } }; },
    async confirm(t, cm){ const [k, err] = tokOk(t); if(err) return { error: err };
      const o = DB.orders[k.oid]; if(!o || !o.colmeia) return { error:"Este pedido não está mais na colmeia." };
      if(String(o.colmeia).toUpperCase() !== String(cm).toUpperCase()) return { error:"Colmeia errada." };
      const hasEnc = (o.items||[]).some(i => i.qtyEnc > 0), arrived = !!o.arrivedAt || (o.mode==="parcial" && o.remessa===2), now = Date.now();
      let patch, result;
      if((o.remessa||1)!==2 && hasEnc && !arrived){ patch = { status:"enc_pendente", colmeia:null, sentAt1:now, saida1:k.how, saida1By:k.created_by, saidaVia:"qr", ...(o.mode!=="parcial"?{mode:"parcial", modeOrig:o.mode}:{}) }; result="parcial"; }
      else { patch = { status:"enviado", sentAt:now, saida:k.how, saidaBy:k.created_by, saidaVia:"qr" }; result="final"; }
      DB.orders[k.oid] = { ...o, ...patch }; k.used_at = now; k.used_colmeia = cm; save(); emit("orders");
      return { ok:true, result, num:o.num, colmeia:o.colmeia }; }
  };
  const RC_TOKEN = (location.hash.match(/^#rc=([A-Za-z0-9_-]{20,})$/) || [])[1] || null;
  const nfOids = n => [...new Set((n.lines||[]).flatMap(l=>(l.alloc||[]).map(a=>a.oid)))];
  const ORDER_KEYS = ["items","fase2","res1","res","status","queuedAt","arrivedAt","arrivedBy","nfRecebida","tray","trayStatus","startedAt","pickedAt","atMesaAt","mode","colmeia"];
  window.psRc = {
    token: RC_TOKEN,
    async create(nf){ const n=(DB.invoices||{})[nf]; if(!n) throw new Error("Nota não encontrada"); if(n.received) throw new Error("Esta nota já foi recebida");
      const t = Array.from(crypto.getRandomValues(new Uint8Array(24)), b => b.toString(16).padStart(2,"0")).join("");
      (DB.nf_tokens ||= {})[t] = { nf, created_by: meId, expires_at: Date.now() + 4*3600e3 }; save(); return t; },
    async info(t){ const k=(DB.nf_tokens||{})[t]; if(!k) return {error:"Link inválido."}; if(k.expires_at<Date.now()) return {error:"Este link expirou. Gere um novo QR code no computador."};
      const n=(DB.invoices||{})[k.nf]; if(!n) return {error:"Nota não encontrada."}; if(n.received) return {error:"Esta nota já foi recebida.", done:true};
      const ids=nfOids(n);
      return { by: DB.users[k.created_by]?.name||"", byId: k.created_by, nf: clone(n), orders: ids.map(id=>DB.orders[id]).filter(Boolean).map(clone),
        hive: Object.values(DB.orders).filter(o=>o.colmeia && !["enviado","excluido"].includes(o.status) && !ids.includes(o.id)).map(o=>({id:o.id, colmeia:o.colmeia, status:o.status, mode:o.mode, retira:o.retira, naLoja:o.naLoja, canal:o.canal, stub:true})),
        hiveDim: DB.config?.mesas?.colmeias || null }; },
    async write(t, table, id, data){ const k=(DB.nf_tokens||{})[t]; if(!k || k.expires_at<Date.now()) return {error:"Link expirado."};
      const n=(DB.invoices||{})[k.nf];
      if(table==="invoices"){ if(id!==k.nf) return {error:"Nota inválida."}; if(n?.received) return {error:"Esta nota já foi recebida."}; DB.invoices[id]=clone(data); save(); emit("invoices"); return {ok:true}; }
      if(table==="orders"){ if(!nfOids(n).includes(id)) return {error:"Pedido não pertence a esta nota."};
        const clean=Object.fromEntries(Object.entries(data).filter(([key])=>ORDER_KEYS.includes(key))); DB.orders[id]={...DB.orders[id], ...clone(clean)}; save(); emit("orders"); return {ok:true}; }
      return {error:"Tabela inválida."}; }
  };
  window.claude = (HV_TOKEN || RC_TOKEN) ? { async use(){ return null; } } : { async use(name){ return name === "db" ? db : name === "user" ? user : name === "downloads" ? downloads : null; } };
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
