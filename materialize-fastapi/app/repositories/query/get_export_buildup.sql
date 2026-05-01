SELECT
  a.MasterAWB AS mawb,
  MAX(a.AirlinesCode) AS airlines_code,
  MAX(a.FlightNumber) AS flight_number,
  MAX(a.Origin) AS origin,
  MAX(a.Destination) AS dest,
  MAX(a.DateOfFlight) AS flight_date,
  SUM(COALESCE(a.TotalPieces, 0)) AS total_pieces,
  SUM(COALESCE(a.TotalNetto, 0)) AS total_weight,
  (
    SELECT h.descriptiongoods
    FROM eks_hostawb h
    WHERE h.MasterAWB = a.MasterAWB
      AND h.descriptiongoods IS NOT NULL
      AND h.descriptiongoods <> ''
    ORDER BY h.noid DESC
    LIMIT 1
  ) AS nature_of_goods
FROM eks_weighingheader AS a
WHERE a.MasterAWB IN :mawb
GROUP BY a.MasterAWB;
