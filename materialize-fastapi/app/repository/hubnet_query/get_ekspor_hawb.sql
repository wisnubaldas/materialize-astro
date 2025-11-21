SELECT 
a.MasterAWB,
a.kd_kemasan,
a.descriptiongoods,
a.AgenCode,
a.ShipperCode,
a.ConsigneeCode,
a.TimeEntry,
b.CompanyName agenCompany,
CONCAT(b.Address1,' ',b.Address2,' ',b.City,' ',b.PostCode) AS agenAddr,
c.CompanyName shipperName,
CONCAT(c.Address1,' ',c.Address2,' ',c.City,' ',c.PostCode) AS shipperAddr,
d.CompanyName conssigneeName,
CONCAT(d.Address1,' ',d.Address2,' ',d.City,' ',d.PostCode) AS ConsigneeAddr
FROM `eks_hostawb` a
INNER JOIN mst_customer b ON a.AgenCode = b.CustomerCode
INNER JOIN mst_customer c ON a.ShipperCode = c.CustomerCode
INNER JOIN mst_customer d ON a.ConsigneeCode = d.CustomerCode
WHERE MasterAWB = :awb ORDER BY a.TimeEntry DESC LIMIT 1;