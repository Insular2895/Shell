# CRM Delivery (HubSpot / Salesforce / Pipedrive)

## Pattern

```
Buyer subscribes to API access plan
  → Generates buyer API token (cf api-keys module)
  → Configures CRM integration in our cockpit
  → On lead match : auto-push to buyer's CRM
  → INSERT lead_delivery_log
  → Webhook receipt confirmation from buyer (or retry)
```

## HubSpot

```typescript
await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
  method: 'POST',
  headers: { Authorization: `Bearer ${buyer.hubspot_token}` },
  body: JSON.stringify({ properties: deliveryPayload })
});
```

## Salesforce

OAuth2 flow nécessaire. Stockage refresh token chiffré.

## Pipedrive

API token simple, similaire HubSpot.

## Erreurs

Si push CRM échoue : retry exponential backoff. Après 5 retries : marqué `delivery_failed` dans lead_delivery_log + ticket dans decision_queue.
