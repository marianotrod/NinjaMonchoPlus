"""Inventario de assets en Markdown: tamaño, dimensiones de imágenes y duración de audios.

Uso: .venv/Scripts/python tools/assets_info.py [carpeta] [-o salida.md]
Por defecto lee public/assets e imprime por consola.
"""
import argparse
from pathlib import Path

from mutagen import File as AudioFile
from PIL import Image

IMAGENES = {".png", ".webp", ".jpg", ".jpeg", ".gif", ".ico"}
AUDIOS = {".mp3", ".ogg", ".wav", ".m4a"}


def describir(ruta: Path) -> str:
    ext = ruta.suffix.lower()
    if ext in IMAGENES:
        with Image.open(ruta) as img:
            return f"{img.width}x{img.height} px, {img.mode}"
    if ext in AUDIOS:
        audio = AudioFile(ruta)
        if audio is not None and audio.info:
            return f"{audio.info.length:.1f} s"
    return ""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("carpeta", nargs="?", default="public/assets")
    parser.add_argument("-o", "--salida", help="archivo .md de salida")
    args = parser.parse_args()

    filas = ["| Archivo | KB | Detalle |", "|---|---:|---|"]
    for ruta in sorted(Path(args.carpeta).rglob("*")):
        if ruta.is_file():
            kb = ruta.stat().st_size / 1024
            filas.append(f"| {ruta.relative_to(args.carpeta).as_posix()} | {kb:.1f} | {describir(ruta)} |")

    texto = "\n".join(filas) + "\n"
    if args.salida:
        Path(args.salida).write_text(texto, encoding="utf-8")
    else:
        print(texto, end="")


if __name__ == "__main__":
    main()
