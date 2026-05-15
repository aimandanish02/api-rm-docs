---
title: "Individual Payment Checkout"
sidebar_label: "Individual Payment Checkout"
---

After creating a hosted checkout session, use the `checkoutId` to build a custom payment experience.

<CodeBlock language="plaintext" filename="Checkout URL" hideLineNumbers>
{`https://sb-pg.revenuemonster.my/v4/checkout?checkoutId=1548316308361173347`}
</CodeBlock>

---

## Redirect Response

:::info
The redirect URL brings the customer back to your page after payment. It can be any URL type (deep link, browser URL, server URL).
:::

**Method:** <HttpMethodBadge method="GET" />

| Parameter | Type | Required | Description |
|---|---|---|---|
| `status` | String | Yes | Payment status |
| `orderId` | String | Yes | Payment order ID |
| `reason` | String | No | Payment failure reason |

---

## Notify Response

:::info
The notify URL informs your server of the transaction status after a successful payment. Notify is only called on success — failure or refund does not trigger a notify. Query the transaction using [Query By Transaction ID](../query/by-transaction-id.md) for full details.
:::

**Method:** <HttpMethodBadge method="POST" />

<ParamTable
  title="Details"
  rows={[
    { name: "eventType", type: "String", required: true, description: "Notify event type. Always \"PAYMENT_WEB_ONLINE\"." },
    { name: "data.store", type: "JSON", description: "Store details." },
    { name: "data.referenceId", type: "String", description: "Reference ID." },
    { name: "data.transactionId", type: "String", required: true, description: "Transaction ID." },
    { name: "data.terminalId", type: "String", description: "Terminal ID." },
    { name: "data.currencyType", type: "String", required: true, description: "Currency type (currently supported MYR only)." },
    { name: "data.balanceAmount", type: "Integer", required: true, description: "Remaining balance for initiating refund." },
    { name: "data.finalAmount", type: "Integer", required: true, description: "Amount after deductions (voucher, membership)." },
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
    { name: "data.order.amount", type: "Integer", required: true, description: "Order amount." },
    { name: "data.order.detail", type: "String", description: "Order detail." },
    { name: "data.order.additionalData", type: "String", description: "Order additional data." }
  ]}
/>
