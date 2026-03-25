---
id: verify-signature
title: Verify Signature
sidebar_label: Verify Signature
---

:::note

- Verify Signature is used to verify your signature.

:::

:::important

- <span style={{ color: "black", fontWeight: "bold" }}>Data object</span> needs to be sorted, the <span style={{ color: "black", fontWeight: "bold" }}>Nested object</span> also needs to be sorted.

:::

### Step 1 : Response Parameter

**Method :** <span style={{ color: "orange", fontWeight: "bold" }}>POST</span><br/>

:::note

- Refer to which API endpoint you are calling , below response parameter is just an **EXAMPLE**

:::

#### Example of Web/Mobile Payment

<ParamTable
  rows={[
    { name: "item", type: "Object", description: "item object", example: "(Refer to explanation below)" },
    { name: "code", type: "String", description: "Successfully call this endpoint. If fail, will return error code object (Refer Appendix 1: Error Codes)", example: "\"SUCCESS\"" }
  ]}
/>
<br />
<strong>item Object (item):</strong>

<ParamTable
  rows={[
    { name: "checkoutId", type: "String", description: "Code to identify web payment url", example: "\"1617985392758071583\"" },
    { name: "url", type: "String", description: "Example to form checkout URL. Note: to change base URL to desired URL.", example: "\"https://sb-pg.revenuemonster.my/v2/checkout?checkoutId=1617985392758071583\"" }
  ]}
/>
> Example Response

```json
{
  "item": {
    "checkoutId": "1617985392758071583",
    "url": "https://sb-pg.revenuemonster.my/v2/checkout?checkoutId=1617985392758071583"
  },
  "code": "SUCCESS"
}
```

:::important

- Sort the above json key **alphabetically** and make it **compact**

:::

### Step 2 : Encode the data using Base64 format

:::note

eyJpdGVtIjp7ImNoZWNrb3V0SWQiOiIxNjE3OTg1MzkyNzU4MDcxNTgzIiwidXJsIjoiaHR0cHM6Ly9zYi1wZy5yZXZlbnVlbW9uc3Rlci5teS92Mi9jaGVja291dD9jaGVja291dElkPTE2MTc5ODUzOTI3NTgwNzE1ODMifSwiY29kZSI6IlNVQ0NFU1MifQ==
:::

### Step 3: Construct plain text parameters

:::important

- if the body is empty then the `data` parameter can be skip
- if it's verifying our callback then the `requestUrl` can be skip

:::

<ParamTable
  rows={[
    { name: "data", type: "String", required: true, description: "Base64 data body from Step 2.", example: "Refer to Step 2" },
    { name: "method", type: "String", required: true, description: "HTTP call method used", example: "\"post\"" },
    { name: "nonceStr", type: "String", required: true, description: "Get from Response Header", example: "\"VYNknZohxwicZMaWbNdBKUrnrxDtaRhN\"" },
    { name: "requestUrl", type: "String", required: true, description: "API URL that you call must be exactly the same, together with URL.", example: "https://sb-open.revenuemonster.my/v3/payment/online" },
    { name: "signType", type: "String", required: true, description: "Sign Type, prefer SHA-256", example: "\"sha256\"" },
    { name: "timestamp", type: "String", required: true, description: "Get from Response Header", example: "\"1527407052\"" }
  ]}
/>
**Example**
:::note
data=eyJpdGVtIjp7ImNoZWNrb3V0SWQiOiIxNjE3OTg1MzkyNzU4MDcxNTgzIiwidXJsIjoiaHR0cHM6Ly9zYi1wZy5yZXZlbnVlbW9uc3Rlci5teS92Mi9jaGVja291dD9jaGVja291dElkPTE2MTc5ODUzOTI3NTgwNzE1ODMifSwiY29kZSI6IlNVQ0NFU1MifQ==&#38;method=post&#38;nonceStr=VYNknZohxwicZMaWbNdBKUrnrxDtaRhN&#38;signType=sha256&#38;timestamp=1527407052&#38;requestUrl=https://sb-open.revenuemonster.my/v3/payment/online

:::

:::important

- Verify the content string using **public key** ( Can get From Merchant Portal => Developer => Applications => Server public key)

:::
