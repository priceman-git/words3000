#!/usr/bin/env bash
# Публикация приложения на 5555words.com: копирует только файлы сайта (без data/, скриптов и документации).
# Запуск с Mac из папки words3000:  bash deploy/publish.sh
# Нужен SSH-доступ по ключу: в ~/.ssh/config есть Host 5555words.
set -euo pipefail
cd "$(dirname "$0")/.."
rsync -az --delete --chmod=Du=rwx,Dgo=rx,Fu=rw,Fgo=r \
  index.html privacy.html o-prilozhenii.html robots.txt sitemap.xml favicon.ico styles.css app.js sync.js words.js sw.js manifest.webmanifest fonts icons slova \
  5555words:/var/www/5555words/
echo "Опубликовано: https://5555words.com (версия $(grep -o 'const V = [0-9]*' sw.js | grep -o '[0-9]*'))"
