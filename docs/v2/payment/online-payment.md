---
id: online-payment
title: "Online Payment"
sidebar_label: "Online Payment"

api:
  method: POST
  url:
    sandbox: https://sb-open.revenuemonster.my/v3/payment/online

  headers:
    Content-Type: application/json
    Authorization: Bearer {{access_token}}
    X-Signature: sha256 {{signature}}
    X-Nonce-Str: {{nonce}}
    X-Timestamp: {{timestamp}}
  body:
    type: json
    example: |
      {
        "storeId": "123456789012345678901234",
        "redirectUrl": "https://merchant.com/payment/redirect",
        "notifyUrl": "https://merchant.com/payment/notify",
        "layoutVersion": "v4",
        "type": "WEB_PAYMENT",
        "order": {
          "id": "ORDER123456789012345678",
          "title": "Online Payment",
          "currencyType": "MYR",
          "amount": 1000
        }
      }

examples:
  request: |
    curl --location --request POST "https://sb-open.revenuemonster.my/v3/payment/online" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer {{access_token}}" \
    --header "X-Signature: sha256 {{signature}}" \
    --header "X-Nonce-Str: {{nonce}}" \
    --header "X-Timestamp: {{timestamp}}" \
    --data '{
      "storeId": "123456789012345678901234",
      "redirectUrl": "https://merchant.com/payment/redirect",
      "notifyUrl": "https://merchant.com/payment/notify",
      "layoutVersion": "v4",
      "type": "WEB_PAYMENT",
      "order": {
        "id": "ORDER123456789012345678",
        "title": "Online Payment",
        "currencyType": "MYR",
        "amount": 1000
      }
    }'
  response: |
    {
      "item": { "checkoutId": "...", "url": "https://..." },
      "code": "SUCCESS"
    }
---


import ApiEndpoint from "@site/src/components/api/ApiEndpoint";

<ApiEndpoint
  method="POST"
  sandbox="/v3/payment/online"
  prod="/v3/payment/online"
/>

import { Flex, Button, Card, Image } from "rebass";

## What is this?

Online Payment lets businesses accept online payments through web and mobile applications. Customers can enter card details or select an e-wallet to complete payment from their smartphone or website.

:::info
Online Payment is an **online payment method**. Subscription is based on the online subscription rate.
:::

---

## How to Use

### Step 1: Create a Checkout Session

Send the order details to this endpoint. You will receive a `checkoutId` and a checkout `url`.

### Step 2: Redirect the Customer

Redirect the customer to the `url` returned in the response. They will complete payment on the hosted checkout page.

### Step 3: Handle the Redirect

After payment, the customer is redirected to your `redirectUrl`. The redirect includes `status` and `orderId` as query parameters.

### Step 4: Receive the Server Notification

Set a `notifyUrl` to receive a server-to-server callback when payment succeeds. Query the transaction using [Query Transaction](./query-transaction.md) for full details.

---

## Hosted Payment Checkout

:::note
- This creates a unified payment checkout page for both web and mobile.
- The **data object** must be sorted alphabetically, including nested objects.
:::

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "storeId", type: "String", required: true, description: "Revenue Monster Store ID" },
    { name: "redirectUrl", type: "String", required: true, description: "URL to redirect the customer back to after payment." },
    { name: "notifyUrl", type: "String", required: true, description: "Server URL to receive payment status callbacks." },
    { name: "layoutVersion", type: "String", required: true, description: "Always use \"v4\"." },
    { name: "type", type: "String", required: true, description: "Checkout session type." },
    { name: "method", type: "[]String", description: "Payment methods to enable." },
    { name: "order.id", type: "String", required: true, description: "Order ID" },
    { name: "order.title", type: "String", required: true, description: "Order title" },
    { name: "order.currencyType", type: "String", required: true, description: "Order currency type (currently supported MYR only)" },
    { name: "order.amount", type: "Uint64", required: true, description: "Order amount" },
    { name: "order.detail", type: "String", description: "Order detail" },
    { name: "order.additionalData", type: "String", description: "Order additional data" },
    { name: "customer.userId", type: "String", description: "Required when tokenization is enabled." },
    { name: "customer.email", type: "String", description: "Customer email address." },
    { name: "customer.countryCode", type: "String", description: "Customer country code." },
    { name: "customer.phoneNumber", type: "String", description: "Customer phone number." }
  ]}
/>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.checkoutId", type: "String", description: "Checkout session ID" },
    { name: "item.url", type: "String", description: "Checkout session URL to redirect the customer to" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

## Individual Payment Checkout

After creating a checkout session, use the `checkoutId` to build a custom payment experience:

<CodeBlock language="plaintext" filename="Checkout URL" hideLineNumbers>
{`https://sb-pg.revenuemonster.my/v4/checkout?checkoutId=1548316308361173347`}
</CodeBlock>

### Redirect Response

:::info
The redirect URL brings the customer back to your page after payment. It can be any URL type (deep link, browser URL, server URL).
:::

**Method:** <span style={{ color: "orange", fontWeight: "bold" }}>GET</span>

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | String | Yes | Payment status |
| `orderId` | String | Yes | Payment order ID |
| `reason` | String | No | Payment failure reason |

### Notify Response

:::info
The notify URL informs your server of the transaction status after a successful payment. Notify is only called on success — failure or refund does not trigger a notify. Query the transaction using [Query Transaction](./query-transaction.md) for full details.
:::

**Method:** <span style={{ color: "orange", fontWeight: "bold" }}>POST</span>

<ParamTable
  title="Details"
  rows={[
    { name: "eventType", type: "String", required: true, description: "Notify event type. Always \"PAYMENT_WEB_ONLINE\"." },
    { name: "data.store", type: "JSON", description: "Store details." },
    { name: "data.referenceId", type: "String", description: "Reference ID." },
    { name: "data.transactionId", type: "String", required: true, description: "Transaction ID." },
    { name: "data.terminalId", type: "String", description: "Terminal ID." },
    { name: "data.currencyType", type: "String", required: true, description: "Currency type (currently supported MYR only)." },
    { name: "data.balanceAmount", type: "Uint64", required: true, description: "Remaining balance for initiating refund." },
    { name: "data.finalAmount", type: "Uint64", required: true, description: "Amount after deductions (voucher, membership)." },
    { name: "data.platform", type: "String", required: true, description: "Transaction platform." },
    { name: "data.type", type: "String", required: true, description: "Transaction type." },
    { name: "data.method", type: "String", required: true, description: "Transaction payment method." },
    { name: "data.region", type: "String", required: true, description: "Transaction payment region." },
    { name: "data.status", type: "String", required: true, description: "Transaction payment status." },
    { name: "data.transactionAt", type: "String", description: "Transaction date time (present only when status is SUCCESS)." },
    { name: "data.createdAt", type: "String", required: true, description: "Transaction created date time." },
    { name: "data.updatedAt", type: "String", required: true, description: "Transaction last updated date time." },
    { name: "data.order.id", type: "String", required: true, description: "Order ID." },
    { name: "data.order.title", type: "String", required: true, description: "Order title." },
    { name: "data.order.currencyType", type: "String", required: true, description: "Order currency type." },
    { name: "data.order.amount", type: "Uint64", required: true, description: "Order amount." },
    { name: "data.order.detail", type: "String", description: "Order detail." },
    { name: "data.order.additionalData", type: "String", description: "Order additional data." }
  ]}
/>

---

## Query Payment Checkout

:::caution
Payment checkout is not the same as payment transaction info. Checkout only returns status, amount, and redirectUrl. For full transaction details, query the transaction using [Query By Transaction ID](./query-transaction.md#query-by-transaction-id) with the `transactionId` from the checkout response.
:::

**Request Parameters**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `checkoutId` | QueryParam | Yes | Payment checkout ID |

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." },
    { name: "item.id", type: "String", description: "Payment checkout ID." },
    { name: "item.type", type: "String", description: "Payment checkout type." },
    { name: "item.transactionId", type: "String", description: "Payment transaction ID. Use this to query the transaction via Query Transaction." },
    { name: "item.order.id", type: "String", description: "Order ID." },
    { name: "item.order.title", type: "String", description: "Order title." },
    { name: "item.order.currencyType", type: "String", description: "Order currency type." },
    { name: "item.order.amount", type: "Uint64", description: "Order amount." },
    { name: "item.order.detail", type: "String", description: "Order detail." },
    { name: "item.order.additionalData", type: "String", description: "Order additional data." },
    { name: "item.platform", type: "String", description: "Payment checkout platform." },
    { name: "item.method", type: "String", description: "Payment checkout available methods." },
    { name: "item.redirectUrl", type: "String", description: "Payment redirect URL." },
    { name: "item.notifyUrl", type: "String", description: "Payment notify URL." },
    { name: "item.startAt", type: "String", description: "Payment checkout start date time." },
    { name: "item.status", type: "String", description: "Payment checkout status." },
    { name: "item.createdAt", type: "String", description: "Payment checkout created date time." },
    { name: "item.updatedAt", type: "String", description: "Payment checkout last updated date time." }
  ]}
/>

---

## Direct Payment Checkout

:::note
With Direct Payment Checkout, you create a payment page with your own UI design. There are two modes: QR code and URL. URL is preferred in most cases.
:::

:::caution
Direct Payment Checkout requires polling the [Query Payment Checkout](#query-payment-checkout) API to keep the payment status updated. Without polling, the payment status will not update until our system performs a pre-timeout check. Suggested polling interval is 3 to 5 seconds.
:::

### Mode: URL

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"URL\"." },
    { name: "method", type: "String", required: true, description: "Payment method (e.g., ALIPAYPLUS_MY)." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1582438693268947023",
  "type": "URL",
  "method": "ALIPAYPLUS_MY"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.url", type: "String", description: "Checkout session URL." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

### Mode: QR Code

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"QRCODE\"." },
    { name: "method", type: "String", required: true, description: "Payment method (e.g., MAYBANK_MY)." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1582438693268947023",
  "type": "QRCODE",
  "method": "MAYBANK_MY"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.qrcode.base64Image", type: "String", description: "Base64-encoded QR code image." },
    { name: "item.qrcode.data", type: "String", description: "QR code data string." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

### Mode: DuitNow QR

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"DUITNOW_QRCODE\"." },
    { name: "method", type: "String", required: true, description: "Leave empty for DuitNow QR." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1687168234460362061",
  "method": "",
  "type": "DUITNOW_QRCODE"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.qrcode.base64Image", type: "String", description: "Base64-encoded QR code image." },
    { name: "item.qrcode.data", type: "String", description: "QR code data string." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

### Mode: Alipay Mini Program

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"MINI_PROGRAM\"." },
    { name: "method", type: "String", required: true, description: "Payment method. Set to \"ALIPAY_CN\"." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1582438693268947023",
  "type": "MINI_PROGRAM",
  "method": "ALIPAY_CN"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.data", type: "String", description: "Base64-encoded data to pass to the mini program API." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

**Alipay Mini Program Frontend**

:::note
Use base64 decode on the `data` parameter and pass the result to the mini program API.
:::

<CodeBlock language="javascript" filename="Alipay Mini Program">
{`my.tradePay({
  orderStr: base64Decode(dataParameter),
  success: (res) => { console.log("success", res); },
  fail: (res) => { console.log("error", res); }
});`}
</CodeBlock>

---

### Mode: WeChat Pay Mini Program

:::note
Before starting integration, contact [support@revenuemonster.my](mailto:support@revenuemonster.my) to bind your "Mini Program App ID / 小程序 App ID" to your account.
:::

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"MINI_PROGRAM\"." },
    { name: "method", type: "String", required: true, description: "Payment method. Set to \"WECHATPAY_CN\"." },
    { name: "userId", type: "String", required: true, description: "WeChat user Open ID." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1582438693268947023",
  "type": "MINI_PROGRAM",
  "method": "WECHATPAY_CN",
  "userId": "oFGqK6w1kZyjDTtNAcOXBDHAa8CY"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.data", type: "String", description: "Base64-encoded data to pass to the mini program API." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

**WeChat Pay Mini Program Frontend**

:::note
Use base64 decode on the `data` parameter and pass the result to the mini program API.
:::

<CodeBlock language="javascript" filename="WeChat Mini Program">
{`var base64decoded = base64Decode(dataParameter);
var payload = JSON.parse(base64decoded);
wx.requestPayment({
  ...payload,
  success: function (res) { console.log("success", res); },
  fail: function (res) { console.log("fail", res); },
  complete: function (res) { console.log("complete", res); }
});`}
</CodeBlock>

---

### Mode: FPX

**Method:** <span style={{ color: "orange", fontWeight: "bold" }}>GET</span>
**URL:** `https://open.revenuemonster.my/v3/payment/fpx-bank`

**Sandbox URL:** `https://sb-open.revenuemonster.my/v3/payment/fpx-bank`

**FPX Bank Codes:**

| Code | Name |
|---|---|
| ABB0233:B2C | Affin Bank |
| ABMB0212:B2C | Alliance Bank (Personal) |
| AGRO01:B2C | AGRONet |
| AMBB0209:B2C | AmBank |
| BCBB0235:B2C | CIMB Bank |
| BIMB0340:B2C | Bank Islam |
| BKRM0602:B2C | Bank Rakyat |
| BMMB0341:B2C | Bank Muamalat |
| BSN0601:B2C | Bank Simpanan Nasional |
| HLB0224:B2C | Hong Leong Bank |
| HSBC0223:B2C | HSBC |
| KFH0346:B2C | Kuwait Finance House |
| MB2U0227:B2C | Maybank2U |
| MBB0228:B2C | Maybank2E |
| OCBC0229:B2C | OCBC |
| PBB0233:B2C | Public Bank |
| RHB0218:B2C | RHB Bank |
| SCB0216:B2C | Standard Chartered Bank |
| UOB0226:B2C | United Oversea Bank |

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"URL\"." },
    { name: "method", type: "String", required: true, description: "Payment method. Set to \"FPX_MY\"." },
    { name: "fpx.bankCode", type: "String", required: true, description: "FPX bank code from the table above." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1687166508263303064",
  "method": "FPX_MY",
  "type": "URL",
  "fpx": {
    "bankCode": "TEST0021"
  }
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.url", type: "String", description: "FPX payment URL to redirect the customer to." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

### Mode: GoBiz / Paydee / Mastercard

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "checkoutId", type: "String", required: true, description: "Checkout ID from the Hosted Payment Checkout response." },
    { name: "type", type: "String", required: true, description: "Checkout type. Set to \"URL\"." },
    { name: "method", type: "String", required: true, description: "Payment method (e.g., MASTERCARD_MY, GOBIZ_MY)." },
    { name: "gobiz.type", type: "String", description: "GoBiz payment type." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "checkoutId": "1687168234460362061",
  "method": "MASTERCARD_MY",
  "type": "URL"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.type", type: "String", description: "Checkout session type." },
    { name: "item.url", type: "String", description: "Payment URL." },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded." },
    { name: "error.code", type: "String", description: "Error code." },
    { name: "error.message", type: "String", description: "Error message." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

<!-- SPDX-License-Identifier: Apache-2.0 -->
