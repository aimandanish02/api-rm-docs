---
title: "Reverse Transaction"
sidebar_label: "Reverse Transaction"

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

Reverse a transaction — used to void a payment before settlement. If a transaction times out, perform a reverse before creating a new transaction to prevent a double charge.

:::info
**Reverse** cancels a transaction — used mainly to prevent double charges when a timeout occurs. Use within ~15 minutes of a transaction.
:::

---

## How to Use

### Step 1: Get the Order ID

Locate the `orderId` from the original transaction response.

### Step 2: Make the Request

Send the reverse request with the `orderId`. Check the `code` field in the response — if `"SUCCESS"`, the operation completed.

---

## Request Parameters

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

## Response Parameters

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

<!-- SPDX-License-Identifier: Apache-2.0 -->