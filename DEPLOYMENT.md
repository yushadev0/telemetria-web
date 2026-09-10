# Deployment

`telemetria-web` is a static Vite build served by nginx under the `/telemetria/`
sub-path. The API and the live-timing WebSocket are the **separate**
`telemetria-api` service (FastAPI/uvicorn in Docker on `127.0.0.1:8000`),
reverse-proxied under the same prefix. The examples use the domain `yusa.app`
(the live instance) — substitute your own.

```
browser ──► nginx (:443)
              ├─ /telemetria/            → static files   (/var/www/telemetria-web)
              ├─ /telemetria/api/  ──►   127.0.0.1:8000/api/   (telemetria-api, Docker)
              └─ /telemetria/ws/   ──►   127.0.0.1:8000/ws/    (WebSocket, upgrade)
```

The client is pure static output — no server-side runtime, no environment file
on the host. Everything it needs is baked in at build time from
`.env.production` (`VITE_API_BASE_URL=/telemetria`, `VITE_WS_BASE_URL=/telemetria`
— path prefixes, so all calls are same-origin and there is no CORS or
mixed-content).

---

## 1. Prerequisites

- **Node 20+** with a matching npm — only needed to build. Install system-wide,
  e.g. via NodeSource:

  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  node -v
  ```

- **nginx** with the site's TLS `server { listen 443 ssl; server_name yusa.app; }`
  block already configured.
- **rsync**.
- The **`telemetria-api`** stack already running and reachable on
  `127.0.0.1:8000` (its own repo / Docker Compose — see section 7). The client
  deploys and serves fine without it, but every screen will error until the API
  answers.
- Enough disk for the dev toolchain during `npm ci` (~250 MB, build only).

---

## 2. Build

Clone the repo on the host (or build elsewhere and copy `dist/` over):

```bash
git clone https://github.com/yushadev0/telemetria-web.git
cd telemetria-web

npm ci
npm run build          # → dist/   (base = /telemetria/, from .env.production)
```

`npm run build` runs `tsc --noEmit` first, so a type error fails the build.

---

## 3. Deploy the web client

```bash
sudo mkdir -p /var/www/telemetria-web
sudo rsync -a --delete dist/ /var/www/telemetria-web/
sudo chown -R www-data:www-data /var/www/telemetria-web
```

`--delete` is what evicts the previous build's content-hashed assets.

---

## 4. nginx

Add the following inside the site's `server { listen 443 ssl; server_name
yusa.app; … }` block. nginx matches the **longest** location prefix, so the
`api/`, `ws/` and `assets/` blocks win over the bare `/telemetria/` regardless
of the order they appear in.

> These are all **prefix** locations, so `alias` is safe. Do **not** move the
> asset rule to a regex `location ~*` with a plain `alias` — inside a regex
> location `alias` without captures resolves every request to the directory
> itself and returns `403`. Keep it a prefix location, or switch the whole set
> to `root /var/www;` **and** rename the web root to `/var/www/telemetria/`.

```nginx
# ---- telemetria-web (static SPA) ----
location = /telemetria { return 301 /telemetria/; }

location /telemetria/ {
    alias /var/www/telemetria-web/;
    try_files $uri $uri/ /telemetria/index.html;   # SPA deep-link fallback
}

# content-hashed build assets — long, immutable cache
location /telemetria/assets/ {
    alias /var/www/telemetria-web/assets/;
    expires 30d;
    add_header Cache-Control "public, immutable";
    access_log off;
}

# ---- telemetria-api (FastAPI/uvicorn in Docker, 127.0.0.1:8000) ----
# proxy_pass ends in /api/ and /ws/ so the "/telemetria" prefix is stripped and
# the app still sees "/api/..." and "/ws/live/{room}".
location /telemetria/api/ {
    proxy_pass http://127.0.0.1:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}

location /telemetria/ws/ {
    proxy_pass http://127.0.0.1:8000/ws/;
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade           $http_upgrade;   # WebSocket handshake
    proxy_set_header Connection        "upgrade";
    proxy_read_timeout 3600s;                           # keep idle live sockets open
    proxy_send_timeout 3600s;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 5. Verify

```bash
curl -sI  https://yusa.app/telemetria/                     # 200, text/html
curl -sI  https://yusa.app/telemetria/assets/index-*.js    # 200, immutable cache header
curl -s   https://yusa.app/telemetria/xyz/deep/link | head # index.html (SPA fallback)
curl -sI  https://yusa.app/telemetria/api/v1/active-rooms  # 200 from the API (not 404 from nginx)
```

Then open `https://yusa.app/telemetria/` — the "Pit Wall" shell should load and
`/f1` / `/ac` navigation should resolve against the live API.

---

## 6. Updating

Once the first deploy is done, use the bundled script for every subsequent
release — it pulls, rebuilds, republishes and waits for the page to serve:

```bash
cd telemetria-web
./scripts/deploy.sh
```

Flags: `--no-pull` (deploy the working tree), `--no-build` (reuse the existing
`dist/`). Paths are overridable via `TLM_WEB_ROOT`, `TLM_WEB_OWNER`,
`TLM_HEALTH_URL`.

<details>
<summary>Equivalent manual steps</summary>

```bash
cd telemetria-web && git pull --ff-only
npm ci && npm run build
sudo rsync -a --delete dist/ /var/www/telemetria-web/
sudo chown -R www-data:www-data /var/www/telemetria-web
curl -sI https://yusa.app/telemetria/
```

</details>

---

## 7. Backend (`telemetria-api`) — separate repo

Not deployed by this script. It is a Docker Compose stack in its own checkout
(`~/APIs/telemetria-api`), bind-mounting the repo into the container, so a
release is:

```bash
cd ~/APIs/telemetria-api
git pull
docker compose restart api                 # or: docker compose up -d --build   (requirements.txt changed)
docker exec telemetria-api-redis_cache-1 redis-cli flushdb   # if a response shape changed
```

The `api` service publishes `8000:8000/tcp` (and `4433:4433/udp` for the
Assetto Corsa UDP bridge). The server's `docker-compose.yml` has drifted from
the repo copy (it adds `--root-path /telemetria` and the UDP port) — edit the
**server** copy, not the repo's.

---

## 8. Troubleshooting

**`./scripts/deploy.sh: Permission denied` on a fresh clone.** The executable
bit is not set on the checkout. It is tracked as `100755` in git, so a plain
`git pull` restores it; otherwise `chmod +x scripts/deploy.sh`, or run it as
`bash scripts/deploy.sh`. Run it as a **normal user**, not `sudo
./scripts/deploy.sh` — the script self-escalates with `sudo` only for the
`rsync` / `chown` / `mkdir` steps.

**Assets return `403` while `index.html` is `200`.** The asset rule is a regex
`location` using `alias` without captures — see the note in section 4. Make it a
prefix location.

**Deep links (`/telemetria/f1/2024/...`) 404 on reload.** The `try_files …
/telemetria/index.html` fallback is missing from `location /telemetria/`, or the
web root path in `alias` is wrong.

**Blank page, console 404s for `/assets/...` (no `/telemetria` prefix).** Built
in dev mode, or `.env.production` was not picked up. `npm run build` must run in
production mode (the default) so `base` becomes `/telemetria/`.

**WebSocket never connects / closes at ~60 s.** The `Upgrade` / `Connection`
headers or the long `proxy_read_timeout` are missing from `location
/telemetria/ws/`. Final URL the client dials is
`wss://yusa.app/telemetria/ws/live/{room}`.

**`/telemetria/api/...` returns nginx `404`/`502`.** `telemetria-api` isn't
listening on `127.0.0.1:8000` — `docker compose ps` in `~/APIs/telemetria-api`,
and `sudo ss -ltnp | grep 8000`.

**`npm ci` fails with `ECONNRESET` and `ping registry.npmjs.org` shows an IPv6
address with 100 % loss.** The host advertises unroutable IPv6. Prefer IPv4
system-wide:

```bash
echo 'precedence ::ffff:0:0/96  100' | sudo tee -a /etc/gai.conf
```

**`npm run build` fails on a type error.** `build` is `tsc --noEmit && vite
build` by design. Fix the type error, or (temporary) `npx vite build` to skip
the check.
