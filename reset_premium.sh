#!/bin/bash
echo "=== ANTES DEL RESET ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT id, name, feature_flags FROM accounts"

echo ""
echo "=== EJECUTANDO RESET ==="
docker exec chatwoot-custom-produccion-rails-1 bundle exec rails runner "
Account.find_each do |account|
  Featurable::FEATURE_LIST.each do |feature|
    if feature['enabled']
      account.enable_features(feature['name'])
    else
      account.disable_features(feature['name'])
    end
  end
  account.save!
  STDOUT.puts \"Account #{account.id} (#{account.name}) reset OK - new flags: #{account.feature_flags}\"
end
" 2>&1

echo ""
echo "=== DESPUES DEL RESET ==="
docker exec chatwoot-custom-produccion-postgres-1 psql -U postgres -d chatwoot_production -t -A -c "SELECT id, name, feature_flags FROM accounts"

echo ""
echo "=== LIMPIANDO REDIS ==="
docker exec chatwoot-custom-produccion-redis-1 redis-cli -a chatwoot_redis_secure_pass FLUSHALL 2>/dev/null

echo ""
echo "=== REINICIANDO SERVICIOS ==="
docker restart chatwoot-custom-produccion-rails-1 chatwoot-custom-produccion-sidekiq-1
