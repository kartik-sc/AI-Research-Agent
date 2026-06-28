"""initial schema — projects + sessions

Revision ID: 001
Revises:
Create Date: 2026-06-28

"""
from alembic import op
import sqlalchemy as sa

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "projects",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("color", sa.String(7), nullable=False, server_default="#7F77DD"),
        sa.Column("icon", sa.String(50), nullable=False, server_default="folder"),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )

    op.create_table(
        "sessions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("query", sa.Text, nullable=False),
        sa.Column("mode", sa.String(20), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("report", sa.Text, nullable=True),
        sa.Column("sources_json", sa.Text, nullable=True),
        sa.Column("sub_questions_json", sa.Text, nullable=True),
        sa.Column("knowledge_nodes_json", sa.Text, nullable=True),
        sa.Column("knowledge_edges_json", sa.Text, nullable=True),
        sa.Column("follow_ups_json", sa.Text, nullable=True),
        sa.Column("agent_events_json", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("duration_seconds", sa.Integer, nullable=True),
        sa.Column("project_id", sa.String(36), sa.ForeignKey("projects.id", ondelete="SET NULL"), nullable=True),
    )


def downgrade() -> None:
    op.drop_table("sessions")
    op.drop_table("projects")
