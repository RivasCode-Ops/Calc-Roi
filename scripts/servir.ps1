param(
    [int]$Port = 8765
)

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "Calc-Roi em http://localhost:$Port" -ForegroundColor Cyan
Write-Host 'Pressione Ctrl+C para parar.' -ForegroundColor DarkGray

Start-Process "http://localhost:$Port/index.html"
python -m http.server $Port
