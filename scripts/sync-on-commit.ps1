# PostToolUse hook: trigger on git add, map staged .ts files to CLAUDE.md targets
$stdin = $input | Out-String
if (-not $stdin) { exit 0 }

try {
    $data = $stdin | ConvertFrom-Json
    $command = $data.tool_input.command
    if (-not $command -or $command -notlike "*git add*") { exit 0 }
} catch {
    exit 0
}

$gitStatus = git status --short 2>$null
if (-not $gitStatus) { exit 0 }

$mapping = @{
    'server/src/auth/'             = 'server/src/auth/CLAUDE.md'
    'server/src/session/'          = 'server/src/session/CLAUDE.md'
    'server/src/turn/'             = 'server/src/turn/CLAUDE.md'
    'server/src/ai/'               = 'server/src/ai/CLAUDE.md'
    'server/src/common/'           = 'server/src/common/CLAUDE.md'
    'server/src/report/'           = 'server/CLAUDE.md'
    'server/src/user/'             = 'server/CLAUDE.md'
    'server/src/prisma/'           = 'server/CLAUDE.md'
    'server/src/config/'           = 'server/CLAUDE.md'
    'client/lib/'                  = 'client/lib/CLAUDE.md'
    'client/components/interview/' = 'client/components/interview/CLAUDE.md'
    'client/components/report/'    = 'client/components/report/CLAUDE.md'
    'client/app/(app)/sessions/'   = 'client/app/(app)/sessions/CLAUDE.md'
}

$targets = [System.Collections.Generic.HashSet[string]]::new()

foreach ($line in ($gitStatus -split "`n")) {
    $line = $line.Trim()
    if (-not $line) { continue }
    $filePath = ($line -replace '^[MAD?! ]+\s+', '').Trim().Replace('\', '/')
    if ($filePath -notmatch '\.(ts|tsx)$') { continue }
    if ($filePath -match '\.(spec|test)\.(ts|tsx)$') { continue }
    if ($filePath -match 'CLAUDE\.md') { continue }
    foreach ($prefix in $mapping.Keys) {
        if ($filePath -like "*$prefix*") {
            [void]$targets.Add($mapping[$prefix])
            break
        }
    }
}

if ($targets.Count -eq 0) { exit 0 }

$targetList = ($targets | Sort-Object) -join ', '
Write-Host "[CLAUDE.md-SYNC] git add phat hien $($targets.Count) target can sync: $targetList. Cap nhat truoc khi commit."
