SELECT 
a.MasterAWB,
a.InvoiceNumber, 
a.ProofNumber, 
a.Pieces,
a.CAW,
a.Netto,
b.Volume,
b.FlightNumber,
b.KindOfgood,
b.AirlinesCode,
b.OriginCode,
b.DestinasiCode,
b.DateOfArrival,
b.TimeOfArrival,
d.CompanyName,
d.Address1
FROM inc_invoicedetail AS a
JOIN inc_weighingdetail AS b ON a.ProofNumber = b.ProofNumber 
JOIN inc_invoiceheader AS c ON a.InvoiceNumber = c.InvoiceNumber
JOIN mst_customer AS d ON c.CustomerCode = d.CustomerCode
WHERE b.DateOfArrival = :date_of_arrival;