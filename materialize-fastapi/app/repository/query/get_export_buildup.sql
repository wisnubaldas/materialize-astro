SELECT
    a.MasterAWB AS mawb,
    a.AirlinesCode AS airlines_code,
    a.FlightNo AS flight_number,
    a.Origin AS origin,
    a.Destination AS dest,
    a.DateOfFlight AS flight_date,
    b.Quantity AS pieces,
    a.Pieces AS total_pieces,
    b.Weight AS weight,
    a.Weight AS total_weight,
    b.descriptiongoods AS nature_of_goods
FROM eks_masterwaybill a
JOIN eks_hostawb b ON a.MasterAWB = b.MasterAWB
WHERE a.MasterAWB IN :mawb
ORDER BY a.MasterAWB;
