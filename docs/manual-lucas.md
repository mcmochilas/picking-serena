# Manual do Picking Serena

Base de conhecimento do assistente **Lucas**. Descreve como o sistema funciona hoje, tela por tela e passo a passo. Sempre que uma atualização for publicada, este manual é atualizado junto.

Última atualização: 24/10/2026 (ajuste de pré-venda).

---

## 1. O que é o Picking Serena

O Picking Serena é o sistema da Serena (CD Porto Belo) que organiza o caminho de um pedido desde a venda até a entrega ao cliente:

1. **Comercial** importa a pré-venda (PDF do sistema de vendas) e define o tipo de envio.
2. Pedidos do **e-commerce** (site e marketplaces) entram sozinhos pela integração com a Magazord.
3. **Separação** (separadores no celular) coleta as peças no estoque, guiada por endereço, mapa e leitura de código de barras.
4. As peças vão para a **mesa de expedição** (em bandeja, cesta ou direto na mesa) para conferência e embalagem.
5. Pedidos que o cliente vai buscar, ou que esperam encomenda, ficam guardados nas **colmeias** (nichos numerados, ex.: A1, B2).
6. Itens vendidos sob encomenda passam por **Compras**, que encomenda aos fornecedores, importa as notas fiscais e acompanha a chegada.
7. O **Recebimento** (Estoque) confere as caixas e os itens que chegaram dos fornecedores; quando a encomenda de um pedido chega completa, ele volta para a separação.

Endereço do sistema: https://picking-serena.vercel.app (funciona no computador e no celular; no celular dá para "Adicionar à tela inicial" para usar como aplicativo).

---

## 2. Acesso, login e níveis

### 2.1 Entrar
- Entre com **usuário** (ex.: `joao.silva`) ou e-mail, e a senha.
- Esqueceu a senha: peça ao Administrador. Ele define uma nova senha em **Usuários → ⚙ (engrenagem) → Trocar senha**.
- "Acesso ainda não liberado": a conta existe mas não tem nível de acesso. O Administrador precisa liberar em **Usuários**.
- Para sair: link **Sair** embaixo do seu nome, no canto superior.

### 2.2 Níveis de acesso
Uma pessoa pode ter **mais de um nível**; as permissões se somam (ex.: "Compras + Estoque").

| Nível | O que faz | Abas que vê |
|---|---|---|
| Administrador | Tudo, inclusive usuários e integrações | Todas |
| Supervisor | Todas as operações, sem gestão de usuários | Comercial, Separação, Separados, Colmeias, Compras, Recebimento, Locais |
| Comercial | Importa pré-vendas, define tipo de envio, acompanha pedidos e colmeias | Comercial (com as colmeias na lateral) |
| Compras | Encomendas aos fornecedores, notas fiscais, decisões de "Tem encomenda", devolução de peças da colmeia | Compras, Recebimento, Colmeias |
| Financeiro | Cadastra pedidos na colmeia (Novo pedido na colmeia) e consulta as colmeias | Colmeias |
| Estoque | Endereços, EANs, etiquetas, recebimento de mercadoria | Recebimento, Locais, Colmeias |
| Separador | Coleta dos pedidos no celular | Separação, Separados, Colmeias |
| Conferente | Mesa de expedição e guarda nas colmeias | Separação (mesa), Separados, Colmeias |
| Painel TV | Só mostra o painel da fila na TV | Painel |

Separadores também têm canais liberados: **Venda Consultiva** (pré-vendas) e/ou **E-commerce**. Quem não tem o canal liberado não vê nem separa pedidos daquele canal.

### 2.3 Itens do topo da tela
- **Sincronizado** (bolinha verde): os dados estão em tempo real com os outros setores. "Modo local" ou aviso vermelho = sem conexão.
- **Botão de tema** (círculo meio preenchido): alterna automático / claro / escuro.
- **Sino**: liga as notificações no celular (som e aviso de novo pedido). Aparece para Separação e para Compras. No iPhone, as notificações só funcionam com o sistema adicionado à tela inicial.
- **Atualizar**: busca tudo de novo no servidor.

---

## 3. Comercial · Integração de pré-vendas

Tela dividida em duas partes: à esquerda a importação da pré-venda; à direita **Pedidos na expedição** e **Colmeias**.

### 3.1 Importar uma pré-venda
1. **Arraste o PDF** da pré-venda (formato "Pré-venda - Nº" ou "Orçamento - Nº" do sistema de vendas) para a área indicada, ou clique para escolher o arquivo.
2. O sistema lê número, data, cliente, cidade, vendedor, observações, valor e itens.
3. Confira a **Transportadora** (o sistema tenta identificar pela observação; dá para digitar ou escolher da lista).
4. Itens sem endereço mostram "sem local": dá para digitar o endereço ali mesmo (ex.: `R1-LB-BIN-8.M`) e **Salvar**, ou enviar assim mesmo.
5. Escolha o **Tipo de envio** (item 3.2) e as marcações de retirada (item 3.3).
6. Clique em **Enviar para expedição** (ou **Enviar para Compras**, no caso "Tem encomenda").

**Administrador**: antes de enviar, na tabela de itens dá para **ajustar a quantidade** de cada item, **excluir** (×) e **Adicionar item** pelo SKU ou descrição. Fica registrado no histórico do pedido que os itens foram ajustados pelo administrador.

Se a pré-venda já estiver no sistema, vira um **ajuste de pré-venda** (ver 3.3a).
"Não reconheci este PDF": o arquivo não está no formato da pré-venda/orçamento ou não tem a tabela de itens.

### 3.2 Tipos de envio
- **Envio total**: tudo tem pronta entrega. A separação coleta tudo e o pedido vai para o envio.
- **Envio parcial**: envia agora o que tem em estoque. Na coluna "Sob encomenda" informe a quantidade de cada item que é encomenda (ou marque "todas"). Os itens de encomenda vão direto para Compras (aba **Em aberto**, sem precisar de decisão) e Compras recebe um aviso. O que tem em estoque segue para a separação (1º envio). Quando a encomenda chegar, sai o 2º envio.
- **Tem encomenda**: não marca nada. A pré-venda vai inteira para **Compras** (aba **Para decidir**), que decide: encomendar tudo, separar o que tem na loja e guardar na colmeia aguardando o resto, ou enviar tudo. O botão fica **Enviar para Compras**.

Outros tipos que aparecem no sistema (definidos por Compras ou pelo administrador): **Encomenda total** (todos os itens são encomenda; não passa pela separação até chegar) e **Aguarda encomenda** (separa o que tem e guarda na colmeia até a encomenda chegar).

### 3.3 Retirada
- **Retira na Loja** (verde): o cliente vem buscar depois. Ao terminar a separação, o pedido vai para uma **colmeia** e fica "Pronto para o cliente retirar".
- **Cliente está na loja** (vermelho, urgente): o cliente está esperando. O pedido fura a fila (aparece primeiro para os separadores) e termina na **mesa**, sem ir para colmeia; é entregue direto ao cliente.
- Sem marcação: entrega por transportadora; termina na mesa/bandeja para conferência e envio.

Ordem de prioridade na fila: Cliente está na loja → Retira na Loja → demais, por ordem de chegada.

### 3.3a Ajuste de pré-venda (importar de novo uma pré-venda que já está no sistema)
Quando o cliente muda o pedido (quantidade, modelo, item novo ou removido), o Comercial importa de novo o PDF da mesma pré-venda.
- O sistema reconhece o número e mostra **Ajuste da pré-venda #X**, comparando as versões: quantidade que aumentou/diminuiu, **item novo**, **item removido** e **troca de modelo** (sai um item, entra outro). O tipo de envio e as marcações de retirada vêm preenchidos com os da versão anterior.
- **Ainda não separado**: o botão é **Atualizar pré-venda**; o pedido só é atualizado e mantém a posição na fila.
- **Já separado** (na bandeja, na mesa, na área de envio ou na colmeia): o botão é **Enviar ajuste para a separação**; vira uma tarefa de ajuste no **topo da fila** dos separadores.
- **Sendo separado agora**: o separador vê o aviso "Pré-venda ajustada pelo Comercial"; o que falta coletar já vem com a quantidade nova e o que já foi coletado vira tarefa de ajuste depois.
- **Pedido que já saiu** (enviado, retirado pelo cliente, entregue na loja ou 1º envio feito): **Ajuste bloqueado**; combine direto com a expedição.
- Se o ajuste mexer em item de **encomenda**, Compras recebe o aviso "Pré-vendas ajustadas pelo Comercial · corrija o pedido ao fornecedor" no topo da tela de Compras e marca **Ciente** quando corrigir.
- Na lateral, o pedido mostra "Ajuste pendente na separação" e depois "Ajuste da pré-venda concluído".

### 3.4 Pedidos na expedição (lateral)
Lista os pedidos de Venda Consultiva do dia e os ainda abertos, com: número, situação, cliente, tipo de envio, quantas referências já foram separadas, faltas, tempo desde a integração, "Tempos" (linha do tempo) e referências sob encomenda.

### 3.5 Colmeias (lateral do Comercial)
O Comercial não tem aba de Colmeias: tudo fica nesta seção, à direita. Funciona igual à aba Colmeias (seção 6): mapa, busca, itens da pré-venda, **Cliente irá retirar / Enviar** (pelo QR code) e **+ Novo pedido na colmeia**.

### 3.6 Etiquetas de teste
Botão no topo do Comercial. Mostra códigos de barras de exemplo na tela para testar o leitor/celular.

---

## 4. Separação (celular)

### 4.1 A fila
Aba **Separação**. Mostra os pedidos **Aguardando separação** e **Em separação**, já na ordem de prioridade (urgentes primeiro, com faixa vermelha "CLIENTE NA LOJA" ou verde "RETIRA NA LOJA").
- Quem separa os dois canais vê o seletor **Venda Consultiva / E-commerce** com a quantidade de cada um.
- **Separação em lote** (e-commerce): escolha por canal (site/marketplace) ou por transportadora e separe um pedido atrás do outro.
- Embaixo aparece **Separados · com bandeja ou mesa**: pedidos já separados que ainda ocupam bandeja/mesa, com o botão **Liberar bandeja** (ou "Liberar bandeja e mesa").
- **Painel TV**: abre o painel da fila para deixar numa TV.

### 4.2 Separar um pedido, passo a passo
Toque no pedido para começar. O cronômetro de picking começa a contar.
1. **Bandeja** (se a configuração "Usar bandeja" estiver ligada): bipe uma bandeja vazia. Sem bandeja ou peças grandes: toque em **usar a Mesa** (ou bipe a etiqueta de outra mesa). Para juntar vários pedidos, bipe uma **cesta**.
2. **Local**: a tela mostra o endereço (Rua-Lado-Tipo-Nível.Coluna, ex.: R1-LB-BIN-8.M), o desenho do móvel e o **mapa com a rota**. Vá até o local.
3. **Bipe o produto** (EAN da embalagem ou o código do produto). Produto errado: o sistema avisa "Código X não é de nenhuma peça deste pedido".
4. **Quantidade**: conte as peças, ajuste com − / + (ou digite a quantidade e Enter) e toque em **Confirmar N pç**.
5. Item **não cabe na bandeja**: toque em "Não cabe na bandeja · colocar na Mesa".
6. **Falta**: não achou a peça (ou achou menos)? Toque em **Falta** (ou "Encerrar com N (falta)"). Fica registrado como falta/parcial.
7. Repita para cada item. A lista embaixo mostra o andamento (✓ coletado, ! falta). Toque num item para ir direto a ele.
8. No último item o picking termina sozinho: o pedido vai para a **mesa de expedição** (ou para a colmeia, se for de retirada/aguarda encomenda).

Produto **sem local cadastrado**: procure pelo código e bipe normalmente; depois avise o Estoque para cadastrar o local.
Item de **encomenda que chegou** (2ª etapa): o local aparece como **Área de recebimento**, com o número da NF; pegue a peça nas caixas recebidas e bipe normalmente.

Botões no topo da tela de separação: **voltar**, **reiniciar separação** (seta circular), **excluir separação** (lixeira, pede motivo), cronômetro e contador de itens.

Pedido do e-commerce **cancelado na Magazord** durante a separação: aparece faixa vermelha "Pedido CANCELADO na Magazord · pare a separação e devolva as peças". Situação mudou: faixa amarela pedindo para confirmar com o responsável.

### 4.2a Ajuste de pré-venda (separador)
Pedidos que o Comercial refez aparecem no topo da fila, em **Ajustes de pré-venda** (faixa roxa "AJUSTE DE PRÉ-VENDA"), com o resumo (ex.: "retirar 4 pç · coletar 2 pç") e onde o pedido está.
1. **Achar o pedido**: a tela diz onde ele está e o que mudou. Na bandeja ou na colmeia: bipe a etiqueta da bandeja/colmeia. Na mesa ou na área de envio: toque em **Encontrei o pedido**. Se o pedido já foi finalizado sem bandeja, ele provavelmente está na área de envio aguardando a transportadora.
2. **Retirar**: tire as peças do pedido bipando cada uma, confirme e **devolva ao endereço do estoque bipando a etiqueta do endereço** (sem endereço: guarde e toque em **Guardei no estoque**).
3. **Coletar**: vá ao local indicado, bipe cada peça, confirme e junte ao pedido.
4. **Devolver**: coloque o pedido de volta no mesmo lugar (bandeja, mesa, colmeia ou área de envio) e toque em **Ajuste concluído**.
Tudo fica registrado no histórico do pedido.

### 4.3 Depois da separação
- Tela de conclusão mostra referências, tempo de picking e onde o pedido está (mesa, bandeja, colmeia).
- Item que estava em falta e foi encontrado: bipe a peça nessa tela para registrar.
- **Bandejas**: depois da conferência no packing, a bandeja precisa ser **desvinculada** (bipe a bandeja em "Bandejas" ou use **Liberar bandeja** na lista). Uma bandeja vinculada não pode ser usada em outro pedido.

### 4.4 Mesa de expedição (Conferente)
- **Receber os pedidos separados**: quando o pedido chegar na mesa, toque em receber / bipe. Se o pedido for de colmeia, a tela indica em qual colmeia guardar.
- **Guardar na colmeia**: leve as peças à colmeia indicada e **bipe a etiqueta da colmeia** para confirmar. Colmeia errada é recusada.

### 4.5 Separados
Aba **Separados**: histórico dos pedidos separados (e os excluídos do dia), com transportadora, cliente, horário, tempo de picking e situação.
- Filtro **Todos · Venda Consultiva · E-commerce** e busca por número do pedido ou cliente.
- **Editar** (só Administrador): altera tipo de envio, retirada, transportadora, situação (onde está no fluxo), bandeja/mesa, colmeia e observação. Tudo fica registrado no histórico do pedido. Voltar a situação para "Aguardando separação" recoloca o pedido na fila e avisa os separadores.

### 4.6 Painel TV
Endereço `/#tv` (botão **Painel TV**). Mostra a fila de separação em letras grandes, com som de alerta (toque em "Ativar som") e **Tela cheia**. O nível "Painel TV" só vê esta tela.

---

## 5. Pedidos do e-commerce (Magazord)
- A cada 2 minutos o sistema importa os pedidos na situação **5 · Crédito e Cadastro Aprovados** das últimas 72 horas (site e marketplaces, sem Mercado Livre Full).
- Se a situação mudar na Magazord, o pedido sai da fila sozinho (se voltar para a 5, volta para a fila).
- A transportadora vem do próprio pedido; o logotipo aparece se estiver cadastrado em **Usuários → Logotipos das transportadoras**.
- Configuração da integração: **Usuários → Integração Magazord** (Administrador): Importar agora, ver última importação.

---

## 6. Colmeias

Aba **Colmeias** (Separação, Compras, Estoque, Administrador) ou lateral do Comercial. As colmeias guardam:
- pedidos **aguardando encomenda** (amarelo no mapa);
- pedidos **prontos para o cliente retirar ou para enviar** (verde: "Pronto · retirar ou enviar").

### 6.1 Mapa e lista
- **Mapa das colmeias**: grade (ex.: colunas A–F, linhas 1–4) com o número do pedido em cada nicho ocupado. O tamanho da grade é configurado em **Tamanho da grade** (Admin, Supervisor, Estoque).
- **Pedidos nas colmeias**: cada pedido mostra a colmeia, cliente e situação.
- **Busca**: por número da pré-venda, nome do cliente, SKU ou descrição do produto (também pelo número do pedido ao fornecedor). Se a busca achar um produto, o card abre sozinho e destaca o item.
- **Ver itens da pré-venda**: abre (com animação) todos os itens do pedido, mostrando o que está na colmeia e o que ainda é encomenda (com a situação de Compras e a previsão de chegada).

### 6.1a Editar itens de um pedido na colmeia (Administrador)
No pedido da lista de colmeias, o Administrador tem o link **Editar itens**. Na janela dá para:
- mudar a **quantidade total** de cada item;
- dividir cada item entre **Encomenda** e **Na colmeia** (já separado);
- **excluir** itens (×) e **adicionar** itens pelo SKU ou descrição (marcando "encomenda" se for o caso).
Ao **Salvar itens**: o que está "na colmeia" passa a contar como separado; mudanças em itens de encomenda são avisadas para Compras; se não sobrar nenhuma encomenda, o pedido fica **Pronto** (para retirar ou enviar); se voltar a ter encomenda, fica **Aguardando encomenda**. Tudo fica no histórico do pedido.

### 6.2 Novo pedido na colmeia (cadastro manual)
Botão **+ Novo pedido na colmeia**:
1. Escolha **por que vai para a colmeia**: **Cliente vai retirar** ou **Aguardando encomenda** (obrigatório).
2. Importe o PDF da pré-venda ou preencha número e cliente (observação opcional).
3. **Aguardando encomenda**: marque **quais itens estão aguardando encomenda** e quantas peças de cada um (ou **Marcar todos** / "todas"). Os demais itens vão para a colmeia agora. Os itens marcados aparecem para Compras em **Em aberto** para encomendar. Sem o PDF não dá para marcar os itens.
4. Escolha a colmeia livre (toque no mapa ou bipe a etiqueta) e **Guardar na colmeia**.
Quem pode cadastrar: Separação, Conferente, Comercial, **Financeiro**, Supervisor e Administrador.

### 6.3 Tirar o pedido da colmeia (entrega ou envio)
Botões no pedido: **Cliente irá retirar** ou **Enviar**.
1. Abre a tela **Vá até a colmeia**: bipe a etiqueta da colmeia (leitor ou câmera). Colmeia errada é recusada.
2. Aparecem todos os itens do pedido para conferir com o cliente.
3. Toque em **Confirmar: cliente retirou** (ou **Confirmar envio**). A colmeia fica livre e o pedido é finalizado.
- Se a encomenda ainda não chegou, o aviso diz que o cliente leva só o que está na colmeia; o pedido vira **envio parcial** e a encomenda continua em aberto em Compras ("1º envio feito · aguardando encomenda"). Quando a encomenda chegar, sai o 2º envio.

**Comercial e Compras no computador**: ao tocar em Cliente irá retirar/Enviar abre um **QR code**. Aponte o celular: o processo abre direto, **sem precisar entrar no sistema** no celular. O link serve só para aquele pedido, uma vez, por 2 horas, e a liberação fica registrada no nome de quem gerou o QR. Também dá para usar **Fazer neste aparelho**. Separação, Estoque e Administrador vão direto para a tela de bipar.

---

## 7. Compras · encomendas

Aba **Compras**. Abas internas (todas com paginação):
- **Para decidir**: pré-vendas "Tem encomenda" esperando a decisão de Compras.
- **Em aberto**: pedidos com itens sob encomenda ainda não encomendados por completo.
- **Aguardando chegada**: itens já encomendados, com prazo (no prazo / atrasado X dias).
- **Pedidos ao fornecedor**: pedidos de compra importados.
- **Concluídas**: encomendas que já chegaram.

Compras recebe **aviso no sistema (som + mensagem)** e **notificação no celular** (com o sino ligado) quando chega pedido "Tem encomenda" para decidir ou envio parcial com encomenda.

### 7.1 Decidir um "Tem encomenda"
O card mostra cada item com as colunas **Vendido**, **Encomendar** e **Da loja**. Em "Encomendar" digite quantas peças de cada item serão encomendadas (ou marque "todas"; o botão **Encomendar tudo** marca todos). O sistema mostra o resultado da decisão:
- **Encomenda total** (encomendar tudo): não passa pela separação nem usa colmeia; espera chegar tudo.
- **Separar o que tem na loja** (parte encomenda, parte da loja): as peças da loja vão para a separação e ficam guardadas numa colmeia livre (indicada na tela) até a encomenda chegar.
- **Nada a encomendar**: vai para a separação como envio total (os separadores são avisados).
Depois toque em **Confirmar e encaminhar**. O card também mostra o que o Comercial pediu e se o cliente retira ou está na loja.

### 7.2 Importar o pedido feito ao fornecedor (PDF)
Botão **Importar pedido do fornecedor**. Fornecedores reconhecidos: Living, Zen, Italy (Italyline), Torralba, Jador.
1. Envie o PDF do pedido ao fornecedor. O sistema lê fornecedor, número, itens e quantidades.
2. Informe a **previsão de entrega** (obrigatória).
3. Relacione cada linha do fornecedor ao **SKU da Serena** (busca por SKU ou descrição; dá para cadastrar produto novo). O código do fornecedor fica guardado no produto para as próximas vezes.
4. Relacione às **pré-vendas** (busca por número ou nome do cliente). Dá para **Adicionar pré-venda (PDF)** dentro da própria importação.
5. Os itens passam a "Encomendado" e entram em **Aguardando chegada** com a previsão.

### 7.3 Importar a nota fiscal (NF) do fornecedor
Botão **Importar nota fiscal do fornecedor**: arquivo **XML** da NF-e ou **PDF do DANFE**.
- O sistema distribui os itens da nota entre as pré-vendas automaticamente, usando os vínculos dos pedidos ao fornecedor. Dá para ajustar.
- Aceita **faturamento parcial** (a nota traz só parte dos itens). Situações: "Faturado em parte", "Faturado · a caminho".
- A nota fica em **Notas a receber** para o Recebimento.

### 7.4 Chegada e liberação
- Quando o Recebimento confirma a nota e **todos os itens de encomenda** de um pedido chegaram, o pedido volta sozinho para a separação como **Encomenda recebida** (local "Área de recebimento"). Termina na mesa ou na colmeia.
- Também dá para marcar manualmente **Chegou** / **Desfazer chegada** em cada item e usar **Encomenda completa · enviar para a separação**.

### 7.5 Editar pedido que está na colmeia (devolver ao estoque)
No card: **Editar pedido · retirar da colmeia X** (permissão "devolver"). No computador abre QR code para fazer no celular.
1. Bipe a colmeia.
2. Bipe todas as peças que estão nela (em qualquer ordem).
3. Leve cada item ao seu endereço e bipe a etiqueta do endereço.
No fim, o pedido volta para **Para decidir** e a colmeia fica livre.

---

## 8. Recebimento (Estoque / Compras)

Aba **Recebimento**: chegada de mercadoria dos fornecedores.
1. **Bipe o código de barras da DANFE** (nota impressa que vem com as caixas, 44 dígitos) ou digite o número da NF. Ou toque na nota em **Notas a receber**.
2. **Conte as caixas**: cada bipe da mesma nota soma uma caixa (ou use − / +). Mostra "X de Y caixas".
3. **Confira os itens visualmente**, item por item: se a quantidade bate, toque em **OK**; se veio diferente, digite o que chegou e toque em OK (fica registrado como divergência).
4. **Confirmar recebimento**. As pré-vendas atendidas são liberadas para a separação.
- A conferência é **salva automaticamente**; dá para parar ("Salvar e continuar depois") e continuar depois, por outra pessoa ou outro aparelho. Na lista aparece "Em conferência".
- **Nota ainda não importada por Compras**: dá para registrar a chegada assim mesmo; Compras amarra os itens depois.
- **No computador**: tocar numa nota abre um **QR code de uso único** para fazer a conferência no celular **sem login** (vale 4 horas, dá para parar e retomar pelo mesmo link; fica registrado no nome de quem gerou). Ou **Fazer neste aparelho**.

---

## 9. Locais (Estoque)

Aba **Locais**: endereços dos produtos, EAN e etiquetas.
- **Endereço** = Rua-Lado-Tipo-Nível.Coluna. Ex.: `R1-LB-BIN-8.M` = rua 1, lado B, bin, nível 8, coluna M. Tipos: **GAV** gaveta, **COL** colmeia (de estoque), **BIN** bin.
- **Criar estrutura**: cadastra um móvel/bloco de locais de uma vez (rua, lado, tipo, faixa de níveis e colunas).
- Clique num local da grade para **colocar o produto**, **remover do local** ou **Gerar etiqueta deste local (PDF)**.
- **Produtos e EAN**: busque por código, descrição ou EAN. Para cadastrar o EAN, clique no campo do produto e bipe a embalagem (o leitor digita e dá Enter; salva na hora). **Novo produto** cadastra um item.
- **Etiquetas** ("O que imprimir"): Endereços, Produtos, Bandejas, Mesas, Cestas, Colmeias.
- **Configuração da separação**: usar bandeja, mesas e cestas; tamanho da grade das colmeias.

---

## 10. Usuários (Administrador)
- **Pessoas com acesso**: lista com níveis (etiquetas), canais (Venda Consultiva / E-commerce) e situação.
- **⚙ Configurar usuário**: marcar um ou mais **níveis de acesso**, ativar/desativar, canais que separa, **trocar senha**, **remover acesso**. Painel TV não combina com outros níveis.
- **Criar usuário**: nome, usuário ou e-mail, senha inicial (mín. 6), nível e canais. A conta já nasce liberada (sem e-mail de confirmação).
- **Adicionar pessoa que já criou conta**: busca pelo nome e define o nível.
- **Níveis de acesso**: tabela de permissões por nível.
- **Simular um nível**: ver o sistema como outro nível (só muda a sua tela).
- **Integração Magazord**, **Logotipos das transportadoras**, **Usar bandeja**.
- **Assistente Lucas**: configuração do assistente (chave da API e modelo).
- A aba **Chamados** fica ao lado de Usuários (ver seção 10a).

---

## 10a. Lucas (assistente) e Chamados
- **Lucas**: botão flutuante no canto inferior direito de todas as telas (menos Painel TV e links de QR code). Abre um chat para tirar dúvidas sobre o sistema, 24 horas.
  - Dá para **escrever**, **falar** (botão do microfone: a fala vira texto) e **anexar prints da tela** (botão da imagem, colar com Ctrl+V ou arrastar; até 3 por mensagem).
  - O botão **+** começa uma nova conversa. A conversa fica guardada no aparelho por 12 horas.
  - Limite de 150 perguntas por pessoa a cada 24 horas.
- **Chamados** (aba só do Administrador): lista todas as conversas com o Lucas, cada uma com um **título** que resume o assunto, quem perguntou, quando, quantas perguntas e em qual tela. **Ver conversa** mostra as perguntas e respostas.
  - Quando alguém pede uma função que o sistema ainda não tem, o chamado recebe a etiqueta **Criar uma nova Função** e a função entra na aba **Novas funções**, uma lista de tarefas para o Administrador marcar como **criada** quando for publicada.
  - Filtros: **Todos** / **Criar uma nova Função** e busca por assunto, pessoa ou tela.

---

## 11. Situações de um pedido (o que cada uma significa)
- **Aguardando separação**: na fila, ninguém começou.
- **Em separação**: um separador está coletando.
- **Na mesa / A caminho da mesa**: separado, aguardando conferência na mesa de expedição.
- **Na mesa · guardar na colmeia X**: precisa ser guardado na colmeia indicada.
- **Na colmeia · aguardando encomenda**: peças da loja guardadas, esperando a encomenda.
- **Pronto · cliente retira na colmeia X**: aguardando o cliente buscar.
- **Finalizado · na mesa / entregue ao cliente na loja / enviado**: concluído.
- **Aguardando decisão de Compras**: "Tem encomenda" esperando Compras.
- **Encomenda total · aguardando chegada**: tudo encomendado.
- **1º envio feito · aguardando encomenda**: envio parcial; falta a encomenda.
- **Excluído**: separação excluída (com motivo).

---

## 12. Dúvidas comuns
- **Bipei e não aconteceu nada**: confira se o campo "Leitor pronto" (barra de baixo) está ativo; toque nele. No celular, use **Câmera** para ler pela câmera (ou por foto).
- **"Local errado"**: você bipou outro endereço; vá ao endereço mostrado.
- **"Bandeja X está em separação no pedido Y"**: a bandeja ainda está vinculada a outro pedido; use outra ou finalize/libere a anterior.
- **Pedido não aparece para mim**: verifique o canal (Venda Consultiva / E-commerce) liberado para você em Usuários, e se o pedido não está com Compras ("Tem encomenda").
- **Colmeia ocupada**: escolha outra livre no mapa.
- **Produto sem EAN**: bipe pelo código do produto; peça ao Estoque para cadastrar o EAN.
- **Notificação não chega no iPhone**: adicione o sistema à tela inicial (Compartilhar → Adicionar à Tela de Início), abra por ali e ligue o sino.
- **QR code expirou / já foi usado**: gere um novo no computador.
- **Sem conexão**: confira a internet e toque em Atualizar; os dados voltam a sincronizar sozinhos.

Quando o Lucas não souber responder, ele orienta a falar com o Administrador do sistema.
