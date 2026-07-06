# Moon Language — VS Code Extension

Расширение для [VS Code](https://code.visualstudio.com) и [Cursor](https://cursor.com) для языка [Moon](https://github.com/nnxlxde-stack/moon-lang).

## Установка (рекомендуется)

Скачайте `.vsix` из [GitHub Releases](https://github.com/nnxlxde-stack/moon-vscode/releases/latest):

```bash
code --install-extension vscode-moon-0.3.0.vsix
```

Или используйте [moon-setup](https://github.com/nnxlxde-stack/moon-setup) для полной установки toolchain + расширения.

## Возможности

- Подсветка `*.moon` и `Moonfile`
- LSP через Swift `moon lsp` (completion, hover, diagnostics, code actions)
- Форматирование при сохранении
- Preview LLM-промптов
- Команды **Moon: Build** и **Moon: Run**

## Требования

- [moon-lang](https://github.com/nnxlxde-stack/moon-lang) — `swift build`, подкоманда `moon lsp`
- Bun — только для сборки расширения из исходников

## Сборка из исходников

```bash
git clone https://github.com/nnxlxde-stack/moon-vscode.git
cd moon-vscode
bun install
MOON_STDLIB_SOURCE=../moon-lang/stdlib bun run package
```

## Настройка LSP

По умолчанию: `<workspace>/.build/debug/moon lsp` или `moon` в PATH.

Переопределение: `moon.languageServerPath`.

## Экосистема

| Репозиторий | Описание |
|-------------|----------|
| [moon-lang](https://github.com/nnxlxde-stack/moon-lang) | Интерпретатор |
| [moon-pkg](https://github.com/nnxlxde-stack/moon-pkg) | Пакеты |
| [moon-setup](https://github.com/nnxlxde-stack/moon-setup) | Установка |

## Лицензия

MIT