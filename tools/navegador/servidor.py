# Servidor estático del banco de pruebas: python tools/navegador/servidor.py 5599
# Es el de python -m http.server con una cola de conexiones más grande: con la de 5 que trae, al pedir todos los archivos
# juntos rechazaba alguno de vez en cuando y un nivel o un gráfico no cargaba, sin que el juego tuviera ningún problema.
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class Servidor(ThreadingHTTPServer):
    request_queue_size = 128


class Archivos(SimpleHTTPRequestHandler):
    def log_message(self, formato, *args):
        pass


if __name__ == '__main__':
    Servidor(('127.0.0.1', int(sys.argv[1])), Archivos).serve_forever()
