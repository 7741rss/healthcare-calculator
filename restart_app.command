#!/bin/bash

# HealthcareCalculator 로컬 웹서버 재시작 스크립트
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🔄 HealthcareCalculator 서버 재시작 중..."
bash "$SCRIPT_DIR/stop_app.command"
sleep 1
bash "$SCRIPT_DIR/start_app.command"
