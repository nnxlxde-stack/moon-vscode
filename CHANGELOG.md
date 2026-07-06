# Changelog

## 0.3.2

- Fix `Moon: Restart Language Server` after a failed/crashed start (dispose + recreate client)

## 0.3.1

- Windows: prepend Swift toolchain/runtime to LSP `PATH` (fixes `0xC0000135` / EPIPE crash)
- Auto-detect `.build/<triple>/debug/moon.exe` on Windows

## 0.3.0

- Extracted from moon-lang monorepo into standalone repository
- Swift `moon lsp` as default language server (no bundled Node server)
- Auto-detect `.build/debug/moon` in workspace
- Bundled stdlib copied from moon-lang at build time

## 0.2.x (legacy monorepo)

- Bundled Node LSP, VS Code commands, AI completions