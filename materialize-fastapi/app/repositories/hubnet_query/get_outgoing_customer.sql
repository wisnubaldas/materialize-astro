SELECT 
a.MasterAWB,
a.kindofgood,
a.shipperCode,
a.agentCode,
a.consigneeCode,
b.CompanyName agenName,
CONCAT(b.Address1,' ',b.Address2,' ',b.City,' ',b.PostCode) AS agenAddr,
c.CompanyName shipperName,
CONCAT(c.Address1,' ',c.Address2,' ',c.City,' ',c.PostCode) AS shipperAddr,
d.CompanyName consigneeName,
CONCAT(d.Address1,' ',d.Address2,' ',d.City,' ',d.PostCode) AS consigneeAddr
FROM `out_approval` a
INNER JOIN mst_customer b ON a.agentCode = b.CustomerCode
INNER JOIN mst_customer c ON a.shipperCode = c.CustomerCode
INNER JOIN mst_customer d ON a.consigneeCode = d.CustomerCode
WHERE MasterAWB = :awb LIMIT 1