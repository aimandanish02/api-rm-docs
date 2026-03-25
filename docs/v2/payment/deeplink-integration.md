---
id: deeplink-integration
title: "DeepLink Integration"
sidebar_label: "DeepLink Integration"
---

import { Box, Heading, Text, Card, Image, Button, Flex } from "rebass";

# Deeplink Integration

Deeplink Integration enables businesses to manage their orders through a single mobile application and process transactions using various payment methods, thereby enhancing the customer experience.

:::note
This integration is compatible with any mobile device or terminal, as long as you are using our application.
:::

# Deeplink

:::caution
This is applicable to the Merchant App on terminals with versions greater than 2.10.0.

Demo: [applink-demo](https://github.com/RevenueMonster/applink-demo)
:::

## Application Receiver

### Setup 1: AndroidManifest

```xml
<activity android:name=".ReceiverActivity" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.SEND" />
        <category android:name="android.intent.category.DEFAULT" />
        <data android:mimeType="text/plain" />
    </intent-filter>
</activity>
```

### Setup 2: ReceiverActivity

```kotlin
class ReceiverActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        //....

        try {
            val keySet: Set<String> = intent?.extras!!.keySet()
            keySet.forEach {
                Log.v("Receiver", "key = $it || value = ${intent.extras!![it]}")
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        val result = intent?.getStringExtra("result")
        val transactionType = intent?.getIntExtra("transactionType")
        //Do your code here

    }
}
```


## Deeplink: Quick Pay

```kotlin
val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 1)
    putExtra("orderId", System.currentTimeMillis().toString())
    putExtra("orderTitle", "Intent Demo")
    putExtra("amount", 10)
    putExtra("printReceipt", false)
}
startActivity(i)
```

**Response Parameters**

```kotlin
val jsonString = intent?.getStringExtra("result")
```

<ParamTable
  rows={[
    { name: "item", type: "JSON", description: "Transaction response" },
    { name: "code", type: "String", description: "Determine request have success" },
    { name: "error.code", type: "String", description: "Error code" },
    { name: "error.message", type: "String", description: "Error message" }
  ]}
/>
## Deeplink: Card Payment

```kotlin
val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 2)
    putExtra("orderId", System.currentTimeMillis().toString())
    putExtra("orderTitle", "Intent Demo")
    putExtra("amount", 100)
    putExtra("printReceipt", false)
}
startActivity(i)
```

Note: For terminal MF919 we had no control for the receipt printing.

**Response Parameters**

```kotlin
val jsonString = intent?.getStringExtra("result")
```

<ParamTable
  rows={[
    { name: "item", type: "JSON", description: "Transaction response" },
    { name: "code", type: "String", description: "Determine request have success" },
    { name: "error.code", type: "String", description: "Error code" },
    { name: "error.message", type: "String", description: "Error message" }
  ]}
/>
## Deeplink: Void Transaction

```kotlin
val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 3)
    putExtra("transactionId", "240620034957010325054813")
    putExtra("reason", "Wrong Order")
    putExtra("email", "test@abc.my")
    putExtra("pin", "456789")
    putExtra("printReceipt", false)
}
startActivity(i)
```

**Response Parameters**

```kotlin
val jsonString = intent?.getStringExtra("result")
```

<ParamTable
  rows={[
    { name: "item", type: "JSON", description: "Transaction response" },
    { name: "code", type: "String", description: "Determine request have success" },
    { name: "error.code", type: "String", description: "Error code" },
    { name: "error.message", type: "String", description: "Error message" }
  ]}
/>
## Deeplink: Wallet Settlement

```kotlin
val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 4)
    putExtra("print", false)
}
startActivity(i)
```

**Response Parameters**

```kotlin
val jsonString = intent?.getStringExtra("result")
```

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
## Deeplink: Card Settlement

```kotlin
val i = Intent("REVENUE_MONSTER_PAYMENT").apply {
    putExtra("packageName", packageName)
    putExtra("receiverName", <<YOUR_ACTIVITY>>::class.java.name)
    putExtra("transactionType", 5)
}
startActivity(i)
```

**Response Parameters**

```kotlin
val jsonString = intent?.getStringExtra("result")
```

<ParamTable
  rows={[
    { name: "code", type: "String", description: "Determine request have success" },
    { name: "error.code", type: "String", description: "Error code" },
    { name: "error.message", type: "String", description: "Error message" },
    { name: "error.debug", type: "String", description: "Debug message ( sandbox only )" },
    { name: "summary.batchNo", type: "String", description: "Sequence no. of the terminal settlement" },
    { name: "summary.currencyType", type: "String", description: "Settlement Currency Type ( currently supported MYR only)" },
    { name: "summary.noOfTransactions", type: "Uint64", description: "Count of settled transactions" },
    { name: "summary.settlementAt", type: "String", description: "Date and time of the settlement" },
    { name: "summary.totalSalesAmount", type: "Uint64", description: "Total sales amount in cents" },
    { name: "transactions[*].amount", type: "Uint64", description: "Transactions amount in cents" },
    { name: "transactions[*].currencyType", type: "Uint64", description: "Transaction Currency Type ( currently supported MYR only)" },
    { name: "transactions[*].transactionAt", type: "String", description: "Date and time of the transaction" },
    { name: "transactions[*].transactionId", type: "String", description: "Transaction ID" },
    { name: "transactions[*].type", type: "String", description: "Transaction type" }
  ]}
/>

