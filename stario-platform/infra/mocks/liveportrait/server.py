"""
Mock LivePortrait AI Service
Simple HTTP server that mocks the LivePortrait video generation API
"""
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

class MockLivePortraitHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            response = {
                'status': 'healthy',
                'service': 'mock-liveportrait',
                'version': '1.0.0',
                'mode': 'mock'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        parsed = urlparse(self.path)

        if parsed.path == '/generate':
            # Simulate processing time
            time.sleep(0.5)

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            response = {
                'status': 'success',
                'video_url': 'https://storage.stario.uz/mock/generated_video.mp4',
                'processing_time_ms': 500,
                'mode': 'mock'
            }
            self.wfile.write(json.dumps(response).encode())
        elif parsed.path == '/status':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()

            response = {
                'status': 'completed',
                'progress': 100
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        print(f"[MockLivePortrait] {args[0]}")

if __name__ == '__main__':
    port = 8100
    server = HTTPServer(('0.0.0.0', port), MockLivePortraitHandler)
    print(f"Mock LivePortrait service running on port {port}")
    server.serve_forever()
