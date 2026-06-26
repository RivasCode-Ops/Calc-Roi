#!/usr/bin/env node
/**
 * cursor-mcp-configurator-v2.js
 * Merge seguro de servidores MCP + checklist pós-config + abrir Cursor.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn, execFileSync } = require("child_process");

const PRESETS = {
  filesystem: (ctx) => ({
    command: "node",
    args: [
      path.posix.join(ctx.mcpRoot, "filesystem/dist/index.js"),
      ctx.projectRootPosix,
    ],
  }),
  github: (ctx) => ({
    command: "node",
    args: [path.posix.join(ctx.mcpRoot, "github/dist/index.js")],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN:
        process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "seu_token_aqui",
    },
  }),
  postgres: (ctx) => ({
    command: "node",
    args: [
      path.posix.join(ctx.mcpRoot, "postgres/dist/index.js"),
      process.env.POSTGRES_URL ||
        "postgresql://postgres:senha@localhost:5432/sige_dev",
    ],
  }),
  fetch: () => ({
    command: process.platform === "win32" ? "cmd" : "npx",
    args:
      process.platform === "win32"
        ? ["/c", "npx", "-y", "@modelcontextprotocol/server-fetch"]
        : ["-y", "@modelcontextprotocol/server-fetch"],
  }),
  memory: (ctx) => ({
    command: process.platform === "win32" ? "cmd" : "npx",
    args:
      process.platform === "win32"
        ? ["/c", "npx", "-y", "@modelcontextprotocol/server-memory"]
        : ["-y", "@modelcontextprotocol/server-memory"],
    env: {
      MEMORY_FILE_PATH: path.join(ctx.projectRoot, ".cursor", "memory.jsonl"),
    },
  }),
};

function printHelp() {
  console.log(`
cursor-mcp-configurator v2 — merge seguro + checklist + abrir Cursor

Uso:
  node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres [opções]

Opções:
  --servers <lista>      Presets: ${Object.keys(PRESETS).join(", ")}
  --custom <arquivo>     JSON com { "mcpServers": { ... } }
  --project              Grava em ./.cursor/mcp.json (senão: global)
  --dry-run              Preview sem gravar
  --open-cursor          Tenta abrir o Cursor na pasta atual após salvar
  --print-checklist      Imprime checklist de validação no terminal
  --mcp-root <path>      Raiz dos servidores locais (padrão: MCP_ROOT ou C:/dev/mcp)
  -h, --help             Ajuda

Exemplos:
  node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres --project --dry-run --print-checklist
  node cursor-mcp-configurator-v2.js --servers filesystem,github,postgres,fetch,memory --project --open-cursor --print-checklist
`);
}

function parseArgs(argv) {
  const opts = {
    servers: [],
    custom: null,
    project: false,
    dryRun: false,
    openCursor: false,
    printChecklist: false,
    mcpRoot: process.env.MCP_ROOT || "C:/dev/mcp",
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") opts.help = true;
    else if (arg === "--project") opts.project = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--open-cursor") opts.openCursor = true;
    else if (arg === "--print-checklist") opts.printChecklist = true;
    else if (arg === "--servers")
      opts.servers = (argv[++i] || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    else if (arg === "--custom") opts.custom = argv[++i];
    else if (arg === "--mcp-root") opts.mcpRoot = argv[++i];
    else throw new Error(`Argumento desconhecido: ${arg}`);
  }

  return opts;
}

function toPosix(p) {
  return p.replace(/\\/g, "/");
}

function readJson(filePath) {
  if (!fs.existsSync(filePath)) return { mcpServers: {} };
  const raw = fs.readFileSync(filePath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON inválido em ${filePath}: ${err.message}`);
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`JSON inválido em ${filePath}: raiz deve ser um objeto`);
  }
  if (parsed.mcpServers && typeof parsed.mcpServers !== "object") {
    throw new Error(`JSON inválido em ${filePath}: mcpServers deve ser um objeto`);
  }
  return parsed;
}

function normalizeServer(name, server) {
  if (!server || typeof server !== "object" || Array.isArray(server)) {
    throw new Error(`Servidor "${name}": configuração deve ser um objeto`);
  }
  if (typeof server.command !== "string" || !server.command.trim()) {
    throw new Error(`Servidor "${name}": command é obrigatório`);
  }

  const normalized = { command: server.command.trim() };

  if (server.args !== undefined) {
    if (!Array.isArray(server.args) || server.args.some((a) => typeof a !== "string")) {
      throw new Error(`Servidor "${name}": args deve ser array de strings`);
    }
    normalized.args = server.args.map((a) => a.trim()).filter(Boolean);
  }

  if (server.env !== undefined) {
    if (!server.env || typeof server.env !== "object" || Array.isArray(server.env)) {
      throw new Error(`Servidor "${name}": env deve ser um objeto`);
    }
    const env = {};
    for (const [key, value] of Object.entries(server.env)) {
      env[key] = String(value);
    }
    if (Object.keys(env).length > 0) normalized.env = env;
  }

  if (server.cwd !== undefined) normalized.cwd = String(server.cwd);

  return normalized;
}

function sortKeys(obj) {
  return Object.keys(obj)
    .sort((a, b) => a.localeCompare(b))
    .reduce((acc, key) => {
      acc[key] = obj[key];
      return acc;
    }, {});
}

function mergeServers(existing, incoming) {
  const merged = { ...existing };
  for (const [name, config] of Object.entries(incoming)) {
    merged[name] = normalizeServer(name, {
      ...(merged[name] || {}),
      ...config,
      env: { ...(merged[name]?.env || {}), ...(config.env || {}) },
      args: config.args ?? merged[name]?.args,
    });
  }
  return sortKeys(merged);
}

function redactSecrets(config) {
  const clone = JSON.parse(JSON.stringify(config));
  for (const server of Object.values(clone.mcpServers || {})) {
    if (server.env) {
      for (const key of Object.keys(server.env)) {
        if (/token|password|secret|key|authorization/i.test(key)) {
          const val = server.env[key];
          server.env[key] =
            val && val !== "seu_token_aqui" ? "***REDACTED***" : val;
        }
      }
    }
    if (Array.isArray(server.args)) {
      server.args = server.args.map((arg) =>
        /postgresql:\/\/.+@/.test(arg)
          ? arg.replace(/(postgresql:\/\/[^:]+:)[^@]+(@)/, "$1***$2")
          : arg,
      );
    }
  }
  return clone;
}

function backupFile(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = `${filePath}.${stamp}.bak`;
  fs.copyFileSync(filePath, backupPath);
  return backupPath;
}

function buildPresetServers(names, ctx) {
  const servers = {};
  for (const name of names) {
    const factory = PRESETS[name];
    if (!factory) {
      throw new Error(
        `Preset desconhecido: "${name}". Disponíveis: ${Object.keys(PRESETS).join(", ")}`,
      );
    }
    servers[name] = factory(ctx);
  }
  return servers;
}

function loadCustomServers(filePath) {
  const abs = path.resolve(filePath);
  const data = readJson(abs);
  if (!data.mcpServers) {
    throw new Error(`Arquivo custom ${abs} deve conter mcpServers`);
  }
  const normalized = {};
  for (const [name, config] of Object.entries(data.mcpServers)) {
    normalized[name] = normalizeServer(name, config);
  }
  return normalized;
}

function findCursorExecutable() {
  const candidates = [];

  if (process.platform === "win32") {
    const localAppData = process.env.LOCALAPPDATA || "";
    candidates.push(
      path.join(localAppData, "Programs", "cursor", "Cursor.exe"),
      path.join(localAppData, "Programs", "Cursor", "Cursor.exe"),
    );
  } else if (process.platform === "darwin") {
    candidates.push("/Applications/Cursor.app/Contents/MacOS/Cursor");
  }

  candidates.push("cursor");

  for (const candidate of candidates) {
    if (candidate === "cursor") continue;
    if (fs.existsSync(candidate)) return candidate;
  }

  try {
    execFileSync(process.platform === "win32" ? "where" : "which", ["cursor"], {
      stdio: "ignore",
    });
    return "cursor";
  } catch {
    return null;
  }
}

function openCursor(projectRoot) {
  const exe = findCursorExecutable();
  if (!exe) {
    console.log("\n⚠ Não encontrei o Cursor no PATH nem nos caminhos padrão.");
    console.log("  Abra manualmente a pasta:", projectRoot);
    return false;
  }

  try {
    if (exe === "cursor") {
      const child = spawn("cursor", [projectRoot], {
        detached: true,
        stdio: "ignore",
        shell: process.platform === "win32",
      });
      child.unref();
    } else {
      const child = spawn(exe, [projectRoot], {
        detached: true,
        stdio: "ignore",
      });
      child.unref();
    }
    console.log(`\n✓ Cursor aberto em: ${projectRoot}`);
    return true;
  } catch (err) {
    console.log(`\n⚠ Falha ao abrir Cursor: ${err.message}`);
    return false;
  }
}

function detectWarnings(output, incomingNames) {
  const warnings = [];
  for (const name of incomingNames) {
    const server = output.mcpServers[name];
    if (!server) continue;

    if (name === "github") {
      const token = server.env?.GITHUB_PERSONAL_ACCESS_TOKEN;
      if (!token || token === "seu_token_aqui") {
        warnings.push("github: GITHUB_PERSONAL_ACCESS_TOKEN ainda é placeholder");
      }
    }

    if (name === "postgres") {
      const conn = server.args?.find((a) => a.startsWith("postgresql://"));
      if (conn?.includes("senha@")) {
        warnings.push("postgres: connection string ainda usa senha placeholder");
      }
    }

    if (name === "filesystem") {
      const script = server.args?.[0];
      if (script && !fs.existsSync(script.replace(/\//g, path.sep))) {
        warnings.push(`filesystem: script não encontrado (${script})`);
      }
    }
  }
  return warnings;
}

function printChecklist({ targetPath, projectRoot, serverNames, dryRun, saved, warnings }) {
  console.log("\n══════════════════════════════════════════");
  console.log("  CHECKLIST — validação MCP no Cursor");
  console.log("══════════════════════════════════════════\n");

  console.log(`  Config: ${targetPath}`);
  console.log(`  Projeto: ${projectRoot}`);
  console.log(`  Servidores: ${serverNames.join(", ") || "(nenhum)"}`);
  console.log(`  Status gravação: ${dryRun ? "dry-run (não gravou)" : saved ? "salvo" : "pendente"}\n`);

  console.log("  [ ] 1. Recarregar janela do Cursor");
  console.log("         Ctrl+Shift+P → Developer: Reload Window\n");

  console.log("  [ ] 2. Abrir Settings → Tools & MCP Servers");
  console.log("         Confirmar status Connected (verde) em cada servidor\n");

  for (const name of serverNames) {
    console.log(`  [ ] 3.${serverNames.indexOf(name) + 1} Servidor "${name}" visível e sem erro`);
  }
  console.log("");

  console.log("  [ ] 4. Testar uma ferramenta MCP num prompt do Agent");
  console.log("         Ex.: listar diretório (filesystem) ou buscar repo (github)\n");

  if (warnings.length) {
    console.log("  ⚠ Avisos antes de validar:");
    for (const w of warnings) console.log(`     • ${w}`);
    console.log("");
  }

  if (dryRun) {
    console.log("  → Próximo passo: rode o mesmo comando SEM --dry-run\n");
  } else {
    console.log("  → O Cursor pode precisar de reload manual — isso é esperado.\n");
  }
}

function main() {
  const opts = parseArgs(process.argv);
  if (opts.help) {
    printHelp();
    return;
  }

  if (!opts.servers.length && !opts.custom) {
    throw new Error("Informe --servers ou --custom");
  }

  const projectRoot = process.cwd();
  const targetPath = opts.project
    ? path.join(projectRoot, ".cursor", "mcp.json")
    : path.join(os.homedir(), ".cursor", "mcp.json");

  const ctx = {
    projectRoot,
    projectRootPosix: toPosix(projectRoot),
    mcpRoot: toPosix(path.resolve(opts.mcpRoot)),
  };

  const current = readJson(targetPath);
  const existingServers = current.mcpServers || {};

  let incoming = {};
  if (opts.servers.length) {
    incoming = { ...incoming, ...buildPresetServers(opts.servers, ctx) };
  }
  if (opts.custom) {
    incoming = { ...incoming, ...loadCustomServers(opts.custom) };
  }

  const mergedServers = mergeServers(existingServers, incoming);
  const output = { mcpServers: mergedServers };
  const incomingNames = Object.keys(incoming);
  const warnings = detectWarnings(output, incomingNames);

  console.log(`Alvo: ${targetPath}`);
  console.log(`Modo: ${opts.dryRun ? "dry-run (não grava)" : "gravar"}`);
  console.log(`Servidores adicionados/atualizados: ${incomingNames.join(", ") || "(nenhum)"}`);
  console.log("\n--- mcp.json resultante ---\n");
  console.log(JSON.stringify(redactSecrets(output), null, 2));

  let saved = false;

  if (opts.dryRun) {
    console.log("\n(dry-run — arquivo não alterado)");
  } else {
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    const backup = backupFile(targetPath);
    if (backup) console.log(`\nBackup: ${backup}`);

    fs.writeFileSync(targetPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
    console.log(`\nSalvo: ${targetPath}`);
    saved = true;

    if (opts.openCursor) {
      openCursor(projectRoot);
    }
  }

  if (opts.printChecklist) {
    printChecklist({
      targetPath,
      projectRoot,
      serverNames: Object.keys(mergedServers),
      dryRun: opts.dryRun,
      saved,
      warnings,
    });
  } else if (!opts.dryRun) {
    console.log("\nRecarregue o Cursor (Developer: Reload Window) para aplicar.");
  }
}

try {
  main();
} catch (err) {
  console.error(`Erro: ${err.message}`);
  process.exit(1);
}
