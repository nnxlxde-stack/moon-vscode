# Moon Language — VS Code Extension

[![Release](https://img.shields.io/github/v/release/nnxlxde-stack/moon-vscode?style=flat-square&logo=github)](https://github.com/nnxlxde-stack/moon-vscode/releases/latest)
[![Docs](https://img.shields.io/badge/docs-GitHub%20Pages-5865F2?style=flat-square)](https://nnxlxde-stack.github.io/moon-lang/#vscode)

Расширение для [VS Code](https://code.visualstudio.com), [VS Code Insiders](https://code.visualstudio.com/insiders/) и [Cursor](https://cursor.com) для языка [Moon](https://github.com/nnxlxde-stack/moon-lang).

## Установка (рекомендуется)

**Windows — полная установка или TUI-менеджер:**

```powershell
irm https://raw.githubusercontent.com/nnxlxde-stack/moon-setup/main/install-all.ps1 | iex
irm https://raw.githubusercontent.com/nnxlxde-stack/moon-setup/main/moon-manage.ps1 | iex
```

Скрипт автоматически находит `code`, `code-insiders` или `cursor` в PATH.

> **Важно:** перед установкой расширения закройте редактор полностью. Если VS Code/Cursor запущен, установка будет отложена — скрипт покажет команду для ручной установки.

**Только .vsix:**

```bash
# https://github.com/nnxlxde-stack/moon-vscode/releases/latest
code-insiders --install-extension vscode-moon-0.3.2.vsix
```

## Возможности

- Подсветка `*.moon` и `Moonfile`
- LSP через Swift `moon lsp` (completion, hover, diagnostics, code actions)
- Форматирование при сохранении
- Preview LLM-промптов
- Команды **Moon: Build**, **Moon: Run**, **Moon: Restart Language Server**

## Требования

- [moon-lang](https://github.com/nnxlxde-stack/moon-lang) — `moon.exe` в PATH или `.build/debug/moon` в workspace
- Bun — только для сборки расширения из исходников

## Сборка из исходников

```bash
git clone https://github.com/nnxlxde-stack/moon-vscode.git
cd moon-vscode
bun install
MOON_STDLIB_SOURCE=../moon-lang/stdlib bun run package
```

## Настройка LSP

По умолчанию: `<workspace>/.build/debug/moon lsp` или `moon` в PATH (включая `%APPDATA%\Moon\bin` после moon-setup).

Переопределение: `moon.languageServerPath`.

## Экосистема

| Репозиторий | Описание |
|-------------|----------|
| [moon-lang](https://github.com/nnxlxde-stack/moon-lang) | Интерпретатор, CLI, LSP |
| [moon-pkg](https://github.com/nnxlxde-stack/moon-pkg) | Пакеты |
| [moon-setup](https://github.com/nnxlxde-stack/moon-setup) | Установка, обновление, TUI-менеджер |

Документация: [nnxlxde-stack.github.io/moon-lang](https://nnxlxde-stack.github.io/moon-lang/)

## Лицензия

MIT