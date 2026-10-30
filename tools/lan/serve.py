#!/usr/bin/env python3
"""HC2 Football LAN server (t-044, LAN step 2: docs/lan-step2.md).

Serves the game (game/ only) to the Wi-Fi on port 8770 and is the matchmaker, so players only press HOST or JOIN:
  POST /lan/host            the host's WebRTC offer -> a room (open 2 minutes)
  GET  /lan/rooms           the open rooms (one: the guest joins straight away; several: he picks)
  POST /lan/answer/<room>   the guest's answer (the room closes: one guest per match)
  GET  /lan/answer/<room>   the host waits for it (long poll, 20 s at a time)
  GET  /lan/ping            "this page comes from serve.py" (the game shows PLAY ON LAN) + the address for PC 2
It never carries match traffic: that goes PC to PC over WebRTC, as step 1 measured (avg 34.5 ms on the Wi-Fi).

Python 3 standard library only, nothing to install. Start it with tools/lan/Start LAN.command (Mac) or
Start LAN.bat (Windows), or:  python3 tools/lan/serve.py [--port 8770] [--no-browser]
Safety: answers only the local network (private / loopback addresses; anything else gets 403), serves game/ and
nothing else, no uploads, and keeps the offers / answers in memory for 2 minutes at most. Never port-forward it.
"""
import argparse, ipaddress, json, os, platform, secrets, socket, subprocess, sys, threading, time, webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

GAME = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'game'))
ROOM_TTL = 120          # seconds a room waits for a guest
MAX_BODY = 64 * 1024    # an SDP is a few KB

rooms = {}              # room -> {name, offer, from, t, answer}
lock = threading.Condition()


def prune():
    now = time.time()
    for r in [r for r, o in rooms.items() if now - o['t'] > ROOM_TTL]:
        del rooms[r]


def lan_ip():
    # the address other PCs reach this one on (connecting a UDP socket sends nothing; it only picks the route)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('10.255.255.255', 1)); return s.getsockname()[0]
    except OSError:
        return '127.0.0.1'
    finally:
        s.close()


def lan_name():
    # a short name where the network allows it: a Mac answers to <LocalHostName>.local (Bonjour), Windows to its
    # computer name on most home networks. The IP is always shown too, as the backup.
    if platform.system() == 'Darwin':
        try:
            n = subprocess.run(['scutil', '--get', 'LocalHostName'], capture_output=True, text=True, timeout=2).stdout.strip()
            if n: return n + '.local'
        except Exception:
            pass
    n = socket.gethostname().split('.')[0]
    return n if n and n.lower() != 'localhost' else None


def say(line):
    # (flush: the Windows console window shows a thread's print late otherwise)
    print(time.strftime('  %H:%M:%S ') + line, flush=True)


def with_ip_candidates(desc, ip):
    """Luca's first 2-PC test (30 Oct, Windows laptop): connected, then lost straight away. Chrome / Edge hide each PC's
    address behind a random <id>.local name (mDNS) in its connection candidates, and the other PC has to look that
    name up on the Wi-Fi; routers and Windows don't always answer, and then the two can't reach each other. This
    server already sees each PC's real address, so every .local candidate gets a twin with that address (the
    original stays: whichever works wins)."""
    if not ip: return desc
    out = []
    for ln in desc['sdp'].split('\r\n'):
        out.append(ln)
        f = ln.split(' ')
        if ln.startswith('a=candidate:') and len(f) > 5 and f[4].endswith('.local'):
            f[0] = f[0] + '9'                      # (its own foundation)
            f[4] = ip; out.append(' '.join(f))
    return dict(desc, sdp='\r\n'.join(out))


class Handler(SimpleHTTPRequestHandler):
    server_version = 'HC2LAN/1'

    def __init__(self, *a, **k):
        super().__init__(*a, directory=GAME, **k)

    def log_message(self, fmt, *args):  # quiet: only the matchmaker's lines are worth seeing
        if (self.command == 'POST' and not self.path.startswith('/lan/')) or (args and len(args) > 1 and str(args[1]) not in ('200', '204', '304', '404')):
            sys.stderr.write('  [%s] %s\n' % (self.client_address[0], fmt % args))

    def local_only(self):
        try:
            ip = ipaddress.ip_address(self.client_address[0])
        except ValueError:
            ip = None
        if ip is None or not (ip.is_private or ip.is_loopback or ip.is_link_local):
            self.send_error(403, 'HC2 LAN answers the local network only'); return False
        return True

    def peer_ip(self):                             # this PC's address on the Wi-Fi (the laptop's own page comes in on 127.0.0.1)
        ip = self.client_address[0]
        return lan_ip() if ipaddress.ip_address(ip).is_loopback else ip

    def reply(self, code, obj=None):
        body = json.dumps(obj).encode() if obj is not None else b''
        self.send_response(code)
        self.send_header('Content-Type', 'application/json'); self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(body))); self.end_headers(); self.wfile.write(body)

    def list_directory(self, path):  # no folder listings, just the game's files
        self.send_error(404); return None

    def end_headers(self):
        if not self.path.startswith('/lan/'): self.send_header('Cache-Control', 'no-cache')   # (a fresh build after a git pull)
        super().end_headers()

    def body(self):
        n = int(self.headers.get('Content-Length') or 0)
        if n <= 0 or n > MAX_BODY: return None
        try: return json.loads(self.rfile.read(n))
        except ValueError: return None

    def do_GET(self):
        if not self.local_only(): return
        p = self.path.split('?')[0]
        if p == '/lan/ping':
            return self.reply(200, {'hc2lan': 1, 'urls': self.server.urls})
        if p == '/lan/rooms':
            with lock:
                prune()
                return self.reply(200, {'rooms': [{'room': r, 'name': o['name'], 'from': o['from'], 'offer': o['offer']}
                                                  for r, o in rooms.items() if o['answer'] is None]})
        if p.startswith('/lan/answer/'):
            r = p.rsplit('/', 1)[1]; end = time.time() + 20
            with lock:
                while True:
                    prune(); o = rooms.get(r)
                    if o is None: return self.reply(404, {'error': 'no such room (2 minutes passed?)'})
                    if o['answer'] is not None:
                        del rooms[r]                       # handed over: the match starts, the room closes
                        return self.reply(200, {'answer': o['answer']})
                    o['t'] = max(o['t'], time.time() - ROOM_TTL + 30)   # (the host is still there: keep it open)
                    left = end - time.time()
                    if left <= 0: return self.reply(204)
                    lock.wait(min(left, 5))
        if p.startswith('/lan/'): return self.reply(404, {'error': 'unknown'})
        return super().do_GET()

    def do_HEAD(self):
        if self.local_only(): super().do_HEAD()

    def do_POST(self):
        if not self.local_only(): return
        p, b = self.path.split('?')[0], self.body()
        if b is None: return self.reply(400, {'error': 'bad body'})
        if p == '/lan/host':
            off = b.get('offer')
            if not isinstance(off, dict) or off.get('type') != 'offer' or not isinstance(off.get('sdp'), str): return self.reply(400, {'error': 'no offer'})
            name = ''.join(c for c in str(b.get('name') or 'HOST') if c.isalnum() or c in ' -')[:24]
            frm = 'this laptop' if ipaddress.ip_address(self.client_address[0]).is_loopback else self.client_address[0]
            with lock:
                prune(); r = secrets.token_hex(4)
                rooms[r] = {'name': name, 'offer': with_ip_candidates(off, self.peer_ip()), 'from': frm, 't': time.time(), 'answer': None}
                lock.notify_all()
            say('a game is hosted (%s, from %s): waiting for PC 2' % (name, frm))
            return self.reply(200, {'room': r})
        if p.startswith('/lan/answer/'):
            r, ans = p.rsplit('/', 1)[1], b.get('answer')
            if not isinstance(ans, dict) or ans.get('type') != 'answer' or not isinstance(ans.get('sdp'), str): return self.reply(400, {'error': 'no answer'})
            with lock:
                prune(); o = rooms.get(r)
                if o is None: return self.reply(404, {'error': 'no such room'})
                if o['answer'] is not None: return self.reply(409, {'error': 'taken'})
                o['answer'] = with_ip_candidates(ans, self.peer_ip()); lock.notify_all()
            say('PC 2 joined from %s: connecting the two PCs' % self.client_address[0])
            return self.reply(200, {'ok': 1})
        if p == '/lan/log':                        # the two pages say how the link is doing, so this window shows it
            who = 'HOST' if b.get('role') == 'host' else 'PC 2'
            say('%s (%s): %s' % (who, self.client_address[0], ''.join(c for c in str(b.get('msg', '')) if c.isprintable())[:300]))
            return self.reply(200, {'ok': 1})
        return self.reply(404, {'error': 'unknown'})


def main():
    ap = argparse.ArgumentParser(description='HC2 Football LAN server')
    ap.add_argument('--port', type=int, default=8770)
    ap.add_argument('--no-browser', action='store_true', help="don't open the game in this laptop's browser")
    a = ap.parse_args()
    if not os.path.isfile(os.path.join(GAME, 'index.html')):
        sys.exit('game/ not found next to tools/ (looked in %s)' % GAME)
    srv = ThreadingHTTPServer(('0.0.0.0', a.port), Handler)
    srv.daemon_threads = True
    ip, name = lan_ip(), lan_name()
    srv.urls = (['http://%s:%d' % (name, a.port)] if name else []) + ['http://%s:%d' % (ip, a.port)]
    line = '=' * 64
    print(line)
    print('  HC2 FOOTBALL - LAN SERVER IS ON')
    print()
    print('  On the OTHER PC, open this address in Chrome or Edge (and bookmark it):')
    for u in srv.urls: print('      ' + u)
    print('  (the first one is this laptop\'s name; if it doesn\'t open, use the number)')
    print()
    print('  Then: PLAY ON LAN -> HOST on one PC, PLAY ON LAN -> JOIN on the other.')
    print('  It doesn\'t open on the other PC? Allow Python in this laptop\'s firewall:')
    print('    Mac: System Settings > Network > Firewall > Options > allow Python')
    print('    Windows: in the Windows Security box tick Private networks > Allow access')
    print()
    print('  Leave this window open while you play. Close it (or Ctrl+C) to stop.')
    print(line)
    sys.stdout.flush()
    if not a.no_browser:
        threading.Timer(0.8, lambda: webbrowser.open('http://localhost:%d/' % a.port)).start()
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print('\n  stopped.')


if __name__ == '__main__':
    main()
