#!/usr/bin/env bash
# Сервер синхронизации на VPS (запуск от root на сервере, app.py уже скопирован в /tmp/app.py):
#   systemd-сервис 5555words-api от отдельного пользователя, база /var/lib/5555words/app.db,
#   настройки /etc/5555words/api.env (SECRET создаётся здесь и наружу не выводится),
#   nginx: /api/ → 127.0.0.1:8081, ежедневная резервная копия базы (14 дней).
set -euo pipefail

id words >/dev/null 2>&1 || useradd --system --home /var/lib/5555words --shell /usr/sbin/nologin words
install -d -o words -g words -m 750 /var/lib/5555words
install -d -m 755 /opt/5555words; install -d -m 750 /etc/5555words /var/backups/5555words
install -m 644 /tmp/app.py /opt/5555words/app.py

if [ ! -f /etc/5555words/api.env ]; then
  umask 077
  cat > /etc/5555words/api.env <<EOF
DB=/var/lib/5555words/app.db
PORT=8081
SECRET=$(openssl rand -hex 32)
# Почта для кодов входа (пока пусто — коды пишутся в журнал: journalctl -u 5555words-api):
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# MAIL_FROM=3000 слов <no-reply@5555words.com>
EOF
fi
chown root:words /etc/5555words/api.env; chmod 640 /etc/5555words/api.env

cat > /etc/systemd/system/5555words-api.service <<'EOF'
[Unit]
Description=5555words.com — синхронизация прогресса
After=network.target

[Service]
User=words
Group=words
EnvironmentFile=/etc/5555words/api.env
ExecStart=/usr/bin/python3 /opt/5555words/app.py
Restart=always
RestartSec=3
NoNewPrivileges=yes
ProtectSystem=strict
ProtectHome=yes
PrivateTmp=yes
ReadWritePaths=/var/lib/5555words

[Install]
WantedBy=multi-user.target
EOF

# резервная копия базы — каждый день в 03:30, хранится 14 дней
cat > /etc/cron.d/5555words-backup <<'EOF'
30 3 * * * root sqlite3 /var/lib/5555words/app.db ".backup /var/backups/5555words/app-$(date +\%F).db" && find /var/backups/5555words -name 'app-*.db' -mtime +14 -delete
EOF
command -v sqlite3 >/dev/null || DEBIAN_FRONTEND=noninteractive apt-get install -yq sqlite3 >/dev/null

systemctl daemon-reload
systemctl enable --now 5555words-api
systemctl restart 5555words-api

# nginx: /api/ → сервис (вставляем один раз в server с 443)
CONF=/etc/nginx/sites-available/5555words
if ! grep -q 'location /api/' "$CONF"; then
  python3 - "$CONF" <<'PY'
import sys
p = sys.argv[1]; s = open(p).read()
block = """    # синхронизация прогресса — сервис 5555words-api
    location /api/ {
        proxy_pass http://127.0.0.1:8081;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Host $host;
        client_max_body_size 3m;
        add_header Cache-Control "no-store" always;
    }
"""
i = s.index('    location = /manifest.webmanifest')   # первый server-блок (443)
open(p, 'w').write(s[:i] + block + s[i:])
PY
fi
nginx -t && systemctl reload nginx
sleep 1; systemctl is-active 5555words-api
