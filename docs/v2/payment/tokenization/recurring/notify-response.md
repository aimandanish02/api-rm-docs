---
title: "Recurring — Notify Response"
sidebar_label: "Notify Response"
---

Your `notifyUrl` receives this callback each time a recurring payment is successfully charged.

:::info
Notify is only called on success — failed payments do not trigger a notify. Use [Query By Transaction ID](../../query/by-transaction-id.md) for full transaction details.
:::

**Method:** <HttpMethodBadge method="GET" />

<ParamTable
  title="Details"
  rows={[
    { name: "eventType", type: "String", required: true, description: "Notify event type" },
    { name: "data.amount", type: "Integer", required: true, description: "Recurring payment amount" },
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
