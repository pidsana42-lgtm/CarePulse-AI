#!/bin/bash
set -e

echo "=================================================="
echo "🏥 CarePulse AI - Local Development Environment"
echo "🤖 Model: Qwen 3.8 27B FP8 (Modal Cloud GPU)"
echo "=================================================="

# Ensure virtualenv exists
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    .venv/bin/pip install --upgrade pip
    .venv/bin/pip install modal -r backend/requirements.txt
fi

# Ensure frontend dependencies exist
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install --legacy-peer-deps && cd ..
fi

echo ""
echo "🚀 Starting FastAPI Backend (Port 8000)..."
.venv/bin/uvicorn app.main:app --app-dir backend --port 8000 --host 0.0.0.0 --reload &
BACKEND_PID=$!

echo "🚀 Starting Next.js Frontend (Port 3000)..."
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ System running at:"
echo "   - Citizen Portal (Frontend): http://localhost:3000"
echo "   - FastAPI Swagger Docs:     http://localhost:8000/docs"
echo "   - AI Status Endpoint:       http://localhost:8000/api/v1/ai/status"
echo "   - Modal Endpoint:           https://netnaphat0305--carepulse-qwen-38-27b-serve.modal.run"
echo ""
echo "Press Ctrl+C to terminate both services."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true; exit 0" INT TERM
wait
