SELECT 
    a.PaymentCode,
    a.CustomerCode,
    a.InvoiceNumber,
    a.DateOfTransaction,
    a.TimeOfTransaction,
    a.AirlinesCode,
    b.MasterAWB,
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
    c.HostAWB AS HostMAWB,
    a.StampFee,
    a.TaxFee,
    a.SubTotalFee,
    a.GrandTotalFee,
    b.WarehouseFee,
    f.FlightNumber,
    f.Origin AS OriginCode,
    f.Destination,
    c.KindOfNature AS KindOfGood,
    a.TotalColdStorageFee   AS ColdStorageFee,
    a.TotalStrongRoomFee    AS StrongRoomFee,
    a.TotalAirConditioningFee AS AirConditioningFee,
    a.TotalDangerousRoomFee AS DangerousRoomFee,
    d2.ValueItem            AS tarif_kargo,
    e.CompanyName           AS company,
    e.Address1              AS address,
    e.NPWPNumber            AS npwp,
    'Totalpecahpos'         AS Totalpecahpos,
    a.void
FROM eks_invoiceheader a
LEFT JOIN eks_invoicedetail b   ON a.InvoiceNumber = b.InvoiceNumber
LEFT JOIN eks_weighingdetail c  ON b.ProofNumber   = c.ProofNumber
LEFT JOIN eks_masterwaybill d   ON b.MasterAWB     = d.MasterAWB
LEFT JOIN mst_customer e        ON a.CustomerCode  = e.CustomerCode
LEFT JOIN eks_weighingheader f  ON b.ProofNumber   = f.ProofNumber
LEFT JOIN fare_directory d2
       ON d2.AgreementCode = a.AgreementCode
      AND d2.WareHouseCode = 'WHIMP'
      AND d2.ItemCode      = 'WFEE'
      AND a.DateOfTransaction BETWEEN d2.Datefrom AND d2.DateUntil
WHERE a.PaymentCode != 'F'
  AND a.AgreementCode NOT IN ('FX-MAWB')
  AND a.DateOfTransaction = :hari
  AND a.TimeOfTransaction BETWEEN :start_from AND :end_from;