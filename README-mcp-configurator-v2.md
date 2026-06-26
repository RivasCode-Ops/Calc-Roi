# cursor-mcp-configurator v2

CLI para configurar servidores MCP no Cursor com merge seguro, backup e checklist pós-configuração.

## Arquivos

| Arquivo | Função |
|---------|--------|
| `cursor-mcp-configurator-v2.js` | CLI v2 (recomendado) |
| `cursor-mcp-configurator.js` | CLI v1 |
| `cursor-mcp-custom.example.json` | Exemplo de servidores custom |
| `.cursor/mcp.example.json` | Template para git (sem secrets) |
| `docs/MCP-SETUP.md` | Guia completo |

## Fluxo (Calc-Roi)

### 1. Dry-run + checklist

```powershell
cd C:\Users\Nitro\Projects\Calc-Roi
node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --dry-run --print-checklist
```

### 2. Gravar + abrir Cursor

```powershell
node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --open-cursor --print-checklist
```

### 3. No Cursor

1. `Ctrl+Shift+P` → **Developer: Reload Window**
2. **Settings → Tools & MCP Servers** — confirmar *Connected*

## Flags v2

| Flag | Descrição |
|------|-----------|
| `--servers` | Presets: filesystem, github, postgres, fetch, memory |
| `--project` | Grava em `./.cursor/mcp.json` |
| `--dry-run` | Preview sem gravar |
| `--open-cursor` | Abre Cursor na pasta atual após salvar |
| `--print-checklist` | Checklist de validação no terminal |
| `--custom <file>` | Merge com JSON customizado |

## Variáveis de ambiente

```powershell
$env:GITHUB_PERSONAL_ACCESS_TOKEN = "ghp_..."
$env:POSTGRES_URL = "postgresql://user:pass@localhost:5432/sige_dev"
$env:MCP_ROOT = "C:/dev/mcp"
```

## Erros comuns

| Erro | Solução |
|------|---------|
| `node não é reconhecido` | Instale Node.js LTS e reinicie o terminal |
| `arquivo não encontrado` | Confirme que está em `C:\Users\Nitro\Projects\Calc-Roi` |
| MCP não conecta | Reload Window + revise token/senha postgres |
