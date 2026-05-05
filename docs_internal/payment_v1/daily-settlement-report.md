---
id: daily-settlement-report
title: Daily Settlement Report
sidebar_label: Daily Settlement Report
---
{% raw %}

import { Box, Heading, Text, Card, Image, Button, Flex } from "rebass";

**Method :** <span style={{ color: "orange", fontWeight: "bold" }}>POST</span><br/>
URL :`https://open.revenuemonster.my/v3/payment/reconciliation`<br/>
Sandbox URL : `https://sb-open.revenuemonster.my/v3/payment/reconciliation`

:::note
To get Daily Payment report
:::

### Request Parameters

<ParamTable
  rows={[
    { name: "transactionType", type: "String", required: true, description: "\"PAYMENT\" or \"REFUND\"", example: "\"PAYMENT\"" },
    { name: "date", type: "String", required: true, description: "Date of the report", example: "\"2019-12-31\"" },
    { name: "method", type: "[]String", required: true, description: "RM currently supported method", example: "[]" },
    { name: "region", type: "[]String", required: true, description: "Region of wallet, \"MALAYSIA\" or \"CHINA\"", example: "[]" },
    { name: "cursor", type: "String", required: true, description: "Optional, if pagination exists", example: "\"\"" }
  ]}
/>
> Example Request

```json
curl --location --request POST "https://sb-open.revenuemonster.my/v3/payment/reconciliation" \
--header "Content-Type: application/json"\
--header "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjIwMTgtMDMtMTMiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOlsiKiJdLCJleHAiOjE1MjE2MjkyNTYsImlhdCI6MTUyMTYyMjA1NywiaXNzIjoiaHR0cHM6Ly9zYi1vYXV0aC5yZXZlbnVlbW9uc3Rlci5teSIsImp0aSI6IkVod0tFRTlCZFhSb1FXTmpaWE56Vkc5clpXNFF5cmYza3EzTDY4QnoiLCJuYmYiOjE1MjE2MjIwNTcsInN1YiI6IkVoUUtDRTFsY21Ob1lXNTBFSlhWemQzd3JhcVRPUklRQ2dSVmMyVnlFSXlKcUl6dnlNUFZjUSJ9.dJknY9MZHLNrKx1p7gZxS0_oA3uXLWplDU1r1dpwxIbmdB6yw4tQBTXKlWArDfKLlBDn6v22_gT5Px7sdCMj7e5M9eRoJoMnoPnslgYpmJJ5kjqAbKU7dUxKb1OzFLrvmtSK9r-FRLVtMFHioWYpwgSvSPBgZ6lAYkUyDzH7aKadFYtQcBuJR0hlq2CXtP0mzbHOeu2q6giONf3E5-XqS8lLRtuHPAbJ7_YFwo0Oe2zc6h05IOocmx_NvBVPfDBnuygTU063h70Q987MYeGDV_Os4N6N_I4b-GoHprEPtmntB1RJPrFrY28hvvoUfDHXHZVXT1GlrsozrkWV4EjbTw" \
--header "X-Signature: sha256 OsjlEWZLKx0IXgC5PUk6sM+ZZdrS/ELBNdEGj+okOhVAwo/i+GK91CwEmIbLko+p0Vbs8Ph+iBQG/3DyS7kHug=="\
--header "X-Nonce-Str: VYNknZohxwicZMaWbNdBKUrnrxDtaRhN" \
--header "X-Timestamp: 1527407052" \
--data-raw "{
	"transactionType": "PAYMENT",
    "date": "2021-07-28",
    "method": ["BOOST"],
    "region": ["MALAYSIA"],
    "cursor": ""
}"
```

### Response Parameters

<ParamTable
  rows={[
    { name: "items", type: "Object", description: "Transaction object", example: "(Refer to explanation below)" },
    { name: "code", type: "String", description: "Successfully call this endpoint. If fail, will return error code object (Refer Appendix 1: Error Codes)", example: "\"SUCCESS\"" },
    { name: "meta", type: "Object", description: "Database object", example: "{}" }
  ]}
/>
<br/>

<strong>Transaction object (item):</strong>

<ParamTable
  rows={[
    { name: "transactionAt", type: "DateTime", description: "Transaction date time of transaction", example: "\"2019-12-31T07:00:10Z\"" },
    { name: "merchantId", type: "String", description: "(Can view From RM Portal)", example: "\"4118165203679668885\"" },
    { name: "merchantName", type: "String", description: "(Can view From RM Portal)", example: "\"Revenue Monster Sdn Bhd\"" },
    { name: "storeId", type: "String", description: "Store ID", example: "\"4949529109748431621\"" },
    { name: "storeName", type: "String", description: "Store Name", example: "\"Kim's Food Corner\"" },
    { name: "region", type: "String", description: "Region of wallet, \"MALAYSIA\" or \"CHINA\"", example: "\"MALAYSIA\"" },
    { name: "method", type: "String", description: "RM currently supported method", example: "\"TNG\"" },
    { name: "transactionType", type: "String", description: "\"PAYMENT\" or \"REFUND\"", example: "\"PAYMENT\"" },
    { name: "type", type: "String", description: "\"QUICK_PAY\" , \"QR_PAY\",\"Web_Payment\" , \"Mobile_Payment\" , \"Mobile_Web_Payment\"", example: "\"QUICK_PAY\"" },
    { name: "transactionId", type: "String", description: "Transaction ID (from RM server)", example: "\"152161448229438994\"" },
    { name: "orderId", type: "String", description: "Order ID (from Merchant), max: 24", example: "\"1577775608765190100M6010\"" },
    { name: "currencyType", type: "String", description: "Currency notation (currently only support MYR)", example: "\"MYR\"" },
    { name: "grossAmount", type: "Double", description: "Gross Amount QR pay", example: "\"0.10\"" },
    { name: "mdr", type: "Double", description: "MDR (from RM server)", example: "\"0.70\"" },
    { name: "serviceFee", type: "Double", description: "Service Fee (from RM server)", example: "\"-0.00\"" },
    { name: "settlementAmount", type: "Double", description: "Settlement Amount", example: "\"0.10\"" }
  ]}
/>
<br/>

> Example Response

```json
{
  "items": [
      {
         "transactionAt": "2021-07-28T03:30:44Z",
         "merchantId": "4118165203679668885",
         "merchantName": "Revenue Monster",
         "storeId": "1623743430847879711",
         "storeName": "SIDEC",
         "region": "MALAYSIA",
         "method": "BOOST",
         "transactionType": "PAYMENT",
         "type": "QUICK_PAY",
         "transactionId": "210728033043010428257992",
         "orderId": "361323863",
         "currencyType": "MYR",
         "grossAmount": "12.50",
         "mdr": "1.00",
         "serviceFee": "-0.13",
         "settlementAmount": "12.37"
      },
      {
         "transactionAt": "2021-07-28T03:35:14Z",
         "merchantId": "4118165203679668885",
         "merchantName": "Revenue Monster",
         "storeId": "1623743430847879711",
         "storeName": "SIDEC",
         "region": "MALAYSIA",
         "method": "BOOST",
         "transactionType": "PAYMENT",
         "type": "QUICK_PAY",
         "transactionId": "210728033514010427503879",
         "orderId": "-1689379397",
         "currencyType": "MYR",
         "grossAmount": "13.50",
         "mdr": "1.00",
         "serviceFee": "-0.14",
         "settlementAmount": "13.36"
      },
  ],
  "code": "SUCCESS",
  "meta": {}
}
```

{% endraw %}
