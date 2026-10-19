#!/usr/bin/env python3
"""Serve the game over HTTPS on your Wi-Fi so a phone can use its motion sensors.

Browsers only expose motion sensors to https pages, so this makes a self-signed
certificate on first run. Your phone will warn about it once; accept to continue.

    python3 serve.py [port]
"""
import http.server
import os
import socket
import ssl
import subprocess
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8443
HERE = os.path.dirname(os.path.abspath(__file__))
CERT_DIR = os.path.join(HERE, ".cert")
CERT = os.path.join(CERT_DIR, "cert.pem")
KEY = os.path.join(CERT_DIR, "key.pem")


def ensure_cert():
    if os.path.exists(CERT) and os.path.exists(KEY):
        return
    os.makedirs(CERT_DIR, exist_ok=True)
    subprocess.run(
        ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
         "-keyout", KEY, "-out", CERT, "-days", "365", "-subj", "/CN=tilt-bird"],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )


def lan_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(("10.255.255.255", 1))
        return s.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        s.close()


class GameHandler(http.server.SimpleHTTPRequestHandler):
    """Serves index.html only, so the certificate key never leaves this machine."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=HERE, **kwargs)

    def do_GET(self):
        if self.path.split("?")[0] not in ("/", "/index.html"):
            self.send_error(404)
            return
        self.path = "/index.html"
        super().do_GET()


def main():
    ensure_cert()
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), GameHandler)
    ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ctx.load_cert_chain(CERT, KEY)
    httpd.socket = ctx.wrap_socket(httpd.socket, server_side=True)
    print(f"On your phone (same Wi-Fi), open:  https://{lan_ip()}:{PORT}")
    print("Accept the certificate warning, then tap Start. Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
