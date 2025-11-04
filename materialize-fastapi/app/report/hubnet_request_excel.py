from io import BytesIO

import pandas as pd
from fastapi.responses import StreamingResponse


class HubnetRequestExcel:
    @staticmethod
    def generate(data: any):
        data_dict = [d.__dict__ for d in data]
        for row in data_dict:
            row.pop("_sa_instance_state", None)
        # convert ke DataFrame
        df = pd.DataFrame(data_dict)  # noqa: PD901

        output = BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, index=False, sheet_name="Data")

        output.seek(0)
        # response streaming
        headers = {"Content-Disposition": "attachment; filename=data_hubnet.xlsx"}
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers=headers,
        )
