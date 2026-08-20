[CmdletBinding()]
param(
    [string]$SourceRoot = ''
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($SourceRoot)) {
    $cudaCodeRoot = Join-Path (Split-Path -Parent $PSScriptRoot) 'CUDA_code'
    $sourceCandidates = @(
        Get-ChildItem -LiteralPath $cudaCodeRoot -Directory |
            Where-Object {
                Test-Path -LiteralPath (Join-Path $_.FullName 'verify/penta_indep_check.js') -PathType Leaf
            }
    )
    if ($sourceCandidates.Count -ne 1) {
        throw "Expected one source directory under $cudaCodeRoot, found $($sourceCandidates.Count)."
    }
    $SourceRoot = $sourceCandidates[0].FullName
}

$resolvedSourceRoot = (Resolve-Path -LiteralPath $SourceRoot).Path
$nodeCommand = Get-Command node -ErrorAction Stop
$mathScripts = @(
    'verify/penta_indep_check.js',
    'verify/penta_comm_28_verify.js',
    'verify/penta_comm_22_verify.js',
    'verify/penta_index_bounds_verify.js',
    'verify/penta_stability_check.js',
    'verify/hepta_indep_check.js',
    'verify/mband_general.js',
    'verify/mband_recurrence.js'
)

$failures = [System.Collections.Generic.List[string]]::new()

Push-Location $resolvedSourceRoot
try {
    foreach ($mathScript in $mathScripts) {
        if (-not (Test-Path -LiteralPath $mathScript -PathType Leaf)) {
            [void]$failures.Add("Missing math script: $mathScript")
            continue
        }

        Write-Host "`n==> node $mathScript"
        & $nodeCommand.Source $mathScript
        $scriptExitCode = $LASTEXITCODE
        if ($scriptExitCode -ne 0) {
            [void]$failures.Add("$mathScript exited with code $scriptExitCode")
        }
    }
} finally {
    Pop-Location
}

Write-Host "`nMath check summary: Scripts=$($mathScripts.Count), Failures=$($failures.Count)"
foreach ($failure in $failures) {
    Write-Error $failure -ErrorAction Continue
}

if ($failures.Count -gt 0) {
    throw "Math checks failed with $($failures.Count) failure(s)."
}

Write-Host 'Math checks: PASS'
