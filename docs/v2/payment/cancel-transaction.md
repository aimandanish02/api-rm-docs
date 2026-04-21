---
id: cancel-transaction
title: "Cancel Transaction"
sidebar_label: "Cancel Transaction"

api:
  method: POST
  url:
    sandbox: https://sb-open.revenuemonster.my/v3/payment/reverse

  headers:
    Authorization: Bearer {{access_token}}
    X-Timestamp: {{timestamp}}
  body:
    type: json
    example: |
      {
        "orderId": "180730103903010431152179"
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
  sandbox="/v3/payment/reverse"
  prod="/v3/payment/reverse"
/>

## What is this?

Cancel or reverse a transaction. Use this to void a payment before settlement, or to request a refund for a completed transaction.

:::info
**Reverse** cancels a transaction — used mainly to prevent double charges when a timeout occurs.

**Refund** returns funds to the customer — based on the payment provider's policy and time limits.
:::

---

## How to Use

### Step 1: Decide Between Reverse or Refund

- **Reverse** — use within ~15 minutes of a transaction to cancel it. Prevents double charges caused by timeouts.
- **Refund** — use to return funds for a completed transaction. Subject to the payment provider's refund period.

### Step 2: For Reverse — Get the Order ID

Locate the `orderId` from the original transaction response.

### Step 3: For Refund — Get the Transaction ID

Locate the `transactionId` and prepare the refund amount and reason.

### Step 4: Make the Request

Send the appropriate request. Check the `code` field in the response — if `"SUCCESS"`, the operation completed.

---

## Reverse

:::note
If a transaction times out, perform a reverse before creating a new transaction. This prevents a double charge.
:::

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "orderId", type: "String", required: true, description: "Order ID of the transaction to reverse", example: "\"180730103903010431152179\"" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "orderId": "180730103903010431152179"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item", type: "Object", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the reverse succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

---

## Refund

:::note
Refund eligibility depends on the payment provider. Each payment method has its own refund period. If the refund period has passed, contact [support@revenuemonster.my](mailto:support@revenuemonster.my?subject=%5BRefund%20Request%5D) with:
- Transaction ID
- Reference ID (if applicable)
- Total Transaction Amount
- Total Refund Amount
- Reason for refund
:::

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "transactionId", type: "String", required: true, description: "Transaction ID to refund", example: "\"180730103903010431152179\"" },
    { name: "refund.type", type: "String", required: true, description: "Refund type (e.g., \"FULL\")", example: "\"FULL\"" },
    { name: "refund.currencyType", type: "String", required: true, description: "Refund currency type", example: "\"MYR\"" },
    { name: "refund.amount", type: "Uint64", required: true, description: "Refund amount in smallest currency unit", example: "100" },
    { name: "reason", type: "String", required: true, description: "Reason for the refund" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "transactionId": "180730103903010431152179",
  "refund": {
    "type": "FULL",
    "currencyType": "MYR",
    "amount": 100
  },
  "reason": "Customer requested refund"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item", type: "Object", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the refund succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

<!-- SPDX-License-Identifier: Apache-2.0 -->
