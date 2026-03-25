---
id: signature-algorithm
title: Signature Algorithm
sidebar_label: Signature Algorithm
---

:::note

- Signature algorithm is used to sign your payment API request with a private key to obtain additional security.

:::

:::important

- <span style={{ color: "black", fontWeight: "bold" }}>Data object</span> needs to be sorted, the <span style={{ color: "black", fontWeight: "bold" }}>Nested object</span> also needs to be sorted.

:::

### Step 1 : Prepare a Request Parameter

**Method :** <span style={{ color: "orange", fontWeight: "bold" }}>POST</span><br/>

:::note

- Refer to which API endpoint you are calling , below request parameter is just an **EXAMPLE**

:::

#### Example of Web/Mobile Payment

<ParamTable
  rows={[
    { name: "order", type: "Object", required: true, description: "Object of order", example: "(Refer to explanation below)" },
    { name: "customer", type: "Object", required: true, description: "Object of customer", example: "(Refer to explanation below)" },
    { name: "method", type: "[]String", required: true, description: "RM currently supported method", example: "[]" },
    { name: "type", type: "String", required: true, description: "Object of type", example: "(Refer to explanation below)" },
    { name: "storeId", type: "String", required: true, description: "ID of the store to create QR code", example: "\"10946114768247530\"" },
    { name: "redirectUrl", type: "String", required: true, description: "URL to redirect after payment is made", example: "\"https://google.com\"" },
    { name: "notifyUrl", type: "String", required: true, description: "Example of Notify URL Response", example: "\"https://google.com\"" },
    { name: "layoutVersion", type: "String", description: "Select layout for Web payment", example: "v1 / v2 (Supported Credit Card) / v3 (Supported Credit Card and FPX)" }
  ]}
/>
<br />

<strong>Order object (order):</strong>

<ParamTable
  rows={[
    { name: "title", type: "String", required: true, description: "Order title, max: 32", example: "\"Sales\"" },
    { name: "detail", type: "String", required: true, description: "Order detail, max: 600", example: "\"1 x iPhone X; 2 x SAMSUNG S8\"" },
    { name: "additionalData", type: "String", required: true, description: "Order description", example: "\"Sales\"" },
    { name: "amount", type: "Uint", required: true, description: "Amount of order in cent. Only required when \"isPrefillAmount\" = true. (min RM 0.10 or amount: 10)", example: "100" },
    { name: "currencyType", type: "String", required: true, description: "Currency notation (currently only support MYR)", example: "\"MYR\"" },
    { name: "id", type: "String", description: "\"6170506694335521334\"" }
  ]}
/>
<br />

<strong>Customer object (customer):</strong>

<ParamTable
  rows={[
    { name: "userId", type: "String", required: true, description: "if tokenization enable need userId", example: "\"13245876\"" },
    { name: "email", type: "String", description: "Customer Email", example: "\"\"" },
    { name: "countryCode", type: "String", description: "Customer Country Code", example: "\"\"" },
    { name: "phoneNumber", type: "String", description: "Customer Phone Number", example: "\"\"" }
  ]}
/>
<br />

<strong>Type Object (type):</strong> <br />

<ParamTable
  rows={[
    { name: "type", type: "String", required: true, example: "\"WEB_PAYMENT\"" },
    { name: "type", type: "String", required: true, example: "\"MOBILE_PAYMENT\"" }
  ]}
/>
> Example Request

```json
{
  "order": {
    "title": "hello",
    "detail": "",
    "additionalData": "world",
    "amount": 10,
    "currencyType": "MYR",
    "id": "7211"
  },
  "customer": {
    "userId": "13245876",
    "email": ""
  },
  "method": [],
  "type": "WEB_PAYMENT",
  "storeId": "1608123035564538121",
  "redirectUrl": "https://revenuemonster.my",
  "notifyUrl": "https://dev-rm-api.ap.ngrok.io",
  "layoutVersion": "v3"
}
```

:::important

- Sort the above json key **alphabetically** and make it **compact**

- Replace following special character on the json body:<br/>
  **&lt;** to **\u003c**<br/>
  **&gt;** to **\u003e**<br/>
  **&amp;** to **\u0026**<br/>

:::

### Step 2 : Encode the data using Base64 format

:::note

ewogICAgIm9yZGVyIjogewogICAgCSJ0aXRsZSI6ICJoZWxsbyIsCiAgICAJImRldGFpbCI6ICIiLAogICAgCSJhZGRpdGlvbmFsRGF0YSI6ICJ3b3JsZCIsCgkgICAgImFtb3VudCI6IDEwLAoJICAgICJjdXJyZW5jeVR5cGUiOiAiTVlSIiwKCSAgICAiaWQiOiAgIjcyMTEiCiAgICB9LAogICAgImN1c3RvbWVyIjogewogICAgInVzZXJJZCI6ICIiLAogICAgImVtYWlsIjogIiIKfSwKICAgICJtZXRob2QiOltdLAogICAgInR5cGUiOiAiV0VCX1BBWU1FTlQiLAogICAgInN0b3JlSWQiOiAiMTYwODEyMzAzNTU2NDUzODEyMSIsCiAgICAicmVkaXJlY3RVcmwiOiAiaHR0cHM6Ly9yZXZlbnVlbW9uc3Rlci5teSIsCiAgICAibm90aWZ5VXJsIjogImh0dHBzOi8vZGV2LXJtLWFwaS5hcC5uZ3Jvay5pbyIsCiAgICAibGF5b3V0VmVyc2lvbiI6InYzIgp9
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
    { name: "nonceStr", type: "String", required: true, description: "Random string", example: "\"VYNknZohxwicZMaWbNdBKUrnrxDtaRhN\"" },
    { name: "requestUrl", type: "String", required: true, description: "API URL that you call must be exactly the same, together with URL.", example: "https://sb-open.revenuemonster.my/v3/payment/online" },
    { name: "signType", type: "String", required: true, description: "Sign Type, prefer SHA-256", example: "\"sha256\"" },
    { name: "timestamp", type: "String", required: true, description: "UNIX timestamp of request", example: "\"1527407052\"" }
  ]}
/>
**Example**
:::note
data=ewogICAgIm9yZGVyIjogewogICAgCSJ0aXRsZSI6ICJoZWxsbyIsCiAgICAJImRldGFpbCI6ICIiLAogICAgCSJhZGRpdGlvbmFsRGF0YSI6ICJ3b3JsZCIsCgkgICAgImFtb3VudCI6IDEwLAoJICAgICJjdXJyZW5jeVR5cGUiOiAiTVlSIiwKCSAgICAiaWQiOiAgIjcyMTEiCiAgICB9LAogICAgImN1c3RvbWVyIjogewogICAgInVzZXJJZCI6ICIiLAogICAgImVtYWlsIjogIiIKfSwKICAgICJtZXRob2QiOltdLAogICAgInR5cGUiOiAiV0VCX1BBWU1FTlQiLAogICAgInN0b3JlSWQiOiAiMTYwODEyMzAzNTU2NDUzODEyMSIsCiAgICAicmVkaXJlY3RVcmwiOiAiaHR0cHM6Ly9yZXZlbnVlbW9uc3Rlci5teSIsCiAgICAibm90aWZ5VXJsIjogImh0dHBzOi8vZGV2LXJtLWFwaS5hcC5uZ3Jvay5pbyIsCiAgICAibGF5b3V0VmVyc2lvbiI6InYzIgp9&#38;method=post&#38;nonceStr=VYNknZohxwicZMaWbNdBKUrnrxDtaRhN&#38;requestUrl=https://sb-open.revenuemonster.my/v3/payment/online&#38;signType=sha256&#38;timestamp=1527407052
:::

### Step 4: Sign with CLIENT PRIVATE KEY

:::important

- Sign this content using `sha256` with rsa **private key** and make sure the **public key** have been uploaded to **RM Merchant Portal**

:::

| <!--   | Type | Required                                                 | Description            |     |
| ------ | ---- | -------------------------------------------------------- | ---------------------- |
| String | Yes  | Sign the request data in Step 3 using CLIENT PRIVATE KEY | Response show as below | --> |

:::note
**Example of Signature**

sha256 IrBg6t73VsH7ieEnQDB4CXHFjMWUkp8Dtddpxqw+4Gvz6Tag7Dx6nrfAt2ofYK8xZN9aBCvAKAfmAOGWIXnsTXfhFBnMA2kadiga7ufUJ81ozyhllbiliRM2ugw1OcqSTLRHWBPhrVwhHBxgDiG9wbuI3FKURrz+CufYYakFoCw=
:::

### Step 5: Signature of Request Data

:::note
Put this **Signature** into header under **X-Signature**, construct the request as below and call API endpoint:
:::

```json
curl --request POST
 --url 'https://sb-open.revenuemonster.my/v3/payment/online'
 --header 'Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjIwMTgtMDMtMTMiLCJ0eXAiOiJKV1QifQ.eyJhdWQiOlsiKiJdLCJleHAiOjE1MjE2MjkyNTYsImlhdCI6MTUyMTYyMjA1NywiaXNzIjoiaHR0cHM6Ly9zYi1vYXV0aC5yZXZlbnVlbW9uc3Rlci5teSIsImp0aSI6IkVod0tFRTlCZFhSb1FXTmpaWE56Vkc5clpXNFF5cmYza3EzTDY4QnoiLCJuYmYiOjE1MjE2MjIwNTcsInN1YiI6IkVoUUtDRTFsY21Ob1lXNTBFSlhWemQzd3JhcVRPUklRQ2dSVmMyVnlFSXlKcUl6dnlNUFZjUSJ9.dJknY9MZHLNrKx1p7gZxS0_oA3uXLWplDU1r1dpwxIbmdB6yw4tQBTXKlWArDfKLlBDn6v22_gT5Px7sdCMj7e5M9eRoJoMnoPnslgYpmJJ5kjqAbKU7dUxKb1OzFLrvmtSK9r-FRLVtMFHioWYpwgSvSPBgZ6lAYkUyDzH7aKadFYtQcBuJR0hlq2CXtP0mzbHOeu2q6giONf3E5-XqS8lLRtuHPAbJ7_YFwo0Oe2zc6h05IOocmx_NvBVPfDBnuygTU063h70Q987MYeGDV_Os4N6N_I4b-GoHprEPtmntB1RJPrFrY28hvvoUfDHXHZVXT1GlrsozrkWV4EjbTw'
 --header 'Content-Type: application/json'
 --header 'X-Nonce-Str: VYNknZohxwicZMaWbNdBKUrnrxDtaRhN'
 --header 'X-Signature: sha256 IrBg6t73VsH7ieEnQDB4CXHFjMWUkp8Dtddpxqw+4Gvz6Tag7Dx6nrfAt2ofYK8xZN9aBCvAKAfmAOGWIXnsTXfhFBnMA2kadiga7ufUJ81ozyhllbiliRM2ugw1OcqSTLRHWBPhrVwhHBxgDiG9wbuI3FKURrz+CufYYakFoCw='
 --header 'X-Timestamp: 1527407052'
 --data '{
  "order": {
    "title": "hello",
    "detail": "",
    "additionalData": "world",
    "amount": 10,
    "currencyType": "MYR",
    "id": "7211"
  },
  "customer": {
    "userId": "13245876",
    "email": ""
  },
  "method": [],
  "type": "WEB_PAYMENT",
  "storeId": "1608123035564538121",
  "redirectUrl": "https://revenuemonster.my",
  "notifyUrl": "https://dev-rm-api.ap.ngrok.io",
  "layoutVersion": "v3"
}'
```

### Response Parameters

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
    { name: "checkoutId", type: "String", description: "Code to identify web payment url", example: "\"1548316308361173347\"" },
    { name: "url", type: "String", description: "Example to form checkout URL. Note: to change base URL to desired URL.", example: "\"https://sb-pg.revenuemonster.my/checkout?checkoutId=1548316308361173347\"" }
  ]}
/>
> Example Response

```json
{
  "item": {
    "checkoutId": "1548316308361173347",
    "url": "https://sb-pg.revenuemonster.my/checkout?checkoutId=1548316308361173347"
  },
  "code": "SUCCESS"
}
```

<hr/>

## Using RM Merchant Portal to get Signature

### Step 1 : Create New Application

Go to **Merchant Portal** > **Developer** > **Applications** tab (last on the list) and you will see the following page:<br/>

![image](/img/developer-application/1.png)<br />

### Step 2 : Obtain Credential

Click on the <b>Applications</b> created in Step 1. You may edit and update relevant information here :
<br/>

If you would like to disable the application , simply toggle the **"ON/OFF"** switch button at the top right.
<br/>

![image](/img/developer-application/4.png)

Click on **Show** to reveal your **clientSecret**:

![image](/img/developer-application/5.png)

<hr/>

### Generate RSA KEYS

If you need help to generate a key, go to **Merchant portal > Developer > Application > Generator RSA Key** Suggested key size: 2048 Bit. Keep your private keys in a safe place! Or use our **Generate RSA key** tool.

- `Private Keys` are required to sign API request(s) contents.
- `Public Keys` are used to verify content received.

![image](/img/developer-application/rks-key.png)

<hr/>

### Optional Tool: Signature Debugger

`Public Keys` needs to have be wrap as following :

![image](/img/developer-application/9.png)<br/>
For security purposes, we enhanced our authentication flow and Open API by adding layers of encryption to our endpoints. You may develop your own encryption tool on your desired application directly, or use our Signature Debugger to do signing/verification using private/public keys as obtained from the previous step.
Refer more on `Signature Debugger`

![image](/img/developer-application/signature-debug.png)

<!-- <hr/>

### Use API to get Signature

**Method :** <span style={{ color: "orange", fontWeight: "bold" }}>POST</span><br/>
URL : `https://open.revenuemonster.my/tool/signature/generate`<br/>
Sandbox URL : `https://sb-open.revenuemonster.my/tool/signature/generate`

### Request Parameters

> Example Request

```json
{
  "data": {
    "order": {
      "title": "hello",
      "detail": "hello",
      "additionalData": "world",
      "amount": 100,
      "currencyType": "MYR",
      "id": "13234353986"
    },
    "method": [],
    "type": "WEB_PAYMENT",
    "storeId": "10946114768247530",
    "redirectUrl": "https://www.youtube.com/watch?v=k9NZYQHQ7Gg&list=RDGfcbOdIFWPE&index=13",
    "notifyUrl": "https://google.com",
    "layoutVersion": "v2"
  },
  "method": "post",
  "nonceStr": "XAYZRZNLGCKSTURRFKBIGYALUKLCLJOG",
  "privateKey": "-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAvNvEeQ/Se29PKPbD4jWEvOPmMgGYJOQOKc/s0PhUSlIaZDnb\n9dc1Wvkl6vbsi1KYulRvrCNThO5db6a1Jj0erRpovcGXi3ACHF3sei9enaUHEHvd\nFWMAulAD2EI37sNIsyGm1wK5fpuVLlUPjeV+PzJKID1RvHM+3A5m9ZnxSj/SNF/7\nvSXRM1z4SYJuQDGmxVWEEkTkBcbleK2J1pdB88E3xhqzD3UQN2LLHSCM/A2nmA8Y\nEXkwfr7kRl2CJlDl+qrjb0n5i60D+j8JMFDg5mkl6VuTBuUg1PKJuJzRXmJK0GuA\na52I0QXId6uWXHc+Up1B6zvh5IhXa3+dzXBm4wIDAQABAoIBAGVnhy4NndGjKZjw\nLqtmWxhlMfPFwWCFh0lSGHD39aJWRU9tdbqhzEdFoeNwpAAG4HSj47ZE3ZJxvn+1\nvmyCwtblaDoDGZDIGooKsG/GwYHZ21oxd7sFBp4DWp0iqQ+tkXqFZiTqlJjzhv1y\ntMBW6huasAxxgFK0epsDrKrQ9qsLfX1MYjXUU/q1edIJ6+kf5gPeqboH8mWMi038\nSyTDnDuTqBsaWlOdfrlQjs4feVILrmAor6Egz1PcpNSwHpdtjh7vNb1f//8y+rxp\n5p6wvhVS5quRW6yT871qtp97Vq9TR6DThbIsp/Pc5cnRT653pdfNBgAE83ukacye\n6WfErdECgYEA+msNuG+tfgE1toA1+asXaCC0r4mrYLjP+uXBA57ZNHm5drS2tiI4\n3EqcVeek9VGUk/O65yWQ6SBgo0fXpGTNI8qYMONF6MDgRez/u81wBvVRLayAecJO\n7pA8Sokgitb/jyTqvIXJQYxQl+kHKiYtX281DNZ9CRfE0XOmf6UHTysCgYEAwRFw\neOc84ASQnBRzh6DHwKCQWRYZze5njIawty9zX/HZsPDlp4wqh4X4WzBFmBscnZ0L\n0EvaqBtQkIeGrdMAsgbFPFEPqMP3/iRCwBn3M6gW0CCSCLt4X7K2wXq1kJ6x7dhH\njt9b8u7MYonco+k8k7SHJj1elJXLa7Zh6q6pqykCgYEA4MZ6+FR1/CaF2hzXVhW2\n2uaQiQgf5p+9P84/JErPWITybpTjdDTfqQznq0xUC0eBABTEbXqQylEfrTBtZch9\nQmU1mpxGQhfut5V2L1LF/djxVvgCEkjRpN2e4KCZr0Yw+oH+md3UupuCM/kdTz4Z\neBJQIgfdD+5f4knW57hwCSUCgYEAtZN1OAAiHH2uk1wYm4H2248msuI6OpbxBBTY\ntjAGTkHi/qpREpacmQDCZuCrUzaMXx+IMMpmRpwJ1SPg4jIEAWqkrOl/1LUZ0wa/\nUHQbLZX0fqFjNps5xqcJgkWp5O2bYZl7Ez+19m/oAPSvcei1dCTgxnIJNaz7t727\nsT+7iqECgYBgfmuGu77mHrGdz8JMDwqdYWYJbtdxrPOqlH37G2D1IufAyDvLv2LN\nxjenpecoSSyhlVPQMTqD1T3HUaJ99GNE5ANe0qyVcENQVI38+9bb/VtY8vsXpvPi\nnHCRMiX3Li2Q75PT21I4GGiNoxXQphlAPevtfWfKKbrS2Y2DgQfeMA==\n-----END RSA PRIVATE KEY-----",
  "requestUrl": "https://sb-open.revenuemonster.my/v3/payment/online",
  "signType": "sha256",
  "timestamp": "1591946239"
}
```

### Response Parameters

> Example Response

```json
{
  "data": "data=eyJsYXlvdXRWZXJzaW9uIjoidjIiLCJtZXRob2QiOltdLCJub3RpZnlVcmwiOiJodHRwczovL2dvb2dsZS5jb20iLCJvcmRlciI6eyJhZGRpdGlvbmFsRGF0YSI6IndvcmxkIiwiYW1vdW50IjoxMDAsImN1cnJlbmN5VHlwZSI6Ik1ZUiIsImRldGFpbCI6ImhlbGxvIiwiaWQiOiIxMzIzNDM1Mzk4NiIsInRpdGxlIjoiaGVsbG8ifSwicmVkaXJlY3RVcmwiOiJodHRwczovL3d3dy55b3V0dWJlLmNvbS93YXRjaD92PWs5TlpZUUhRN0dnXHUwMDI2bGlzdD1SREdmY2JPZElGV1BFXHUwMDI2aW5kZXg9MTMiLCJzdG9yZUlkIjoiMTA5NDYxMTQ3NjgyNDc1MzAiLCJ0eXBlIjoiV0VCX1BBWU1FTlQifQ==&method=post&nonceStr=XAYZRZNLGCKSTURRFKBIGYALUKLCLJOG&requestUrl=https://sb-open.revenuemonster.my/v3/payment/online&signType=sha256&timestamp=1591946239",
  "sequenceData": "{\"layoutVersion\":\"v2\",\"method\":[],\"notifyUrl\":\"https://google.com\",\"order\":{\"additionalData\":\"world\",\"amount\":100,\"currencyType\":\"MYR\",\"detail\":\"hello\",\"id\":\"13234353986\",\"title\":\"hello\"},\"redirectUrl\":\"https://www.youtube.com/watch?v=k9NZYQHQ7Gg&list=RDGfcbOdIFWPE&index=13\",\"storeId\":\"10946114768247530\",\"type\":\"WEB_PAYMENT\"}",
  "signature": "sha256 FKdep5OjChzPEZI0IxQBl4gSmIxS9HWb6cyxWPTT3X76RmX/pU6EPXj/WCzW3DFkapNllnLegMylQKgNMNhI29ylihYQhFvbrDdbPNBLHio0MJVH/oRkdf7zrl0GOi6CtEBAktj0yQKN7qjk7qa7ZAghSEKRYeq+zGvgmpxF61EjGYogtShsxXK53+l+tnihOkNC0lgb7rY9W5Sahohrc0E7udY6mSqSTEoYVAmLq/KhYW7Ve6mp6cMRC5N/ELB2atcX8CvU6OnJ4sKPAqr0ML5cmIpKbjypVIPHv4HvvWFm2LC6wX8IMe5SgD891FAdBXfFgl3wR6nGhkpbMjg8ug=="
}
``` -->

<hr/>

### Invalid Request Signature

:::note

<!-- If you received **INVALID_REQUEST_SIGNATURE** -->

You can refer the below Response if you received **INVALID_REQUEST_SIGNATURE** <br/>
we will guide you step by step to fix the issue

```json
{
  "debug": {
    "preVerifyContent": {
      "step1": {
        "content": "{\"layoutVersion\":\"v2\",\"method\":[\"GOBIZ_MY\"],\"notifyUrl\":\"https://dev-rm-api.ap.ngrok.io\",\"order\":{\"additionalData\":\"world\",\"amount\":10,\"currencyType\":\"MYR\",\"detail\":\"hello\",\"id\":\"721115\",\"title\":\"hello\"},\"redirectUrl\":\"https://revenuemonster.my\",\"storeId\":\"10946114768247530\",\"type\":\"WEB_PAYMENT\"}",
        "remark": "Sort the json key alphabetically"
      },
      "step2": {
        "content": "eyJsYXlvdXRWZXJzaW9uIjoidjIiLCJtZXRob2QiOlsiR09CSVpfTVkiXSwibm90aWZ5VXJsIjoiaHR0cHM6Ly9kZXYtcm0tYXBpLmFwLm5ncm9rLmlvIiwib3JkZXIiOnsiYWRkaXRpb25hbERhdGEiOiJ3b3JsZCIsImFtb3VudCI6MTAsImN1cnJlbmN5VHlwZSI6Ik1ZUiIsImRldGFpbCI6ImhlbGxvIiwiaWQiOiI3MjExMTUiLCJ0aXRsZSI6ImhlbGxvIn0sInJlZGlyZWN0VXJsIjoiaHR0cHM6Ly9yZXZlbnVlbW9uc3Rlci5teSIsInN0b3JlSWQiOiIxMDk0NjExNDc2ODI0NzUzMCIsInR5cGUiOiJXRUJfUEFZTUVOVCJ9",
        "remark": "Encode the data using Base64 format"
      },
      "step3": {
        "content": "data=eyJsYXlvdXRWZXJzaW9uIjoidjIiLCJtZXRob2QiOlsiR09CSVpfTVkiXSwibm90aWZ5VXJsIjoiaHR0cHM6Ly9kZXYtcm0tYXBpLmFwLm5ncm9rLmlvIiwib3JkZXIiOnsiYWRkaXRpb25hbERhdGEiOiJ3b3JsZCIsImFtb3VudCI6MTAsImN1cnJlbmN5VHlwZSI6Ik1ZUiIsImRldGFpbCI6ImhlbGxvIiwiaWQiOiI3MjExMTUiLCJ0aXRsZSI6ImhlbGxvIn0sInJlZGlyZWN0VXJsIjoiaHR0cHM6Ly9yZXZlbnVlbW9uc3Rlci5teSIsInN0b3JlSWQiOiIxMDk0NjExNDc2ODI0NzUzMCIsInR5cGUiOiJXRUJfUEFZTUVOVCJ9&method=post&nonceStr=XAYZRZNLGCKSTURRFKBIGYALUKLCLJOG&requestUrl=https://sb-open.revenuemonster.my/v3/payment/online&signType=sha256&timestamp=1599467903",
        "remark": "Construct plain text parameters on this format, if the body is empty then the `data` parameter can be skip"
      },
      "step4": {
        "content": "data=eyJsYXlvdXRWZXJzaW9uIjoidjIiLCJtZXRob2QiOlsiR09CSVpfTVkiXSwibm90aWZ5VXJsIjoiaHR0cHM6Ly9kZXYtcm0tYXBpLmFwLm5ncm9rLmlvIiwib3JkZXIiOnsiYWRkaXRpb25hbERhdGEiOiJ3b3JsZCIsImFtb3VudCI6MTAsImN1cnJlbmN5VHlwZSI6Ik1ZUiIsImRldGFpbCI6ImhlbGxvIiwiaWQiOiI3MjExMTUiLCJ0aXRsZSI6ImhlbGxvIn0sInJlZGlyZWN0VXJsIjoiaHR0cHM6Ly9yZXZlbnVlbW9uc3Rlci5teSIsInN0b3JlSWQiOiIxMDk0NjExNDc2ODI0NzUzMCIsInR5cGUiOiJXRUJfUEFZTUVOVCJ9&method=post&nonceStr=XAYZRZNLGCKSTURRFKBIGYALUKLCLJOG&requestUrl=https://sb-open.revenuemonster.my/v3/payment/online&signType=sha256&timestamp=1599467903",
        "remark": "Sign this content using sha256 with rsa private key and make sure the public key have been uploaded to the portal"
      },
      "step5": {
        "remark": "The signature that generated from step 4, pass on the header X-Signature with prefix the sign type, e.g: sha256 {{ signatureContent }}l"
      }
    },
    "requestHeader": {
      "X-Nonce-Str": {
        "currentValue": "XAYZRZNLGCKSTURRFKBIGYALUKLCLJOG",
        "isValid": true,
        "remark": "Make sure the nonce str is should not contain space and must unique at least for 120 second, if not the server will throw duplicate request error"
      },
      "X-Signature": {
        "currentValue": "sha256 XvedDW8H2gqGL5gMzTHqDy1PXX3OqRF09WuQDkeCDwuinOAsPstcPOSefUwkyHPM9WPNKKHyR5qXbKNLC7UgQyGi8Ynio03kDo0p+g3BqXaUT1tpo5D8kv42Kh2S8CW4RkX2Dkf+Yxi2XMQ8l3kzPZaRyhudaGerUZony4Npzf63p4+oTBbXE01uX/4x/WL57+zkaaVRc1KlJsLdGsBmLlPOHLana7udJffJyxXhOmyokBuJ4GoOC8JpDG9oaKCNMZ88ow9CWWB0yRPrK2KeaEDwzCm2Jh8IFKw1gS6avQAwsjychZWv5XmAXkZ8ZQrnLXJquA09QpLxPTtOeQC9SA==",
        "isValid": false,
        "remark": "The signature is invalid, please check preVerifyContent parameter on how to generate the signature or go to our API documentation https://doc.revenuemonster.my/docs/quickstart/signature-algorithm"
      },
      "X-Timestamp": {
        "currentValue": "1599467903",
        "isValid": false,
        "remark": "Make sure the timestamp generated on UTC timezone and must be maximum the time difference is 120 second from the request send to the server, if not the server will throw invalid timestamp"
      }
    }
  },
  "error": {
    "code": "INVALID_REQUEST_SIGNATURE",
    "message": "The request signature is invalid"
  }
}
```

- Check your **Private key** and **Public key**
- **No space** in JSON data
- To access all wallets, use `method:[]`
- For **amount:100** is RM 1.00

:::

<!-- `Public Keys` needs to have be wrap as following :
![image](/img/developer-application/9.png)

**Optional Tool: Signature Debugger**<br />

For security purposes, we enhanced our authentication flow and Open API by adding layers of encryption to our endpoints. You may use our Signature Debugger
You may develop your own encryption tool on your desired application directly, or you may use our Signature Debugger to do signing/verification using private/public keys as obtained from previous step.
Refer more on `Signature Debugger`

![image](/img/developer-application/10.png) -->
