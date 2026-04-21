---
id: deeplink-integration
title: "DeepLink Integration"
sidebar_label: "DeepLink Integration"
---

## What is this?

DeepLink Integration lets businesses manage orders through a single mobile application and process transactions using various payment methods via the Revenue Monster Merchant App on Android terminals.

:::note
This integration is compatible with any mobile device or terminal running the RM Merchant App.
:::

---

## How to Use

### Step 1: Set Up the Android Receiver

Configure your Android app to receive the DeepLink intent from the RM Merchant App.

### Step 2: Choose the Transaction Type

Select the appropriate `transactionType` number:
- `1` — Quick Pay
- `2` — Card Payment
- `3` — Void Transaction
- `4` — Wallet Settlement
- `5` — Card Settlement

### Step 3: Launch the Intent

Use the `REVENUE_MONSTER_PAYMENT` intent with the required extras.

### Step 4: Handle the Response

The result is returned as a JSON string in the `result` extra of the intent.

---

## Application Receiver

### Setup 1: AndroidManifest.xml

<CodeBlock language="xml" filename="AndroidManifest.xml">
{`<activity android:name=".ReceiverActivity" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
</activity>`}
</CodeBlock>

### Setup 2: ReceiverActivity.kt

```kotlin title="ReceiverActivity.kt"
class ReceiverActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        try {
            val keySet: Set<String> = intent?.extras!!.keySet()
            keySet.forEach { key ->
                val value = intent.extras!![key]
                Log.v("Receiver", "key = $key || value = $value")
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val result = intent?.getStringExtra("result")
        val transactionType = intent?.getIntExtra("transactionType")
        // Process result and transactionType here
    }
}
```

---

## Deeplink: Quick Pay

<CodeBlock language="kotlin" filename="QuickPay.kt">
{`val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 1)
    putExtra("orderId", System.currentTimeMillis().toString())
    putExtra("orderTitle", "Intent Demo")
    putExtra("amount", 10)
    putExtra("printReceipt", false)
}
startActivity(i)`}
</CodeBlock>

**Response Parameters**

<CodeBlock language="kotlin" filename="Response.kt" hideLineNumbers>
{`val jsonString = intent?.getStringExtra("result")`}
</CodeBlock>

<ParamTable
  rows={[
    { name: "item", type: "JSON", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the payment succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." }
  ]}
/>

---

## Deeplink: Card Payment

<CodeBlock language="kotlin" filename="CardPayment.kt">
{`val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 2)
    putExtra("orderId", System.currentTimeMillis().toString())
    putExtra("orderTitle", "Intent Demo")
    putExtra("amount", 100)
    putExtra("printReceipt", false)
}
startActivity(i)`}
</CodeBlock>

:::note
For terminal MF919, receipt printing cannot be controlled programmatically.
:::

**Response Parameters**

<CodeBlock language="kotlin" filename="Response.kt" hideLineNumbers>
{`val jsonString = intent?.getStringExtra("result")`}
</CodeBlock>

<ParamTable
  rows={[
    { name: "item", type: "JSON", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the payment succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." }
  ]}
/>

---

## Deeplink: Void Transaction

<CodeBlock language="kotlin" filename="VoidTransaction.kt">
{`val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 3)
    putExtra("transactionId", "240620034957010325054813")
    putExtra("reason", "Wrong Order")
    putExtra("email", "test@abc.my")
    putExtra("pin", "456789")
    putExtra("printReceipt", false)
}
startActivity(i)`}
</CodeBlock>

**Response Parameters**

<CodeBlock language="kotlin" filename="Response.kt" hideLineNumbers>
{`val jsonString = intent?.getStringExtra("result")`}
</CodeBlock>

<ParamTable
  rows={[
    { name: "item", type: "JSON", description: "Transaction response object" },
    { name: "code", type: "String", description: "\"SUCCESS\" if the void succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." }
  ]}
/>

---

## Deeplink: Wallet Settlement

<CodeBlock language="kotlin" filename="WalletSettlement.kt">
{`val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 4)
    putExtra("print", false)
}
startActivity(i)`}
</CodeBlock>

**Response Parameters**

<CodeBlock language="kotlin" filename="Response.kt" hideLineNumbers>
{`val jsonString = intent?.getStringExtra("result")`}
</CodeBlock>

<ParamTable
  rows={[
    { name: "totalSalesAmount", type: "Uint64", description: "Total sales amount" },
    { name: "totalSalesCount", type: "Uint64", description: "Total sales count" },
    { name: "totalRefundedAmount", type: "Uint64", description: "Total refunded amount" },
    { name: "totalRefundedCount", type: "Uint64", description: "Total refunded count" },
    { name: "wallet[*].name", type: "String", description: "Wallet name" },
    { name: "wallet[*].method", type: "String", description: "Wallet method" },
    { name: "wallet[*].region", type: "String", description: "Wallet region" },
    { name: "wallet[*].sales.count", type: "Uint64", description: "Wallet sales count" },
    { name: "wallet[*].sales.amount", type: "Uint64", description: "Wallet sales amount" },
    { name: "wallet[*].refunded.count", type: "Uint64", description: "Wallet refunded count" },
    { name: "wallet[*].refunded.amount", type: "Uint64", description: "Wallet refunded amount" },
    { name: "range[*]", type: "String", description: "Range of settlement dates" }
  ]}
/>

---

## Deeplink: Card Settlement

<CodeBlock language="kotlin" filename="CardSettlement.kt">
{`val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 5)
}
startActivity(i)`}
</CodeBlock>

**Response Parameters**

<CodeBlock language="kotlin" filename="Response.kt" hideLineNumbers>
{`val jsonString = intent?.getStringExtra("result")`}
</CodeBlock>

<ParamTable
  rows={[
    { name: "code", type: "String", description: "\"SUCCESS\" if the settlement succeeded, otherwise an error code." },
    { name: "error.code", type: "String", description: "Error code if the request failed." },
    { name: "error.message", type: "String", description: "Error message if the request failed." },
    { name: "error.debug", type: "String", description: "Debug message (sandbox only)." },
    { name: "summary.batchNo", type: "String", description: "Terminal settlement sequence number" },
    { name: "summary.currencyType", type: "String", description: "Settlement currency type (currently supported MYR only)" },
    { name: "summary.noOfTransactions", type: "Uint64", description: "Count of settled transactions" },
    { name: "summary.settlementAt", type: "String", description: "Date and time of settlement" },
    { name: "summary.totalSalesAmount", type: "Uint64", description: "Total sales amount in cents" },
    { name: "transactions[*].amount", type: "Uint64", description: "Transaction amount in cents" },
    { name: "transactions[*].currencyType", type: "Uint64", description: "Transaction currency type" },
    { name: "transactions[*].transactionAt", type: "String", description: "Transaction date and time" },
    { name: "transactions[*].transactionId", type: "String", description: "Transaction ID" },
    { name: "transactions[*].type", type: "String", description: "Transaction type" }
  ]}
/>

<!-- SPDX-License-Identifier: Apache-2.0 -->
