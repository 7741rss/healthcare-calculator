#!/bin/bash

# HealthcareCalculator 로컬 웹서버 실행 스크립트
PORT=3000
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "========================================================"
echo "🏥 HealthcareCalculator 로컬 웹서버 실행기"
echo "📍 목표 주소: http://localhost:$PORT"
echo "========================================================"

# 기존 포트 3000 점유 프로세스 확인 및 종료
EXISTING_PID=$(lsof -ti :$PORT)
if [ -n "$EXISTING_PID" ]; then
    echo "🔄 포트 $PORT 점유 프로세스(PID: $EXISTING_PID) 정리 중..."
    kill -9 $EXISTING_PID 2>/dev/null
    sleep 1
fi

echo "🚀 백그라운드 서버 기동 중..."
nohup python3 "$SCRIPT_DIR/server.py" $PORT > /dev/null 2>&1 &
SERVER_PID=$!

sleep 1

# 서버 상태 확인
if ps -p $SERVER_PID > /dev/null; then
    echo "========================================================"
    echo "🎉 HealthcareCalculator 서버가 백그라운드에서 성공적으로 시작되었습니다!"
    echo "📍 주소: http://localhost:$PORT"
    echo "⚙️ 프로세스 PID: $SERVER_PID"
    echo "💡 이 창을 닫아도 서버는 백그라운드에서 계속 실행됩니다."
    echo "💡 서버를 종료하려면 stop_app.command 를 실행하세요."
    echo "========================================================"
    open "http://localhost:$PORT" 2>/dev/null || true
else
    echo "❌ 서버 시작에 실패했습니다. server.py 및 로그를 확인해주세요."
fi
