# Moon Language — VS Code Extension

Расширение для [VS Code](https://code.visualstudio.com) и [Cursor](https://cursor.com) с подсветкой синтаксиса, LSP и командами сборки/запуска для языка [Moon](https://github.com/nnxlxde-stack/moon-lang).

## Возможности

- Подсветка `*.moon` и `Moonfile`
- Language Server (completion, hover, go-to-definition, diagnostics, code actions)
- Форматирование при сохранении
- Preview LLM-промптов
- Команды **Moon: Build** и **Moon: Run**
- Опциональные AI inline completions (DeepSeek)

## Требования

- [moon-lang](https://github.com/nnxlxde-stack/moon-lang) — Swift toolchain с подкомандой `moon lsp`
- [Bun](https://bun.sh) 1.1+ — только для сборки расширения

## Установка из исходников

```bash
git clone https://github.com/nnxlxde-stack/moon-vscode.git
cd moon-vscode
bun install
bun run build
bun run package
code --install-extension vscode-moon-0.3.0.vsix
```

Для `copy-stdlib` нужен клон `moon-lang` рядом (`../moon-lang`) или переменная `MOON_STDLIB_SOURCE`.

## Настройка LSP

По умолчанию расширение ищет `moon` в:

1. `<workspace>/.build/debug/moon` (или `moon.exe` на Windows)
2. `<workspace>/.build/release/moon`
3. `moon` в `PATH`

Переопределение: `moon.languageServerPath` — путь к исполняемому файлу `moon`.

## Связанные репозитории

| Репозиторий | Описание |
|-------------|----------|
| [moon-lang](https://github.com/nnxlxde-stack/moon-lang) | Интерпретатор и CLI |
| [moon-pkg](https://github.com/nnxlxde-stack/moon-pkg) | Спецификация пакетного реестра |

## Лицензия

MIT