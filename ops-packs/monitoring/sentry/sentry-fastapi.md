# Sentry pour un worker FastAPI (engine)

## Install

```bash
pip install sentry-sdk[fastapi]
```

```python
import sentry_sdk
sentry_sdk.init(
    dsn=os.environ["SENTRY_DSN"],
    traces_sample_rate=0.05,
    send_default_pii=False,  # CRITICAL
    before_send=lambda event, hint: redact_pii(event),
)
```

## Anti-leak

- `send_default_pii=False` obligatoire
- `before_send` : passe le payload via ai-privacy-gateway/redact
- Pas de capture de l'input user en clair (Pydantic erreurs OK, valeurs NON)
