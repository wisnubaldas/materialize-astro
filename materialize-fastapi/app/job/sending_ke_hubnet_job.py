from __future__ import annotations

import logging
import re
from datetime import date, datetime
from json import dumps

import requests
from requests.auth import HTTPBasicAuth
from sqlalchemy import select

from app.db.mysql import SessionDB1R, SessionDB1W
from app.models.BaseDB1.hubnet_request import HubnetRequest
from app.models.BaseDB1.hubnet_response import HubnetResponse
from app.schemas.hubnet_request_schema import HubnetRequestGet
from app.services.redis_service import publish_sync
from app.utils.env import ENV

CHANNEL_NAME = "sending_ke_hubnet_channel"

logger = logging.getLogger("hubnet")


def run_sending_ke_hubnet(use_dev_url: bool = True, limit: int = 10) -> None:  # noqa: PLR0912, PLR0915
    """
    Kirim data ke Kemenhub HUBNET dengan Basic Auth.

    - Sumber data: tabel hubnet_request (IS_SEND = "0").
    - Payload mengikuti schema HubnetRequest (hubnet_request_schema.py).
    - Jika sukses, set IS_SEND="1" dan IS_SUCCESS="1"; jika gagal set IS_FAILED="1".
    """

    url_base = ENV.HUBNET_URL_DEV if use_dev_url else ENV.HUBNET_URL
    url = f"{url_base}/nle-udara/receive-data-logistik"

    # Ambil data yang belum terkirim (batasi per batch)
    publish_sync(
        CHANNEL_NAME,
        dumps({"level": "info", "message": "🔔 Job sending_ke_hubnet dimulai"}),
    )
    logger.info("🔔 Job sending_ke_hubnet dimulai")
    with SessionDB1R() as rsession:
        rows: list[HubnetRequest] = (
            rsession.query(HubnetRequest)
            .filter(HubnetRequest.IS_SEND == "0")
            .order_by(HubnetRequest.created_at.asc())
            .limit(limit)
            .all()
        )

    if not rows:
        msg = "Tidak ada data IS_SEND=0 untuk dikirim."
        logger.info(msg)
        publish_sync(CHANNEL_NAME, dumps({"level": "info", "message": msg}))
        return

    # Bentuk payload sesuai contoh (list of objects)
    payload = []
    send_time = datetime.now()  # noqa: DTZ005

    def _fmt_dt(val):
        if isinstance(val, datetime):
            return val.strftime("%Y-%m-%d %H:%M")
        return str(val) if val is not None else None

    def _fmt_flt_date(val):  # noqa: PLR0911
        fallback_hhmm = send_time.strftime("%H:%M")
        fallback_full = send_time.strftime("%Y-%m-%d %H:%M")

        def _ensure_non_zero(dt_value: datetime) -> datetime:
            dt_value = dt_value.replace(microsecond=0)
            if dt_value.hour == 0 and dt_value.minute == 0 and dt_value.second == 0:
                return dt_value.replace(
                    hour=send_time.hour,
                    minute=send_time.minute,
                    second=send_time.second,
                )
            return dt_value

        if val is None:
            return fallback_full

        if isinstance(val, datetime):
            return _ensure_non_zero(val).strftime("%Y-%m-%d %H:%M")

        if isinstance(val, date):
            return datetime.combine(val, datetime.min.time()).replace(
                hour=send_time.hour,
                minute=send_time.minute,
                second=send_time.second,
            ).strftime("%Y-%m-%d %H:%M")

        raw = str(val).strip()
        if not raw:
            return fallback_full

        normalized = raw.replace("T", " ").rstrip("Z").strip()

        for fmt in (
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%d %H:%M",
            "%Y/%m/%d %H:%M:%S",
            "%Y/%m/%d %H:%M",
            "%d-%m-%Y %H:%M:%S",
            "%d-%m-%Y %H:%M",
            "%d/%m/%Y %H:%M:%S",
            "%d/%m/%Y %H:%M",
        ):
            try:
                return _ensure_non_zero(datetime.strptime(normalized, fmt)).strftime("%Y-%m-%d %H:%M")  # noqa: DTZ007
            except ValueError:
                continue

        for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y"):
            try:
                date_part = datetime.strptime(normalized, fmt).strftime("%Y-%m-%d")  # noqa: DTZ007
                return f"{date_part} {fallback_hhmm}"
            except ValueError:
                continue

        date_prefix = re.match(r"^(\d{4}[-/]\d{2}[-/]\d{2})", normalized)
        if date_prefix:
            date_part = date_prefix.group(1).replace("/", "-")
            return f"{date_part} {fallback_hhmm}"

        return fallback_full

    for row in rows:
        # Validasi ringan via schema (akan raise jika field wajib tidak valid)
        HubnetRequestGet.model_validate(row)
        data_dikirim = {
            "AWB_NO": row.AWB_NO,
            "FLT_NUMBER": row.FLT_NUMBER,
            "FLT_DATE": _fmt_flt_date(row.FLT_DATE),
            "ORI": row.ORI,
            "DEST": _fmt_dt(row.DEST),
            "FLT_NUMBER1": _fmt_dt(row.FLT_NUMBER1),
            "FLT_DATE1": _fmt_dt(row.FLT_DATE1),
            "ORI1": _fmt_dt(row.ORI1),
            "T": _fmt_dt(row.T),
            "K": _fmt_dt(row.K),
            "CH_WEIGHT": _fmt_dt(row.CH_WEIGHT),
            "MC": _fmt_dt(row.MC),
            "AGT_NAME": _fmt_dt(row.AGT_NAME),
            "AGT_ADD": _fmt_dt(row.AGT_ADD),
            "SHP_NAME": _fmt_dt(row.SHP_NAME),
            "SHP_ADD": _fmt_dt(row.SHP_ADD),
            "CNE_NAME": _fmt_dt(row.CNE_NAME),
            "CNE_ADD": _fmt_dt(row.CNE_ADD),
            "KATEGORI_CARGO": _fmt_dt(row.KATEGORI_CARGO),
            "COMMODITY": _fmt_dt(row.COMMODITY),
            "CARGO_TREATMENT": _fmt_dt(row.CARGO_TREATMENT),
            "REMARKS": _fmt_dt(row.REMARKS) or "",
        }
        payload.append(data_dikirim)
        logger.debug(f"data yg dikirim {data_dikirim}")

    try:
        publish_sync(
            CHANNEL_NAME,
            dumps(
                {
                    "level": "info",
                    "message": f"Kirim {len(rows)} data ke HUBNET ...",
                }
            ),
        )
        resp = requests.post(
            url,
            json=payload,
            auth=HTTPBasicAuth(ENV.HUBNET_USER, ENV.HUBNET_PASSWORD),
            timeout=60,
        )

        # Coba parse JSON untuk ambil status/message/ref_id
        resp_json = None
        try:
            resp_json = resp.json()
            logger.info("Berhasil sending ke hubnet", extra={"res": resp_json})
        except Exception:
            resp_json = None
            logger.error(str(resp_json))
        # Bangun mapping AWB -> ref_id atau ref_id batch jika tersedia
        awb_to_ref: dict[str, str] = {}
        ref_id_global: str | None = None
        if isinstance(resp_json, list):
            for item in resp_json:
                if not isinstance(item, dict):
                    continue
                awb = item.get("AWB_NO") or item.get("awb_no") or item.get("awb")
                ref = item.get("ref_id") or item.get("refid")
                if awb and ref is not None:
                    awb_to_ref[str(awb)] = str(ref)
        elif isinstance(resp_json, dict):
            data = resp_json.get("data")
            # Case: data is dict with a single ref_id for the whole batch
            if isinstance(data, dict) and ("ref_id" in data or "refid" in data):
                ref = data.get("ref_id") or data.get("refid")
                if ref is not None:
                    ref_id_global = str(ref)
            # Case: data is list of items with per-AWB ref
            elif isinstance(data, list):
                for item in data:
                    if not isinstance(item, dict):
                        continue
                    awb = item.get("AWB_NO") or item.get("awb_no") or item.get("awb")
                    ref = item.get("ref_id") or item.get("refid")
                    if awb and ref is not None:
                        awb_to_ref[str(awb)] = str(ref)
            else:
                # Case: top-level single response with ref_id
                ref = resp_json.get("ref_id") or resp_json.get("refid")
                if ref is not None and len(rows) >= 1:
                    ref_id_global = str(ref)

        with SessionDB1W() as wsession:
            # Simpan log response
            message_txt = (
                resp_json.get("message")[:255]
                if isinstance(resp_json, dict) and resp_json.get("message")
                else str(resp.text)[:255]
            )

            if ref_id_global is not None:
                # Satu baris log dengan ref_id batch
                wsession.add(
                    HubnetResponse(
                        status=str(resp.status_code), message=message_txt, ref_id=ref_id_global
                    )
                )
            elif awb_to_ref:
                # Per item
                for _awb, ref in awb_to_ref.items():
                    wsession.add(
                        HubnetResponse(
                            status=str(resp.status_code), message=message_txt, ref_id=ref
                        )
                    )
            else:
                # Tidak ada ref_id terdeteksi
                wsession.add(
                    HubnetResponse(status=str(resp.status_code), message=message_txt, ref_id=None)
                )

            # Update flag kirim + ref_id jika tersedia
            if resp.ok:
                for r in rows:
                    db_row = wsession.execute(
                        select(HubnetRequest).where(HubnetRequest.id == r.id)
                    ).scalar_one()
                    db_row.IS_SEND = "1"
                    db_row.IS_SUCCESS = "1"
                    db_row.SUCCESS_MESSAGE = "SENT"
                    if r.AWB_NO in awb_to_ref:
                        db_row.ref_id = awb_to_ref[r.AWB_NO]
                    elif ref_id_global is not None:
                        db_row.ref_id = ref_id_global
            else:
                for r in rows:
                    db_row = wsession.execute(
                        select(HubnetRequest).where(HubnetRequest.id == r.id)
                    ).scalar_one()
                    db_row.IS_FAILED = "1"
                    db_row.ERROR_MESSAGE = resp.text[:500]

            wsession.commit()

        summary = f"Kirim data: HTTP {resp.status_code}. Detail: {resp.text[:200]}"
        logger.info(summary)
        publish_sync(
            CHANNEL_NAME,
            dumps(
                {
                    "level": "success" if resp.ok else "error",
                    "message": summary,
                }
            ),
        )

    except requests.exceptions.RequestException as e:
        # Gagal total (network/timeout) → catat error dan tandai gagal
        err_text = str(e)
        with SessionDB1W() as wsession:
            wsession.add(
                HubnetResponse(status="REQUEST_EXCEPTION", message=err_text[:255], ref_id=None)
            )
            for r in rows:
                db_row = wsession.execute(
                    select(HubnetRequest).where(HubnetRequest.id == r.id)
                ).scalar_one()
                db_row.IS_FAILED = "1"
                db_row.ERROR_MESSAGE = err_text[:500]
            wsession.commit()

        logger.info(f"Gagal mengirim ke HUBNET: {err_text}")
        publish_sync(
            CHANNEL_NAME,
            dumps({"level": "error", "message": f"Gagal mengirim ke HUBNET: {err_text}"}),
        )


# from app.services.redis_service import rds


# async def publish_sending_ke_hubnet():
#     await rds.publish(CHANNEL_NAME, "print")
