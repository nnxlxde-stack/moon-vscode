import { workspace, type WorkspaceConfiguration } from "vscode";

export interface MoonExtensionConfig {
  languageServerPath: string;
  logging: { enabled: boolean; verbose: boolean };
  deepseek: {
    apiKey: string;
    baseUrl: string;
    apiFormat: "anthropic" | "openai";
    useBeta: boolean;
  };
  ai: {
    inlineCompletions: { enabled: boolean; model: string };
  };
  build: {
    defaultTarget: string;
    runBeforeStart: boolean;
    cliPath: string;
  };
  models: { defaultFlash: string; defaultPro: string };
  formatOnSave: boolean;
}

export function readMoonConfig(): MoonExtensionConfig {
  const cfg = workspace.getConfiguration("moon");
  return {
    languageServerPath: cfg.get<string>("languageServerPath", ""),
    logging: {
      enabled: cfg.get<boolean>("logging.enabled", true),
      verbose: cfg.get<boolean>("logging.verbose", false),
    },
    deepseek: {
      apiKey: cfg.get<string>("deepseek.apiKey", "") || process.env.DEEPSEEK_API_KEY || "",
      baseUrl: cfg.get<string>("deepseek.baseUrl", "") || process.env.DEEPSEEK_BASE_URL || "",
      apiFormat: cfg.get<"anthropic" | "openai">("deepseek.apiFormat", "anthropic"),
      useBeta: cfg.get<boolean>("deepseek.useBeta", false),
    },
    ai: {
      inlineCompletions: {
        enabled: cfg.get<boolean>("ai.inlineCompletions.enabled", false),
        model: cfg.get<string>("ai.inlineCompletions.model", "deepseek-v4-flash"),
      },
    },
    build: {
      defaultTarget: cfg.get<string>("build.defaultTarget", ""),
      runBeforeStart: cfg.get<boolean>("build.runBeforeStart", true),
      cliPath: cfg.get<string>("build.cliPath", ""),
    },
    models: {
      defaultFlash: cfg.get<string>("models.defaultFlash", "deepseek-v4-flash"),
      defaultPro: cfg.get<string>("models.defaultPro", "deepseek-v4-pro"),
    },
    formatOnSave: cfg.get<boolean>("formatOnSave", true),
  };
}

export function moonConfigSection(): WorkspaceConfiguration {
  return workspace.getConfiguration("moon");
}