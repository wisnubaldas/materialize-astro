from pydantic import BaseModel


class FwbMessageOut(BaseModel):
    """Formatted FWB payload for Cargo-IMP and Cargo-XML previews."""

    mawb: str
    cargo_imp: str
    cargo_xml: str
