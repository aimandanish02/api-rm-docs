---
title: "Recurring — Redirect Response"
sidebar_label: "Redirect Response"
---

After the customer completes card binding on the RM-hosted page, they are redirected back to your `redirectUrl` with the following parameters.

:::info
The redirect URL can be any URL type — deep link, browser URL, or server URL.
:::

**Method:** <HttpMethodBadge method="GET" />

<ParamTable
  title="Details"
  rows={[
    { name: "status", type: "String", required: true, description: "Card bind status" },
    { name: "customerId", type: "String", required: true, description: "Card bind customer ID. Use this for subsequent API calls." },
    { name: "reason", type: "String", description: "Card bind failure reason" }
  ]}
/>
