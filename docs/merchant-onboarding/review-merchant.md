---
id: submit-merchant-for-review
title: Submit Merchant for Review
sidebar_label: Submit Merchant for Review
api:
  method: POST
  url:
    sandbox: https://sb-open.revenuemonster.my/v3/partner/merchant/{merchantID}
    prod: https://open.revenuemonster.my/v3/partner/merchant/{merchantID}
  headers:
    Content-Type: application/json
    Authorization: Bearer {{access_token}}
    X-Signature: sha256 {{signature}}
    X-Nonce-Str: {{nonce}}
    X-Timestamp: {{timestamp}}

examples:
  request: |
    curl --location --request POST "https://sb-open.revenuemonster.my/v3/partner/merchant/1629292083526787883" \
    --header "Content-Type: application/json" \
    --header "Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IjIwMTgtMy0xOCIsInR5cCI6IkpXVCJ9.eyJhdWQiOlsiYXBpX2NsaWVudEBFaGNLQzA5QmRYUm9RMnhwWlc1MEVQZUEyYXJ4dk1PSUZnIl0sImV4cCI6MTU5MzU4MDY0NSwiaWF0IjoxNTkwOTg4NjQ1LCJpc3MiOiJodHRwczovL29hdXRoLnJldmVudWVtb25zdGVyLm15IiwianRpIjoiRWh3S0VFOUJkWFJvUVdOalpYTnpWRzlyWlc0UXMtNnI5LVgzbElvVyIsIm5iZiI6MTU5MDk4ODY0NSwic3ViIjoiRWhRS0NFMWxjbU5vWVc1MEVMUF9wNlNKNnFQN0ZSSVFDZ1JWYzJWeUVPaXZfb1dKNnFQN0ZRIn0.RKtXykw3y0ov3mKKa_K2h5FZB2jXtqf3gNRwwnzzA4xTMdY09mEHlFupMeUmchFW2XHYK254LdMYbF4ZhjxK9K51UUdQBYH-zZpo0WWtPSZqrPGtT-c4z_sEO73EDVcek3rDwyWiXvjSKDpsZM7NOdKRm5tvT3qNK-7C7WMUjSXDcBzbTFhwfOAOO1n-wMR9H_w0DuIE-yMjEZkOdt7GUIBC8F5izATlZH0FRTx4VAwQWY4gjjQ9-3PbUbHx-NKiFXwCOAsxu-79PiF0HDEHb6ZOCGywNmKuanEXqLonli0caZiUZfrdT53y3Xnd3W2SEr6s7ZQxWnQO5PeOU7BQYA" \
    --header "X-Signature: sha256 bFGc2JOEFqdI91DE5VXYBUllr+9DHcrrylRFU3i1r72aPmJreljn0dU+nwPSwTH/dTQUiZ9C2aQSF8AuT959EW4WEyEZ6VWgt9gCyZaU/bcOQ/ZIhKc06+uwzivVhAzpbUtG5tm5/sBp4ig6Sk7L6SE0Ecu6Tm0FhYl0qdgZvrTh4EEpLs3kHIuYL9QXKJILfKlu4gTX1Exrt7nNyEr8ndeUMaKYrj3FckMbRtmCwc829SsVp6FAgvoDPnguUJ+VjLF1e9NXhar2JwYjuqMkwsmUWRDbittqCgCCfaPF8anarlLsoXbdYEa7bp9BYp2U/Dw3Xd2MlamEZSR8H+Dosw==" \
    --header "X-Nonce-Str: VYNknZohxwicZMaWbNdBKUrnrxDtaRhN" \
    --header "X-Timestamp: 1528450585"
  body: |
    There is no example body request.
  response: |
    {
      "item": {
        "id": "1629297229825579798",
        "merchantId": "1629292083526787883",
        "isDefault": true,
        "companyName": "",
        "companyType": "",
        "registrationNumber": "",
        "businessCategory": "",
        "businessScope": "",
        "sourceOfFunds": "",
        "customerOrigin": "",
        "establishedAt": "0001-01-01T00:00:00Z",
        "countryCode": "",
        "phoneNumber": "",
        "addressLine1": "",
        "addressLine2": "",
        "postcode": "",
        "city": "",
        "state": "",
        "country": "",
        "isSameBusinessAddress": false,
        "invoiceAddress": null,
        "inspectList": null,
        "status": "REVIEWING",
        "document": {
          "ctosFileUrl": "",
          "ownerICFileUrl": "",
          "directorICFileUrl": "",
          "shareHolderICFileUrl": "",
          "businessRegistrationFileUrl": "",
          "bankStatementFileUrl": "",
          "moaFileUrl": "",
          "form24FileUrl": "",
          "form49FileUrl": "",
          "section14FileUrl": "",
          "form44FileUrl": "",
          "businessSitePhotoFileUrl": "",
          "essmDocumentFileUrl": "",
          "letterOfConsentFileUrl": ""
        },
        "documentFile": {
          "CTOSFileURL": null,
          "OwnerICFileURL": null,
          "DirectorICFileURL": null,
          "ShareHolderICFileURL": null,
          "BusinessRegistrationFileURL": null,
          "BankStatementFileURL": null,
          "MOAFileURL": null,
          "Form24FileURL": null,
          "Form49FileURL": null,
          "Section14FileURL": null,
          "Form44FileURL": null,
          "BusinessSitePhotoFileURL": null
        },
        "bankAccountNo": "",
        "bankAccountType": "",
        "bankAccountHolderName": "",
        "bankName": "",
        "bankCode": "",
        "averageTicketSize": 0,
        "averageTurnoverPerMonth": 0,
        "paymentSubscription": "",
        "createdAt": "2021-08-18T14:33:49Z",
        "updatedAt": "2021-08-18T14:33:49Z"
      },
      "code": "SUCCESS"
    }
---

import ApiEndpoint from "@site/src/components/api/ApiEndpoint";

<ApiEndpoint
  method="POST"
  sandbox="/v3/partner/merchant/{merchantID}"
  prod="/v3/partner/merchant/{merchantID}"
/>



import { Box, Heading, Text, Card, Image, Button, Flex } from "rebass";


:::note

Submit Merchant for Revenue Monster to Review


### Response Parameters

<ParamTable
  rows={[
    { name: "item", type: "Object", example: "(Refer to explanation below)" },
    { name: "code", type: "String", description: "Successfully call this endpoint. If fail, will return error code object (Refer Appendix 1: Error Codes)", example: "\"SUCCESS\"" }
  ]}
/>
<br/>

<strong>Item Object :</strong>

<ParamTable
  rows={[
    { name: "id", type: "String", description: "Store ID", example: "\"1629258558902992793\"" },
    { name: "MerchantId", type: "String", description: "Merchant ID", example: "\"1629258448138509563\"" },
    { name: "isDefault", type: "bool", description: "Default Settlement", example: "true" },
    { name: "companyName", type: "String", description: "Company name of merchant", example: "\"REVENUE MONSTER\"" },
    { name: "companyType", type: "String", description: "Type of company incorporation", example: "\"SOLE PROPRIETOR\"" },
    { name: "registrationNumber", type: "String", description: "Registration number of merchant", example: "“12344”" },
    { name: "businessCategory", type: "String", description: "Business category of merchant", example: "\"SOFTWARE AND IT\"" },
    { name: "businessScope", type: "String", description: "Business category of merchant", example: "\"SOFTWARE AND IT\"" },
    { name: "sourceOfFunds", type: "String", description: "Business category of merchant", example: "\"SOFTWARE AND IT\"" },
    { name: "customerOrigin", type: "String", description: "Business category of merchant", example: "\"SOFTWARE AND IT\"" },
    { name: "establishedAt", type: "DateTime", description: "Established date time of merchant", example: "\"2018-03-26T04:50:57Z\"" },
    { name: "countryCode", type: "String", description: "Country code of merchant contact number", example: "\"60\"" },
    { name: "phoneNumber", type: "String", description: "Phone number of merchant", example: "\"377334080\"" },
    { name: "addressLine1", type: "String", description: "Address 1 of merchant", example: "\"20, JALAN JASA 38, TAMAN MUTIARA RINI\"" },
    { name: "addressLine2", type: "String", description: "Address 2 of merchant", example: "\"\"" },
    { name: "postcode", type: "String", description: "Postcode of merchant", example: "“81300”" },
    { name: "city", type: "String", description: "City of merchant", example: "\"Selangor\"" },
    { name: "state", type: "String", description: "State of merchant", example: "\"Selangor\"" },
    { name: "country", type: "String", description: "Country of merchant", example: "\"Malaysia\"" },
    { name: "isSameBusinessAddress", type: "Boolean", example: "false" },
    { name: "invoiceAddress", type: "String (nullable)", example: "null" },
    { name: "inspectList", type: "String (nullable)", example: "null" },
    { name: "status", type: "String", description: "Current status of merchant", example: "“REVIEWING”" },
    { name: "document", type: "Object", example: "Refer Below" },
    { name: "documentFile", type: "Object", example: "Refer Below" },
    { name: "bankAccountNo", type: "String", example: "\"\"" },
    { name: "bankAccountType", type: "String", example: "\"\"" },
    { name: "bankAccountHolderName", type: "String", example: "\"\"" },
    { name: "bankName", type: "String", example: "\"\"" },
    { name: "bankCode", type: "String", example: "\"\"" },
    { name: "averageTicketSize", type: "Uint", example: "0" },
    { name: "averageTurnoverPerMonth", type: "Uint", example: "0" },
    { name: "paymentSubscription", type: "String", example: "\"\"" },
    { name: "createdAt", type: "DateTime", description: "Creation date time of merchant", example: "\"2021-02-12T08:53:13Z\"" },
    { name: "updatedAt", type: "DateTime", description: "Last update date time of merchant", example: "\"2021-02-12T08:53:13Z\"" }
  ]}
/>
<br/>
