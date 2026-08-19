[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Running L0 knowledge lint...'
& (Join-Path $PSScriptRoot 'check_knowledge.ps1')

Write-Host "`nRunning L1 independent math checks..."
& (Join-Path $PSScriptRoot 'check_math.ps1')

Write-Host "`nRunning L1 capacity-model self-check..."
$codeRoot = Join-Path $PSScriptRoot '..\CUDA_code'
$sourceRoot = Get-ChildItem -LiteralPath $codeRoot -Directory |
    Where-Object { Test-Path (Join-Path $_.FullName 'verify\penta_capacity_model.js') } |
    Select-Object -First 1 -ExpandProperty FullName
if (-not $sourceRoot) {
    throw 'Cannot locate the source root containing verify/penta_capacity_model.js'
}
Push-Location $sourceRoot
try {
    $nodeScript = "verify/penta_capacity_model.js"
    $nodeSelfTest = "--self-test"
    & node $nodeScript $nodeSelfTest
    if ($LASTEXITCODE -ne 0) {
        throw "Capacity-model self-check failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
}

Write-Host "`nAll available local checks: PASS"
exit 0
