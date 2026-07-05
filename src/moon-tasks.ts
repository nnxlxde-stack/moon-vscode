import { spawn } from "child_process";
import * as path from "path";
import { existsSync } from "fs";
import { workspace, type OutputChannel } from "vscode";
import { readMoonConfig } from "./config";

function workspaceRoot(): string | undefined {
  return workspace.workspaceFolders?.[0]?.uri.fsPath;
}

function resolveCli(root: string): { command: string; argsPrefix: string[] } {
  const cfg = readMoonConfig();
  if (cfg.build.cliPath.trim()) {
    const custom = cfg.build.cliPath.trim();
    return { command: custom, argsPrefix: [] };
  }

  const exe = process.platform === "win32" ? "moon.exe" : "moon";
  const candidates = [
    path.join(root, ".build", "debug", exe),
    path.join(root, ".build", "release", exe),
    exe,
  ];

  for (const candidate of candidates) {
    if (candidate === exe || existsSync(candidate)) {
      return { command: candidate, argsPrefix: [] };
    }
  }

  return { command: exe, argsPrefix: [] };
}

export function runMoonCli(
  subcommand: string,
  extraArgs: string[],
  output: OutputChannel,
): Promise<number> {
  const root = workspaceRoot();
  if (!root) {
    output.appendLine("[error] No workspace folder open.");
    return Promise.resolve(1);
  }

  const { command, argsPrefix } = resolveCli(root);
  const args = [...argsPrefix, subcommand, ...extraArgs];
  output.appendLine(`[task] ${command} ${args.join(" ")}`);

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: root,
      shell: process.platform === "win32",
      env: { ...process.env },
    });

    child.stdout.on("data", (chunk: Buffer | string) => {
      output.append(chunk.toString());
    });
    child.stderr.on("data", (chunk: Buffer | string) => {
      output.append(chunk.toString());
    });
    child.on("close", (code) => {
      output.appendLine(`[task] exit ${code ?? 1}`);
      resolve(code ?? 1);
    });
    child.on("error", (err) => {
      output.appendLine(`[error] ${String(err)}`);
      resolve(1);
    });
  });
}

export async function moonBuild(output: OutputChannel, target?: string): Promise<number> {
  const cfg = readMoonConfig();
  const name = target ?? cfg.build.defaultTarget;
  const args = name ? ["--target", name] : [];
  return runMoonCli("build", args, output);
}

export async function moonRun(output: OutputChannel, target?: string): Promise<number> {
  const cfg = readMoonConfig();
  if (cfg.build.runBeforeStart) {
    const buildCode = await moonBuild(output, target);
    if (buildCode !== 0) return buildCode;
  }
  const name = target ?? cfg.build.defaultTarget;
  const args = ["--mock", ...(name ? ["--target", name] : [])];
  return runMoonCli("run", args, output);
}