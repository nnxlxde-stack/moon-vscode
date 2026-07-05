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
let promptOutput: OutputChannel | undefined;
let moonOutput: OutputChannel | undefined;
let aiCompletions: { dispose: () => void } | undefined;

function logMoon(message: string): void {
  const cfg = readMoonConfig();
  if (!cfg.logging.enabled) return;
  moonOutput?.appendLine(`[moon] ${message}`);
}

export function activate(context: ExtensionContext): void {
  promptOutput = window.createOutputChannel("Moon Prompt Preview");
  moonOutput = window.createOutputChannel("Moon");
  moonOutput.appendLine("Moon extension activated");

  const serverOptions = createServerOptions(context);
  const runOpts = "run" in serverOptions ? serverOptions.run : serverOptions;
  moonOutput.appendLine(
    `[moon] spawning LSP: ${runOpts.command} ${(runOpts.args ?? []).join(" ")}`,
  );

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

  client = new LanguageClient(
    "moonLanguageServer",
    "Moon Language Server",
    serverOptions,
    clientOptions,
  );

  const status = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  status.text = "$(sync~spin) Moon";
  status.tooltip = "Starting Moon Language Server…";
  status.show();

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
    commands.registerCommand("moon.restartLanguageServer", async () => {
      if (!client) return;
      status.text = "$(sync~spin) Moon";
      logMoon("restarting language server");
      await client.stop();
      await client.start();
    }),
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
    status,
    { dispose: () => aiCompletions?.dispose() },
  );

  void client.start().then(
    () => {
      status.text = "$(check) Moon";
      status.tooltip = "Moon Language Server is running";
      logMoon("language server started");
    },
    (err: unknown) => {
      status.text = "$(error) Moon";
      status.tooltip = `Moon Language Server failed: ${String(err)}`;
      moonOutput?.appendLine(`[error] language server failed: ${String(err)}`);
      void window.showErrorMessage(
        `Moon Language Server failed to start. Install Node.js or set moon.languageServerPath.`,
      );
    },
  );

  context.subscriptions.push({ dispose: () => { void client?.stop(); } });
}

export function deactivate(): Promise<void> | undefined {
  aiCompletions?.dispose();
  return client?.stop();
}