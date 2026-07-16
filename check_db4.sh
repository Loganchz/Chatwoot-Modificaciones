#!/bin/bash
echo "=== ACCOUNT FEATURE FLAGS (bitfield) ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT id, name, feature_flags FROM accounts"
echo ""
echo "=== INSTALLATION_PRICING_PLAN ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT serialized_value FROM installation_configs WHERE name = 'INSTALLATION_PRICING_PLAN'"
