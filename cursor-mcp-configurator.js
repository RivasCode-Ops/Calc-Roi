#!/usr/bin/env node
/**
 * cursor-mcp-configurator.js
 * Atualiza ~/.cursor/mcp.json ou ./.cursor/mcp.json com merge seguro.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");

const PRESETS = {
  filesystem: (ctx) => ({
    command: "node",
    args: [
      path.posix.join(ctx.mcpRoot, "filesystem/dist/index.js"),
      ctx.projectRootPosix,
    ],
  }),
  github: () => ({
    command: "node",
    args: [path.posix.join(process.env.MCP_ROOT || "C:/dev/mcp", "github/dist/index.js")],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN || "seu_token_aqui",
    },
  }),
  postgres: () => ({
    command: "node",
    args: [
      path.posix.join(process.env.MCP_ROOT || "C:/dev/mcp", "postgres/dist/index.js"),
      process.env.POSTGRES_URL || "postgresql://postgres:senha@localhost:5432/sige_dev",
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
cursor-mcp-configurator — merge seguro de servidores MCP no Cursor

Uso:
  node cursor-mcp-configurator.js --servers filesystem,github,postgres [opções]

Opções:
  --servers <lista>   Presets separados por vírgula (${Object.keys(PRESETS).join(", ")})
  --custom <arquivo>  JSON com { "mcpServers": { ... } } para merge adicional
  --project           Grava em ./.cursor/mcp.json (padrão: global ~/.cursor/mcp.json)
  --dry-run           Mostra o resultado sem gravar
  --mcp-root <path>   Raiz dos servidores locais (padrão: C:/dev/mcp ou MCP_ROOT)
  -h, --help          Esta ajuda

Exemplos:
  node cursor-mcp-configurator.js --servers filesystem,github,postgres --project --dry-run
  node cursor-mcp-configurator.js --servers filesystem,github --project
  node cursor-mcp-configurator.js --custom cursor-mcp-custom.example.json --dry-run
`);
}

function parseArgs(argv) {
  const opts = {
    servers: [],
    custom: null,
    project: false,
    dryRun: false,
    mcpRoot: process.env.MCP_ROOT || "C:/dev/mcp",
    help: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "-h" || arg === "--help") opts.help = true;
    else if (arg === "--project") opts.project = true;
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--servers") opts.servers = (argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
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

  if (server.cwd !== undefined) {
    normalized.cwd = String(server.cwd);
  }

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
          server.env[key] = val && val !== "seu_token_aqui" ? "***REDACTED***" : val;
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
      throw new Error(`Preset desconhecido: "${name}". Disponíveis: ${Object.keys(PRESETS).join(", ")}`);
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

  console.log(`Alvo: ${targetPath}`);
  console.log(`Modo: ${opts.dryRun ? "dry-run (não grava)" : "gravar"}`);
  console.log(`Servidores adicionados/atualizados: ${Object.keys(incoming).join(", ") || "(nenhum)"}`);
  console.log("\n--- mcp.json resultante ---\n");
  console.log(JSON.stringify(redactSecrets(output), null, 2));

  if (opts.dryRun) {
    console.log("\n(dry-run — arquivo não alterado)");
    return;
  }

  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
  const backup = backupFile(targetPath);
  if (backup) console.log(`\nBackup: ${backup}`);

  fs.writeFileSync(targetPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`\nSalvo: ${targetPath}`);
  console.log("Recarregue o Cursor (Developer: Reload Window) para aplicar.");
}

try {
  main();
} catch (err) {
  console.error(`Erro: ${err.message}`);
  process.exit(1);
}
