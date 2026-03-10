from datetime import datetime
from json import dumps

import pytz
from sqlalchemy import select, text

from app.db.mysql import SessionDB1W, SessionDB2R
from app.models.BaseDB1.hubnet_request import HubnetRequest
from app.services.redis_service import publish_sync
from app.utils.helper import HELPER

CHANNEL_NAME = "sending_ke_hubnet_channel"
jakarta_tz = pytz.timezone("Asia/Jakarta")
now_wib = datetime.now(jakarta_tz)


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

    if not time_text:
        time_text = fallback_time
    elif time_text in {"00:00", "0:00", "00:00:00", "0:00:00", "00:00:00.000000"}:
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


def run_incoming():
    try:
        query_file = "app/repository/query/get_inc_hubnet.sql"
        db2 = SessionDB2R()
        query = HELPER.load_sql_query(query_file)
        param = {"date_of_arrival": now_wib.strftime("%Y-%m-%d")}
        sql = text(query)
        inc = db2.execute(sql, param).mappings().all()
        for item in inc:
            if __cek_hostawb(item["MasterAWB"]):
                print(f"AWB_NO {item['MasterAWB']} sudah ada, skip insert")
                publish_sync(
                    CHANNEL_NAME,
                    dumps(
                        {
                            "level": "info",
                            "message": f"📟 AWB_NO {item['MasterAWB']} sudah ada, skip insert",
                        }
                    ),
                )
            else:
                flt_datetime = _normalized_flt_datetime(item["DateOfArrival"], item["TimeOfArrival"])
                with SessionDB1W() as db1:
                    new_request = HubnetRequest(
                        AWB_NO=item["MasterAWB"],
                        FLT_NUMBER=item["FlightNumber"],
                        FLT_DATE=flt_datetime,
                        ORI=item["OriginCode"],
                        DEST=item["DestinasiCode"],
                        FLT_NUMBER1=item["FlightNumber"],
                        FLT_DATE1=flt_datetime,
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
                    publish_sync(
                        CHANNEL_NAME,
                        dumps(
                            {
                                "level": "info",
                                "message": f"✅ Insert AWB_NO {item['MasterAWB']} berhasil",
                            }
                        ),
                    )
    except Exception as e:
        print("Error :", e)
        publish_sync(
            CHANNEL_NAME,
            dumps({"level": "error", "message": f"Error: {e!s}"}),
        )
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
