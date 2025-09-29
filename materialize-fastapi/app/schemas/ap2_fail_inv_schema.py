
from pydantic import BaseModel, field_validator


class FailInvBase(BaseModel):
    inv: str | None = None
    desc: str | None = None
    status: str | None = None
    class Config:
        from_attributes = True 
    
    @field_validator("status",mode="before")
    @classmethod
    def parse_status(cls, v):
        if v is None:
            return None
        try:
            code = int(v)  # pastikan bisa dipaksa ke int walaupun input string
        except (ValueError, TypeError):
            return v  # kalau bukan angka, kembalikan apa adanya

        mapping = {
            1: "Sedang Dalam Proses Pengecekan Kembali",
            2: "Sedang Dalam Proses Pengecekan Berikutnya",
            3: "Tidak lagi di cek invoice melebihi batas waktu pengiriman",
        }
        return mapping.get(code, f"Unknown Status ({code})")
    
class FailInvCreate(FailInvBase):
    pass
class FailInvGet(FailInvBase):
    id: int