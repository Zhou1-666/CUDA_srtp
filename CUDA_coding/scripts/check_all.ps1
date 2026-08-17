[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Write-Host 'Running L0 knowledge lint...'
& (Join-Path $PSScriptRoot 'check_knowledge.ps1')

Write-Host "`nRunning L1 independent math checks..."
& (Join-Path $PSScriptRoot 'check_math.ps1')

Write-Host "`nAll available local checks: PASS"
exit 0
