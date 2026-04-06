"""Konfigurasi mapping data invoice sumber -> kolom tabel inv_ap2.

File ini dipakai saat sinkronisasi invoice di:
- app/services/angkasapura_service.py
- method: INVAp2Service.get_data_inv()

Alur pakai singkat:
1. Query SQL (get_inv_export/get_inv_import/get_inv_export_pcp) ambil data mentah.
2. Setiap kolom hasil query di-convert dengan INVTOAP2INV ke nama field schema InvoiceCreate.
3. Nilai default/konstan di-inject lewat INVTOAP2INV_BASE sebelum insert ke tabel inv_ap2.
"""

# Nilai default/konstan untuk field inv_ap2.
# Nilai ini akan overwrite jika key yang sama sudah ada dari hasil mapping query.
INVTOAP2INV_BASE = {
    "DOM_INT": "I",
    "PJT_HANDLING_FEE": "0",
    "RUSH_HANDLING_FEE": "0",
    "RUSH_SERVICE_FEE": "0",
    "TRANSHIPMENT_FEE": "0",
    "PECAH_PU_FEE": "0",
    "COOL_COLD_STORAGE_FEE": "0",
    "STRONG_ROOM_FEE": "0",
    "AC_ROOM_FEE": "0",
    "DG_ROOM_FEE": "0",
    "AVI_ROOM_FEE": "0",
    "DANGEROUS_GOOD_CHECK_FEE": "0",
    "DISCOUNT_FEE": "0",
    "RKSP_FEE": "0",
    "HAWB_FEE": "0",
    "HAWB_MAWB_FEE": "0",
    "CSC_FEE": "0",
    "ENVIROTAINER_ELEC_FEE": "0",
    "NAWB_FEE": "0",
    "BARCODE_FEE": "0",
    "CARGO_DEVELOPMENT_FEE": "0",
    "DUTIABLE_SHIPMENT_FEE": "0",
    "FHL_FEE": "0",
    "FWB_FEE": "0",
    "CARGO_INSPECTION_REPORT_FEE": "0",
    "status": "0",
    "void": "0",
    "INC_OUT": "O",
}

# Mapping nama kolom hasil query sumber menjadi nama field standar inv_ap2/InvoiceCreate.
INVTOAP2INV = {
    "InvoiceNumber": "NO_INVOICE",
    "DateOfTransaction": "TANGGAL",
    "MasterAWB": "SMU",
    "AirlinesCode": "KDAIRLINE",
    "FlightNumber": "FLIGHT_NUMBER",
    "OriginCode": "ASAL",
    "Destination": "TUJUAN",
    "KindOfGood": "JENIS_KARGO",
    "tarif_kargo": "TARIF_KARGO",
    "TotalPieces": "KOLI",
    "TotalCAW": "BERAT",
    "TotalNetto": "VOLUME",
    "OverStay": "JML_HARI",
    "WarehouseFee": "CARGO_CHG",
    "TotalAssistancyFee": "KADE",
    "SubTotalFee": "TOTAL_PENDAPATAN_TANPA_PPN",
    "GrandTotalFee": "TOTAL_PENDAPATAN_DENGAN_PPN",
    "AdministrationFee": "ADMINISTRATION_FEE",
    "DocumentFee": "DOCUMENTS_FEE",
    "HostMAWB": "HAWB",
    "AirportContriFee": "ADDITIONAL_COSTS",
    "StampFee": "MATERAI_FEE",
    "TaxFee": "PPN_FEE",
}
