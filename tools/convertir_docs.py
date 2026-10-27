"""Convierte a Markdown (con markitdown) todos los documentos de una carpeta.

Uso: .venv/Scripts/python tools/convertir_docs.py [entrada] [salida]
Por defecto: Docs/fuentes -> Docs/convertidos. Solo reconvierte si el original cambió.
"""
import sys
from pathlib import Path

from markitdown import MarkItDown

EXTENSIONES = {".docx", ".pdf", ".pptx", ".xlsx", ".html", ".htm", ".csv", ".json", ".txt"}


def main() -> None:
    entrada = Path(sys.argv[1] if len(sys.argv) > 1 else "Docs/fuentes")
    salida = Path(sys.argv[2] if len(sys.argv) > 2 else "Docs/convertidos")
    salida.mkdir(parents=True, exist_ok=True)
    md = MarkItDown()

    for origen in sorted(entrada.rglob("*")):
        if not origen.is_file() or origen.suffix.lower() not in EXTENSIONES:
            continue
        destino = salida / origen.relative_to(entrada).with_suffix(".md")
        if destino.exists() and destino.stat().st_mtime >= origen.stat().st_mtime:
            print(f"= {origen} (sin cambios)")
            continue
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_text(md.convert(str(origen)).text_content, encoding="utf-8")
        print(f"+ {origen} -> {destino}")


if __name__ == "__main__":
    main()
