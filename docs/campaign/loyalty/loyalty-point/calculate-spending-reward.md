---
id: calculate-spending-reward
title: Calculate Spending Reward
sidebar_label: Calculate Spending Reward
api:
  method: POST
  url:
    sandbox: https://sb-open.revenuemonster.my/v3/loyalty/spending-reward/calculate
    prod: https://open.revenuemonster.my/v3/loyalty/spending-reward/calculate
  headers:
    Content-Type: application/json
    Authorization: Bearer {{access_token}}
    X-Signature: sha256 {{signature}}
    X-Nonce-Str: {{nonce}}
    X-Timestamp: {{timestamp}}
  body: |
    {
      "currencyType": "MYR",
      "amount": 300
    }

examples:
  request: |
    curl --location --request GET "{{open_base_path}}/v3/loyalty/spending-reward/calculate" \
      --header "Content-Type: application/json" \
      --header "Authorization: Bearer {{clientToken}}" \
      --header "X-Signature: sha256 Sty3LNcKA8+WlMHtAgIY+y1xbwnzKsN0UdyKaW+yYIgcTkBAtF7G5Lx251qQITURJ4wiXPDODxhs1nFVmBBing==" \
      --header "X-Nonce-Str: VYNknZohxwicZMaWbNdBKUrnrxDtaRhN" \
      --header "X-Timestamp: 1528450585" \
      --data "{
        \"currencyType\": \"MYR\",
        \"amount\": 300
    
    }"
  body: |
    There is no example body request.
  response: |
    {
      "item": {
        "point": 3
      },
      "code": "SUCCESS"
    }
---

import ApiEndpoint from "@site/src/components/api/ApiEndpoint";

<ApiEndpoint
  method="POST"
  sandbox="https://sb-open.revenuemonster.my/v3/loyalty/spending-reward/calculate"
  prod="https://open.revenuemonster.my/v3/loyalty/spending-reward/calculate"
/>



import { Box, Heading, Text, Card, Image, Button, Flex } from "rebass";


:::note
Use amount sales to Calculate Spending Reward points
:::

### Request Parameters

| Parameter      | Type   | Description          | Example |
| -------------- | ------ | -------------------- | ------- |
| `currencyType` | String | Currently `MYR` only | MYR     |
| `amount`       | int    | Amount Sales         | 300     |

### Response Parameters

| Parameter | Type   | Description                                                                                                                                                      | Example                      |
| --------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `item`    | Object | Point object                                                                                                                                                     | (Refer to explanation below) |
| `code`    | String | Successfully call this endpoint. If fail, will return error code object (Refer [Appendix 1: Error Codes](https://doc.revenuemonster.my/#appendix-1-error-codes)) | "SUCCESS"                    |

<br/>

<strong>Point Object (item)</strong> <br/>

| Parameter     | Type | Description                       | Example |
| ------------- | ---- | --------------------------------- | ------- |
| `point`       | Int  | Loyalty point given to customers. | 3       |

Currency notation (currently only support MYR)
