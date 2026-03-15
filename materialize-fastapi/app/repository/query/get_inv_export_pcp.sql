-- Refactored from procedure `send_inv_exp_pcp` into plain query
-- Parameters:
--   :hari        -> match a.DateOfTransaction (YYYY-MM-DD)

SELECT DISTINCT
    a.CustomerCode,
    a.InvoiceNumber,
    a.PaymentCode,
    a.DateOfTransaction,
    a.TimeOfTransaction,
    a.MasterAWB,
    a.HAWB AS HostMAWB,
    d.AirlinesCode,
    d.FlightNumber,
    d.Origin AS OriginCode,
    d.Destination,
    a.HostFee AS tarif_kargo,
    e.KindOfCode AS KindOfGood,
    d.TotalPieces,
    d.TotalNetto,
    d.TotalVolume AS TotalCAW,
    c.overstay AS OverStay,
    0 AS WarehouseFee,
    0 AS TotalAssistancyFee,
    a.TotalFee AS SubTotalFee,
    a.Grandtotal AS GrandTotalFee,
    b.AdministrationFee,
    b.DocumentFee,
    0 AS Totalpecahpos,
    b.TotalColdStorageFee AS ColdStorageFee,
    b.TotalStrongRoomFee AS StrongRoomFee,
    b.TotalAirConditioningFee AS AirConditioningFee,
    b.TotalDangerousRoomFee AS DangerousRoomFee,
    c.OtherFee,
    0 AS AirportContriFee,
    b.StampFee,
    a.TaxFee,
    b.PaymentCode,
    f.CompanyName AS company,
    f.Address1 AS address,
    f.NPWPNumber AS npwp,
    a.void
FROM imp_invoicepecahpos AS a
INNER JOIN eks_invoiceheader AS b ON a.referensi = b.InvoiceNumber
INNER JOIN eks_invoicedetail AS c ON b.InvoiceNumber = c.InvoiceNumber
INNER JOIN eks_weighingheader AS d ON d.ProofNumber = c.ProofNumber
INNER JOIN eks_weighingdetail AS e ON d.ProofNumber = e.ProofNumber
INNER JOIN mst_customer AS f ON a.CustomerCode = f.CustomerCode
WHERE a.PaymentCode != 'F'
  AND a.type_inv IN ('PPOS','ATA','BARC','CIMP','CFHL','CFWB','BTT')
  AND a.DateOfTransaction = :hari
  AND a.AgreementCode <> 'TRANS';
