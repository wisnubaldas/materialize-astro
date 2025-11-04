from io import BytesIO

import pandas as pd
from fastapi.responses import StreamingResponse

from app.schemas.hubnet_request_schema import HubnetRequestBase
from app.utils.helper import STR_DATE


class HubnetRequestExcel:
    @staticmethod
    def generate(data: any):  # type: ignore
        field_names = list(HubnetRequestBase.model_fields.keys())
        records = [HubnetRequestBase.model_validate(d).model_dump(mode="python") for d in data]
        df = pd.DataFrame(records, columns=field_names)  # noqa: PD901

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="DataTracking")

        output.seek(0)
        # response streaming
        headers = {"Content-Disposition": f"attachment; filename={STR_DATE}.xlsx"}
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )
