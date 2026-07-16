#!/bin/bash
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -c "SELECT id, name, feature_flags, custom_attributes FROM accounts;"
echo "---"
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -c "SELECT id, name, serialized_value FROM installation_configs WHERE name LIKE '%PRICING%' OR name LIKE '%FEATURE%' OR name LIKE '%ENTERPRISE%' OR name LIKE '%PLAN%';"
echo "---"
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -c "SELECT id, name, serialized_value FROM installation_configs;"
