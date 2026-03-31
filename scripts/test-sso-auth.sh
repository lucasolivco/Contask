#!/bin/bash
# =============================================================
# Script de Testes: SSO, Código de Registro e Recuperação
# =============================================================
# Uso: bash scripts/test-sso-auth.sh [BASE_URL]
# Padrão: http://localhost:3001
# =============================================================

BASE_URL="${1:-http://localhost:3001}"
API_URL="$BASE_URL/api/auth"
PASSED=0
FAILED=0
COOKIE_JAR=$(mktemp)

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

cleanup() {
    rm -f "$COOKIE_JAR"
}
trap cleanup EXIT

log_pass() {
    echo -e "  ${GREEN}✓ PASS${NC}: $1"
    ((PASSED++))
}

log_fail() {
    echo -e "  ${RED}✗ FAIL${NC}: $1 (esperado: $2, recebido: $3)"
    ((FAILED++))
}

assert_status() {
    local description="$1"
    local expected="$2"
    local actual="$3"
    if [ "$actual" -eq "$expected" ] 2>/dev/null; then
        log_pass "$description"
    else
        log_fail "$description" "$expected" "$actual"
    fi
}

echo -e "\n${CYAN}=== Testes SSO, Registro e Recuperação ===${NC}"
echo -e "${YELLOW}Base URL: $BASE_URL${NC}\n"

# ----------------------------------------------------------
# 1. Health Check
# ----------------------------------------------------------
echo -e "${CYAN}[1] Health Check${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>/dev/null)
assert_status "GET /health retorna 200" 200 "$STATUS"

# ----------------------------------------------------------
# 2. Registro SEM código → 400
# ----------------------------------------------------------
echo -e "\n${CYAN}[2] Registro sem código de registro${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Teste SSO","email":"teste-sso-nocode@test.com","password":"Test123!@#","role":"EMPLOYEE"}')
assert_status "POST /register sem código → 400" 400 "$STATUS"

# ----------------------------------------------------------
# 3. Registro com código ERRADO → 400
# ----------------------------------------------------------
echo -e "\n${CYAN}[3] Registro com código errado${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$API_URL/register" \
    -H "Content-Type: application/json" \
    -d '{"name":"Teste SSO","email":"teste-sso-wrong@test.com","password":"Test123!@#","role":"EMPLOYEE","registrationCode":"CodigoErrado"}')
assert_status "POST /register com código errado → 400" 400 "$STATUS"

# ----------------------------------------------------------
# 4. Registro com código CORRETO → 201
# ----------------------------------------------------------
echo -e "\n${CYAN}[4] Registro com código correto${NC}"
TIMESTAMP=$(date +%s)
TEST_EMAIL="teste-sso-${TIMESTAMP}@test.com"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_URL/register" \
    -H "Content-Type: application/json" \
    -d "{\"name\":\"Teste SSO\",\"email\":\"${TEST_EMAIL}\",\"password\":\"Test123!@#\",\"role\":\"EMPLOYEE\",\"registrationCode\":\"Canellahub123*\"}")
STATUS=$(echo "$RESPONSE" | tail -1)
# Aceitar 201 (criado) ou 400 (email não verificado em ambiente de teste)
if [ "$STATUS" -eq 201 ]; then
    log_pass "POST /register com código correto → 201"
else
    log_fail "POST /register com código correto → 201" 201 "$STATUS"
fi

# ----------------------------------------------------------
# 5. Validate Session SEM cookie → 401
# ----------------------------------------------------------
echo -e "\n${CYAN}[5] Validate Session sem cookie${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    "$API_URL/validate-session")
assert_status "GET /validate-session sem cookie → 401" 401 "$STATUS"

# ----------------------------------------------------------
# 6. Hub Login → deve retornar Set-Cookie
# ----------------------------------------------------------
echo -e "\n${CYAN}[6] Hub Login (com credenciais válidas)${NC}"
echo -e "  ${YELLOW}Nota: Requer usuário real no banco. Testando com credenciais de teste...${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -c "$COOKIE_JAR" \
    -X POST "$API_URL/hub-login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@canellaesantos.com.br","password":"Admin123!@#"}')
STATUS=$(echo "$RESPONSE" | tail -1)

if [ "$STATUS" -eq 200 ]; then
    log_pass "POST /hub-login retorna 200"

    # Verificar se o cookie foi setado
    if grep -q "canellahub_session" "$COOKIE_JAR" 2>/dev/null; then
        log_pass "Cookie canellahub_session foi setado"
    else
        log_fail "Cookie canellahub_session foi setado" "presente" "ausente"
    fi

    # ----------------------------------------------------------
    # 7. Validate Session COM cookie → 200
    # ----------------------------------------------------------
    echo -e "\n${CYAN}[7] Validate Session com cookie válido${NC}"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -b "$COOKIE_JAR" \
        "$API_URL/validate-session")
    assert_status "GET /validate-session com cookie → 200" 200 "$STATUS"

    # ----------------------------------------------------------
    # 8. Hub Logout → limpar cookie
    # ----------------------------------------------------------
    echo -e "\n${CYAN}[8] Hub Logout${NC}"
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
        -X POST "$API_URL/hub-logout")
    assert_status "POST /hub-logout retorna 200" 200 "$STATUS"

    # Verificar se validate-session falha após logout
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
        -b "$COOKIE_JAR" \
        "$API_URL/validate-session")
    assert_status "GET /validate-session após logout → 401" 401 "$STATUS"
else
    echo -e "  ${YELLOW}⚠ Hub login falhou (status: $STATUS). Pulando testes 7-8 (requerem login válido).${NC}"
    echo -e "  ${YELLOW}  Certifique-se de que existe um usuário com email verificado no banco.${NC}"
fi

# ----------------------------------------------------------
# 9. Find Username (recuperação de nome de usuário)
# ----------------------------------------------------------
echo -e "\n${CYAN}[9] Recuperação de nome de usuário${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_URL/find-username" \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@teste.com"}')
STATUS=$(echo "$RESPONSE" | tail -1)
assert_status "POST /find-username retorna 200 (mensagem genérica)" 200 "$STATUS"

# ----------------------------------------------------------
# 10. Request Password Reset
# ----------------------------------------------------------
echo -e "\n${CYAN}[10] Solicitação de reset de senha${NC}"
RESPONSE=$(curl -s -w "\n%{http_code}" \
    -X POST "$API_URL/request-password-reset" \
    -H "Content-Type: application/json" \
    -d '{"email":"teste@teste.com"}')
STATUS=$(echo "$RESPONSE" | tail -1)
assert_status "POST /request-password-reset retorna 200 (mensagem genérica)" 200 "$STATUS"

# ----------------------------------------------------------
# 11. Validate Session com cookie inválido → 401
# ----------------------------------------------------------
echo -e "\n${CYAN}[11] Validate Session com cookie inválido${NC}"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -b "canellahub_session=token-invalido-fake-123" \
    "$API_URL/validate-session")
assert_status "GET /validate-session com cookie inválido → 401" 401 "$STATUS"

# ----------------------------------------------------------
# Resultado Final
# ----------------------------------------------------------
echo -e "\n${CYAN}==========================================${NC}"
TOTAL=$((PASSED + FAILED))
echo -e "  Total: $TOTAL | ${GREEN}Passou: $PASSED${NC} | ${RED}Falhou: $FAILED${NC}"
echo -e "${CYAN}==========================================${NC}\n"

if [ "$FAILED" -eq 0 ]; then
    echo -e "${GREEN}Todos os testes passaram!${NC}\n"
    exit 0
else
    echo -e "${RED}Alguns testes falharam. Verifique os resultados acima.${NC}\n"
    exit 1
fi
