SELECT
  d.MasterAWB AS mawb,
  MAX(d.AirlinesCode) AS airlines_code,
  MAX(d.FlightNumber) AS flight_number,
  MAX(d.Origin) AS origin,
  MAX(d.Destination) AS dest,
  MAX(h.DateOfFlight) AS flight_date,
  SUM(COALESCE(d.Pieces, 0)) AS total_pieces,
  SUM(COALESCE(d.VolumeCargo, 0)) AS total_volume,
  SUM(COALESCE(d.Netto, 0)) AS total_weight,
  MAX(NULLIF(TRIM(d.KindOfNature), '')) AS nature_of_goods
FROM out_weighingdetail AS d
JOIN out_weighingheader AS h
  ON d.id_header = h._id
WHERE d.MasterAWB IN :mawb
GROUP BY d.MasterAWB;
