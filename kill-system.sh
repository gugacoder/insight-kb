#!/bin/bash

# Script para matar processos nas portas 3000 e 8000 e processos node/npm
# kill-system.sh

echo "🔍 Matando processos do LibreChat..."
echo ""

# Mata todos os processos npm e nodemon relacionados ao backend
echo "📍 Matando processos npm e nodemon..."
pkill -f "npm run backend" 2>/dev/null
pkill -f "nodemon api/server" 2>/dev/null
pkill -f "cross-env NODE_ENV" 2>/dev/null

# Aguarda um momento
sleep 1

# Mata processos órfãos e zumbis do node
echo "📍 Limpando processos node órfãos..."
pkill -9 -f "api/server/index.js" 2>/dev/null

# Mata qualquer processo nas portas específicas
echo "📍 Liberando portas 3000 e 8000..."
fuser -k 3000/tcp 2>/dev/null
fuser -k 8000/tcp 2>/dev/null

# Aguarda para garantir que processos foram encerrados
sleep 2

# Verifica e mata processos restantes
echo "📍 Verificando processos restantes..."
for PID in $(ps aux | grep -E "npm run backend|nodemon|api/server/index.js" | grep -v grep | awk '{print $2}'); do
    echo "  Matando PID: $PID"
    kill -9 $PID 2>/dev/null
done

echo ""
echo "🎯 Verificando status final..."
echo "-------------------"

# Verifica se as portas estão livres
for PORT in 3000 8000; do
    if nc -z localhost $PORT 2>/dev/null; then
        echo "❌ Porta $PORT: ainda OCUPADA"
    else
        echo "✅ Porta $PORT: LIVRE"
    fi
done

# Verifica processos restantes
REMAINING=$(ps aux | grep -E "npm run backend|nodemon|api/server/index.js" | grep -v grep | wc -l)
if [ "$REMAINING" -eq 0 ]; then
    echo "✅ Todos os processos do LibreChat foram encerrados"
else
    echo "⚠️  Ainda há $REMAINING processo(s) do LibreChat rodando"
fi

echo ""
echo "✨ Script concluído!"