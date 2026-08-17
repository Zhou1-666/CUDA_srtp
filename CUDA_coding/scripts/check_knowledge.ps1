[CmdletBinding()]
param(
    [string]$ProjectRoot = (Split-Path -Parent $PSScriptRoot)
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$resolvedProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$wikiRoot = Join-Path $resolvedProjectRoot 'knowledge/wiki'
$sourceRegistryPath = Join-Path $resolvedProjectRoot 'knowledge/raw/source-registry.md'

if (-not (Test-Path -LiteralPath $wikiRoot -PathType Container)) {
    throw "Wiki root not found: $wikiRoot"
}
if (-not (Test-Path -LiteralPath $sourceRegistryPath -PathType Leaf)) {
    throw "Source registry not found: $sourceRegistryPath"
}

$errors = [System.Collections.Generic.List[string]]::new()
$warnings = [System.Collections.Generic.List[string]]::new()
$markdownFiles = @(Get-ChildItem -LiteralPath $resolvedProjectRoot -Recurse -File -Filter '*.md')
$wikiFiles = @(Get-ChildItem -LiteralPath $wikiRoot -Recurse -File -Filter '*.md')

# Validate relative Obsidian wikilinks. A target containing dots is still allowed
# to omit the final .md suffix, so both the literal target and target + .md are checked.
foreach ($markdownFile in $markdownFiles) {
    $documentText = [string](Get-Content -LiteralPath $markdownFile.FullName -Raw -Encoding UTF8)
    foreach ($linkMatch in [regex]::Matches($documentText, '\[\[([^\]]+)\]\]')) {
        $linkTarget = (($linkMatch.Groups[1].Value -split '\|', 2)[0] -split '#', 2)[0].Trim()
        if ([string]::IsNullOrWhiteSpace($linkTarget)) {
            continue
        }

        $candidatePath = Join-Path $markdownFile.DirectoryName $linkTarget
        $targetExists = (Test-Path -LiteralPath $candidatePath) -or
                        (Test-Path -LiteralPath ($candidatePath + '.md'))
        if (-not $targetExists) {
            $relativeFile = $markdownFile.FullName.Substring($resolvedProjectRoot.Length + 1)
            [void]$errors.Add("Broken wikilink: $relativeFile -> $linkTarget")
        }
    }
}

# Read the source ledger once, then validate every declared source_id.
$sourceRegistryText = [string](Get-Content -LiteralPath $sourceRegistryPath -Raw -Encoding UTF8)
$knownSourceIds = [System.Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
foreach ($sourceMatch in [regex]::Matches($sourceRegistryText, '(?m)^\|\s*(SRC-[A-Za-z0-9]+)\s*\|')) {
    [void]$knownSourceIds.Add($sourceMatch.Groups[1].Value)
}

$allowedStatuses = @('draft', 'reviewed', 'verified', 'deprecated')
$pageIds = @{}

foreach ($wikiFile in $wikiFiles) {
    $relativeWikiFile = $wikiFile.FullName.Substring($resolvedProjectRoot.Length + 1)
    $documentText = [string](Get-Content -LiteralPath $wikiFile.FullName -Raw -Encoding UTF8)
    $frontmatterMatch = [regex]::Match(
        $documentText,
        '^---\r?\n(?<frontmatter>[\s\S]*?)\r?\n---(?:\r?\n|$)'
    )

    if (-not $frontmatterMatch.Success) {
        [void]$errors.Add("Missing frontmatter: $relativeWikiFile")
        continue
    }

    $frontmatter = $frontmatterMatch.Groups['frontmatter'].Value
    $fieldValues = @{}
    foreach ($fieldName in @('id', 'type', 'status')) {
        $fieldMatch = [regex]::Match($frontmatter, "(?m)^$fieldName\s*:\s*(.+?)\s*$")
        if (-not $fieldMatch.Success) {
            [void]$errors.Add("Missing core frontmatter '$fieldName': $relativeWikiFile")
        } else {
            $fieldValues[$fieldName] = $fieldMatch.Groups[1].Value.Trim()
        }
    }

    if ($fieldValues.ContainsKey('status') -and $fieldValues['status'] -notin $allowedStatuses) {
        [void]$errors.Add("Invalid status '$($fieldValues['status'])': $relativeWikiFile")
    }

    if ($fieldValues.ContainsKey('id')) {
        $pageId = $fieldValues['id']
        if ($pageIds.ContainsKey($pageId)) {
            [void]$errors.Add("Duplicate page id '$pageId': $($pageIds[$pageId]) and $relativeWikiFile")
        } else {
            $pageIds[$pageId] = $relativeWikiFile
        }
    }

    foreach ($recommendedField in @('confidence', 'source_ids')) {
        if ($frontmatter -notmatch "(?m)^$recommendedField\s*:") {
            [void]$warnings.Add("Missing extended metadata '$recommendedField': $relativeWikiFile")
        }
    }

    $sourceIdsMatch = [regex]::Match($frontmatter, '(?m)^source_ids\s*:\s*(.+?)\s*$')
    if ($sourceIdsMatch.Success) {
        foreach ($sourceIdMatch in [regex]::Matches($sourceIdsMatch.Groups[1].Value, 'SRC-[A-Za-z0-9]+')) {
            $sourceId = $sourceIdMatch.Value
            if (-not $knownSourceIds.Contains($sourceId)) {
                [void]$errors.Add("Unknown source_id '$sourceId': $relativeWikiFile")
            }
        }
    }
}

Write-Host "Knowledge lint summary: Markdown=$($markdownFiles.Count), Wiki=$($wikiFiles.Count), Sources=$($knownSourceIds.Count), Warnings=$($warnings.Count), Errors=$($errors.Count)"

foreach ($warning in $warnings) {
    Write-Warning $warning
}
foreach ($lintError in $errors) {
    Write-Error $lintError -ErrorAction Continue
}

if ($errors.Count -gt 0) {
    throw "Knowledge lint failed with $($errors.Count) error(s)."
}

Write-Host 'Knowledge lint: PASS'
