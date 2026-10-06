#!/usr/bin/env bash
# Статистика посещений 5555words.com за последние 14 дней (журналы nginx) — отчёт открывается на Mac.
# Без cookies и внешних счётчиков; IP-адреса в отчёте обезличены. Запуск из папки words3000:  bash deploy/stats.sh
set -euo pipefail
OUT="${TMPDIR:-/tmp}/5555words-stats.html"
ssh 5555words 'zcat -f /var/log/nginx/access.log* | grep -v -E "\"(GET|POST|PUT|DELETE) /api/" | goaccess - --log-format=COMBINED --anonymize-ip --ignore-crawlers --no-progress -o html --html-report-title="5555words.com — посещения" 2>/dev/null' > "$OUT"
echo "Отчёт: $OUT"
command -v open >/dev/null && open "$OUT" || true
