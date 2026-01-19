from app.repository.discrepancy_code_repository import DiscrepancyCodeRepository


class DiscrepancyCodeService:
    def __init__(self, repo: DiscrepancyCodeRepository):
        self.repository = repo

    def list_all(self):
        return self.repository.list_all()
