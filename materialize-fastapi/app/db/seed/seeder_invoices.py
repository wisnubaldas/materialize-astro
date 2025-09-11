from datetime import datetime
import random

from faker import Faker
from sqlalchemy.orm import Session
from sqlalchemy.exc import DBAPIError, OperationalError

from app.models.inv_ap2 import InvAp2  # pastikan path sesuai
from app.db.mysql import SessionDB1W  # koneksi DB-mu

fake = Faker()

def seed_invoices(n: int = 10):
    db: Session = SessionDB1W()
    try:
        for _ in range(n):
            invoice = InvAp2(
                NO_INVOICE=fake.unique.bothify(text="BGD1.INV.##.#######"),
                TANGGAL=fake.date_time_this_year().strftime("%Y-%m-%d %H:%M:%S"),
                SMU=fake.bothify(text="###-#######"),
                KDAIRLINE=random.choice(["GA", "JT", "ID", "QZ", "IU", "SJ"]),
                FLIGHT_NUMBER=fake.bothify(text="FL###"),
                DOM_INT=random.choice(["DOM", "INT"]),
                INC_OUT=random.choice(["INC", "OUT"]),
                ASAL=fake.city(),
                TUJUAN=fake.city(),
                JENIS_KARGO=random.choice(["GENERAL", "PERISHABLE", "DANGEROUS GOODS", "LIVE ANIMALS", "VALUABLE"]),
                TARIF_KARGO=str(random.randint(1000, 10000)),
                KOLI=str(random.randint(1, 50)),
                BERAT=str(round(random.uniform(10, 1000), 2)),
                VOLUME=str(round(random.uniform(0.1, 10), 2)),
                JML_HARI=str(random.randint(1, 7)),
                CARGO_CHG=str(random.randint(100000, 1000000)),
                KADE=fake.word(),
                TOTAL_PENDAPATAN_TANPA_PPN=str(random.randint(100000, 2000000)),
                TOTAL_PENDAPATAN_DENGAN_PPN=str(random.randint(100000, 2000000)),
                PJT_HANDLING_FEE=random.randint(0, 10000),
                RUSH_HANDLING_FEE=random.randint(0, 10000),
                RUSH_SERVICE_FEE=random.randint(0, 10000),
                TRANSHIPMENT_FEE=random.randint(0, 10000),
                ADMINISTRATION_FEE=random.randint(0, 10000),
                DOCUMENTS_FEE=random.randint(0, 10000),
                PECAH_PU_FEE=random.randint(0, 10000),
                COOL_COLD_STORAGE_FEE=random.randint(0, 10000),
                STRONG_ROOM_FEE=random.randint(0, 10000),
                AC_ROOM_FEE=random.randint(0, 10000),
                DG_ROOM_FEE=random.randint(0, 10000),
                AVI_ROOM_FEE=random.randint(0, 10000),
                DANGEROUS_GOOD_CHECK_FEE=random.randint(0, 10000),
                DISCOUNT_FEE=random.randint(0, 10000),
                RKSP_FEE=random.randint(0, 10000),
                HAWB=fake.bothify(text="HAWB-#####"),
                HAWB_FEE=random.randint(0, 10000),
                HAWB_MAWB_FEE=random.randint(0, 10000),
                CSC_FEE=random.randint(0, 10000),
                ENVIROTAINER_ELEC_FEE=random.randint(0, 10000),
                ADDITIONAL_COSTS=random.randint(0, 10000),
                NAWB_FEE=random.randint(0, 10000),
                BARCODE_FEE=random.randint(0, 10000),
                CARGO_DEVELOPMENT_FEE=random.randint(0, 10000),
                DUTIABLE_SHIPMENT_FEE=random.randint(0, 10000),
                FHL_FEE=random.randint(0, 10000),
                FWB_FEE=random.randint(0, 10000),
                CARGO_INSPECTION_REPORT_FEE=random.randint(0, 10000),
                MATERAI_FEE=random.randint(0, 10000),
                PPN_FEE=random.randint(0, 10000),
                status=random.choice([0, 1]),
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            db.add(invoice)

        db.commit()
        print(f"✅ {n} dummy invoices inserted successfully!")
    except (DBAPIError, OperationalError) as e:
        db.rollback()
        print("❌ Error while seeding:", e)
    finally:
        db.close()


if __name__ == "__main__":
    seed_invoices(20)  # ganti jumlah sesuai kebutuhan
