# 🚀 Guia Rápido de Deploy - Sistema SSO Canellahub

Este documento contém todos os passos necessários para fazer o deploy do sistema SSO (Canellahub + Contask) em produção.

---

## 📋 Checklist Pré-Deploy

### Backend (Contask)

- [ ] ✅ Campos SSO adicionados ao schema Prisma (`ssoToken`, `ssoTokenExpiresAt`)
- [ ] ✅ Rotas SSO implementadas (`/api/auth/hub-login`, `/api/auth/sso-login`)
- [ ] ✅ CORS configurado para aceitar Canellahub
- [ ] ✅ Rate limiting configurado
- [ ] ✅ Logs de segurança implementados

### Frontend (Canellahub)

- [ ] ✅ Arquivos melhorados criados (`index-improved.html`, `script-improved.js`, `config.js`)
- [ ] ✅ `vercel.json` configurado
- [ ] ✅ Logo da empresa adicionada

### Infraestrutura

- [ ] Domínio `canellahub.com.br` registrado
- [ ] Subdomínio `contask.canellahub.com.br` configurado
- [ ] VPS com Contask rodando
- [ ] Certificado SSL configurado

---

## 🔧 Comandos Necessários

### 1. Atualizar Database Schema (Backend)

Se você ainda não rodou a migration para adicionar os campos SSO:

```bash
cd backend

# Gerar migration
npx prisma migrate dev --name add_sso_token

# OU se já existe a migration, apenas aplicar
npx prisma migrate deploy

# Regenerar Prisma Client
npx prisma generate
```

### 2. Verificar Configuração do Backend

```bash
cd backend

# Verificar variáveis de ambiente
cat .env | grep -E "NODE_ENV|FRONTEND_URL|DATABASE_URL"

# Deve mostrar:
# NODE_ENV=production
# FRONTEND_URL=https://contask.canellahub.com.br
# DATABASE_URL=postgresql://...
```

### 3. Reiniciar Backend (se já estiver rodando)

**Na VPS via SSH:**

```bash
# Se estiver usando PM2
pm2 restart contask-backend

# Se estiver usando systemd
sudo systemctl restart contask-backend

# Verificar logs
pm2 logs contask-backend --lines 50
# OU
sudo journalctl -u contask-backend -n 50 -f
```

### 4. Deploy do Canellahub na Vercel

**Opção A: Via Vercel CLI**

```bash
cd canellahub

# Login na Vercel (primeira vez)
vercel login

# Deploy em produção
vercel --prod

# Seguir instruções no terminal
```

**Opção B: Via GitHub + Vercel Dashboard**

1. Push do código para GitHub:
```bash
cd canellahub
git add .
git commit -m "feat: add canellahub with SSO"
git push origin main
```

2. Na Vercel Dashboard (https://vercel.com):
   - Clique em "Add New Project"
   - Selecione o repositório do GitHub
   - Configure:
     - **Framework Preset**: Other
     - **Root Directory**: `canellahub` (se aplicável)
     - **Build Command**: (vazio)
     - **Output Directory**: (vazio)
   - Clique em "Deploy"

### 5. Configurar Domínio na Vercel

1. Na Vercel Dashboard, vá em **Settings** → **Domains**
2. Adicione `canellahub.com.br`
3. Configure DNS no seu provedor:

```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

4. Aguarde propagação DNS (pode levar até 24h)

---

## 🧪 Testar em Produção

### 1. Testar Backend (API)

```bash
# Health check
curl https://contask.canellahub.com.br/api/health

# Deve retornar:
# {"status":"ok","timestamp":"...","version":"1.0.0"}

# Testar hub-login (trocar email/senha por credenciais válidas)
curl -X POST https://contask.canellahub.com.br/api/auth/hub-login \
  -H "Content-Type: application/json" \
  -d '{"email":"seu-email@example.com","password":"sua-senha"}'

# Deve retornar:
# {"autenticado":true,"userName":"Seu Nome","ssoToken":"..."}
```

### 2. Testar Frontend (Canellahub)

1. Acesse: `https://canellahub.com.br`
2. Faça login com suas credenciais do Contask
3. Clique em "Contask"
4. Você deve ser redirecionado e autenticado automaticamente

### 3. Verificar Logs

**Backend (na VPS):**
```bash
# Logs do PM2
pm2 logs contask-backend --lines 100 | grep -E "Hub-login|SSO"

# Buscar por:
# ✅ "Hub-login: Sucesso"
# ❌ "Hub-login: Senha inválida"
# ❌ "Rate limit excedido"
```

**Frontend (na Vercel):**
1. Acesse Vercel Dashboard
2. Vá em **Deployments**
3. Clique no deployment
4. Veja a aba **Logs**

---

## 🔒 Checklist de Segurança Pós-Deploy

### Imediato (Fazer Agora)

- [ ] ✅ HTTPS habilitado em ambos os domínios
- [ ] ✅ Certificado SSL válido
- [ ] ✅ CORS permitindo apenas domínios necessários
- [ ] ✅ Rate limiting funcionando
- [ ] ✅ Testar fluxo completo de SSO

### Primeira Semana

- [ ] Monitorar logs de tentativas de login falhadas
- [ ] Verificar se rate limiting está adequado
- [ ] Testar em diferentes navegadores/dispositivos
- [ ] Validar expiração de tokens SSO

### Mensal

- [ ] Revisar logs de segurança
- [ ] Atualizar dependências do backend
- [ ] Verificar certificados SSL

---

## 🐛 Troubleshooting Rápido

### Erro: "Bloqueado pelo CORS"

```bash
# Na VPS, editar backend/src/server.ts
# Adicionar domínio do Canellahub em allowedOrigins

# Reiniciar backend
pm2 restart contask-backend
```

### Erro: "Token SSO inválido"

```bash
# Verificar se database tem os campos SSO
psql -U seu-usuario -d sua-database

# No psql:
\d users

# Deve mostrar: ssoToken | ssoTokenExpiresAt
```

Se os campos não existirem:
```bash
cd backend
npx prisma migrate deploy
npx prisma generate
pm2 restart contask-backend
```

### Erro 500 no Backend

```bash
# Ver logs detalhados
pm2 logs contask-backend --lines 200 --err

# Verificar se database está acessível
cd backend
npx prisma studio
# Se abrir, database está OK
```

---

## 📊 Monitoramento

### Logs Importantes para Monitorar

**Backend:**
```bash
# Tentativas de login
pm2 logs | grep "Hub-login"

# Rate limiting
pm2 logs | grep "Rate limit"

# Erros
pm2 logs --err
```

**Vercel:**
- Acessar Dashboard → Deployments → Seu Deployment → Logs

### Métricas Recomendadas

- Taxa de sucesso de logins
- Tempo médio de resposta do hub-login
- Número de tokens SSO gerados vs usados
- Rate limits atingidos por IP

---

## 🔄 Rollback (Se Necessário)

### Reverter Backend

```bash
# Na VPS
cd backend
git log --oneline  # Ver commits
git revert HEAD    # Reverter último commit
npm install
pm2 restart contask-backend
```

### Reverter Frontend

**Na Vercel:**
1. Vá em **Deployments**
2. Encontre deployment anterior
3. Clique nos "..." → **Promote to Production**

---

## 📞 Contatos de Emergência

- **VPS Provider**: [seu provedor]
- **Domain Registrar**: [seu registrar]
- **Vercel Support**: https://vercel.com/support
- **Developer**: lukazcosta03@gmail.com

---

## ✅ Pós-Deploy Completo

Depois de confirmar que tudo está funcionando:

1. [ ] Remover arquivos antigos (`index.html`, `script.js`) do repositório
2. [ ] Atualizar README principal com informações sobre SSO
3. [ ] Documentar credenciais em local seguro
4. [ ] Fazer backup do database
5. [ ] Configurar monitoramento automático (opcional)

---

<div align="center">

**🎉 Deploy Concluído com Sucesso!**

Canellahub SSO está pronto para produção

</div>
