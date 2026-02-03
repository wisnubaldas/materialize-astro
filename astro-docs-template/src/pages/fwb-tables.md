1️⃣ Identifikasi Message & AWB
| Field                     | Segment | Mandatori | Keterangan                             |
| ------------------------- | ------- | --------- | -------------------------------------- |
| message_type              | FWB     | ✅         | Selalu `FWB`                           |
| message_version           | FWB/nn  | ✅         | Contoh: `17`                           |
| awb_prefix                | AWB     | ✅         | Airline prefix (3 digit), contoh `777` |
| awb_number                | AWB     | ✅         | Nomor AWB (8 digit)                    |
| origin                    | AWB     | ✅         | Airport origin (IATA 3 char)           |
| destination               | AWB     | ✅         | Airport destination (IATA 3 char)      |
| shipment_description_code | AWB     | ✅         | Biasanya `T`                           |
| total_pieces              | AWB     | ✅         | Total koli                             |
| weight_unit               | AWB     | ✅         | `K` (Kg)                               |
| gross_weight              | AWB     | ✅         | Berat total                            |

2️⃣ Routing & Flight Booking
| Field          | Segment | Mandatori | Keterangan                    |
| -------------- | ------- | --------- | ----------------------------- |
| routing_list   | RTG     | ❌         | Routing via airport + carrier |
| first_carrier  | RTG     | ❌         | Maskapai pertama              |
| onward_carrier | RTG     | ❌         | Maskapai lanjutan             |
| flight_number  | FLT     | ❌         | Nomor penerbangan             |
| flight_date    | FLT     | ❌         | Tanggal flight                |
| flight_carrier | FLT     | ❌         | Carrier flight                |

3️⃣ Shipper (Pengirim)
| Field            | Segment | Mandatori | Keterangan   |
| ---------------- | ------- | --------- | ------------ |
| shipper_name     | SHP/NAM | ✅         | Nama shipper |
| shipper_address  | SHP/ADR | ❌         | Alamat       |
| shipper_city     | SHP/LOC | ❌         | Kota         |
| shipper_state    | SHP/LOC | ❌         | Provinsi     |
| shipper_country  | SHP     | ❌         | ISO country  |
| shipper_postcode | SHP     | ❌         | Kode pos     |
| shipper_contact  | SHP     | ❌         | Telp/email   |

4️⃣ Consignee (Penerima)
| Field              | Segment | Mandatori | Keterangan     |
| ------------------ | ------- | --------- | -------------- |
| consignee_name     | CNE/NAM | ✅         | Nama consignee |
| consignee_address  | CNE/ADR | ❌         | Alamat         |
| consignee_city     | CNE/LOC | ❌         | Kota           |
| consignee_state    | CNE/LOC | ❌         | Provinsi       |
| consignee_country  | CNE     | ❌         | ISO country    |
| consignee_postcode | CNE     | ❌         | Kode pos       |
| consignee_contact  | CNE     | ❌         | Telp/email     |

5️⃣ Agent (Forwarder)
| Field           | Segment | Mandatori | Keterangan            |
| --------------- | ------- | --------- | --------------------- |
| agent_iata_code | AGT     | ❌         | IATA cargo agent code |
| agent_account   | AGT     | ❌         | Account number        |
| agent_name      | AGT     | ❌         | Nama agent            |
| agent_city      | AGT     | ❌         | Lokasi agent          |

6️⃣ Charge Declaration (CVD)
| Field                   | Segment | Mandatori | Keterangan     |
| ----------------------- | ------- | --------- | -------------- |
| currency                | CVD     | ✅         | ISO currency   |
| charge_code             | CVD     | ❌         | PX / PP / CC   |
| weight_charge_pp_cc     | CVD     | ✅         | PP / CC        |
| other_charge_pp_cc      | CVD     | ✅         | PP / CC        |
| declared_value_carriage | CVD     | ❌         | Nilai angkut   |
| declared_value_customs  | CVD     | ❌         | Nilai bea      |
| insurance_value         | CVD     | ❌         | Nilai asuransi |

7️⃣ Rate & Goods Detail (RTD)
| Field             | Segment | Mandatori | Keterangan           |
| ----------------- | ------- | --------- | -------------------- |
| rate_line_no      | RTD     | ✅         | Line rate            |
| pieces            | RTD     | ✅         | Jumlah koli          |
| weight            | RTD     | ✅         | Berat                |
| rate_class        | RTD     | ❌         | N, Q, C, dll         |
| chargeable_weight | RTD     | ❌         | Berat charge         |
| rate              | RTD     | ❌         | Tarif                |
| total_charge      | RTD     | ❌         | Total                |
| goods_description | RTD/NG  | ✅         | Nature of goods      |
| dimensions        | RTD/DIM | ❌         | PxLxT                |
| volume            | RTD/V   | ❌         | Volume               |
| slac              | RTD/S   | ❌         | Shipper Load & Count |
| hs_code           | RTD/H   | ❌         | HS Code              |
| country_of_origin | RTD/O   | ❌         | COO                  |

8️⃣ Other Charges
| Field             | Segment | Mandatori | Keterangan   |
| ----------------- | ------- | --------- | ------------ |
| other_charge_code | OTH     | ❌         | Code charge  |
| entitlement       | OTH     | ❌         | P / C        |
| amount            | OTH     | ❌         | Nilai charge |

9️⃣ Charge Summary (PPD / COL)
| Field                 | Segment | Mandatori | Keterangan |
| --------------------- | ------- | --------- | ---------- |
| prepaid_weight_charge | PPD     | ❌         | WT         |
| prepaid_other_charge  | PPD     | ❌         | OC         |
| total_prepaid         | PPD     | ❌         | CT         |
| collect_charge        | COL     | ❌         | Jika CC    |

🔟 Certification & Issue
| Field                 | Segment | Mandatori | Keterangan      |
| --------------------- | ------- | --------- | --------------- |
| shipper_certification | CER     | ❌         | Nama shipper    |
| issue_date            | ISU     | ✅         | Tanggal AWB     |
| issue_place           | ISU     | ✅         | Kota            |
| issued_by             | ISU     | ✅         | Agent / airline |

1️⃣1️⃣ Special Handling & Regulatory
| Field                 | Segment | Mandatori | Keterangan              |
| --------------------- | ------- | --------- | ----------------------- |
| special_handling_code | SPH     | ❌         | DG, PER, AVI, SPX       |
| ssr                   | SSR     | ❌         | Special service         |
| osi                   | OSI     | ❌         | Other service info      |
| oci                   | OCI     | ❌         | Customs / security info |
