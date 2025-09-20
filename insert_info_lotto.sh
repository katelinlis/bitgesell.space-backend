#!/usr/bin/env bash

DB_USER="app2"
DB_PASS="app2"
DB_NAME="opensea_lotto2"
DB_HOST="localhost"

run_sql() {
  PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -c "$1"
}

record_exists() {
  local count
  count=$(PGPASSWORD="$DB_PASS" psql -U "$DB_USER" -d "$DB_NAME" -h "$DB_HOST" -t -A -c "SELECT COUNT(*) FROM info_lotto;")
  [ "$count" -gt 0 ]
}

select_field() {
  echo
  echo "🎯 Выберите поле, которое хотите изменить:"
  select opt in "last_payment" "wining_block" "round" "wbgl" "Выйти"; do
    case $opt in
      "last_payment"|"wining_block"|"round"|"wbgl")
        field="$opt"
        return 0
        ;;
      "Выйти")
        field=""
        return 1
        ;;
      *)
        echo "❌ Неверный выбор"
        ;;
    esac
  done
}

if record_exists; then
  echo "⚡ В таблице уже есть запись, будем делать UPDATE"
  while true; do
    select_field
    if [ -z "$field" ]; then
      echo "Выход из программы."
      break
    fi

    read -rp "Введите новое значение для $field: " value

    # SQL с корректным именем колонки
    run_sql "UPDATE info_lotto SET $field = '$value';"

    echo "✅ Поле $field обновлено"
  done
else
  echo "⚡ Таблица пустая, нужно добавить запись (INSERT)"
  read -rp "Введите last_payment: " last_payment
  read -rp "Введите wining_block: " wining_block
  read -rp "Введите round: " round
  read -rp "Введите wbgl: " wbgl
  run_sql "INSERT INTO info_lotto (last_payment, wining_block, round, wbgl)
           VALUES ('$last_payment', $wining_block, $round, $wbgl);"
  echo "✅ Запись добавлена"
fi