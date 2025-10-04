SELECT 
MasterAWB,
kd_kemasan,
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
FROM `eks_hostawb` WHERE MasterAWB = :awb LIMIT 1;