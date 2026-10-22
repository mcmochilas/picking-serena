# Picking Serena

Sistema de separação de pedidos da Serena Puxadores. Ele cobre o comercial (integração das pré-vendas), a separação no celular ou coletor, a mesa de expedição, as encomendas em colmeia, o cadastro de locais e EAN e o controle de usuários por nível de acesso.

- **Front-end:** HTML + JavaScript puro, sem etapa de build, hospedado na **Vercel**.
- **Banco, login e tempo real:** **Supabase**.
- **Código:** **GitHub**. Cada `git push` publica uma nova versão na Vercel.

```
index.html              o sistema (telas e regras)
js/config.js            URL e chave pública do Supabase  ← você preenche
js/backend.js           login + ligação com o Supabase
supabase/schema.sql     tabelas, regras de acesso (RLS) e tempo real
supabase/push.sql       notificações push (inscrições + gatilho de novo pedido)
supabase/functions/push função que envia o push (Supabase Edge Function)
supabase/functions/admin-users  criação de usuários e troca de senha pelo administrador
sw.js                   service worker: mostra a notificação com o app fechado
supabase/seed-exemplo.sql  dados de exemplo (opcional)
vercel.json             cabeçalhos (libera a câmera no próprio site)
manifest.webmanifest    instalação como app no celular/coletor
```

---

## 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com). Escolha a região **South America (São Paulo)**.
2. Abra **SQL Editor → New query**, cole todo o conteúdo de `supabase/schema.sql` e clique em **Run**.
   - O arquivo cria as tabelas (`orders`, `products`, `blocks`, `config`, `profiles`), as regras de acesso por nível e liga o tempo real.
   - Pode rodar de novo sem problema.
3. *(Opcional)* Para ter locais e produtos de teste, rode também `supabase/seed-exemplo.sql`.
4. Em **Authentication → URL Configuration**:
   - **Site URL:** o endereço da Vercel (ex.: `https://picking-serena.vercel.app`). Você ajusta depois do passo 3.
   - **Redirect URLs:** adicione o mesmo endereço.
5. Em **Authentication → Sign In / Providers → Email**:
   - Mantenha **Confirm email** ligado se quiser que cada pessoa confirme o e-mail antes de entrar.
   - Se a equipe não usa e-mail no dia a dia, desligue essa opção. Nesse caso, quem criar conta já entra, mas continua sem acesso até o administrador liberar.
6. Em **Project Settings → API** (ou **API Keys**), copie:
   - a **Project URL**;
   - a chave **anon** (ou **publishable**).

## 2. Configurar e subir para o GitHub

1. Edite `js/config.js` e cole a URL e a chave anon:
   ```js
   window.PS_CONFIG = {
     SUPABASE_URL: "https://xxxx.supabase.co",
     SUPABASE_ANON_KEY: "eyJ... ou sb_publishable_..."
   };
   ```
   > A chave anon é pública por natureza: quem protege os dados são as regras (RLS) do `schema.sql`. **Nunca** coloque a chave `service_role` / `secret` no projeto.
2. Crie um repositório no GitHub (ex.: `picking-serena`) e envie os arquivos:
   ```bash
   git init
   git add .
   git commit -m "Picking Serena"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/picking-serena.git
   git push -u origin main
   ```

## 3. Vercel

1. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
2. Preencha:
   - **Framework Preset:** *Other*
   - **Build Command:** vazio
   - **Output Directory:** vazio (a raiz do projeto)
3. Clique em **Deploy**.
4. Copie o endereço gerado e volte ao Supabase, no passo 1.4 (Site URL e Redirect URLs).
5. *(Opcional)* Em **Settings → Domains**, ligue um domínio próprio, por exemplo `picking.serenapuxadores.com.br`. Depois atualize as URLs no Supabase.

A partir daqui, cada `git push` na `main` publica sozinho.

## 4. Primeiro acesso e usuários

1. Abra o sistema e clique em **Criar conta**. **A primeira conta criada vira Administrador automaticamente.**
2. **Recomendado:** o administrador cria as contas em **Usuários → Criar usuário** (nome, e-mail **ou** usuário, senha inicial e nível). A conta já nasce liberada, sem e-mail de confirmação. Quem não tem e-mail entra com o usuário, por exemplo `joao.silva`. Para trocar a senha de alguém, use **Nova senha** ao lado do nome.
   - A pessoa também pode criar a própria conta pelo botão **Criar conta**. Só que o Supabase gratuito envia poucos e-mails de confirmação por hora ("email rate limit exceeded").
3. O administrador vai em **Usuários**, busca a pessoa pelo nome e define o nível: Supervisor, Comercial, Estoque, Separador ou Conferente.
4. Quem não tem nível vê "Acesso ainda não liberado". As regras do banco também bloqueiam essa pessoa: ela não lê nem grava nada.

| Nível | Pode |
|---|---|
| Administrador | tudo, inclusive usuários e configurações |
| Supervisor | todas as operações, sem gerenciar usuários |
| Comercial | integrar pré-vendas, registrar envios, cadastrar produtos novos da pré-venda |
| Estoque | locais, produtos/EAN e etiquetas |
| Separador | separação no celular/coletor |
| Conferente | mesa de expedição e colmeias |

## 5. Celular e coletor

- **Instalar como app:** abra o endereço no **Chrome** e use **Adicionar à tela inicial**. O sistema abre em tela cheia, como um aplicativo.
- **Leitura pela câmera:** fora do Claude, o botão **Câmera** abre o leitor **ao vivo**. Basta apontar para o código de barras.
- **Coletor Android com leitor embutido:** configure o leitor em modo **teclado (keyboard wedge)**, com sufixo **Enter**, e deixe ligados **EAN-13** e **Code 128**. O sistema detecta o coletor e ativa o modo compacto sozinho.

## Notificação de novo pedido

- **Quem recebe:** Administrador, Supervisor e Separador, exceto quem integrou o pedido.
- **Som no app:** toca enquanto o sistema está aberto. Liga e desliga no card **Alerta de novo pedido**, na aba Separação.
- **Push no celular:** chega mesmo com o app fechado. Cada pessoa toca em **Ativar notificações no celular** uma vez em cada aparelho.
  - **Android:** pelo Chrome. Pode ser no navegador ou no app instalado.
  - **iPhone (iOS 16.4 ou mais novo):** primeiro **Adicionar à Tela de Início** e abrir pelo ícone, depois ativar.
- **Como funciona:** quando entra um pedido para separar, o banco chama a função `push` (gatilho em `supabase/push.sql`). Ela envia para todos os aparelhos inscritos. As chaves do push são criadas e guardadas no próprio Supabase, na tabela `app_secrets`, que fica fechada para o app.

## Observações

- **Tempo real:** pedidos integrados no comercial aparecem na hora nos celulares, com alerta sonoro para o separador. Para isso, o sistema precisa estar aberto no aparelho.
- **Backup:** o Supabase faz backup diário nos planos pagos. No plano gratuito, exporte as tabelas de vez em quando em **Table Editor → Export**.
- **Projeto parado:** projetos do plano gratuito do Supabase pausam após uma semana sem uso. Em produção, considere o plano Pro.
