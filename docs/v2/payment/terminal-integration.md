---
id: terminal-integration
title: "Terminal Integration"
sidebar_label: "Terminal Integration"

api:
  method: POST
  url:
    sandbox: https://sb-open.revenuemonster.my/v3/payment/terminal/quickpay

  headers:
    Authorization: Bearer {{access_token}}
    X-Timestamp: {{timestamp}}
  body:
    type: json
    example: |
      {
        "terminalId": "1554193032595276913",
        "type": "E-WALLET",
        "receiptType": 3,
        "cameraType": "FRONT",
        "order": {
          "amount": 10,
          "currencyType": "MYR",
          "id": "387153091916665362292147",
          "title": "title"
        }
      }

examples:
  request: |
    There is no example request provided.
  body: |
    There is no example body request.
  response: |
    There is no example response provided.
---


import ApiEndpoint from "@site/src/components/api/ApiEndpoint";

<ApiEndpoint
  method="POST"
  sandbox="/v3/payment/terminal/quickpay"
  prod="/v3/payment/terminal/quickpay"
/>

## What is this?

Terminal Integration lets businesses process orders using an RM Terminal to accept credit cards, debit cards, and e-wallets. Common use cases are for **POS** and **Self-Service Kiosk** systems.

There are two types of integration:
- **Event** — sends an action to the terminal from the RM server. May take time and can fail if the terminal is not connected.
- **Server** — processes directly on the RM server and returns a response immediately.

:::note
This integration works with any system as long as you are using an RM Terminal for payment acceptance.
:::

---

## How to Use

### Step 1: Identify the Terminal

Get the `terminalId` of the RM Terminal you want to use.

### Step 2: Choose the Event Type

Select the appropriate event based on what you want to do:
- Quick Pay — accept e-wallet QR payments
- Card Payment — accept card payments
- Card Refund — refund a card transaction
- Card Settlement — settle terminal transactions
- Cancel Event — cancel an ongoing event

### Step 3: Make the POST Request

Send the event request with the `terminalId`, `type`, and order details.

### Step 4: Handle the Response

Check the `code` field. For Event-type requests, a `"SUCCESS"` response confirms the event was sent — not that it completed on the terminal.

---

## Event: Quick Pay

:::tip
If your hardware device has its own scanner to scan payment QR codes, use the [OpenAPI QuickPay](./quick-pay.md) instead for better experience and performance.
:::

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "terminalId", type: "String", required: true, description: "RM Terminal ID" },
    { name: "type", type: "String", required: true, description: "Payment type. Set to \"E-WALLET\"." },
    { name: "receiptType", type: "Integer", required: true, description: "Receipt setting: 1 = Print both merchant and customer copy, 2 = Print customer copy only, 3 = Do not print" },
    { name: "cameraType", type: "String", required: true, description: "Use \"FRONT\" or \"BACK\" camera to scan QR code (for E-WALLET only)" },
    { name: "order.id", type: "String", required: true, description: "Order ID" },
    { name: "order.title", type: "String", required: true, description: "Order title" },
    { name: "order.currencyType", type: "String", required: true, description: "Currency type (currently supported MYR only)" },
    { name: "order.amount", type: "Integer", required: true, description: "Order amount" },
    { name: "order.detail", type: "String", description: "Order detail" },
    { name: "order.additionalData", type: "String", description: "Order additional data" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "terminalId": "1554193032595276913",
  "type": "E-WALLET",
  "receiptType": 3,
  "cameraType": "FRONT",
  "order": {
    "amount": 10,
    "currencyType": "MYR",
    "id": "387153091916665362292147",
    "title": "title",
    "detail": "desc",
    "additionalData": "010100 Pay parking ticket"
  }
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item", type: "Object", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the event was sent, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

## Event: Card Payment

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "terminalId", type: "String", required: true, description: "RM Terminal ID" },
    { name: "type", type: "String", required: true, description: "Payment type. Set to \"CARD\"." },
    { name: "receiptType", type: "Integer", required: true, description: "Receipt setting: 1 = Print both copies, 2 = Print customer copy only, 3 = Do not print" },
    { name: "order.id", type: "String", required: true, description: "Order ID" },
    { name: "order.title", type: "String", required: true, description: "Order title" },
    { name: "order.currencyType", type: "String", required: true, description: "Currency type (currently supported MYR only)" },
    { name: "order.amount", type: "Integer", required: true, description: "Order amount" },
    { name: "order.detail", type: "String", description: "Order detail" },
    { name: "order.additionalData", type: "String", description: "Order additional data" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "terminalId": "1554193032595276913",
  "type": "CARD",
  "receiptType": 3,
  "order": {
    "amount": 10,
    "currencyType": "MYR",
    "id": "387153091916665362292147",
    "title": "title",
    "detail": "desc",
    "additionalData": "010100 Pay parking ticket"
  }
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item", type: "Object", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the event was sent, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

## Event: Card Refund

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "terminalId", type: "String", required: true, description: "RM Terminal ID" },
    { name: "type", type: "String", required: true, description: "Event type. Set to \"REFUND\"." },
    { name: "data.transactionId", type: "String", required: true, description: "Transaction ID to refund" },
    { name: "data.receiptType", type: "Integer", description: "Receipt setting: 1 = Print both copies, 2 = Print customer copy only, 3 = Do not print" },
    { name: "data.reason", type: "String", description: "Reason for the refund" },
    { name: "data.email", type: "String", required: true, description: "Email address matching the refund PIN" },
    { name: "data.pin", type: "String", required: true, description: "Refund PIN" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "terminalId": "1582107209454501456",
  "type": "REFUND",
  "data": {
    "transactionId": "210215083727100327507906",
    "receiptType": 3,
    "reason": "Testing Refund",
    "email": "oska.ng@revenuemonster.my",
    "pin": "321123"
  }
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item", type: "Object", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the event was sent, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

## Event: Card Settlement

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "terminalId", type: "String", required: true, description: "RM Terminal ID" },
    { name: "type", type: "String", required: true, description: "Event type. Set to \"SETTLEMENT\"." },
    { name: "data.receiptType", type: "Integer", description: "Receipt setting: 1 = Print both copies, 2 = Print customer copy only, 3 = Do not print" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "terminalId": "1554193032595276913",
  "type": "SETTLEMENT",
  "data": {
    "receiptType": 3
  }
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "code", type: "String", description: "\"SUCCESS\" if the event was sent, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." },
    { name: "summary.batchNo", type: "String", description: "Terminal settlement sequence number" },
    { name: "summary.currencyType", type: "String", description: "Settlement currency type (currently supported MYR only)" },
    { name: "summary.noOfTransactions", type: "Integer", description: "Count of settled transactions" },
    { name: "summary.settlementAt", type: "String", description: "Date and time of settlement" },
    { name: "summary.totalSalesAmount", type: "Integer", description: "Total sales amount in cents" },
    { name: "transactions[*].amount", type: "Integer", description: "Transaction amount in cents" },
    { name: "transactions[*].currencyType", type: "Integer", description: "Transaction currency type" },
    { name: "transactions[*].transactionAt", type: "String", description: "Transaction date and time" },
    { name: "transactions[*].transactionId", type: "String", description: "Transaction ID" },
    { name: "transactions[*].type", type: "String", description: "Transaction type" }
  ]}
/>

---

## Event: Cancel Event

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "terminalId", type: "String", required: true, description: "RM Terminal ID" },
    { name: "type", type: "String", required: true, description: "Event type. Set to \"CANCEL\"." }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "terminalId": "1582107209454501456",
  "type": "CANCEL"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "code", type: "String", description: "\"SUCCESS\" if the event was sent, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

## Server: Payment Refund

:::caution
This applies to e-wallet transactions only. For card payments, perform the refund on the terminal via the Event API.

See [Cancel Transaction > Refund](./cancel-transaction.md#refund)
:::

---

## Server: Payment Reverse

:::caution
This applies to e-wallet transactions only. For card payments, perform the reverse on the terminal via the Event API.

See [Cancel Transaction > Reverse](./cancel-transaction.md#reverse)
:::

<!-- SPDX-License-Identifier: Apache-2.0 -->
