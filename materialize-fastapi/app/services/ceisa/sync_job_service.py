"""Shim kompatibilitas import service CEISA lama."""

from app.integrations.ceisa.sync_job import CeisaSyncJobService

__all__ = ["CeisaSyncJobService"]
