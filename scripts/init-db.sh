#!/bin/bash
# Initialize NERE_APP PostgreSQL Database
# Usage: docker compose exec db bash /init-db.sh

set -e

echo "🔄 Initializing NERE_APP PostgreSQL Database..."

# Create required extensions
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" << EOF
-- UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- JSON support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- pgvector for AI embeddings (optional, Phase 3)
-- CREATE EXTENSION IF NOT EXISTS "vector";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE "$POSTGRES_DB" TO "$POSTGRES_USER";

-- Create schema version table for migrations
CREATE TABLE IF NOT EXISTS schema_version (
    version_rank integer,
    installed_rank integer,
    version varchar(50) not null,
    description varchar(255) not null,
    type varchar(20) not null,
    script varchar(1000) not null,
    checksum integer,
    installed_by varchar(100) not null,
    installed_on timestamp not null default current_timestamp,
    execution_time integer not null,
    success boolean not null
);

-- Verify setup
SELECT '✅ UUID extension enabled' as setup_status WHERE EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp'
);

EOF

echo "✅ Database initialization complete!"
echo ""
echo "Database ready for Alembic migrations:"
echo "  alembic upgrade head"
