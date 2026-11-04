# Corre el banco de pruebas en un solo paso (desde PowerShell, en la raíz del repo):
#   .\tools\navegador\probar.ps1                  todos los escenarios
#   .\tools\navegador\probar.ps1 golpes           un escenario (tools/navegador/escenarios/golpes.json)
# Si no hay un servidor en el puerto 5501, levanta uno con Python mientras duran las pruebas.
# Si Node no está instalado, usa el portable de %LOCALAPPDATA%\node-portable (si existe).
param([string]$Escenario = '')

$raiz = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $raiz

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  $portable = Get-ChildItem "$env:LOCALAPPDATA\node-portable" -Directory -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($portable) { $env:Path = "$($portable.FullName);$env:Path" }
  else { Write-Host 'No se encontró Node. Instalarlo o bajar el portable a %LOCALAPPDATA%\node-portable.'; exit 1 }
}
if (-not (Test-Path "$PSScriptRoot\node_modules")) {
  Push-Location $PSScriptRoot; npm ci --no-audit --no-fund; Pop-Location
}

$servidor = $null
try { Invoke-WebRequest http://127.0.0.1:5501/index.html -UseBasicParsing -TimeoutSec 2 | Out-Null }
catch {
  $servidor = Start-Process python -ArgumentList '-m', 'http.server', '5501', '--bind', '127.0.0.1' -WorkingDirectory $raiz -WindowStyle Hidden -PassThru
  Start-Sleep 2
}

$objetivo = if ($Escenario) { "tools/navegador/escenarios/$Escenario.json" } else { 'tools/navegador/escenarios' }
node tools/navegador/probar.js http://127.0.0.1:5501/index.html $objetivo tools/navegador/capturas
$codigo = $LASTEXITCODE

if ($servidor) { Stop-Process -Id $servidor.Id -ErrorAction SilentlyContinue }
exit $codigo
