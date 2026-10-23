#!/usr/bin/env python3
"""Gera a versão de TESTE (homologação) do Picking Serena num único HTML para publicar como artefato.
Uso: python3 test/build-test.py <saida.html>
- troca o backend real (Supabase) pelo test/backend-test.js (dados de exemplo neste navegador)
- remove manifest/ícones/service worker, que não existem no artefato
"""
import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / "index.html").read_text(encoding="utf-8")
tb = (root / "test" / "backend-test.js").read_text(encoding="utf-8")
out = sys.argv[1] if len(sys.argv) > 1 else str(root / "test" / "picking-serena-teste.html")

def cut(pattern, repl="", count=1):
    global src
    new, n = re.subn(pattern, repl, src, count=count, flags=re.S)
    assert n == count, f"padrão não encontrado: {pattern}"
    src = new

cut(r'<script src="https://cdn\.jsdelivr\.net/npm/@supabase/[^"]+"></script>\s*<script src="/js/config\.js"></script>\s*<script src="/js/backend\.js"></script>',
    lambda m: "<script>\n" + tb + "\n</script>")
cut(r'<link rel="manifest"[^>]*>\s*')
cut(r'<link rel="icon"[^>]*>\s*')
cut(r'<link rel="apple-touch-icon"[^>]*>\s*')
cut(r'<title>Picking Serena</title>', '<title>Picking Serena Teste</title>')
# o artefato recebe o próprio esqueleto (doctype/html/head/body)
cut(r'^<!doctype html>\s*<html[^>]*>\s*<head>\s*')
cut(r'</head>\s*<body>\s*')
cut(r'\s*</body>\s*</html>\s*$', "\n")
pathlib.Path(out).write_text(src, encoding="utf-8")
print("ok", out, len(src))
