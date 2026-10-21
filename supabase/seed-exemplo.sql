-- =====================================================================
-- Picking Serena · dados de EXEMPLO (opcional)
-- Cria algumas estruturas de locais e puxadores para testar o sistema.
-- Não rode em produção se já cadastrou os locais e produtos reais.
-- =====================================================================
insert into public.blocks (id, data) values
  ('R1-LA-GAV-1-8-A-F', '{"r":1,"l":"A","t":"GAV","n1":1,"n2":8,"c1":"A","c2":"F"}'),
  ('R1-LB-COL-1-3-A-J', '{"r":1,"l":"B","t":"COL","n1":1,"n2":3,"c1":"A","c2":"J"}'),
  ('R1-LB-BIN-4-8-A-M', '{"r":1,"l":"B","t":"BIN","n1":4,"n2":8,"c1":"A","c2":"M"}'),
  ('R2-LA-GAV-1-6-A-H', '{"r":2,"l":"A","t":"GAV","n1":1,"n2":6,"c1":"A","c2":"H"}'),
  ('R2-LB-BIN-1-6-A-K', '{"r":2,"l":"B","t":"BIN","n1":1,"n2":6,"c1":"A","c2":"K"}')
on conflict (id) do nothing;

insert into public.products (id, data) values
  ('18337', '{"code":"18337","name":"ITALY - AURI IL1690 37MM - BROWN","ean":"7895887303077","loc":"R1-LA-GAV-3.C"}'),
  ('19139', '{"code":"19139","name":"ITALY - ZIGRINATO IL1582 20MM - BROWN","ean":"","loc":"R1-LA-GAV-1.D"}'),
  ('17702', '{"code":"17702","name":"PUXADOR PERFIL SLIM 128MM - PRETO FOSCO","ean":"","loc":"R1-LB-BIN-8.M"}'),
  ('20114', '{"code":"20114","name":"PUXADOR CONCHA OVAL 96MM - DOURADO ESCOVADO","ean":"","loc":"R1-LB-COL-2.B"}'),
  ('16540', '{"code":"16540","name":"PUXADOR BARRA REDONDA 160MM - INOX ESCOVADO","ean":"","loc":"R2-LA-GAV-4.A"}')
on conflict (id) do nothing;
