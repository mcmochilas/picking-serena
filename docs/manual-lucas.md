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
1. **Arraste o PDF** da pré-venda (formato "Pré-venda - Nº", "Orçamento - Nº" ou **"Condicional - Nº"** do sistema de vendas) para a área indicada, ou clique para escolher o arquivo. O tipo do documento aparece no topo (Pré-venda, Orçamento ou Condicional). A condicional tem numeração própria: uma condicional e uma pré-venda com o mesmo número são pedidos diferentes.
2. O sistema lê número, data, cliente, cidade, vendedor, observações, valor e itens.
3. Confira a **Transportadora** (o sistema tenta identificar pela observação; dá para digitar ou escolher da lista).
4. Itens sem endereço mostram "sem local": dá para digitar o endereço ali mesmo (ex.: `R1-LB-BIN-8.M`) e **Salvar**, ou enviar assim mesmo.
5. Escolha o **Tipo de envio** (item 3.2) e as marcações de retirada (item 3.3).
6. Clique em **Enviar para expedição** (ou **Enviar para Compras**, no caso "Tem encomenda").

**Administrador**: antes de enviar, na tabela de itens dá para **ajustar a quantidade** de cada item, **excluir** (×) e **Adicionar item** pelo SKU ou descrição. Fica registrado no histórico do pedido que os itens foram ajustados pelo administrador.

Se a pré-venda já estiver no sistema, vira um **ajuste de pré-venda** (ver 3.3a).
"Não reconheci este PDF": o arquivo não está no formato da pré-venda/orçamento/condicional ou não tem a tabela de itens.

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
- **Já separado + Tem encomenda** (ex.: entrou item novo, parte de pronta entrega e parte encomenda): escolha **Tem encomenda** no ajuste. Os itens novos e o aumento de quantidade vão para **Compras** decidir (aparece em "Para decidir" com a etiqueta **Ajuste**); o que já foi separado continua onde está. O que Compras decidir separar da loja vira tarefa de ajuste para o separador, que coleta e junta na **mesma colmeia** do pedido. Se o pedido ainda não estava em colmeia e passou a ter encomenda, o sistema reserva uma colmeia livre e o separador guarda o pedido inteiro nela no fim do ajuste. Se o pedido estiver sendo separado naquele momento, espere terminar para enviar o ajuste como Tem encomenda.
- **Sendo separado agora**: o separador vê o aviso "Pré-venda ajustada pelo Comercial"; o que falta coletar já vem com a quantidade nova e o que já foi coletado vira tarefa de ajuste depois.
- **Pedido que já foi entregue ao cliente** (enviado, retirado pelo cliente ou entregue na loja): pode importar a pré-venda de novo. Ela entra como um **pedido novo com o mesmo número** (selo **2ª entrega** na fila; no sistema o código fica PV-123-2, -3...), e o pedido anterior continua no histórico. Enquanto a 2ª entrega não sair, importar de novo é ajuste dela. Vale também no cadastro direto na colmeia e na pré-venda adicionada por Compras.
- **1º envio já feito, aguardando encomenda**: **Ajuste bloqueado**; combine direto com a expedição.
- Se o ajuste mexer em item de **encomenda**, Compras recebe o aviso "Pré-vendas ajustadas pelo Comercial · corrija o pedido ao fornecedor" no topo da tela de Compras, um balão por pré-venda, e fecha o balão no **×** quando corrigir.
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
  - **Pular pedido** (ícone ⏭ no topo da tela de separação, só durante o lote): pergunta "Pular o pedido #X?"; ao confirmar, o pedido volta para a fila normal (outro separador pode pegar) e o lote segue para o próximo. Se já tinha peças coletadas, devolva-as aos locais (a coleta volta a zero); a bandeja é liberada. O pedido pulado não volta no mesmo lote e fica no histórico como "Pulado na separação em lote".
- Embaixo aparece **Separados · com bandeja ou mesa**: pedidos já separados que ainda ocupam bandeja/mesa, com o botão **Liberar bandeja** (ou "Liberar bandeja e mesa").
- **Painel TV**: abre o painel da fila para deixar numa TV.

### 4.1a Trocar o separador ou o canal de um pedido (Administrador)
Na fila, cada pedido tem um **lápis** (só o Administrador vê). Ele abre "Editar pedido", que tem dois campos no topo:
- **Separador**: escolhe quem vai separar o pedido. Se o pedido ainda está na fila, ele fica **reservado** para essa pessoa: os outros separadores não o veem mais e o card mostra "Separador: Nome". Se já está em separação, passa para a nova pessoa e o que já foi bipado continua valendo; quem estava separando sai da tela com o aviso "O Administrador passou o pedido para outra pessoa". **Nenhum** devolve o pedido para a fila, para qualquer separador pegar. Só aparecem pessoas com nível Separador, Supervisor ou Conferente. Se a pessoa não separa aquele canal (opção Venda Consultiva / E-commerce no cadastro em Usuários), o sistema não deixa salvar.
- **Canal**: passa o pedido de **Venda Consultiva para E-commerce** ou o contrário. Antes de concluir, abre a tela **Tipo de envio**, igual à do Comercial ao subir a pré-venda: Envio total (vai para a fila), Envio parcial (marque quantas peças de cada item são encomenda; Compras é avisado) ou Tem encomenda (o pedido vai para Compras decidir). Também tem Retira na Loja e Cliente está na loja. **Voltar** cancela a transferência sem salvar nada.
Tudo fica registrado no histórico do pedido com o nome do Administrador. O mesmo "Editar" existe na aba Separados.

### 4.2 Separar um pedido, passo a passo
Toque no pedido para começar. O cronômetro de picking começa a contar. No topo da tela aparecem o número do pedido e o **nome do cliente** (Venda Consultiva e E-commerce).
1. **Bandeja** (se a configuração "Usar bandeja" estiver ligada): ao abrir o pedido aparece só a tela **"Passo 1 · Bipe uma bandeja vazia"** (com o total de referências e peças); os produtos aparecem depois de bipar a bandeja. Sem bandeja ou peças grandes: toque em **usar a Mesa** (ou bipe a etiqueta de outra mesa). Para juntar vários pedidos, bipe uma **cesta**.
2. **Local**: a tela mostra o endereço (Rua-Lado-Tipo-Nível.Coluna, ex.: R1-LB-BIN-8.M), o desenho do móvel e o **mapa com a rota**. Vá até o local.
   - **Mapa 3D ou 2D**: o botão no canto do mapa troca entre o **3D** (navegação: a câmera segue o caminho da mesa até a estante, chega de frente para o local e acende a caixa, gaveta ou nicho certo, com o selo "Olhe no…", ex.: "Gaveta 2 · Gaveteiro C · 2ª gaveta de baixo") e o **2D** (planta vista de cima, ocupando a largura da tela). Cada pessoa fica com o que escolheu. A seta redonda mostra a rota de novo. Se o aparelho não abrir o 3D, aparece o 2D.
3. **Bipe o produto** (EAN da embalagem ou o código do produto) na Venda Consultiva. **No E-commerce, bipe a etiqueta do endereço** (o produto também é aceito; produto sem endereço cadastrado: bipe o produto). Produto errado: o sistema avisa "Código X não é de nenhuma peça deste pedido".
4. **Quantidade**: conte as peças, ajuste com − / + (ou digite a quantidade e Enter) e toque em **Confirmar N pç**.
5. Item **não cabe na bandeja**: toque em "Não cabe na bandeja · colocar na Mesa".
6. **Falta**: não achou a peça (ou achou menos)? Toque em **Falta** (ou "Encerrar com N (falta)"). Fica registrado como falta/parcial.
7. Repita para cada item. A lista embaixo mostra o andamento (✓ coletado, ! falta). Toque num item para ir direto a ele.
8. No último item o picking termina sozinho: o pedido vai para a **mesa de expedição** (ou para a colmeia, se for de retirada/aguarda encomenda).

Produto **sem local cadastrado**: procure pelo código e bipe normalmente; depois avise o Estoque para cadastrar o local.
Item de **encomenda que chegou** (2ª etapa): o local aparece como **Área de recebimento**, com o número da NF; pegue a peça nas caixas recebidas e bipe normalmente. Se o cliente vai retirar (Retira na loja, ou estava na loja no dia da venda), aparece a faixa **"Encomenda chegou · no fim, guarde numa colmeia"**: no fim o separador escolhe e bipa a colmeia (uma livre, junto com outra pré-venda, ou a mesma onde já está a parte da loja, se houver; não há colmeias reservadas) e o pedido fica **completo na colmeia, aguardando o cliente retirar**. Na 2ª etapa o pedido aparece como "Retira na loja" (verde) e a TV não anuncia "cliente aguarda na loja".

### 4.2b Conferência no local (Envio total + Cliente na loja)
Pedido da Venda Consultiva com **Envio total** e **Cliente está na loja** não usa bandeja nem vai para a mesa. A tela mostra o aviso verde "Conferência no local". Em cada endereço, **bipe cada peça** (contador "2 de 4 pç bipadas"); ao completar a quantidade o sistema passa sozinho para o próximo item. Há **Desfazer 1** e **Encerrar com N (falta)**. No fim aparece "Coloque as N pç na sacola e entregue direto ao vendedor": entregue e toque em **Entreguei ao vendedor**. Fica no histórico como "Conferido no local" e "Entregue ao vendedor". Os demais tipos de envio seguem o fluxo normal (bandeja → produto → quantidade → mesa).

### 4.2d Simulação de bip (permissão)
Os botões "Simular leitura (demo)" só aparecem para quem o Administrador liberar: **Usuários → abrir a pessoa → "Pode usar a simulação de bip"**. Desmarcado (padrão): só bipando de verdade.

### 4.2c Tipo de leitura (engrenagem)
Na barra de leitura, embaixo, a **engrenagem** abre "Como você vai bipar?". Cada separador escolhe uma vez no seu aparelho:
- **Leitor de código (Bluetooth/USB)**: sem botão de câmera; o campo fica sempre pronto, é só bipar. É o padrão.
- **Coletor (leitor embutido no aparelho)**: para coletor Android com gatilho (ex.: Takepot KP58HYT). O campo mostra "Coletor pronto: aperte o gatilho" e a leitura funciona **sem o teclado na tela**; o teclado só abre no botão de digitar (ao lado do campo) e some de novo depois do Enter. O sistema aceita a leitura como teclas, como texto inteiro (com ou sem Enter no final) ou como "colar", e lê mesmo se o separador tocou num botão antes de bipar.
  - **Teste do leitor**: na primeira vez aparece em cima do campo a faixa azul **Bipar sem o teclado na tela · Testar leitor** (também em engrenagem → **Testar o leitor do coletor**). Aperte o gatilho em qualquer código: o teste tenta dois jeitos sem teclado e, por último, com o teclado aberto; o que funcionar fica gravado **naquele aparelho**. Até fazer o teste, o coletor continua com o teclado aberto (modo antigo).
  - Se só ler com o teclado aberto, a limitação é do aplicativo de leitura do coletor: no aplicativo do leitor ("Scanner", nas Configurações do aparelho) troque a saída para **simular teclado** ("Keyboard emulation" / "Key event"), ligue o **Enter no final** e refaça o teste. Nesse modo antigo, se o teclado fechar aparece o aviso **Teclado fechado: o leitor pode não ler** com o botão **Reabrir**.
  - **Outros campos de bipe** (Produtos e EAN: busca, EAN e endereço; janela do produto no celular; colocar produto no local em Endereços; colmeia na pré-venda manual; bandeja na edição do pedido): no coletor sem teclado, tocar no campo deixa ele ativo **sem abrir o teclado**, é só bipar; **tocar de novo no mesmo campo** abre o teclado para digitar. Bipar sem tocar em nada em **Produtos e EAN** joga o código na busca e abre o produto; na janela do produto, cai no campo EAN.
  - Se o teste disser que o leitor não mandou nada: confira se o leitor está ligado no aplicativo do coletor e se a saída não está em "Broadcast".
- **Câmera do celular**: botão grande **Abrir câmera** (tocar no campo do código também abre a câmera; para digitar, use o botão **Digitar** ao lado); ao abrir, espera cerca de 2 s ("Posicione o código no quadro…") para dar tempo de apontar; depois a câmera fica aberta e lê um código atrás do outro, com uma pausa de ~1 s entre leituras (vibra e mostra o resultado a cada leitura) até tocar em Fechar. O botão de teclado continua para digitar o código.

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
- **Guardar na colmeia**: o sistema **não escolhe** a colmeia: o separador escolhe, coloca as peças e **bipa a etiqueta da colmeia**; o pedido fica ligado à colmeia bipada. Se a colmeia já tiver outra pré-venda, o sistema pergunta se quer **Guardar junto**. Se o pedido já estava numa colmeia (ex.: volta da encomenda), ela aparece como sugestão, mas dá para bipar outra.

### 4.5 Separados
Aba **Separados**: histórico dos pedidos separados (e os excluídos do dia), com transportadora, cliente, horário, tempo de picking e situação.
- Filtro **Todos · Venda Consultiva · E-commerce** e busca por número do pedido ou cliente.
- **Itens bipados** (abre junto com o histórico, na seta do card; também no detalhe do pedido em Gestão): cada item do pedido com SKU, nome, situação (✓ coletado, parcial ex. 1/2, falta, encomenda), endereço de onde saiu, como foi confirmado (endereço bipado + contagem, produto bipado + contagem, peça por peça ou sem bipar o produto), hora e quem separou. No topo, o resumo (ex.: 2/2 ref. · 2/2 pç). Pedidos separados antes de 12/11/2026 não têm o "como foi confirmado"; a hora e o separador vêm do bip do endereço, quando houver.
- **Histórico (seta no canto direito do card)**: abre o card e mostra a linha do tempo do pedido, com data, hora e quem fez: entrada (integrado, importado da Magazord ou cadastrado na colmeia), decisão de Compras, início/reinício/conclusão da separação (com tempo de picking), mesa, colmeia, chegada da encomenda, ajustes e edições, pedido pulado no lote, envio/retirada ou exclusão (com motivo). Cores: azul = entrada, verde = etapa concluída, roxo = ajuste/edição, vermelho = exclusão. Pedidos antigos podem ter menos registros.
- **Editar** (só Administrador): altera canal (com confirmação do tipo de envio), separador, tipo de envio, retirada, transportadora, situação (onde está no fluxo), bandeja/mesa, colmeia e observação. Tudo fica registrado no histórico do pedido. Voltar a situação para "Aguardando separação" recoloca o pedido na fila e avisa os separadores.

### 4.6 Painel TV
Endereço `/#tv` (botão **Painel TV**). Mostra a fila de separação em letras grandes, com som de alerta (toque em "Ativar som") e **Tela cheia**. O nível "Painel TV" só vê esta tela.

**Aviso de voz (cliente na loja):** quando há pedido com **Cliente está na loja** esperando separação, depois do alerta sonoro uma voz gravada (a mesma do vídeo do picking, guardada no sistema) diz "Atenção! Pré-venda (número em grupos). Cliente aguarda na loja para retirada." O número é falado em dois grupos: 37526 = "trinta e sete, quinhentos e vinte e seis"; 38038 = "trinta e oito, zero trinta e oito"; 90001 = "noventa, zero zero um". Se em **1 minuto** o pedido não entrar em separação, toca o sinal de atenção e o aviso é repetido (a cada minuto, até alguém iniciar). **Para funcionar, o som precisa estar liberado:** enquanto não estiver, aparece embaixo uma faixa vermelha "Toque na tela (ou aperte OK no controle) para ligar o som"; qualquer toque ou tecla libera e a TV diz "Aviso de voz ligado". O navegador exige esse toque **toda vez que a página abre** (TV reiniciada, página recarregada). Com o som ligado, o botão **Som e voz ligados · testar** toca um aviso de exemplo (pré-venda 37526). Se a voz gravada não carregar em 4 segundos, a TV usa a voz do navegador para não ficar muda. No topo da TV a linha **Último aviso de voz** mostra o número, a hora e qual voz foi usada. Se o navegador da TV suspender o som sozinho, a TV tenta religar; se não conseguir, a faixa vermelha volta. A TV também busca a fila de novo a cada 1 minuto, para não perder pedido se a conexão cair. Em PC/mini-PC com Chrome dá para dispensar o toque abrindo o Chrome com a opção `--autoplay-policy=no-user-gesture-required`.

### 4.7 Painel do showroom
Endereço `/#showroom`, para o monitor da loja (entre com um usuário **Painel TV** e toque na tela uma vez para liberar o som; ⛶ = tela cheia, ✕ = sair). Usa a identidade da Serena Puxadores (petróleo, areia e dourado, com a logomarca), em uma coluna só e letras grandes. Mostra só os pedidos marcados **Cliente está na loja**:
- **Pedido pronto** (no topo, quadro petróleo com borda dourada piscando): "Vendedor(a), busque na expedição", com a hora em que ficou pronto. Ao ficar pronto toca uma **campainha (ding-dong)** duas vezes. Fica na tela pelo tempo configurado (padrão 10 min).
- **Pedidos em separação**: cliente, pré-venda, vendedor(a), barra de progresso, percentual, peças separadas e o separador. A barra anda conforme o separador bipa (atualiza a cada 1,5 s no máximo).
- **Aguardando separação**: posição na fila e há quanto tempo espera. O que não cabe na tela aparece como "+ N pedido(s) na fila".
- **Sem pedidos**: passa os **vídeos de propaganda** em ordem aleatória, em tela cheia; sem vídeos, mostra a logomarca.
- Configuração (Administrador): **Usuários → Configuração → Painel do showroom**: **+ Adicionar vídeo** (MP4 H.264 ou WebM, até 50 MB cada, de preferência 1920×1080), **Ver**/**Remover** (toque duas vezes para confirmar), e quantos minutos o "pronto" fica na tela. O painel não fala os avisos de voz da TV; só toca a campainha.

### Como funcionam as buscas
Em todos os buscadores (Compras, amarração da nota, Recebimento, Colmeias, Separados, Locais, Etiquetas e Chamados) as palavras podem vir **em qualquer ordem**, sem acento e sem diferença de maiúscula ("gold phenix 320" acha "PHENIX 320MM GOLD"). Palavras de 4 letras ou mais aceitam pequenos erros de digitação (uma letra trocada, faltando ou sobrando; duas a partir de 8 letras) e som parecido ("fenix" acha "phenix"). Pedaços de palavra também valem ("pux bel 96"). **Números** só por trecho exato, para não confundir códigos.

---

## 5. Pedidos do e-commerce (Magazord)
- A cada 2 minutos o sistema importa os pedidos na situação **5 · Crédito e Cadastro Aprovados** das últimas 72 horas (site e marketplaces, sem Mercado Livre Full).
- Se a situação mudar na Magazord, o pedido sai da fila sozinho (se voltar para a 5, volta para a fila).
- A transportadora vem do próprio pedido; o logotipo aparece se estiver cadastrado em **Usuários → Logotipos das transportadoras**.
- Configuração da integração: **Usuários → Integração Magazord** (Administrador): Importar agora, ver última importação.
- **Pedido manual**: pedido criado no painel da Magazord pela equipe (não comprado no site nem no marketplace). Aparece na fila de separação com a tag roxa **MANUAL** e o card destacado em roxo (o quadro do cliente na tela de separação também fica roxo). Ao tocar para começar, o sistema pergunta "Iniciar separação de pedido manual?": **Cancelar** volta para a fila sem mexer no pedido; **Continuar** inicia a separação. Pedidos manuais **não entram na Separação em lote**; são separados um a um pela fila.

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
3. **Aguardando encomenda**: se a pré-venda foi **desmembrada** (todos os itens dela estão aqui e a encomenda está em outra pré-venda), marque **"A encomenda está em outra pré-venda"** (e, se souber, o nº dela): não precisa marcar itens, todos vão para a colmeia e o pedido fica "Aguardando a pré-venda da encomenda"; depois cadastre a outra pré-venda e bipe a mesma colmeia (Salvar junto). Caso contrário, marque **quais itens estão aguardando encomenda** e quantas peças de cada um (ou **Marcar todos** / "todas"). Os demais itens vão para a colmeia agora. Os itens marcados aparecem para Compras em **Em aberto** para encomendar. Sem o PDF não dá para marcar os itens.
4. **Salvar e bipar a colmeia** (padrão): no computador aparece um **QR code**; leia com o celular, o app abre na tela "Bipe a colmeia" (com o seu login), bipe a colmeia livre e confirme "Deseja salvar a colmeia X?". A janela do computador mostra "✓ Guardado na colmeia X". No celular, vai direto para a tela de bipar. Até ser bipado, o pedido fica em **Colmeias → "Aguardando colmeia"** (botão **Bipar colmeia**). No iPhone, o QR abre no Safari; se o login estiver só no atalho do app, abra o atalho e use "Aguardando colmeia". Também dá para escolher a colmeia direto no computador em "Ou escolher a colmeia aqui".
Quem pode cadastrar: Separação, Conferente, Comercial, **Financeiro**, Supervisor e Administrador.

### 6.2b Mais de uma pré-venda na mesma colmeia
Uma colmeia pode guardar **mais de uma pré-venda** (ex.: pré-venda desmembrada pelo Financeiro). Ao bipar (ou escolher no computador) uma colmeia que já tem pedido, o sistema avisa "A colmeia A1 já tem a pré-venda X. As duas vão ficar juntas" e pede **Salvar junto**. No mapa, a colmeia mostra no canto a **quantidade** de pré-vendas; ao tocar, aparecem todas, cada uma com seus itens. Cada pré-venda continua sendo um pedido próprio (sai, é enviada ou volta para Compras separadamente). Quando o sistema escolhe a colmeia sozinho, ele continua usando uma livre.

### 6.2a Mudar um pedido de colmeia
No **mapa das colmeias** os quadradinhos mostram só a posição (A1, B2…) e a cor da situação (livre, amarelo = aguarda encomenda, verde = pronto para retirar ou enviar). Só fica colorida a colmeia que tem peça guardada: não existe colmeia reservada, o separador escolhe onde guardar na hora (uma livre ou junto com outra pré-venda); **toque numa colmeia ocupada** para ver o pedido e os itens (mesma janela de quando bipa a colmeia).
No celular, na aba **Colmeias**, bipe a etiqueta de uma colmeia: abre a janela com o pedido que está nela e a lista de **itens da pré-venda** (o que está na colmeia e o que é encomenda). Toque em **Alterar colmeia**, bipe a nova colmeia (livre) e confirme "Deseja salvar a nova localização...?". Fica no histórico "Colmeia alterada: A1 → C1". O botão aparece só para o Administrador e para quem tiver a permissão **Usuários → abrir a pessoa → "Pode mudar pedidos de colmeia"**. Bipar uma colmeia livre mostra "Colmeia livre" e permite guardar ali um pedido que está aguardando colmeia.

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
- **Encomenda total** (encomendar tudo): não passa pela separação enquanto espera chegar tudo. Quando chega, volta para a separação (área de recebimento): se o cliente retira, o separador guarda na colmeia; se é envio, vai para a mesa.
- **Separar o que tem na loja** (parte encomenda, parte da loja): as peças da loja vão para a separação e o separador guarda na colmeia que bipar até a encomenda chegar.
- **Nada a encomendar**: vai para a separação como envio total (os separadores são avisados).
Depois toque em **Confirmar e encaminhar**. O card também mostra o que o Comercial pediu e se o cliente retira ou está na loja.
- **Para decidir · Ajuste**: pré-venda já separada que o Comercial ajustou com Tem encomenda. O card mostra só o que entrou de novo (coluna "Novo no ajuste"); digite quanto encomendar, o restante é separado da loja e vira tarefa de ajuste para o separador juntar na colmeia do pedido.
- **Editar itens** (só Administrador): no card "Para decidir", abre uma janela para mudar a quantidade, excluir item (×) ou adicionar item pelo SKU ou descrição. Ao salvar, o card atualiza e Compras segue decidindo. Fica registrado no histórico do pedido.

### 7.1a Avisos de pré-venda ajustada
No topo da tela de Compras aparecem os avisos "Pré-vendas ajustadas · corrija o pedido ao fornecedor", **um balão por pré-venda**, com o número, horário, cliente e o que mudou em cada item (encomenda e quantidade vendida). Depois de corrigir o pedido ao fornecedor, feche o balão no **×** (conta como "Compras ciente" e fica no histórico do pedido). Com mais de um aviso aparece **Dispensar todos**. Os avisos aparecem em **carrossel**, até 3 por vez no computador (2 em tela média, 1 no celular); com mais avisos, use as setas **‹ ›** ao lado do contador (ex.: "1–3 de 5") ou arraste para o lado.

### 7.2 Importar o pedido feito ao fornecedor (PDF)
Botão **Importar pedido do fornecedor**. Fornecedores reconhecidos: Living, Zen, Italy (Italyline), Torralba, Jador.
1. Envie o PDF do pedido ao fornecedor. O sistema lê fornecedor, número, itens e quantidades.
2. Informe a **previsão de entrega** (obrigatória).
3. Relacione cada linha do fornecedor ao **SKU da Serena** (busca por SKU ou descrição; dá para cadastrar produto novo). O código do fornecedor fica guardado no produto para as próximas vezes.
4. Relacione às **pré-vendas** (busca por número ou nome do cliente). Dá para **Adicionar pré-venda (PDF)** dentro da própria importação.
5. Os itens passam a "Encomendado" e entram em **Aguardando chegada** com a previsão.

### 7.3 Importar a nota fiscal (NF) do fornecedor e amarrar às pré-vendas
Botão **Importar nota fiscal**: escolha o arquivo **XML** da NF-e (recomendado) ou o **PDF do DANFE**. Depois de ler, abre a tela **Amarrar nota fiscal** (não é mais uma janela).
- **Duas colunas**: à esquerda (fundo azul, etiqueta NOTA FISCAL) os **itens da nota**; à direita (etiqueta PRÉ-VENDAS) as **pré-vendas com encomenda** em aberto. No celular viram duas abas.
- **Busca dos dois lados**: itens da nota por código ou descrição; pré-vendas por número, cliente, código ou descrição. Filtros dos itens: **Todos / Com sugestão / Amarrados / Estoque**. Cada lado mostra **20 por página** e o card cresce com a lista (sem rolagem interna).
- **Como amarrar**: toque num **item da nota**: aparecem as **sugestões** (mesmo pedido ao fornecedor, mesmo produto ou descrição parecida) e as outras encomendas; toque em **Amarrar**. Ou comece pela **pré-venda**: toque na encomenda e depois em **Amarrar aqui** no item da nota (os mais parecidos sobem). A quantidade entra com o que falta da encomenda, limitada ao que veio na nota; ajuste com − / + ou **tirar**. O que não for amarrado vai para o **estoque**.
- O sistema já amarra sozinho o que consegue pelos pedidos ao fornecedor; confira no filtro **Amarrados**.
- **+ Cadastrar pré-venda** (na coluna das pré-vendas): para pré-venda com encomenda que ainda não está no sistema. **Enviar o PDF** (lê número, cliente e itens; marque quantas peças são encomenda) ou **Digitar** (número, cliente e itens com código, descrição e quantidade). Se todas as peças forem encomenda, entra como "Encomenda total · aguardando chegada"; se só parte for (pelo PDF), a parte do estoque vai para a fila de separação. Número que já existe é recusado. É obrigatório escolher o **destino quando a encomenda chegar**: **Colmeia · cliente retira na loja** (o separador guarda na colmeia e o pedido fica pronto para retirar) ou **Envio ao cliente** (finaliza na mesa de expedição); se houver itens do estoque e o destino for envio, escolha **Enviar tudo junto** ou **Enviar o que tem agora e o resto depois**. Na coluna das pré-vendas, cada uma mostra o destino ("→ colmeia · retira", "→ envio"); tocando na etiqueta dá para trocar (fica no histórico). Pré-venda sem destino aparece em vermelho "Destino? definir". A pré-venda de encomenda só entra na separação quando a nota fiscal amarrada for **recebida e conferida** no Recebimento (ou na hora, se a nota já tinha sido recebida); lembre de tocar em **Salvar nota** depois de amarrar.
- **Salvar nota** grava; a faixa "Alterações ainda não salvas" lembra, e **Voltar** pergunta antes de sair.
- **Tutorial** (botão ao lado de Voltar): passo a passo da amarração em 10 passos; cada parte da tela fica em destaque com um balão explicando o que fazer (Próximo / Voltar / Sair; no computador também as setas e Esc). Só abre quando a pessoa toca no botão.
- Aceita **faturamento parcial** (a nota traz só parte dos itens). Situações: "Faturado em parte", "Faturado · a caminho".
- **Aba Notas fiscais** (em Compras): lista as notas importadas com a amarração e a situação (Aguardando chegada, Recebida, Recebida com divergência). O botão **Amarrar / Ver amarração** reabre a nota.
- **Amarrar depois do recebimento**: nota já conferida no Recebimento também pode ser amarrada (ou ter a amarração ajustada). Ao salvar, as pré-vendas amarradas já contam como encomenda chegada; se houve divergência, vale a quantidade conferida (o que sobrar vai para o estoque).
- A nota fica em **Notas a receber** para o Recebimento. Na lista do Recebimento cada nota mostra o fornecedor (com caixas e itens), as **pré-vendas amarradas** e, à direita, a situação (**Aguardando** ou **Em conferência**, com itens conferidos, quantos faltam e caixas contadas).

### 7.4 Chegada e liberação
- **Chegou só parte da encomenda**: ao confirmar o recebimento, o pedido entra na fila como **Parte da encomenda chegou · guardar na colmeia**. O separador separa **só as peças que chegaram** e guarda na colmeia (a do pedido, se já tiver). O pedido volta a aguardar o restante, com essas peças marcadas como guardadas. Quando o resto chega, entra de novo na fila só com o que faltava: **cliente retira** → guarda na mesma colmeia (fica pronto para retirar); **envio** → finaliza na mesa, buscando na colmeia o que já estava lá. O **histórico** da pré-venda (aba Separados) mantém todas as rodadas: a 1ª separação continua com a data e o separador originais, e cada parte da encomenda aparece como uma etapa própria ("Parte da encomenda (NF X) · chegou / separação concluída / guardado na colmeia"). Nos itens do pedido na colmeia, aparece **onde cada parte está de verdade**: só as peças da encomenda guardadas ficam "na colmeia"; a pronta entrega que já foi finalizada na mesa aparece como "finalizadas na mesa · não estão na colmeia" (ou "entregues ao cliente / enviadas no 1º envio"); o que falta mostra a situação na compra. O card diz "Aguardando o restante da encomenda · N pç guardada(s) aqui · faltam M pç", a casa no mapa fica com a cor de aguardando encomenda e esse pedido não dispara o alerta de pedido parado. Se a pré-venda **já tem peças numa colmeia**, a tela de guardar mostra em vermelho "Já tem peças na colmeia X · guarde junto"; se o separador bipar outra colmeia, abre "#pré-venda já está na colmeia X" com **Guardar na X** (destacado) ou **Mudar tudo para Y** (só se levar também as peças da X; fica no histórico).
- A **conferência não apaga a amarração**: se Compras amarrar pré-vendas enquanto a nota está sendo conferida (no computador ou pelo celular do link), a amarração é mantida; o celular busca a nota de novo antes de confirmar.
- **Item de pré-venda no recebimento**: quando o conferente bipa (ou dá OK em) um item da nota que está amarrado a uma pré-venda, abre o aviso **Este item é de pré-venda**, com a pré-venda, o cliente e quantas peças separar. Ele deixa essas peças numa **mesa** e **bipa a etiqueta da mesa** (ou toca no nome da mesa). "Agora não" pula e a peça fica como "Área de recebimento".
- **Na TV e na fila**: quando a encomenda do pedido chega toda, ele entra na fila como **Encomenda chegou · buscar na Mesa-X**.
- **Separador**: a tela mostra em qual mesa o conferente deixou; ele **bipa a mesa para desvincular** e depois bipa a peça (se bipar a peça antes, o sistema pede a mesa). Se o pedido tem peças na colmeia aguardando a encomenda, aparece o aviso para buscar lá também. **Envio**: finaliza na mesa dele e a colmeia é liberada. **Cliente retira**: no fim guarda na colmeia (junta com o que já está lá ou escolhe outra).
- Quando o Recebimento confirma a nota e **todos os itens de encomenda** de um pedido chegaram, o pedido volta sozinho para a separação como **Encomenda recebida** (local "Área de recebimento"). Termina na mesa (envio) ou na colmeia (cliente retira).
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
3. **Etapa 1 · caixas**: conte as caixas (bipando a nota a cada caixa ou no **+**) e toque em **OK · N caixas conferidas**. Os itens só abrem depois desse OK (o botão **Alterar** volta para a contagem). **Etapa 2 · produtos**: bipe o código de barras de **uma peça** de cada produto. Vale só o **EAN (ou o código) do cadastro do picking**; o código ZP/EAN que vem na nota é do fornecedor e não é usado. O item bipado aparece em destaque no topo, com a quantidade da nota: toque em **OK · chegou** ou ajuste antes com − / + (ou digitando). Quantidade diferente fica em vermelho (**Ajustado**) e registrada como divergência. Se o produto bipado ainda não estiver relacionado a um item da nota, abre **Qual item da nota é este?** com os itens mais parecidos pelo nome e uma busca: toque no item certo e o sistema guarda a relação (código do fornecedor → produto do picking) para as próximas notas. Produto sem código de barras: confira e toque em **OK** na linha. Avisos: "Primeiro confirme as caixas" (bipou produto antes do OK das caixas), "não está cadastrado no picking" (EAN não existe em Produtos e EAN) e "não está nesta nota".
4. **Confirmar recebimento**. As pré-vendas atendidas são liberadas para a separação.
- A conferência é **salva automaticamente**; dá para parar ("Salvar e continuar depois") e continuar depois, por outra pessoa ou outro aparelho. Na lista aparece "Em conferência". Cada item bipado fica guardado **no próprio aparelho** até o servidor confirmar: se a internet cair, aparece em amarelo "Sem conexão · conferência guardada neste aparelho, enviando de novo…" e o sistema reenvia sozinho (a cada 20 segundos e quando a conexão volta); se o conferente sair da página e voltar, os itens continuam conferidos. Com tudo certo, o topo mostra "Conferência salva · hora". Dois aparelhos na mesma nota (computador e celular) **não apagam a conferência um do outro**: o servidor junta item a item, valendo a alteração mais nova de cada item. Salvar a nota em Compras também não apaga a conferência nem desfaz um recebimento já confirmado.
- **Ajustar recebido** (Administrador e Compras): ao abrir uma nota **já recebida** em Recebimento, o botão **Ajustar recebido · corrigir divergências** permite corrigir a quantidade que de fato chegou de cada item e o número de caixas (por exemplo, item que chegou mas não foi bipado). Por padrão a lista mostra só os itens com divergência; **= nota** preenche a quantidade da nota. Ao **Salvar ajuste**, o sistema recalcula a divergência e a parte de cada pré-venda, registra na nota quem ajustou, quando e o que mudou ("Ajustado manualmente em … por …") e anota no histórico da pré-venda ("Recebimento da NF X ajustado: código de→para"). Se o ajuste completar a encomenda de uma pré-venda, ela é liberada na hora para a separação (se completar só parte, entra como "parte da encomenda chegou"). Diminuir uma quantidade depois que a pré-venda já foi separada só registra a correção; não desfaz a separação.
- **Nota ainda não importada por Compras**: dá para registrar a chegada assim mesmo; Compras amarra os itens depois.
- **No computador**: tocar numa nota abre um **QR code de uso único** para fazer a conferência no celular **sem login** (vale 4 horas, dá para parar e retomar pelo mesmo link; fica registrado no nome de quem gerou). Ou **Fazer neste aparelho**.

---

## 9. Locais (Estoque)

Aba **Locais**: endereços dos produtos, EAN e etiquetas.
- **Endereço** = Rua-Lado-Tipo-Nível.Coluna. Ex.: `R1-LB-BIN-8.M` = rua 1, lado B, bin, nível 8, coluna M. Tipos: **GAV** gaveta, **COL** colmeia (de estoque), **BIN** bin.
- **Criar estrutura**: cadastra um móvel/bloco de locais de uma vez (rua, lado, tipo, faixa de níveis e colunas). Para BIN e colmeia há o campo **Fica em cima de**: **Gaveteiro** (de qual até qual gaveteiro) ou, para BIN, **Colmeia**. Isso monta o lado como ele é de verdade e o mapa 3D desenha gaveteiros, colmeia e pilhas de caixas.
- **Rua 1, lado A** (parede): 5 gaveteiros de 4 gavetas (`R1-LA-GAV-1.A` a `4.E`, coluna = gaveteiro, gaveta 1 = a de baixo); colmeia de 3 linhas × 8 nichos em cima dos gaveteiros D–E (`R1-LA-COL-1.A` a `3.H`); 9 pilhas × 9 caixas bin em cima dos gaveteiros A–C (`R1-LA-BIN-1.A` a `9.I`); 6 pilhas × 5 caixas em cima da colmeia (`R1-LA-BIN-1.J` a `5.O`). A coluna A começa na ponta perto da mesa.
- **Grade de Endereços**: os níveis ficam fixos à esquerda e aparecem **3 colunas por vez**; arraste para o lado para ver as outras. Quando o lado tem mais de um tipo (gaveta, colmeia, bin), use os botões **Gavetas / Colmeia / Caixas bin** em cima da grade.
- **Onde está o produto** (dentro de **Produtos e EAN**): no campo de busca, digite e escolha na **sugestão**, ou bipe o EAN, o código ou a etiqueta do endereço. Abre o quadro **Onde está o produto** com o produto, o endereço com a explicação (ex.: "Gaveteiro C · 2ª gaveta de baixo"), a tabela **Também nesta gaveta** (SKU e descrição dos outros produtos do mesmo lugar) e o **mapa 3D ou 2D** com a rota a partir da mesa; **Fechar** esconde o quadro. No computador cada linha com endereço tem o botão **Mapa**. Produto sem endereço mostra o aviso para usar **Vincular produto ao endereço**.
- **No celular**, Produtos e EAN não mostra "Novo produto" nem "Importar CSV"; a lista traz só código e descrição (com EAN e endereço em letra pequena) e, ao tocar no produto, abre uma janela com EAN, endereço, **Ver no mapa**, **Salvar** e **Fechar**.
- Clique num local da grade para **colocar o produto**, **remover do local** ou **Gerar etiqueta deste local (PDF)**.
- **Gaveta (GAV) aceita mais de um produto** (a grade mostra "N produtos"; no painel do local cada produto tem "Remover do local" e o campo vira "Adicionar outro produto nesta gaveta"). **BIN e colmeia (COL) aceitam só um produto.** Na etiqueta "Endereços" de uma gaveta com vários produtos sai uma etiqueta por produto.
- **Produtos e EAN**: busque por código, descrição ou EAN. Para cadastrar o EAN, clique no campo do produto e bipe a embalagem (o leitor digita e dá Enter; salva na hora). **Novo produto** cadastra um item.
- **Etiquetas** ("O que imprimir"): Endereços, Só endereço, Produtos, Bandejas, Mesas, Cestas, Colmeias.
- **Etiquetas de produtos (EAN)**: em Etiquetas → **Produtos**, busque (código, nome ou EAN) e marque os produtos; os marcados ficam em "Selecionados", cada um com a **quantidade de etiquetas**. Produto sem EAN (ou com EAN inválido) mostra **Gerar EAN**; com vários marcados, **Gerar EAN para N sem EAN**. O EAN gerado é um EAN-13 válido que começa com **200** (faixa da GS1 para uso interno), não repete nenhum EAN do cadastro e fica salvo no produto marcado como "interno": serve para bipar no estoque e na separação, **não para vender em marketplace**. Formato padrão: **Térmica 2 colunas · 40 × 25 mm**, igual à etiqueta do Full (duas por linha), com código de barras, números do EAN, nome (até 2 linhas) e "Cód.". A prévia mostra exatamente como sai; **Gerar PDF para imprimir** baixa o arquivo (imprima em 100%). Sem seleção nada é impresso; para o catálogo inteiro marque **Imprimir todos os produtos** (e, se quiser, **Só os sem EAN**). **Novo EAN**: produto que já tem EAN mostra o botão **Novo EAN** (e, com vários marcados, **Novo EAN para N com EAN**); toque duas vezes para confirmar. O EAN atual é trocado por um novo interno (200…) e o anterior fica anotado no produto ("antes …", até os 5 últimos). Pedidos que já estavam na fila aceitam o EAN antigo e o novo; os próximos usam só o novo, então imprima e cole as etiquetas novas. Layout no computador: em Produtos, Mesas e Cestas as escolhas ficam à esquerda e, à direita, o total, o botão **Gerar PDF**, a prévia e o **Formato** (os formatos numa linha); em Endereços, Só endereço, Bandejas e Colmeias, o que imprimir e o formato ficam em cima e a prévia larga embaixo.
- **Só endereço**: etiqueta provisória de 5 × 2 cm, **56 por folha A4** (4 na largura × 14 na altura, com linha de corte). Tem o código de barras do endereço e o quadro com o endereço escrito (ex.: R1-LA-BIN / 1.A). O código de barras guarda o endereço em forma curta (ex.: `1AB1A` = rua 1, lado A, BIN, nível 1, coluna A), com menos barras; ao bipar, o sistema entende como o endereço completo em qualquer tela (Vincular produto, separação do e-commerce, devolução). Filtros: rua, lado, tipo e "só endereços sem produto". Imprima em tamanho real (100%).
- **Mapa de calor** (aba de Locais): planta 2D do estoque mostrando onde os separadores mais bipam a **etiqueta do endereço**. Cada vez que o separador bipa a etiqueta do endereço certo durante a separação (e-commerce, ou consultiva quando bipa a etiqueta da prateleira), o sistema grava no pedido o endereço, a hora e quem bipou; bipar o produto não conta. O registro começou em 10/11/2026, então o mapa vai se preenchendo a partir daí. Só a **face do lado bipado** é pintada (a mesma estante tem o lado B de uma rua e o lado A da outra) e o calor aparece no **corredor em frente** à coluna, do **azul** (pouco) ao **vermelho** (muito); passe o mouse para ver o código e a quantidade. **Período**: últimos 7, 15, 30 ou 90 dias (padrão 30). **Medir por**: **Bipagens do endereço** (principal) ou **Peças separadas** (pelo endereço atual do produto). Mostra também o total de pedidos, bipagens e endereços do período e a lista dos **15 endereços mais bipados** com o produto.
- **Vincular produto ao endereço** (botão no topo de Locais): bipe o produto (EAN ou código interno) e a etiqueta do endereço, em qualquer ordem, e o produto fica gravado naquele local (o endereço antigo dele fica livre). Se o endereço for BIN ou colmeia e já tiver outro produto, o sistema pergunta se quer **Trocar** (o outro fica sem endereço); se for **gaveta**, o produto é acrescentado junto com os que já estão lá. Ao vincular aparece por 1 segundo um aviso verde **Produto vinculado** (ou **Local alterado**) com o produto e o endereço. A lista "Vinculados agora" mostra o que foi feito na sessão, e o último dá para **Desfazer**. Endereço que não está cadastrado em Endereços é recusado.
- **Configuração da separação**: usar bandeja, mesas e cestas; tamanho da grade das colmeias.
- **Níveis das caixas bin (porta-pallet: Rua 1 lado B e ruas 2, 3 e 4)**: a 1ª prateleira (de baixo) é só de caixas de reposição e não conta. Na **2ª prateleira** cabem 6 caixas empilhadas = **níveis 1 a 6** (de baixo para cima); na **3ª prateleira** cabem 4 = **níveis 7 a 10**. Ex.: nível 8 = 3ª prateleira, 2ª caixa de baixo. Isso é ajustado em **Usuários → Configuração → Estantes (mapa 3D)**, campo "Caixas bin por prateleira" (ex.: `6, 4`).

---

## 9b. Pedido parado na colmeia
Pedido **pronto na colmeia** (aguardando o cliente retirar ou o envio) há mais dias do que o configurado é considerado **parado** (pedido aguardando encomenda não conta).
- **Configuração** (Administrador → Usuários → Configuração): **Avisar depois de X dias** (padrão 7; 0 desliga). O campo mostra quantos pedidos estão parados agora.
- **TV**: faixa vermelha "⚠ Conferir colmeia" com a colmeia, o pedido e os dias, e a voz gravada diz "Confira o pedido na colmeia (letra e número). Mais de (dias) dias aguardando retirada ou envio." **A cada 5 minutos**, até alguém conferir. A voz só fala de **segunda a sexta, 08:00–12:00 e 13:30–18:30** (fora disso só a faixa aparece) e nunca por cima do sinal de novo pedido ou da voz do Cliente na loja: se um deles tocar, o aviso do pedido parado é cortado e volta depois. Vários pedidos parados são falados um de cada vez.
- **Conferir**: **qualquer pessoa** bipa a etiqueta da colmeia em qualquer tela (inclusive na TV) e abre **Colmeia X · conferir**: **Está aqui** (o aviso para e o prazo recomeça), **Cliente retirou** ou **Foi enviado** (registra a saída esquecida e libera a colmeia). Fica no histórico do pedido.
- Na lista das colmeias (Comercial e aba Colmeias) o pedido parado mostra a etiqueta vermelha **Parado há X dias · conferir**, que abre a mesma janela.

---

## 9a. Menu no celular
No celular (tela estreita), o menu de setores fica num botão **☰** no canto superior esquerdo: toque para abrir o menu lateral, que desliza da esquerda; toque de novo (no X), fora do menu ou num setor para fechar. No computador o menu continua no topo.

---

## 9c. Gestão (Administrador)
Primeiro item do menu, só para o Administrador. O botão mostra um número **vermelho** (há alerta crítico) ou **amarelo** (há pontos de atenção). Cinco abas:
- **Hoje**: pedidos que entraram (e-commerce e pré-vendas), separados, peças, tempo médio de separação, espera média na fila, fila atual (com o mais antigo) e alertas; gráfico de separados por hora; "Agora na operação" (em separação, na mesa, prontos para envio, colmeias ocupadas, notas recebidas); quem está separando o quê, há quanto tempo e quantos itens já pegou.
- **Alertas**: 17 conferências automáticas. Toque num alerta para ver a lista de pedidos/notas/produtos e abrir o detalhe com a linha do tempo.
  - Críticos: separação parada (mais de 45 min sem bipar); pedido do e-commerce cancelado ou alterado na Magazord durante a separação; clientes diferentes na mesma colmeia; EAN repetido em produtos diferentes.
  - Atenção: fila com mais de 2 h; pedido na mesa há mais de 2 h; colmeia parada; nota recebida com divergência; conferência de nota parada há mais de 4 h; encomenda sem nota amarrada há mais de 7 dias; pré-venda de Compras sem destino; faltas na separação (7 dias); produto da fila sem endereço; e-commerce com cadastro diferente do site.
  - Informativos: nota há mais de 7 dias sem recebimento; separação reiniciada (7 dias); produto sem EAN; erros técnicos nas últimas 24 h.
- **Equipe**: por pessoa (hoje, 7 ou 30 dias): pedidos, peças, tempo médio, peças por hora, bipagens de endereço (mostra se o separador confirma o local antes de pegar), faltas, reinícios, notas conferidas, ajustes de nota e total de ações.
- **Atividade**: tudo o que foi feito no sistema, do mais recente para o mais antigo (pré-vendas, e-commerce, separação, mesa, colmeia, envio, recebimento, ajustes). Filtros por período, pessoa e área, e busca por pedido, cliente ou ação. Texto longo termina em "…": toque no texto para abrir por inteiro (toque de novo fecha); toque no resto da linha para abrir o pedido. O nome da pessoa aparece sem o "@…" do e-mail.
- **Erros do sistema**: falhas técnicas registradas pelos aparelhos, agrupadas por tipo, com quantas vezes e em qual aparelho (coletor, Android, iPhone, computador).

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
