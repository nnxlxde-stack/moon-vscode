import { existsSync, readdirSync } from "fs";
import * as path from "path";
import { workspace, type ExtensionContext } from "vscode";
import { type ServerOptions, TransportKind } from "vscode-languageclient/node";

function swiftBinDirsOnWindows(): string[] {
  if (process.platform !== "win32") return [];

  const localAppData = process.env.LOCALAPPDATA;
  if (!localAppData) return [];

  const dirs: string[] = [];
  const roots = [
    path.join(localAppData, "Programs", "Swift", "Runtimes"),
    path.join(localAppData, "Programs", "Swift", "Toolchains"),
  ];

  for (const root of roots) {
    if (!existsSync(root)) continue;
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const bin = path.join(root, entry.name, "usr", "bin");
      if (existsSync(bin)) dirs.push(bin);
    }
  }

  return dirs;
}

function prependPath(env: NodeJS.ProcessEnv, entries: string[]): void {
  if (entries.length === 0) return;
  const key = process.platform === "win32" ? "Path" : "PATH";
  const current = env[key] ?? "";
  const prefix = entries.join(path.delimiter);
  env[key] = current ? `${prefix}${path.delimiter}${current}` : prefix;
}

function envForMoonServer(stdlibPath: string | undefined): NodeJS.ProcessEnv {
  const env = { ...process.env };
  if (stdlibPath && existsSync(stdlibPath)) {
    env.MOON_STDLIB = stdlibPath;
  }
  prependPath(env, swiftBinDirsOnWindows());
  return env;
}

function workspaceRoot(): string | undefined {
  return workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function moonBinaryCandidates(root?: string): string[] {
  const exe = process.platform === "win32" ? "moon.exe" : "moon";
  const candidates: string[] = [];

  if (root) {
    candidates.push(
      path.join(root, ".build", "debug", exe),
      path.join(root, ".build", "release", exe),
    );

    const buildRoot = path.join(root, ".build");
    if (existsSync(buildRoot)) {
      for (const entry of readdirSync(buildRoot, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        candidates.push(path.join(buildRoot, entry.name, "debug", exe));
        candidates.push(path.join(buildRoot, entry.name, "release", exe));
      }
    }
  }

  candidates.push(exe);
  return candidates;
}

function resolveMoonLsp(root?: string): { command: string; args: string[] } | undefined {
  for (const candidate of moonBinaryCandidates(root)) {
    if (candidate === "moon" || candidate === "moon.exe") {
      return { command: candidate, args: ["lsp", "--stdio"] };
    }
    if (existsSync(candidate)) {
      return { command: candidate, args: ["lsp", "--stdio"] };
    }
  }
  return undefined;
}

export function createServerOptions(context: ExtensionContext): ServerOptions {
  const config = workspace.getConfiguration("moon");
  const override = config.get<string>("languageServerPath")?.trim();

  const bundledStdlib = path.join(context.extensionPath, "stdlib");
  const stdlibPath = existsSync(bundledStdlib) ? bundledStdlib : undefined;
  const env = envForMoonServer(stdlibPath);
  const root = workspaceRoot();

  if (override) {
    const run = {
      command: override,
      args: ["lsp", "--stdio"],
      transport: TransportKind.stdio,
      options: { env },
    };
    return { run, debug: run };
  }

  const moonLsp = resolveMoonLsp(root);
  if (moonLsp) {
    const run = {
      command: moonLsp.command,
      args: moonLsp.args,
      transport: TransportKind.stdio,
      options: { cwd: root, env },
    };
    return { run, debug: run };
  }

  throw new Error(
    "Moon language server not found. Build moon-lang (`swift build`) or set moon.languageServerPath.",
  );
}