---
id: notify-url
title: Notify URL
sidebar_label: Notify URL
---

import { Box, Heading, Text, Card, Image, Button, Flex } from "rebass";

:::note
Notify URL or callback URL to inform server on transaction status after payment made
:::

### Response Parameters

<ParamTable
  rows={[
    { name: "data", type: "-", required: true, example: "Refer to the below" },
    { name: "eventType", type: "String", required: true, example: "\"PAYMENT_WEB_ONLINE\"" }
  ]}
/>
<br/>
<strong>Data Object (data):</strong>

<ParamTable
  rows={[
    { name: "balanceAmount", type: "Uint", required: true, example: "100" },
    { name: "createdAt", type: "String", required: true, example: "\"2019-03-01T05:51:20Z\"" },
    { name: "currencyType", type: "String", required: true, example: "\"MYR\"" },
    { name: "method", type: "String", required: true, example: "\"WECHATPAY\"" },
    { name: "order", type: "-", required: true, example: "Refer to the below" },
    { name: "payee", type: "-", required: true, example: "Refer to the below" },
    { name: "platform", type: "String", required: true, example: "\"OPEN_API\"" },
    { name: "referenceId", type: "String", required: true, example: "\"1010014200000026201903016100904600\"" },
    { name: "region", type: "String", required: true, example: "\"MALAYSIA\"" },
    { name: "status", type: "String", required: true, example: "\"SUCCESS\"" },
    { name: "store", type: "String", required: true, example: "Refer to the below" },
    { name: "terminalId", type: "String", required: true, example: "\"\"" },
    { name: "transactionAt", type: "String", required: true, example: "\"2019-03-01T05:51:59Z\"" },
    { name: "transactionId", type: "String", required: true, example: "\"190301055133300427675601\"" },
    { name: "type", type: "String", required: true, example: "\"WEB_PAYMENT\"" },
    { name: "updatedAt", type: "String", required: true, example: "\"2019-03-01T05:52:00.897920132Z\"" },
    { name: "voucher", type: "String", required: true, example: "null" }
  ]}
/>
<br/>
<strong>Order Object (order):</strong>

<ParamTable
  rows={[
    { name: "additionalData", type: "String", required: true, example: "\"Payment to 11street\"" },
    { name: "amount", type: "Uint", required: true, example: "100" },
    { name: "detail", type: "String", required: true, example: "\"Payment to 11street\"" },
    { name: "id", type: "String", required: true, example: "\"P000000660800\"" },
    { name: "title", type: "String", required: true, example: "\"Payment to 11street\"" }
  ]}
/>
<br/>
<strong>Payee Object (payee):</strong>

<ParamTable
  rows={[
    { name: "userId", type: "String", required: true, example: "\"oKz050cwbEJwKAnKZgbD24UYibHQ\"" }
  ]}
/>
<br/>
<strong>Store Object (store):</strong>

<ParamTable
  rows={[
    { name: "addressLine1", type: "String", required: true, example: "\"\"" },
    { name: "addressLine2", type: "String", required: true, example: "\"\"" },
    { name: "city", type: "String", required: true, example: "\"\"" },
    { name: "country", type: "String", required: true, example: "\"\"" },
    { name: "countryCode", type: "String", required: true, example: "\"\"" },
    { name: "createdAt", type: "String", required: true, example: "\"2018-10-02T10:52:03Z\"" },
    { name: "geoLocation", type: "-", required: true, example: "Refer to the below" },
    { name: "id", type: "String", required: true, example: "\"2551293210619662240\"" },
    { name: "imageUrl", type: "String", required: true, example: "\"https://storage.googleapis.com/rm-prod-asset/img/store.png\"" },
    { name: "name", type: "String", required: true, example: "\"11Street\"" },
    { name: "phoneNumber", type: "String", required: true, example: "\"\"" },
    { name: "postCode", type: "String", required: true, example: "\"\"" },
    { name: "state", type: "String", required: true, example: "\"\"" },
    { name: "status", type: "String", required: true, example: "\"ACTIVE\"" },
    { name: "updatedAt", type: "String", required: true, example: "\"2018-10-02T10:52:03Z\"" }
  ]}
/>
<br/>
<strong>Geolocation Object (geoLocation):</strong>

<ParamTable
  rows={[
    { name: "latitude", type: "Float", required: true, example: "0" },
    { name: "longitude", type: "Float", required: true, example: "0" }
  ]}
/>
> Example Response

```json
{
  "data": {
    "balanceAmount": 100,
    "createdAt": "2019-03-01T05:51:20Z",
    "currencyType": "MYR",
    "method": "WECHATPAY",
    "order": {
      "additionalData": "Payment to 11street",
      "amount": 100,
      "detail": "Payment to 11street",
      "id": "P000000660800",
      "title": "Payment to 11street"
    },
    "payee": {
      "userId": "oKz050cwbEJwKAnKZgbD24UYibHQ"
    },
    "platform": "OPEN_API",
    "referenceId": "1010014200000026201903016100904600",
    "region": "MALAYSIA",
    "status": "SUCCESS",
    "store": {
      "addressLine1": "",
      "addressLine2": "",
      "city": "",
      "country": "",
      "countryCode": "",
      "createdAt": "2018-10-02T10:52:03Z",
      "geoLocation": {
        "latitude": 0,
        "longitude": 0
      },
      "id": "2551293210619662240",
      "imageUrl": "https://storage.googleapis.com/rm-prod-asset/img/store.png",
      "name": "11Street",
      "phoneNumber": "",
      "postCode": "",
      "state": "",
      "status": "ACTIVE",
      "updatedAt": "2018-10-02T10:52:03Z"
    },
    "terminalId": "",
    "transactionAt": "2019-03-01T05:51:59Z",
    "transactionId": "190301055133300427675601",
    "type": "WEB_PAYMENT",
    "updatedAt": "2019-03-01T05:52:00.897920132Z",
    "voucher": null
  },
  "eventType": "PAYMENT_WEB_ONLINE"
}
```
