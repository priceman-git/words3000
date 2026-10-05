#!/usr/bin/env bash
# Первичная настройка сервера (Ubuntu 24.04) под 5555words.com. Запуск на сервере от root:
#   bash setup.sh
# Ставит nginx, certbot, файрвол, автообновления безопасности; вход по SSH — только по ключу.
set -euo pipefail

apt-get update -q
DEBIAN_FRONTEND=noninteractive apt-get upgrade -yq
DEBIAN_FRONTEND=noninteractive apt-get install -yq nginx certbot python3-certbot-nginx ufw unattended-upgrades rsync fail2ban

# файрвол: только SSH и веб
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

# SSH: вход только по ключу (ключ уже должен быть в /root/.ssh/authorized_keys)
if [ -s /root/.ssh/authorized_keys ]; then
  cat > /etc/ssh/sshd_config.d/10-keys-only.conf <<'EOF'
PasswordAuthentication no
KbdInteractiveAuthentication no
PermitRootLogin prohibit-password
EOF
  systemctl reload ssh 2>/dev/null || systemctl restart ssh.socket 2>/dev/null || true   # в 24.04 ssh запускается через ssh.socket — настройка действует для новых подключений
fi

# автоматические обновления безопасности
dpkg-reconfigure -f noninteractive unattended-upgrades

# сайт
mkdir -p /var/www/5555words
cp /tmp/nginx-5555words.conf /etc/nginx/sites-available/5555words
ln -sf /etc/nginx/sites-available/5555words /etc/nginx/sites-enabled/5555words
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx

echo "Готово. Дальше: публикация файлов (deploy/publish.sh) и сертификат:"
echo "  certbot --nginx -d 5555words.com -d www.5555words.com -d server.5555words.com --redirect -m <почта> --agree-tos -n"
