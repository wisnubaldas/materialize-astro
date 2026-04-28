"""Ekspor service dan utilitas integrasi CEISA (lazy import)."""

from __future__ import annotations

from importlib import import_module

_LAZY_ATTRS = {
    "CeisaClientService": "app.integrations.ceisa.client",
    "CeisaLogService": "app.integrations.ceisa.log_service",
    "CeisaOAuthService": "app.integrations.ceisa.oauth",
    "CeisaReferenceCatalogService": "app.integrations.ceisa.reference_catalog",
    "CeisaReferenceCodeService": "app.integrations.ceisa.reference_code",
    "CeisaSyncJobService": "app.integrations.ceisa.sync_job",
    "CeisaXrayPhotoService": "app.integrations.ceisa.xray_photo_service",
    "CeisaXrayPhotoGetService": "app.integrations.ceisa.xray_photo_get_service",
}

__all__ = [
    "CeisaClientService",
    "CeisaLogService",
    "CeisaOAuthService",
    "CeisaReferenceCatalogService",
    "CeisaReferenceCodeService",
    "CeisaSyncJobService",
    "CeisaXrayPhotoService",
    "CeisaXrayPhotoGetService",
]


def __getattr__(name: str):
    """Load atribut package CEISA secara lazy untuk hindari circular import."""
    module_path = _LAZY_ATTRS.get(name)
    if module_path is None:
        raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
    module = import_module(module_path)
    return getattr(module, name)
