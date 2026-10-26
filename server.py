import http.server
import socketserver
import socket
import sys
import os
import json
import time

DEFAULT_PORT = 3000
START_TIME = time.time()

class DualStackServer(http.server.ThreadingHTTPServer):
    address_family = socket.AF_INET6

    def server_bind(self):
        self.socket.setsockopt(socket.IPPROTO_IPV6, socket.IPV6_V6ONLY, 0)
        self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        super().server_bind()

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 브라우저 캐시 비활성화 & CORS 허용
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD')
        self.send_header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
        self.send_header('Access-Control-Max-Age', '86400')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_HEAD(self):
        if self.path == '/__health' or self.path.startswith('/__health?'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            return
        super().do_HEAD()

    def do_GET(self):
        if self.path == '/__health' or self.path.startswith('/__health?'):
            self.send_response(200)
            self.send_header('Content-type', 'application/json; charset=utf-8')
            self.end_headers()
            health_data = {
                "status": "ok",
                "app": "HealthcareCalculator",
                "port": self.server.server_port,
                "pid": os.getpid(),
                "uptime_seconds": round(time.time() - START_TIME, 2),
                "timestamp": time.strftime('%Y-%m-%d %H:%M:%S')
            }
            self.wfile.write(json.dumps(health_data, ensure_ascii=False, indent=2).encode('utf-8'))
            return

        return super().do_GET()

if __name__ == '__main__':
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"[경고] 전달된 포트({sys.argv[1]})가 숫자가 아닙니다. 기본 포트({DEFAULT_PORT})를 사용합니다.")
            port = DEFAULT_PORT

    # 작업 디렉토리를 현재 스크립트 위치로 설정
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    try:
        httpd = DualStackServer(("", port), NoCacheHTTPRequestHandler)
        print(f"========================================================")
        print(f"🏥 HealthcareCalculator 로컬 웹서버가 시작되었습니다.")
        print(f"📍 로컬 접속 주소: http://localhost:{port} 또는 http://127.0.0.1:{port}")
        print(f"⚙️ 프로세스 PID: {os.getpid()}")
        print(f"========================================================")
        httpd.serve_forever()
    except Exception as e:
        # IPv6 바인딩 실패 시 일반 IPv4 서버로 폴백
        print(f"[알림] 듀얼스택 바인딩 실패 ({e}). IPv4 단독 모드로 실행합니다...")
        socketserver.TCPServer.allow_reuse_address = True
        with socketserver.TCPServer(("", port), NoCacheHTTPRequestHandler) as httpd:
            print(f"========================================================")
            print(f"🏥 HealthcareCalculator 로컬 웹서버 (IPv4) 시작됨.")
            print(f"📍 주소: http://localhost:{port}")
            print(f"⚙️ 프로세스 PID: {os.getpid()}")
            print(f"========================================================")
            httpd.serve_forever()
