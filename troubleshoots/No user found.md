# No user found

## **QUESTION**

> deixa eu te explicar, eu estou em modo desenvolvimento. nao to usando docker. eu rodo:
> npm run frontend:dev
> npm run backend:dev
> 
> o mondo eh uma instancia que eu instalei.
> 
> entao, temos q fazer o procedimento sim
> se eu entendi, basta apager a colecao e reiniciar?
> 
> (eu mudei a base para InsightKB)

## **ANSWER**

Perfeito! Encontrei o problema. O erro acontece porque você apagou o usuário mas o **refresh token** ainda está válido no navegador/localStorage tentando se autenticar com um usuário que não existe mais.

**O problema:** O JWT token no seu navegador ainda aponta para o ObjectId `689a388cacac5957a2fbbaf5` que você deletou.

**Passo 10: Limpar tokens e sessões**

**Solução rápida:**

```bash
# Conectar no MongoDB
mongosh

# Usar sua database
use InsightKB

# Limpar todas as sessões ativas
db.sessions.deleteMany({})

# Verificar se existe collection de refresh tokens
show collections

# Se existir uma collection de tokens, limpar também
# db.refreshtokens.deleteMany({})

# Sair
exit
```

**E no seu navegador:**
1. Abra o DevTools (F12)
2. Application → Storage → Clear Storage → "Clear site data"
3. Ou simplesmente: **Ctrl+Shift+Delete** → Limpar dados do site

**Depois:**
1. Feche completamente o navegador
2. Reinicie o backend: `npm run backend:dev`
3. Abra o navegador em aba privada para testar
4. Registre um novo usuário

Isso deve resolver o problema do token órfão!