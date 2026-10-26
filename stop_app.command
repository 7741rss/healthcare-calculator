#!/bin/bash

# HealthcareCalculator 로컬 웹서버 안전 종료 스크립트
PORT=3000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================================"
echo "🛑 HealthcareCalculator 로컬 웹서버 종료 도구"
echo "========================================================"

PIDS=$(lsof -ti :$PORT)

if [ -z "$PIDS" ]; then
    echo "ℹ️ 포트 $PORT 에서 실행 중인 서버가 없습니다."
else
    for PID in $PIDS; do
        echo "🔄 서버 프로세스(PID: $PID) 종료 중..."
        kill -15 $PID 2>/dev/null || kill -9 $PID 2>/dev/null
    done
    sleep 1
    echo "✅ HealthcareCalculator 로컬 웹서버가 안전하게 종료되었습니다."
fi
echo "========================================================"
