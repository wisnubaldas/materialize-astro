from sqlalchemy import select, text

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.hubnet_request import HubnetRequest
from app.utils.helper import HELPER


def run_incoming():
    try:
        query_file = "app/services/query/get_inc_hubnet.sql"
        db2 = SessionDB2R()
        query = HELPER.load_sql_query(query_file)
        param = {"date_of_arrival": "2021-09-06"}
        sql = text(query)
        inc = db2.execute(sql, param).mappings().all()
        for item in inc:
            if __cek_hostawb(item["MasterAWB"]):
                print(f"AWB_NO {item['MasterAWB']} sudah ada, skip insert")
            else:
                with SessionDB1W() as db1:
                    new_request = HubnetRequest(
                        AWB_NO=item["MasterAWB"],
                        FLT_NUMBER=item["FlightNumber"],
                        FLT_DATE=f"{item["DateOfArrival"]} {item["TimeOfArrival"]}",
                        ORI=item["OriginCode"],
                        DEST=item["DestinasiCode"],
                        FLT_NUMBER1=item["FlightNumber"],
                        FLT_DATE1=f"{item["DateOfArrival"]} {item["TimeOfArrival"]}",
                        ORI1=item["OriginCode"],
                        T=str(item["Volume"]),
                        K=str(item["Pieces"]),
                        CH_WEIGHT=str(item["CAW"]),
                        MC=str(item["Netto"]),
                        AGT_NAME=item["CompanyName"],
                        AGT_ADD=item["Address1"],
                        SHP_ADD=item["Address1"],
                        SHP_NAME=item["CompanyName"],
                        CNE_NAME=item["CompanyName"],
                        CNE_ADD=item["Address1"],
                        KATEGORI_CARGO=item["KindOfgood"],
                        COMMODITY=item["KindOfgood"],
                        CARGO_TREATMENT=item["KindOfgood"],
                        IS_INTERNATIONAL=0,
                        IS_EKSPOR=0,
                    )
                    db1.add(new_request)
                    db1.commit()
                    print(f"Insert AWB_NO {item['MasterAWB']} berhasil")
    except Exception as e:
        print("Error :", e)
    finally:
        db2.close()


def __cek_hostawb(awb):
    try:
        with SessionDB1W() as db1:
            result = db1.scalar(select(HubnetRequest).where(awb == HubnetRequest.AWB_NO))
            return result is not None

    except Exception as e:
        print("Error :", e)
    finally:
        db1.close()
