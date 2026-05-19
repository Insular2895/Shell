# Build graph

```bash
factory repo:audit .
```

Sortie : `context-engine/repo-graph/graph.json`.

Format :
```json
{
  "generated_at": "2026-05-09T18:00:00Z",
  "files": [
    {
      "path": "lib/runner.ts",
      "imports": ["@/lib/circuitBreaker", "..."],
      "exports": ["runEngine"],
      "lines": 145
    }
  ],
  "modules": [...],
  "routes": [...]
}
```
