from pydantic import BaseModel


class FhlMessageOut(BaseModel):
    """Formatted FHL payload for Cargo-IMP and Cargo-XML previews."""

    master_awb: str
    cargo_imp: str
    cargo_xml: str
