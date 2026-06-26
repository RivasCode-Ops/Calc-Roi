# MCP no Calc-Roi

Configuração de servidores MCP com merge seguro via `cursor-mcp-configurator.js`.

## Fluxo recomendado

1. **Dry-run** — preview sem gravar
2. Revise tokens, connection strings e paths
3. Rode sem `--dry-run`
4. **Ctrl+Shift+P** → `Developer: Reload Window`

## Comandos (v2 — recomendado)

```powershell
# 1. Preview + checklist
node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --dry-run --print-checklist

# 2. Gravar, abrir Cursor e checklist
node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --open-cursor --print-checklist
```

## Comandos (v1)

```powershell
# Preview
node cursor-mcp-configurator.js --servers filesystem,github,postgres --project --dry-run

# Gravar
node cursor-mcp-configurator.js --servers filesystem,github,postgres --project
```

### Presets disponíveis

| Preset | Descrição |
|--------|-----------|
| `filesystem` | Arquivos do projeto (node em `C:/dev/mcp/filesystem`) |
| `github` | API GitHub (`GITHUB_PERSONAL_ACCESS_TOKEN`) |
| `postgres` | Postgres read-only (`POSTGRES_URL` ou placeholder) |
| `fetch` | Fetch web → markdown (npx) |
| `memory` | Memória persistente em `.cursor/memory.jsonl` |

### Servidores customizados

```powershell
node cursor-mcp-configurator.js --custom cursor-mcp-custom.example.json --project --dry-run
```

### Variáveis de ambiente úteis

```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..."
$env:POSTGRES_URL = "postgresql://user:pass@localhost:5432/sige_dev"
$env:MCP_ROOT = "C:/dev/mcp"
```

## Linux / macOS

```bash
node cursor-mcp-configurator.js --servers filesystem,github,fetch,memory --project --dry-run
node cursor-mcp-configurator.js --servers filesystem,github,fetch,memory --project
```

## O que a ferramenta faz

- Merge com servidores existentes (não apaga os outros)
- Valida JSON antes de alterar
- Normaliza `command`, `args`, `env`
- Backup com timestamp antes de salvar
- Ordena chaves alfabeticamente
