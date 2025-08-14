#!/bin/bash

# NIC Insight - Production Distribution Packing Script
# Gera distribuição completa para deploy em produção

set -e  # Exit on any error

echo "🚀 NIC Insight - Empacotamento para Produção"
echo "============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variáveis
DIST_DIR="./dist"
IMAGE_NAME="nic-insight"
IMAGE_TAG="latest"
TAR_FILE="nic-insight.tar"

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Validar se estamos no diretório correto
if [ ! -f "package.json" ] || [ ! -f ".env" ] || [ ! -f "librechat.yaml" ]; then
    log_error "Execute este script no diretório raiz do projeto NIC Insight"
    exit 1
fi

# Criar/limpar diretório dist
log_info "Preparando diretório de distribuição..."
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# Copiar Dockerfile de produção
log_info "Copiando Dockerfile de produção..."
cp Dockerfile.prod "$DIST_DIR/"
log_success "Dockerfile.prod copiado"

# Copiar arquivos de configuração
log_info "Copiando arquivos de configuração..."
cp .env "$DIST_DIR/"
cp librechat.yaml "$DIST_DIR/"
log_success "Arquivos de configuração copiados"

# Copiar package.json para referência
log_info "Copiando package.json..."
cp package.json "$DIST_DIR/"
log_success "package.json copiado"

# Copiar docker-compose de produção
log_info "Copiando docker-compose de produção..."
cp docker-compose.prod.yml "$DIST_DIR/docker-compose.yml"
log_success "docker-compose.yml copiado"

# Criar README de deploy
log_info "Criando documentação de deploy..."
cat > "$DIST_DIR/README-DEPLOY.md" << 'EOF'
# NIC Insight - Deploy de Produção

## Arquivos Incluídos

- `nic-insight.tar` - Imagem Docker completa com aplicação e configurações
- `docker-compose.yml` - Configuração para Traefik e dependências
- `deploy.sh` - Script automatizado de deploy

## Pré-requisitos no Servidor

1. Docker e Docker Compose instalados
2. Rede `codr-net` criada
3. Traefik configurado e rodando

## Deploy

```bash
# 1. Carregar a imagem
docker load -i nic-insight.tar

# 2. Criar diretórios necessários
mkdir -p data logs

# 3. Subir os serviços
docker compose up -d
```

## Verificação

```bash
# Status dos containers
docker compose ps

# Logs da aplicação
docker compose logs nic

# Logs do MongoDB
docker compose logs mongo
```

## URLs

- Aplicação: https://nic.codrstudio.dev
- Porta interna: 5678

## Persistência

- `./data` - Uploads e arquivos da aplicação
- `./logs` - Logs da aplicação
- `mongodb_data` - Volume do MongoDB
- `redis_data` - Volume do Redis
EOF

# Criar script de deploy automatizado
log_info "Criando script de deploy..."
cat > "$DIST_DIR/deploy.sh" << 'EOF'
#!/bin/bash

# Script de Deploy Automatizado - NIC Insight
set -e

echo "🚀 Deploy NIC Insight - Produção"
echo "================================"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

# Verificar se a rede existe
if ! docker network inspect codr-net > /dev/null 2>&1; then
    echo "⚠️  Rede 'codr-net' não encontrada. Criando..."
    docker network create codr-net
fi

# Carregar imagem
echo "📦 Carregando imagem Docker..."
docker load -i nic-insight.tar

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p data logs

# Parar serviços existentes (se houver)
echo "🛑 Parando serviços existentes..."
docker compose down 2>/dev/null || true

# Subir serviços
echo "🚀 Iniciando serviços..."
docker compose up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Verificar status
echo "🔍 Verificando status dos serviços..."
docker compose ps

echo ""
echo "✅ Deploy concluído!"
echo "🌐 Aplicação disponível em: https://nic.codrstudio.dev"
echo "📋 Logs: docker compose logs nic"
EOF

chmod +x "$DIST_DIR/deploy.sh"
log_success "Script de deploy criado: $DIST_DIR/deploy.sh"

# Criar script de build Docker
log_info "Criando script de build Docker..."
cat > "$DIST_DIR/build.sh" << 'EOF'
#!/bin/bash

# Script de Build - NIC Insight
set -e

echo "🔨 Build NIC Insight - Imagem Docker"
echo "===================================="

IMAGE_NAME="nic-insight"
IMAGE_TAG="latest"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando"
    exit 1
fi

# Build da imagem
echo "📦 Construindo imagem Docker..."
docker build -f Dockerfile.prod -t "$IMAGE_NAME:$IMAGE_TAG" .

# Salvar imagem
echo "💾 Salvando imagem..."
docker save -o nic-insight.tar "$IMAGE_NAME:$IMAGE_TAG"

echo "✅ Build concluído!"
echo "📁 Imagem salva em: nic-insight.tar"
echo "📋 Tamanho: $(du -h nic-insight.tar | cut -f1)"
EOF

chmod +x "$DIST_DIR/build.sh"
log_success "Script de build criado: $DIST_DIR/build.sh"

# Criar arquivo de informações da build
log_info "Gerando informações da build..."
cat > "$DIST_DIR/build-info.txt" << EOF
NIC Insight - Informações da Build
==================================

Data/Hora: $(date)
Usuário: $(whoami)
Hostname: $(hostname)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")

Arquivos Incluídos:
- Dockerfile.prod: Dockerfile de produção
- docker-compose.yml: Configuração para Traefik
- .env: Variáveis de ambiente
- librechat.yaml: Configuração da aplicação
- package.json: Dependências do projeto
- build.sh: Script para build da imagem Docker
- deploy.sh: Script de deploy automatizado

Configurações:
- .env: $(wc -l < .env) linhas
- librechat.yaml: $(wc -l < librechat.yaml) linhas

Dependências:
- MongoDB 7
- Redis 7-alpine
- Node.js 20-alpine
EOF

log_success "Informações da build salvas: $DIST_DIR/build-info.txt"

# Criar arquivo tar.gz da distribuição
log_info "Criando arquivo tar.gz da distribuição..."
DIST_ARCHIVE="nic-insight-dist-$(date +%Y%m%d-%H%M%S).tar.gz"
tar -czf "$DIST_ARCHIVE" -C dist .
log_success "Arquivo compactado criado: $DIST_ARCHIVE"

# Mostrar tamanho do arquivo
ARCHIVE_SIZE=$(du -h "$DIST_ARCHIVE" | cut -f1)
echo "  📦 Tamanho: $ARCHIVE_SIZE"

# Resumo final
echo ""
echo "📋 RESUMO DA DISTRIBUIÇÃO"
echo "========================"
echo "📁 Diretório: $DIST_DIR"
echo "📦 Arquivos na pasta dist:"
ls -la "$DIST_DIR"

echo ""
echo "📦 Arquivo compactado: $DIST_ARCHIVE ($ARCHIVE_SIZE)"

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "1. Transferir arquivo '$DIST_ARCHIVE' para o servidor"
echo "2. No servidor: tar -xzf $DIST_ARCHIVE"
echo "3. Executar: ./build.sh (para criar imagem Docker)"
echo "4. Executar: ./deploy.sh (para fazer deploy)"
echo "5. Verificar em: https://nic.codrstudio.dev"

log_success "Empacotamento concluído com sucesso!"