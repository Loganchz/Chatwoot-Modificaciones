#!/bin/bash
echo "=== FEATURE FLAGS DE CUENTAS ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -c "SELECT id, name, feature_flags FROM accounts;"

echo ""
echo "=== CONFIGS RELACIONADOS A PRICING/PLAN ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -c "SELECT id, name FROM installation_configs WHERE name LIKE '%PRICING%' OR name LIKE '%PLAN%' OR name LIKE '%FEATURE%';"

echo ""
echo "=== ACCOUNT LEVEL FEATURE DEFAULTS ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -c "SELECT serialized_value FROM installation_configs WHERE name = 'ACCOUNT_LEVEL_FEATURE_DEFAULTS';"
