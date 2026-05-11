import logging
from datetime import datetime

import pytz
from sqlalchemy import select, text

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.BaseDB1.hubnet_request import HubnetRequest
from app.utils.helper import HELPER as Helper  # noqa: N811

jakarta_tz = pytz.timezone("Asia/Jakarta")
now_wib = datetime.now(jakarta_tz)

CHANNEL_NAME = "sending_ke_hubnet_channel"
logger = logging.getLogger("hubnet")


def _normalized_flt_datetime(date_value, time_value) -> str:
    now_ref = datetime.now(jakarta_tz)
    fallback_date = now_ref.strftime("%Y-%m-%d")
    fallback_time = now_ref.strftime("%H:%M:%S")

    date_text = str(date_value).strip() if date_value is not None else ""
    time_text = str(time_value).strip() if time_value is not None else ""

    if not date_text:
        date_text = fallback_date

    parsed_date = None
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
        try:
            parsed_date = datetime.strptime(date_text, fmt).strftime("%Y-%m-%d")  # noqa: DTZ007
            break
        except ValueError:
            continue
    if parsed_date is None:
        parsed_date = fallback_date

    if not time_text or time_text in {"00:00", "0:00", "00:00:00", "0:00:00", "00:00:00.000000"}:
        time_text = fallback_time

    parsed_time = None
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            t = datetime.strptime(time_text, fmt)  # noqa: DTZ007
            if t.hour == 0 and t.minute == 0 and t.second == 0:
                parsed_time = fallback_time
            else:
                parsed_time = t.strftime("%H:%M:%S")
            break
        except ValueError:
            continue
    if parsed_time is None:
        parsed_time = fallback_time

    return f"{parsed_date} {parsed_time}"


def run_breakdown():
    try:
        qfile = "app/repositories/hubnet_query/get_imp_hubnet.sql"
        db2 = SessionDB2R()
        query = Helper.load_sql_query(qfile)
        param = {"date_of_flight": now_wib.strftime("%Y-%m-%d")}
        sql = text(query)
        customers = db2.execute(sql, param).mappings().all()
        total = len(customers)
        logger.info(f"Data import berhasil di fetch {total} ➡️ data , 🕞 {param}")
        for cust in customers:
            # print(cust["MasterAWB"])
            if __cek_hostawb(cust["MasterAWB"]):
                logger.info(f"AWB_NO {cust['MasterAWB']} sudah ada, skip insert 👈(ﾟヮﾟ👈)")
                pass
            else:
                flt_datetime = _normalized_flt_datetime(
                    cust["DateOfBreakdown"], cust["TimeOfBreakdown"]
                )
                with SessionDB1W() as db1:
                    new_request = HubnetRequest(
                        AWB_NO=cust["MasterAWB"],
                        FLT_NUMBER=cust["FlightNo"],
                        FLT_DATE=flt_datetime,
                        ORI=cust["Origin"],
                        DEST="CGK",
                        FLT_NUMBER1=cust["FlightNo"],
                        FLT_DATE1=flt_datetime,
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
                    logger.info(f"Insert AWB_NO {cust['MasterAWB']} berhasil 🩲")
                    # publish_sync(
                    #     CHANNEL_NAME,
                    #     dumps(
                    #         {
                    #             "level": "info",
                    #             "message": f"✅ Insert AWB_NO {cust['MasterAWB']} berhasil",
                    #         }
                    #     ),
                    # )

    except Exception as e:
        logger.error(f"Error import run_breakdown: {e}")
        # publish_sync(
        #     CHANNEL_NAME,
        #     dumps({"level": "error", "message": f"Error: {e!s}"}),
        # )cc
    finally:
        db2.close()


def __cek_hostawb(awb):
    try:
        with SessionDB1W() as db1:
            result = db1.scalar(select(HubnetRequest).where(awb == HubnetRequest.AWB_NO))
            return result is not None
    except Exception as e:
        logger.error(f"Error cek HAWB : {e}")
    finally:
        db1.close()

