#!/bin/bash
echo "COUNT:"
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT count(*) as cnt FROM accounts"
echo "---"
echo "FLAGS:"
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT id, name, feature_flags FROM accounts"
echo "---"
echo "DEFAULTS:"
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT name, serialized_value FROM installation_configs WHERE name = 'ACCOUNT_LEVEL_FEATURE_DEFAULTS'"
