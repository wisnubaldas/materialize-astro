-- Refactored from procedure `send_invoice_imp` into plain parameterized query
-- Parameters:
--   :hari        -> match a.DateOfTransaction (YYYY-MM-DD)

SELECT DISTINCT
    a.PaymentCode,
    a.CustomerCode,
    a.InvoiceNumber,
    a.DateOfTransaction,
    a.TimeOfTransaction,
    b.MasterAWB,
    a.AirlinesCode,
    c.FlightNumber,
    c.KindOfGood,
    c.OriginCode,
    d2.ValueItem AS tarif_kargo,
    b.Pieces,
    a.TotalPieces,
    b.Netto,
    a.TotalNetto,
    b.CAW,
    a.TotalCAW,
    b.OverStay,
    a.AdministrationFee,
    a.DocumentFee,
    a.TotalAssistancyFee,
    b.OtherFee,
    b.AirportContriFee,
    a.Totalpecahpos,
    b.ColdStorageFee,
    b.StrongRoomFee,
    b.HostMAWB,
    b.CoolRoomFee,
    b.AirConditioningFee,
    b.DangerousRoomFee,
    a.StampFee,
    a.TaxFee,
    a.SubTotalFee,
    a.GrandTotalFee,
    b.WarehouseFee,
    a.void,
    IF(f.CompanyName IS NULL OR f.CompanyName = '', e.AgenCode, f.CompanyName) AS company,
    IF(f.Address1 IS NULL OR f.Address1 = '', e.shipperaddress, f.Address1) AS address,
    IF(f.NPWPNumber IS NULL OR f.NPWPNumber = '', a.TaxNumber, f.NPWPNumber) AS npwp
FROM imp_invoiceheader AS a
LEFT JOIN imp_invoicedetail AS b
    ON a.InvoiceNumber = b.InvoiceNumber
LEFT JOIN imp_deliorderdetail AS c
    ON b.DeliveryOrderNumber = c.DONumber
LEFT JOIN imp_hostawb AS e
    ON b.HostMAWB = e.HostAWB
LEFT JOIN mst_customer AS f
    ON a.CustomerCode = f.CustomerCode
LEFT JOIN fare_directory AS d2
    ON d2.AgreementCode = a.AgreementCode
   AND d2.WareHouseCode = 'WHIMP'
   AND d2.ItemCode = 'WFEE'
   AND a.DateOfTransaction BETWEEN d2.Datefrom AND d2.DateUntil
WHERE a.PaymentCode != 'F'
  AND a.DateOfTransaction = :hari
  AND a.AgreementCode <> 'TRANS';
