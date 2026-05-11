# document-extraction — Security rules

- Fichiers stockés en signed URLs, jamais en blob serveur
- Engine container --read-only --user 1000
- Pydantic strict sur input
- Pas de traceback dans output (cf v2 _write_error)
- LLM via ai-privacy-gateway si extraction utilise Claude/OpenAI

