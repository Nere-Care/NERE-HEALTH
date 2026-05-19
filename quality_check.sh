#!/bin/bash
# Quality Check Script for NERE_APP
# Run this script to validate code quality before commits

set -e

echo "🔍 Running Quality Checks for NERE_APP..."

# Check if we're in the right directory
if [ ! -f "backend/requirements.txt" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

echo "📦 Checking Python dependencies..."
cd backend
python -m pip check

echo "🔧 Running pre-commit hooks..."
cd ..
pre-commit run --all-files

echo "🧪 Running tests..."
cd backend
python -m pytest tests/ -v --tb=short

echo "✅ All quality checks passed!"
echo ""
echo "📋 Summary:"
echo "  - Dependencies: OK"
echo "  - Code formatting: OK"
echo "  - Linting: OK"
echo "  - Type checking: OK"
echo "  - Security: OK"
echo "  - Tests: OK"
echo ""
echo "🚀 Ready for commit!"
