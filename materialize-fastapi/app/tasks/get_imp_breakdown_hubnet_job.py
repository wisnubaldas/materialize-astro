from sqlalchemy import select, text

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.hubnet_request import HubnetRequest
from app.utils.helper import HELPER as Helper


def run_breakdown():
    try:
        qfile = "app/services/query/get_imp_hubnet.sql"
        db2 = SessionDB2R()
        query = Helper.load_sql_query(qfile)
        param = {"date_of_flight": "2023-01-03"}
        sql = text(query)
        customers = db2.execute(sql, param).mappings().all()

        for cust in customers:
            # print(cust["MasterAWB"])
            if __cek_hostawb(cust["MasterAWB"]):
                print(f"AWB_NO {cust["MasterAWB"]} sudah ada, skip insert")
            else:
                with SessionDB1W() as db1:
                    new_request = HubnetRequest(
                        AWB_NO=cust["MasterAWB"],
                        FLT_NUMBER=cust["FlightNo"],
                        FLT_DATE=f"{cust["DateOfBreakdown"]} {cust["TimeOfBreakdown"]}",
                        ORI=cust["Origin"],
                        DEST="CGK",
                        FLT_NUMBER1=cust["FlightNo"],
                        FLT_DATE1=f"{cust["DateOfBreakdown"] } {cust["TimeOfBreakdown"]}",
                        ORI1=cust["Origin"],
                        T=str(cust["Volume"]),
                        K=str(cust["Quantity"]),
                        CH_WEIGHT=str(cust["Weight"]),
                        MC=str(cust["Netto"]),
                        AGT_NAME=cust["AgenCode"],
                        AGT_ADD=cust["AgenCode"],
                        SHP_ADD=cust["shipperaddress"],
                        SHP_NAME=cust["shippername"],
                        CNE_NAME=cust["Consigneename"],
                        CNE_ADD=cust["Consigneeaddress"],
                        KATEGORI_CARGO=cust["KindOfGood"],
                        COMMODITY=cust["DescriptionGoods"],
                        CARGO_TREATMENT=cust["DescriptionGoods"],
                        IS_INTERNATIONAL=1,
                        IS_EKSPOR=0,
                    )
                    db1.add(new_request)
                    db1.commit()
                    print(f"Insert AWB_NO {cust['MasterAWB']} berhasil")

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
