from __future__ import annotations

from datetime import datetime
from json import dumps

import requests
from requests.auth import HTTPBasicAuth
from sqlalchemy import select

from app.db.mysql import SessionDB1R, SessionDB1W
from app.models.hubnet_request import HubnetRequest
from app.models.hubnet_response import HubnetResponse
from app.schemas.hubnet_request_schema import HubnetRequestGet
from app.services.redis_service import publish_sync
from app.utils.env import ENV

CHANNEL_NAME = "sending_ke_hubnet_channel"


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
        print(msg)
        publish_sync(CHANNEL_NAME, dumps({"level": "info", "message": msg}))
        return

    # Bentuk payload sesuai contoh (list of objects)
    payload = []

    def _fmt_dt(val):
        if isinstance(val, datetime):
            return val.strftime("%Y-%m-%d %H:%M")
        return str(val) if val is not None else None

    for row in rows:
        # Validasi ringan via schema (akan raise jika field wajib tidak valid)
        HubnetRequestGet.model_validate(row)

        payload.append(
            {
                "AWB_NO": _fmt_dt(row.AWB_NO),
                "FLT_NUMBER": _fmt_dt(row.FLT_NUMBER),
                "FLT_DATE": _fmt_dt(row.FLT_DATE),
                "ORI": _fmt_dt(row.ORI),
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
        )

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
        except Exception:
            resp_json = None

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
        print(summary)
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

        print(f"Gagal mengirim ke HUBNET: {err_text}")
        publish_sync(
            CHANNEL_NAME,
            dumps({"level": "error", "message": f"Gagal mengirim ke HUBNET: {err_text}"}),
        )


# from app.services.redis_service import rds


# async def publish_sending_ke_hubnet():
#     await rds.publish(CHANNEL_NAME, "print")
