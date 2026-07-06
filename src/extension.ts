import {
  commands,
  window,
  workspace,
  ExtensionContext,
  type OutputChannel,
  StatusBarAlignment,
} from "vscode";
import { LanguageClient, type LanguageClientOptions } from "vscode-languageclient/node";
import { registerAiCompletions } from "./ai-completions";
import { readMoonConfig } from "./config";
import { moonBuild, moonRun } from "./moon-tasks";
import { createServerOptions } from "./server";

let client: LanguageClient | undefined;
let extensionContext: ExtensionContext | undefined;
let promptOutput: OutputChannel | undefined;
let moonOutput: OutputChannel | undefined;
let aiCompletions: { dispose: () => void } | undefined;
let statusBar: ReturnType<typeof window.createStatusBarItem> | undefined;

function logMoon(message: string): void {
  const cfg = readMoonConfig();
  if (!cfg.logging.enabled) return;
  moonOutput?.appendLine(`[moon] ${message}`);
}

function logSpawnLine(context: ExtensionContext): void {
  const serverOptions = createServerOptions(context);
  const runOpts = "run" in serverOptions ? serverOptions.run : serverOptions;
  moonOutput?.appendLine(
    `[moon] spawning LSP: ${runOpts.command} ${(runOpts.args ?? []).join(" ")}`,
  );
}

function buildLanguageClient(context: ExtensionContext): LanguageClient {
  const serverOptions = createServerOptions(context);
  const clientOptions: LanguageClientOptions = {
    documentSelector: [
      { scheme: "file", language: "moon" },
      { scheme: "file", language: "moonfile" },
    ],
    synchronize: { configurationSection: "moon" },
    outputChannel: moonOutput,
    initializationOptions: {
      moon: readMoonConfig(),
    },
  };

  return new LanguageClient(
    "moonLanguageServer",
    "Moon Language Server",
    serverOptions,
    clientOptions,
  );
}

async function disposeLanguageClient(): Promise<void> {
  if (!client) return;
  try {
    await client.stop();
  } catch (err) {
    logMoon(`stop ignored: ${String(err)}`);
  }
  client.dispose();
  client = undefined;
}

async function startLanguageServer(context: ExtensionContext): Promise<void> {
  logSpawnLine(context);
  client = buildLanguageClient(context);
  await client.start();
}

function setServerStatus(state: "starting" | "running" | "error", detail?: string): void {
  if (!statusBar) return;
  switch (state) {
    case "starting":
      statusBar.text = "$(sync~spin) Moon";
      statusBar.tooltip = "Starting Moon Language Server…";
      break;
    case "running":
      statusBar.text = "$(check) Moon";
      statusBar.tooltip = "Moon Language Server is running";
      break;
    case "error":
      statusBar.text = "$(error) Moon";
      statusBar.tooltip = detail ?? "Moon Language Server failed";
      break;
  }
}

async function restartLanguageServer(): Promise<void> {
  const context = extensionContext;
  if (!context) return;

  setServerStatus("starting");
  logMoon("restarting language server");
  moonOutput?.show(true);

  await disposeLanguageClient();

  try {
    await startLanguageServer(context);
    setServerStatus("running");
    logMoon("language server restarted");
    void window.showInformationMessage("Moon: language server restarted");
  } catch (err) {
    const message = String(err);
    setServerStatus("error", message);
    moonOutput?.appendLine(`[error] language server restart failed: ${message}`);
    void window.showErrorMessage(
      "Moon: language server failed to restart. See Moon output for details.",
    );
  }
}

export function activate(context: ExtensionContext): void {
  extensionContext = context;
  promptOutput = window.createOutputChannel("Moon Prompt Preview");
  moonOutput = window.createOutputChannel("Moon");
  moonOutput.appendLine("Moon extension activated");

  statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  setServerStatus("starting");
  statusBar.show();

  aiCompletions = registerAiCompletions(moonOutput);

  context.subscriptions.push(
    commands.registerCommand("moon.previewPrompt", async (uri: string, line: number) => {
      if (!client) return;
      const preview = await client.sendRequest<{
        title: string;
        markdown: string;
      } | null>("moon/getPromptPreview", { uri, line });

      if (!preview) {
        void window.showWarningMessage("Moon: could not build prompt preview for this line.");
        return;
      }

      promptOutput?.clear();
      promptOutput?.appendLine(preview.markdown);
      promptOutput?.show(true);
    }),
    commands.registerCommand("moon.previewPromptAtCursor", async () => {
      const editor = window.activeTextEditor;
      if (!editor || editor.document.languageId !== "moon" || !client) return;
      const uri = editor.document.uri.toString();
      const line = editor.selection.active.line;
      await commands.executeCommand("moon.previewPrompt", uri, line);
    }),
    commands.registerCommand("moon.restartLanguageServer", () => restartLanguageServer()),
    commands.registerCommand("moon.build", async () => {
      moonOutput?.show(true);
      const code = await moonBuild(moonOutput!, readMoonConfig().build.defaultTarget || undefined);
      if (code === 0) {
        void window.showInformationMessage("Moon: build succeeded");
      } else {
        void window.showErrorMessage("Moon: build failed — see Moon output");
      }
    }),
    commands.registerCommand("moon.run", async () => {
      moonOutput?.show(true);
      const code = await moonRun(moonOutput!, readMoonConfig().build.defaultTarget || undefined);
      if (code === 0) {
        void window.showInformationMessage("Moon: run finished");
      } else {
        void window.showErrorMessage("Moon: run failed — see Moon output");
      }
    }),
    commands.registerCommand("moon.showOutput", () => {
      moonOutput?.show(true);
    }),
    workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration("moon")) return;
      logMoon("configuration changed");
      aiCompletions?.dispose();
      aiCompletions = registerAiCompletions(moonOutput!) ?? undefined;
    }),
    statusBar!,
    { dispose: () => aiCompletions?.dispose() },
  );

  void startLanguageServer(context).then(
    () => {
      setServerStatus("running");
      logMoon("language server started");
    },
    (err: unknown) => {
      const message = String(err);
      setServerStatus("error", message);
      moonOutput?.appendLine(`[error] language server failed: ${message}`);
      void window.showErrorMessage(
        "Moon Language Server failed to start. Build moon-lang (`swift build`) or set moon.languageServerPath.",
      );
    },
  );

  context.subscriptions.push({ dispose: () => { void disposeLanguageClient(); } });
}

export async function deactivate(): Promise<void> {
  aiCompletions?.dispose();
  await disposeLanguageClient();
}