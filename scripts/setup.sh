#!/bin/bash
echo "🚀 Setting up LeetCode Clone Development Environment..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create .env file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from .env.example"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Start databases
echo "🐳 Starting databases with Docker..."
docker-compose up -d

echo "⏳ Waiting for databases to be ready..."
sleep 30

echo "✅ Setup completed successfully!"
echo "🎉 Ready to start development!"
echo ""
echo "Next steps:"
echo "1. npm run dev - Start development servers"
echo "2. Open http://localhost:5000/health - Check API health"
