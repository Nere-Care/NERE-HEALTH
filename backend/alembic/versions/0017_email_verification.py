"""add email verification columns to users

Adds the columns used to store the email-verification token and its expiry.
Existing accounts were created before email verification existed : they are
marked as already verified so nobody gets locked out.

Revision ID: 0017_email_verification
Revises: 0016_missing_user_medecin_cols
Create Date: 2026-08-11
"""
from alembic import op

revision = "0017_email_verification"
down_revision = "0016_missing_user_medecin_cols"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255)")
    op.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expires TIMESTAMPTZ")
    op.execute("UPDATE users SET email_verifie = true WHERE email_verifie IS NOT true")


def downgrade() -> None:
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS email_verification_expires")
    op.execute("ALTER TABLE users DROP COLUMN IF EXISTS email_verification_token")
