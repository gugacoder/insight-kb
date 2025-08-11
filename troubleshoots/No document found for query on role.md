# No document found for query on role

## 🚨 Problema: Sistema não inicia/funciona

### Sintomas
```
2025-08-11T19:22:36.965Z error: There was an uncaught error: No document found for query "{ _id: new ObjectId('689822d966543958f7e9ad66') }" on model "Role"
```

### O que acontece
- LibreChat tenta buscar Role específica que não existe
- Sistema pode falhar ao fazer login
- Referências órfãs de sessões antigas causam o problema

---

## ✅ Solução Simples

### Passo Único: Limpar Sessões Órfãs

```bash
# Conectar ao MongoDB
mongosh  # ou docker exec -it mongodb mongosh (se usando Docker)

# Usar database correto 
use insight-kb  # ou nome da sua database

# SOLUÇÃO: Limpar sessões corrompidas
db.sessions.deleteMany({})

# Sair
exit
```

### Reiniciar Sistema
```bash
# Reiniciar LibreChat
# Docker: docker-compose restart
# Local: parar e iniciar processo novamente
```

---

## 🔍 Por que funciona?

**Causa raiz:** Sessões antigas contêm referências para Roles que foram deletadas ou não existem mais no banco.

**Solução:** Ao limpar `db.sessions.deleteMany({})`, remove todas as referências órfãs, permitindo que o sistema crie sessões limpas.

---

## ⚠️ Nota
Este erro geralmente aparece após:
- Mudanças manuais em usuários/roles
- Atualizações do LibreChat  
- Problemas de migração de dados

**Sempre tente limpar sessões primeiro** antes de investigações mais complexas.