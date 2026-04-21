---
id: tokenization-payment
title: "Tokenization Payment"
sidebar_label: "Tokenization Payment"

api:
  method: POST
  url:
    sandbox: https://sb-open.revenuemonster.my/v3/recurring-payment

  headers:
    Authorization: Bearer {{access_token}}
    X-Signature: sha256 {{signature}}
    X-Nonce-Str: {{nonce}}
    X-Timestamp: {{timestamp}}
    Content-Type: application/json
  body:
    type: json
    example: |
      {
        "storeId": "123456789012345678901234",
        "email": "customer@email.com",
        "name": "Customer Name",
        "countryCode": "MY",
        "phoneNumber": "0123456789",
        "productName": "Subscription",
        "productDescription": "Weekly subscription",
        "currency": "MYR",
        "amount": 1000,
        "redirectUrl": "https://merchant.com/redirect",
        "notifyUrl": "https://merchant.com/notify",
        "recurringInterval": "WEEKLY",
        "recurringTarget": "customer",
        "recurringRepetition": 12
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
  sandbox="/v3/recurring-payment"
  prod="/v3/recurring-payment"
/>

## What is this?

Tokenization replaces sensitive card data (PAN) with a secure token. Within the RM API, tokenization enables two use cases:

- **Recurring Payment** — automatically charge a customer's card on a schedule (weekly, monthly, etc.)
- **Tokenized Payment** — store card details once, then charge on your own terms (for merchants with their own recurring engine)

## When to Use

Use tokenization when you:
- Need to charge customers on a recurring basis (subscriptions, instalments)
- Want to offer flexible, on-demand charges without storing card details
- Are building a micromobility or other pay-per-use service

---

## How to Use

### Step 1: Create a Customer

Create a customer by sending their details and redirect URL. The customer is redirected to bind their card.

### Step 2: Customer Binds Their Card

The customer completes card binding on the RM-hosted page. After binding, they are redirected back to your `redirectUrl`.

### Step 3: Handle the Redirect

The redirect includes `status` and `customerId`. If `status` is `"SUCCESS"`, the customer is ready for payments.

### Step 4: For Recurring — Set Up Your Recurring Engine

For Recurring Payment, charges happen automatically based on your schedule. For Tokenized Payment, you call the Create Customer Order API to charge on demand.

---

## Tokenization: Recurring Payment

Recurring payment lets you automatically charge a customer's card based on a defined schedule.

### Create Recurring Customer

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "storeId", type: "String", required: true, description: "Revenue Monster Store ID" },
    { name: "email", type: "String", required: true, description: "Customer email address" },
    { name: "name", type: "String", required: true, description: "Customer name" },
    { name: "countryCode", type: "String", required: true, description: "Customer country code", example: "\"60\"" },
    { name: "phoneNumber", type: "String", required: true, description: "Customer phone number" },
    { name: "productName", type: "String", required: true, description: "Recurring product name" },
    { name: "productDescription", type: "String", required: true, description: "Recurring product description" },
    { name: "currency", type: "String", required: true, description: "Recurring payment currency", example: "\"MYR\"" },
    { name: "amount", type: "Uint64", required: true, description: "Recurring payment amount in smallest currency unit" },
    { name: "redirectUrl", type: "String", required: true, description: "URL to redirect the customer to after card binding" },
    { name: "notifyUrl", type: "String", required: true, description: "Server URL to receive payment notifications" },
    { name: "recurringInterval", type: "String", required: true, description: "Recurring interval (WEEKLY, MONTHLY)" },
    { name: "recurringTarget", type: "String", required: true, description: "Day of the week or month to charge. See recurring target rules below." },
    { name: "recurringRepetition", type: "Uint64", required: true, description: "Number of times to charge the customer" }
  ]}
/>

**Recurring Target Rules:**

| Interval | Target | Payment Behaviour |
|---|---|---|
| `WEEKLY` | `0` | Every Sunday |
| `WEEKLY` | `1` | Every Monday |
| `WEEKLY` | `2` | Every Tuesday |
| `WEEKLY` | `3` | Every Wednesday |
| `WEEKLY` | `4` | Every Thursday |
| `WEEKLY` | `5` | Every Friday |
| `WEEKLY` | `6` | Every Saturday |
| `MONTHLY` | `-1` | End of every month |
| `MONTHLY` | `0` | Start of every month |
| `MONTHLY` | `1–28` | Day of the month |

<CodeBlock language="json" filename="Example Request">
{`{
  "storeId": "1602660043994159611",
  "email": "oska.ng@revenuemonster.my",
  "name": "Oska Ng OpenAPI",
  "countryCode": "60",
  "phoneNumber": "187824152",
  "currency": "MYR",
  "amount": 120,
  "redirectUrl": "https://google.com",
  "notifyUrl": "https://google.com",
  "productName": "Some Product Name",
  "productDescription": "Some Product productDescription",
  "recurringInterval": "WEEKLY",
  "recurringTarget": "1",
  "recurringRepetition": 10
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.id", type: "String", description: "Recurring payment ID" },
    { name: "item.merchantId", type: "String", description: "Merchant ID" },
    { name: "item.storeId", type: "String", description: "Store ID" },
    { name: "item.label", type: "String", description: "Customer card: front six and last four digits" },
    { name: "item.email", type: "String", description: "Customer email" },
    { name: "item.countryCode", type: "String", description: "Customer country code" },
    { name: "item.phoneNumber", type: "String", description: "Customer phone number" },
    { name: "item.productName", type: "String", description: "Recurring product name" },
    { name: "item.productDescription", type: "String", description: "Recurring product description" },
    { name: "item.isActive", type: "Boolean", description: "Whether the recurring payment is active. Becomes true after card is bound successfully." },
    { name: "item.createdAt", type: "String", description: "Recurring created date time" },
    { name: "item.updatedAt", type: "String", description: "Recurring last updated date time" },
    { name: "item.clientKey", type: "String", description: "Internal usage only" },
    { name: "item.redirectUrl", type: "String", description: "URL for customer to redirect after card binding" },
    { name: "item.notifyUrl", type: "String", description: "URL for payment notifications" },
    { name: "item.paymentUrl", type: "String", description: "URL for customer to bind their card" },
    { name: "item.recurringPayment.amount", type: "Uint64", description: "Recurring payment amount" },
    { name: "item.recurringPayment.currency", type: "String", description: "Recurring payment currency" },
    { name: "item.recurringPayment.recurringInterval", type: "String", description: "Recurring interval" },
    { name: "item.recurringPayment.recurringTarget", type: "String", description: "Recurring target rules" },
    { name: "item.recurringPayment.recurringRepetition", type: "Uint64", description: "Number of repetitions" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

### Redirect Response

:::info
The redirect URL brings the customer back to your page after card binding. It can be any URL type (deep link, browser URL, server URL).
:::

**Method:** <span style={{ color: "orange", fontWeight: "bold" }}>GET</span>

<ParamTable
  title="Details"
  rows={[
    { name: "status", type: "String", required: true, description: "Card bind status" },
    { name: "customerId", type: "String", required: true, description: "Card bind customer ID. Use this for subsequent API calls." },
    { name: "reason", type: "String", description: "Card bind failure reason" }
  ]}
/>

### Notify Response

:::info
Notify URL informs your server when a recurring payment is made. Notify is only called on success — fail and refund do not trigger a notify. Use [Query Transaction](./query-transaction.md) for full transaction details.
:::

**Method:** <span style={{ color: "orange", fontWeight: "bold" }}>GET</span>

<ParamTable
  title="Details"
  rows={[
    { name: "eventType", type: "String", required: true, description: "Notify event type" },
    { name: "data.amount", type: "Uint64", required: true, description: "Recurring payment amount" },
    { name: "data.currency", type: "String", required: true, description: "Recurring order currency" },
    { name: "data.countryCode", type: "String", required: true, description: "Recurring customer country code" },
    { name: "data.phoneNumber", type: "String", required: true, description: "Recurring customer phone number" },
    { name: "data.customerId", type: "String", required: true, description: "Recurring customer ID" },
    { name: "data.email", type: "String", required: true, description: "Recurring customer email" },
    { name: "data.name", type: "String", required: true, description: "Recurring customer name" },
    { name: "data.merchantId", type: "String", required: true, description: "Merchant ID" },
    { name: "data.storeId", type: "String", required: true, description: "Store ID" },
    { name: "data.orderId", type: "String", required: true, description: "Recurring transaction order ID" },
    { name: "data.status", type: "String", required: true, description: "Recurring order status" },
    { name: "data.createdAt", type: "String", required: true, description: "Recurring order created date time" },
    { name: "data.updatedAt", type: "String", required: true, description: "Recurring order updated date time" }
  ]}
/>

---

## Tokenization: Tokenized Payment

Tokenized payment lets customers bind their card once, then you charge on your own schedule using your own recurring engine.

### Create Tokenized Customer

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "storeId", type: "String", required: true, description: "Revenue Monster Store ID" },
    { name: "email", type: "String", required: true, description: "Customer email address" },
    { name: "name", type: "String", required: true, description: "Customer name" },
    { name: "countryCode", type: "String", required: true, description: "Customer country code" },
    { name: "phoneNumber", type: "String", required: true, description: "Customer phone number" },
    { name: "productName", type: "String", required: true, description: "Tokenized product name" },
    { name: "productDescription", type: "String", required: true, description: "Tokenized product description" },
    { name: "redirectUrl", type: "String", required: true, description: "URL to redirect the customer to after card binding" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "storeId": "1602660043994159611",
  "email": "oska.ng@revenuemonster.my",
  "name": "Oska Ng OpenAPI",
  "countryCode": "60",
  "phoneNumber": "187824152",
  "redirectUrl": "https://google.com",
  "productName": "Card Tokenized Binding",
  "productDescription": "Some description for card tokenized"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.id", type: "String", description: "Recurring payment ID" },
    { name: "item.merchantId", type: "String", description: "Merchant ID" },
    { name: "item.storeId", type: "String", description: "Store ID" },
    { name: "item.label", type: "String", description: "Customer card: front six and last four digits" },
    { name: "item.email", type: "String", description: "Customer email" },
    { name: "item.countryCode", type: "String", description: "Customer country code" },
    { name: "item.phoneNumber", type: "String", description: "Customer phone number" },
    { name: "item.productName", type: "String", description: "Tokenized product name" },
    { name: "item.productDescription", type: "String", description: "Tokenized product description" },
    { name: "item.isActive", type: "Boolean", description: "Whether the token is active. Becomes true after card is bound successfully." },
    { name: "item.createdAt", type: "String", description: "Created date time" },
    { name: "item.updatedAt", type: "String", description: "Last updated date time" },
    { name: "item.clientKey", type: "String", description: "Internal usage only" },
    { name: "item.redirectUrl", type: "String", description: "URL for customer to redirect after card binding" },
    { name: "item.notifyUrl", type: "String", description: "URL for payment notifications" },
    { name: "item.paymentUrl", type: "String", description: "URL for customer to bind their card" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

### Redirect Response

:::info
The redirect URL brings the customer back to your page after card binding.
:::

**Method:** <span style={{ color: "orange", fontWeight: "bold" }}>GET</span>

<ParamTable
  title="Details"
  rows={[
    { name: "status", type: "String", required: true, description: "Card bind status" },
    { name: "customerId", type: "String", required: true, description: "Card bind customer ID" },
    { name: "reason", type: "String", description: "Card bind failure reason" }
  ]}
/>

---

## Tokenization Customer API

These APIs work for both Recurring Payment and Tokenized Payment customers.

:::note
These APIs are only available after a customer has bound their card at least once.
:::

### Get Customer Info

**Request Parameters**

<ParamTable
  title="Path Parameters"
  rows={[
    { name: "customer_id", type: "String", required: true, description: "Customer ID returned from Create Recurring Customer or Create Tokenized Customer" }
  ]}
/>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.id", type: "String", description: "Recurring payment ID" },
    { name: "item.merchantId", type: "String", description: "Merchant ID" },
    { name: "item.storeId", type: "String", description: "Store ID" },
    { name: "item.label", type: "String", description: "Customer card: front six and last four digits" },
    { name: "item.email", type: "String", description: "Customer email" },
    { name: "item.countryCode", type: "String", description: "Customer country code" },
    { name: "item.phoneNumber", type: "String", description: "Customer phone number" },
    { name: "item.productName", type: "String", description: "Product name" },
    { name: "item.productDescription", type: "String", description: "Product description" },
    { name: "item.isActive", type: "Boolean", description: "Whether the token is active" },
    { name: "item.createdAt", type: "String", description: "Created date time" },
    { name: "item.updatedAt", type: "String", description: "Last updated date time" },
    { name: "item.clientKey", type: "String", description: "Internal usage only" },
    { name: "item.redirectUrl", type: "String", description: "Redirect URL" },
    { name: "item.notifyUrl", type: "String", description: "Notify URL" },
    { name: "item.paymentUrl", type: "String", description: "Card binding URL" },
    { name: "item.recurringPayment.amount", type: "Uint64", description: "Recurring payment amount" },
    { name: "item.recurringPayment.currency", type: "String", description: "Recurring payment currency" },
    { name: "item.recurringPayment.recurringInterval", type: "String", description: "Recurring interval" },
    { name: "item.recurringPayment.recurringTarget", type: "String", description: "Recurring target rules" },
    { name: "item.recurringPayment.recurringRepetition", type: "Uint64", description: "Number of repetitions" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

### Get Customer Orders

**Request Parameters**

<ParamTable
  title="Path Parameters"
  rows={[
    { name: "customer_id", type: "String", required: true, description: "Customer ID returned from Create Recurring Customer or Create Tokenized Customer" }
  ]}
/>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "items", type: "Array", description: "List of recurring order records" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

**Order record (items[\*]):**

<ParamTable
  title="Details"
  rows={[
    { name: "id", type: "String", description: "Recurring order ID" },
    { name: "merchantId", type: "String", description: "Merchant ID" },
    { name: "storeId", type: "String", description: "Store ID" },
    { name: "recurringCustomerId", type: "String", description: "Customer ID" },
    { name: "transactionId", type: "String", description: "Transaction ID" },
    { name: "createdAt", type: "String", description: "Order created date time" },
    { name: "updatedAt", type: "String", description: "Order last updated date time" },
    { name: "amount", type: "Uint64", description: "Order payment amount" },
    { name: "currency", type: "String", description: "Order currency" }
  ]}
/>

### Toggle Customer Status

**Request Parameters**

<ParamTable
  title="Path Parameters"
  rows={[
    { name: "customer_id", type: "String", required: true, description: "Customer ID returned from Create Recurring Customer or Create Tokenized Customer" }
  ]}
/>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item.id", type: "String", description: "Recurring payment ID" },
    { name: "item.merchantId", type: "String", description: "Merchant ID" },
    { name: "item.storeId", type: "String", description: "Store ID" },
    { name: "item.label", type: "String", description: "Customer card: front six and last four digits" },
    { name: "item.email", type: "String", description: "Customer email" },
    { name: "item.countryCode", type: "String", description: "Customer country code" },
    { name: "item.phoneNumber", type: "String", description: "Customer phone number" },
    { name: "item.productName", type: "String", description: "Product name" },
    { name: "item.productDescription", type: "String", description: "Product description" },
    { name: "item.isActive", type: "Boolean", description: "Whether the token is active" },
    { name: "item.createdAt", type: "String", description: "Created date time" },
    { name: "item.updatedAt", type: "String", description: "Last updated date time" },
    { name: "item.clientKey", type: "String", description: "Internal usage only" },
    { name: "item.redirectUrl", type: "String", description: "Redirect URL" },
    { name: "item.notifyUrl", type: "String", description: "Notify URL" },
    { name: "item.paymentUrl", type: "String", description: "Card binding URL" },
    { name: "item.recurringPayment.amount", type: "Uint64", description: "Recurring payment amount" },
    { name: "item.recurringPayment.currency", type: "String", description: "Recurring payment currency" },
    { name: "item.recurringPayment.recurringInterval", type: "String", description: "Recurring interval" },
    { name: "item.recurringPayment.recurringTarget", type: "String", description: "Recurring target rules" },
    { name: "item.recurringPayment.recurringRepetition", type: "Uint64", description: "Number of repetitions" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the request succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

### Create Customer Order (Payment)

:::caution
This API uses the customer's bound card to make a payment — it is not a manual order creation. The charge is applied to the stored token.
:::

**Request Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "customer_id", type: "Param", required: true, description: "Customer ID returned from Create Recurring Customer or Create Tokenized Customer" },
    { name: "currency", type: "String", required: true, description: "Payment currency" },
    { name: "amount", type: "Uint64", required: true, description: "Payment amount in smallest currency unit" },
    { name: "title", type: "String", description: "Payment information title" },
    { name: "description", type: "String", description: "Payment information description" }
  ]}
/>

<CodeBlock language="json" filename="Example Request">
{`{
  "currency": "MYR",
  "amount": 100,
  "title": "Some order title",
  "description": "Some order description"
}`}
</CodeBlock>

**Response Parameters**

<ParamTable
  title="Details"
  rows={[
    { name: "item", type: "Object", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the payment succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." }
  ]}
/>

<!-- SPDX-License-Identifier: Apache-2.0 -->
