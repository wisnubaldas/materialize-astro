SELECT 
a.MasterAWB,
a.InvoiceNumber,
a.ProofNumber,
a.Pieces,
a.CAW,
a.Netto,
b.VolumeCargo AS Volume,
b.FlightNumber,
b.KindOfNature AS KindOfgood,
b.AirlinesCode,
b.origin AS OriginCode,
b.Destination AS DestinasiCode,
h.DateOfFlight AS DateOfArrival,
h.TimeOfEntry AS TimeOfArrival,
d.CompanyName,
d.Address1
FROM out_invoicedetail AS a
JOIN out_weighingdetail AS b ON a.id_weighing = b.id
JOIN out_invoiceheader AS c ON a.InvoiceNumber = c.InvoiceNumber
JOIN out_weighingheader AS h ON b.id_header = h._id
JOIN mst_customer AS d ON c.CustomerCode = d.CustomerCode
WHERE h.DateOfFlight = :date_of_flight;
