SELECT 
a.MasterAWB,
a.DescriptionGoods,
a.AgenCode,
a.shippername,
CONCAT(a.shipperaddress,' ',a.shippercity,' ',a.shippercountry) AS shipperAddr,
a.Consigneename,
CONCAT(a.Consigneeaddress,' ',a.Consigneecity,' ',a.Consigneepostal) AS consigneeAddr
FROM `imp_hostawb` a WHERE MasterAWB = :awb ORDER BY a.TimeEntry DESC LIMIT 1 