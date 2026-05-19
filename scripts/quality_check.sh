#!/bin/bash
# Script to run all quality checks

set -e

echo "🚀 Running quality checks..."

# Format code
echo "📝 Formatting code with Black..."
black backend/

# Sort imports
echo "🔀 Sorting imports with isort..."
isort backend/

# Lint code
echo "🔍 Linting with flake8..."
flake8 backend/

# Type check
echo "🔬 Type checking with mypy..."
mypy backend/

# Run tests
echo "🧪 Running tests..."
cd backend
python -m pytest tests/ -v --tb=short

echo "✅ All quality checks passed!"
