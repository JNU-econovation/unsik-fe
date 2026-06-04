$ErrorActionPreference = 'Stop'

$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$target = Join-Path $root 'dist'

if (Test-Path $target) {
  $resolved = (Resolve-Path $target).Path

  if (-not $resolved.StartsWith($root)) {
    throw "Refusing to remove outside workspace: $resolved"
  }

  Remove-Item -LiteralPath $resolved -Recurse -Force
}
