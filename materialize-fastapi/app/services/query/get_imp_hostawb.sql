SELECT 
MasterAWB,
descriptiongoods,
AgenCode,
ShipperCode,
shippername,
shipperaddress,
shippercity,
shippercountry,
Consigneename,
ConsigneeCode,
Consigneeaddress,
Consigneecity,
Consigneecountry,
TimeEntry
FROM `imp_hostawb` WHERE MasterAWB = :awb LIMIT 1 