# Corre el banco de pruebas en un solo paso (desde PowerShell, en la raíz del repo):
#   .\tools\navegador\probar.ps1                  todos los escenarios
#   .\tools\navegador\probar.ps1 golpes           un escenario (tools/navegador/escenarios/golpes.json)
# Levanta su propio servidor con Python en un puerto aparte, mientras duran las pruebas: Live Server (5501) recarga
# la página cada vez que se guarda una captura y corta los escenarios.
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

$puerto = 5599
$servidor = Start-Process python -ArgumentList '-m', 'http.server', $puerto, '--bind', '127.0.0.1' -WorkingDirectory $raiz -WindowStyle Hidden -PassThru
Start-Sleep 2

$objetivo = if ($Escenario) { "tools/navegador/escenarios/$Escenario.json" } else { 'tools/navegador/escenarios' }
node tools/navegador/probar.js "http://127.0.0.1:$puerto/index.html" $objetivo tools/navegador/capturas
$codigo = $LASTEXITCODE

Stop-Process -Id $servidor.Id -ErrorAction SilentlyContinue
exit $codigo
