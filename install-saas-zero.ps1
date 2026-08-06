<# 
.SYNOPSIS
    Zero-Risk SaaS Stack Windows Installer
    Installs and configures the complete Zero-Risk SaaS development stack on Windows.

.DESCRIPTION
    This script installs and configures:
    - Node.js 20+ (check only, uses existing if present)
    - Hermes CLI
    - Required Hermes skills for SaaS development
    - Supabase CLI
    - Cloudflare Wrangler
    - Stripe CLI
    - Project structure (.claude, .github, supabase, workers)
    - .env.example template
    - Git initialization

    Idempotent: Can be run multiple times safely.
    Handles SmartScreen and ExecutionPolicy warnings.

.PARAMETER DryRun
    If specified, shows what would be done without making changes.

.PARAMETER Verbose
    Show detailed output.

.EXAMPLE
    .\install-saas-zero.ps1
    
.EXAMPLE
    .\install-saas-zero.ps1 -DryRun -Verbose

.NOTES
    Author: Zero-Risk SaaS Stack
    Requires: PowerShell 5.1+ (Windows) or PowerShell 7+ (cross-platform)
    Run as Administrator for best results (some installs may require elevation)
#>

[CmdletBinding()]
param(
    [Parameter(Mandatory=$false)]
    [switch]$DryRun,

    [Parameter(Mandatory=$false)]
    [switch]$Verbose,

    [Parameter(Mandatory=$false)]
    [string]$ProjectRoot = (Get-Location).Path
)

# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

# Colors for output
$Colors = @{
    Reset   = "`e[0m"
    Red     = "`e[31m"
    Green   = "`e[32m"
    Yellow  = "`e[33m"
    Blue    = "`e[34m"
    Cyan    = "`e[36m"
    White   = "`e[37m"
    Bold    = "`e[1m"
    Dim     = "`e[2m"
}

# Required Hermes skills
$RequiredSkills = @(
    'plan',
    'subagent-driven-development',
    'test-driven-development',
    'requesting-code-review',
    'site-qa',
    'systematic-debugging',
    'writing-plans',
    'ckm:design-system',
    'ckm:ui-styling',
    'ckm:brand',
    'popular-web-designs',
    'architecture-diagram'
)

# Project directories to create
$ProjectDirs = @(
    '.claude\skills',
    '.claude\agents',
    '.claude\commands',
    '.claude\hooks',
    '.claude\scripts',
    '.github\workflows',
    'supabase',
    'workers'
)

# CLI tools to verify/install
$CliTools = @{
    'node' = @{
        MinVersion = '20.0.0'
        CheckCommand = 'node --version'
        InstallHint = 'Download from https://nodejs.org/ or use winget install OpenJS.NodeJS'
    }
    'npm' = @{
        MinVersion = '10.0.0'
        CheckCommand = 'npm --version'
        InstallHint = 'Installed with Node.js'
    }
    'hermes' = @{
        CheckCommand = 'hermes --version'
        InstallHint = 'pip install hermes-agent or see https://hermes-agent.nousresearch.com/docs'
    }
    'supabase' = @{
        CheckCommand = 'supabase --version'
        InstallHint = 'winget install Supabase.CLI or scoop install supabase'
    }
    'wrangler' = @{
        CheckCommand = 'wrangler --version'
        InstallHint = 'npm install -g wrangler'
    }
    'stripe' = @{
        CheckCommand = 'stripe --version'
        InstallHint = 'winget install Stripe.StripeCLI or scoop install stripe'
    }
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info','Success','Warning','Error','Debug')]
        [string]$Level = 'Info',
        [switch]$NoPrefix
    )
    
    $prefix = if ($NoPrefix) { '' } else { "[$(Get-Date -Format 'HH:mm:ss')] " }
    $color = $Colors[$Level]
    $reset = $Colors.Reset
    
    $formatted = "${prefix}${color}${Message}${reset}"
    
    switch ($Level) {
        'Error' { Write-Error $formatted }
        'Warning' { Write-Warning $formatted }
        'Debug' { if ($Verbose) { Write-Host $formatted } }
        default { Write-Host $formatted }
    }
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "${Colors.Cyan}${Colors.Bold}═══ $Title ═══${Colors.Reset}"
}

function Test-Command {
    param([string]$Command)
    try {
        $null = & $Command 2>$null
        return $true
    } catch {
        return $false
    }
}

function Get-Version {
    param([string]$Command)
    try {
        $output = & $Command 2>$null
        return $output.Trim()
    } catch {
        return $null
    }
}

function Compare-Version {
    param(
        [string]$Current,
        [string]$Minimum
    )
    try {
        $currentVer = [version]$Current
        $minVer = [version]$Minimum
        return $currentVer -ge $minVer
    } catch {
        return $false
    }
}

function Invoke-DryRunOrReal {
    param(
        [string]$Action,
        [scriptblock]$ScriptBlock,
        [switch]$Force = $false
    )
    
    if ($DryRun -and -not $Force) {
        Write-Log "DRY-RUN: $Action" -Level 'Debug'
        return $true
    }
    
    try {
        & $ScriptBlock
        return $true
    } catch {
        Write-Log "Failed: $Action - $($_.Exception.Message)" -Level 'Error'
        return $false
    }
}

function Ensure-Directory {
    param([string]$Path)
    
    $fullPath = Join-Path $ProjectRoot $Path
    
    if (-not (Test-Path $fullPath)) {
        Invoke-DryRunOrReal "Create directory: $Path" {
            New-Item -ItemType Directory -Path $fullPath -Force | Out-Null
        }
        Write-Log "Created directory: $Path" -Level 'Success'
    } else {
        Write-Log "Directory exists: $Path" -Level 'Debug'
    }
}

function Check-ExecutionPolicy {
    $policy = Get-ExecutionPolicy -Scope CurrentUser
    if ($policy -in @('Restricted', 'AllSigned', 'RemoteSigned')) {
        Write-Log "ExecutionPolicy is '$policy' - script may be blocked" -Level 'Warning'
        Write-Log "Run: Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force" -Level 'Info'
        if (-not $DryRun) {
            $response = Read-Host "Continue anyway? (y/N)"
            if ($response -notin @('y','Y','yes','Yes')) {
                throw "Installation aborted by user due to ExecutionPolicy"
            }
        }
    }
}

function Check-SmartScreen {
    $zone = (Get-Item $PSCommandPath).ZoneIdentifier 2>$null
    if ($zone -and $zone -match '3|4') {
        Write-Log "File may have been downloaded from internet (Zone: $zone)" -Level 'Warning'
        Write-Log "If blocked by SmartScreen: Right-click > Properties > Unblock > Apply" -Level 'Info'
    }
}

# ============================================================================
# INSTALLATION FUNCTIONS
# ============================================================================

function Check-Prerequisites {
    Write-Section "Checking Prerequisites"
    
    $allOk = $true
    
    foreach ($tool in $CliTools.Keys) {
        $info = $CliTools[$tool]
        Write-Log "Checking $tool..." -Level 'Debug'
        
        $version = Get-Version $info.CheckCommand
        
        if ($version) {
            $versionClean = $version -replace '^v', ''
            Write-Log "$tool found: $version" -Level 'Success'
            
            if ($info.MinVersion) {
                if (Compare-Version $versionClean $info.MinVersion) {
                    Write-Log "$tool version $versionClean meets minimum $($info.MinVersion)" -Level 'Success'
                } else {
                    Write-Log "$tool version $versionClean is below minimum $($info.MinVersion)" -Level 'Warning'
                    $allOk = $false
                }
            }
        } else {
            Write-Log "$tool NOT found" -Level 'Error'
            Write-Log "  Install hint: $($info.InstallHint)" -Level 'Info'
            $allOk = $false
        }
    }
    
    if (Test-Command 'git --version') {
        Write-Log "git found: $(git --version)" -Level 'Success'
    } else {
        Write-Log "git NOT found - install from https://git-scm.com/" -Level 'Error'
        $allOk = $false
    }
    
    if (Test-Command 'winget --version') {
        Write-Log "winget available" -Level 'Success'
    } elseif (Test-Command 'scoop --version') {
        Write-Log "scoop available" -Level 'Success'
    } else {
        Write-Log "Neither winget nor scoop found - manual installs may be needed" -Level 'Warning'
    }
    
    return $allOk
}

function Install-HermesSkills {
    Write-Section "Installing Hermes Skills"
    
    $installed = 0
    $skipped = 0
    $failed = 0
    
    foreach ($skill in $RequiredSkills) {
        Write-Log "Checking skill: $skill..." -Level 'Debug'
        
        $skillList = hermes skills list 2>$null
        if ($skillList -and $skillList -match [regex]::Escape($skill)) {
            Write-Log "Skill already installed: $skill" -Level 'Success'
            $skipped++
            continue
        }
        
        Invoke-DryRunOrReal "Install skill: $skill" {
            $result = hermes skill install $skill 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Log "Installed skill: $skill" -Level 'Success'
                $installed++
            } else {
                Write-Log "Failed to install skill: $skill - $result" -Level 'Error'
                $failed++
            }
        } -Force:$true
    }
    
    Write-Log "Skills: $installed installed, $skipped skipped, $failed failed" -Level 'Info'
    return $failed -eq 0
}

function Install-SupabaseCLI {
    Write-Section "Installing Supabase CLI"
    
    if (Test-Command 'supabase --version') {
        Write-Log "Supabase CLI already installed: $(supabase --version)" -Level 'Success'
        return $true
    }
    
    if (Test-Command 'winget --version') {
        Invoke-DryRunOrReal "Install Supabase CLI via winget" {
            winget install --id Supabase.CLI --silent --accept-source-agreements --accept-package-agreements
        }
        if (Test-Command 'supabase --version') {
            Write-Log "Supabase CLI installed via winget" -Level 'Success'
            return $true
        }
    }
    
    if (Test-Command 'scoop --version') {
        Invoke-DryRunOrReal "Install Supabase CLI via scoop" {
            scoop install supabase
        }
        if (Test-Command 'supabase --version') {
            Write-Log "Supabase CLI installed via scoop" -Level 'Success'
            return $true
        }
    }
    
    Invoke-DryRunOrReal "Install Supabase CLI via npm" {
        npm install -g supabase
    }
    
    if (Test-Command 'supabase --version') {
        Write-Log "Supabase CLI installed: $(supabase --version)" -Level 'Success'
        return $true
    } else {
        Write-Log "Failed to install Supabase CLI" -Level 'Error'
        return $false
    }
}

function Install-Wrangler {
    Write-Section "Installing Cloudflare Wrangler"
    
    if (Test-Command 'wrangler --version') {
        Write-Log "Wrangler already installed: $(wrangler --version)" -Level 'Success'
        return $true
    }
    
    Invoke-DryRunOrReal "Install Wrangler via npm" {
        npm install -g wrangler
    }
    
    if (Test-Command 'wrangler --version') {
        Write-Log "Wrangler installed: $(wrangler --version)" -Level 'Success'
        return $true
    } else {
        Write-Log "Failed to install Wrangler" -Level 'Error'
        return $false
    }
}

function Install-StripeCLI {
    Write-Section "Installing Stripe CLI"
    
    if (Test-Command 'stripe --version') {
        Write-Log "Stripe CLI already installed: $(stripe --version)" -Level 'Success'
        return $true
    }
    
    if (Test-Command 'winget --version') {
        Invoke-DryRunOrReal "Install Stripe CLI via winget" {
            winget install --id Stripe.StripeCLI --silent --accept-source-agreements --accept-package-agreements
        }
        if (Test-Command 'stripe --version') {
            Write-Log "Stripe CLI installed via winget" -Level 'Success'
            return $true
        }
    }
    
    if (Test-Command 'scoop --version') {
        Invoke-DryRunOrReal "Install Stripe CLI via scoop" {
            scoop install stripe
        }
        if (Test-Command 'stripe --version') {
            Write-Log "Stripe CLI installed via scoop" -Level 'Success'
            return $true
        }
    }
    
    Write-Log "Stripe CLI not installed - manual install required:" -Level 'Warning'
    Write-Log "  Windows: https://stripe.com/docs/stripe-cli#install" -Level 'Info'
    Write-Log "  Or: scoop install stripe" -Level 'Info'
    return $false
}

function Setup-ProjectStructure {
    Write-Section "Setting Up Project Structure"
    
    foreach ($dir in $ProjectDirs) {
        Ensure-Directory $dir
    }
    
    Write-Log "Project structure created" -Level 'Success'
    return $true
}

function Create-EnvExample {
    Write-Section "Creating .env.example"
    
    $envPath = Join-Path $ProjectRoot '.env.example'
    
    if (Test-Path $envPath) {
        Write-Log ".env.example already exists" -Level 'Success'
        return $true
    }
    
    $envContent = @"
# Zero-Risk SaaS Stack - Environment Variables Template
# Copy this file to .env and fill in your values
# NEVER commit .env to version control!

# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development
APP_URL=http://localhost:3000
APP_NAME=""Zero-Risk SaaS""

# =============================================================================
# SUPABASE (Database & Auth)
# =============================================================================
# Get these from: https://supabase.com/dashboard/project/_/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_PASSWORD=your-db-password

# =============================================================================
# DATABASE (PostgreSQL via Supabase)
# =============================================================================
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:your-db-password@db.your-project.supabase.co:5432/postgres

# =============================================================================
# CLOUDFLARE (Workers & Pages)
# =============================================================================
# Get from: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ZONE_ID=your-zone-id
CLOUDFLARE_PAGES_PROJECT_NAME=your-pages-project

# =============================================================================
# STRIPE (Payments)
# =============================================================================
# Get from: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID_MONTHLY=price_your-monthly-price-id
STRIPE_PRICE_ID_YEARLY=price_your-yearly-price-id

# =============================================================================
# BREVO (Email - formerly Sendinblue)
# =============================================================================
# Get from: https://app.brevo.com/settings/keys
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=""Zero-Risk SaaS""

# =============================================================================
# AUTH & SECURITY
# =============================================================================
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-32-chars-min
NEXTAUTH_URL=http://localhost:3000

# =============================================================================
# OPTIONAL: ANALYTICS & MONITORING
# =============================================================================
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# SENTRY_DSN=https://xxx@sentry.io/xxx

# =============================================================================
# OPTIONAL: FEATURE FLAGS
# =============================================================================
ENABLE_BILLING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_ANALYTICS=false
"@
    
    Invoke-DryRunOrReal "Create .env.example" {
        Set-Content -Path $envPath -Value $envContent -Encoding UTF8
    }
    
    Write-Log ".env.example created" -Level 'Success'
    return $true
}

function Initialize-Git {
    Write-Section "Initializing Git Repository"
    
    $gitDir = Join-Path $ProjectRoot '.git'
    
    if (Test-Path $gitDir) {
        Write-Log "Git repository already initialized" -Level 'Success'
        return $true
    }
    
    Invoke-DryRunOrReal "Initialize git repository" {
        git init
        git config user.name "Zero-Risk SaaS Developer"
        git config user.email "dev@saas-zero.local"
        
        $gitignore = @"
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
.next/
out/
build/
dist/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Supabase
.supabase/

# Wrangler
.wrangler/

# Misc
*.tsbuildinfo
.eslintcache
"@
        Set-Content -Path (Join-Path $ProjectRoot '.gitignore') -Value $gitignore -Encoding UTF8
        
        git add .gitignore
        git commit -m "chore: initial commit - Zero-Risk SaaS Stack setup"
    }
    
    Write-Log "Git repository initialized" -Level 'Success'
    return $true
}

function Verify-Installation {
    Write-Section "Verifying Installation"
    
    $checks = @(
        @{ Name = 'Node.js'; Cmd = 'node --version'; MinVer = '20.0.0' }
        @{ Name = 'npm'; Cmd = 'npm --version'; MinVer = '10.0.0' }
        @{ Name = 'Hermes'; Cmd = 'hermes --version' }
        @{ Name = 'Supabase CLI'; Cmd = 'supabase --version' }
        @{ Name = 'Wrangler'; Cmd = 'wrangler --version' }
        @{ Name = 'Stripe CLI'; Cmd = 'stripe --version' }
        @{ Name = 'Git'; Cmd = 'git --version' }
    )
    
    $passed = 0
    $failed = 0
    
    foreach ($check in $checks) {
        $version = Get-Version $check.Cmd
        if ($version) {
            $versionClean = $version -replace '^v', ''
            if ($check.MinVer) {
                if (Compare-Version $versionClean $check.MinVer) {
                    Write-Log "$($check.Name): $version ✓" -Level 'Success'
                    $passed++
                } else {
                    Write-Log "$($check.Name): $version (minimum: $($check.MinVer)) ✗" -Level 'Error'
                    $failed++
                }
            } else {
                Write-Log "$($check.Name): $version ✓" -Level 'Success'
                $passed++
            }
        } else {
            Write-Log "$($check.Name): NOT FOUND ✗" -Level 'Error'
            $failed++
        }
    }
    
    Write-Log "" -Level 'Info'
    Write-Log "Verifying Hermes skills..." -Level 'Info'
    $skillList = hermes skills list 2>$null
    $skillPassed = 0
    $skillFailed = 0
    
    foreach ($skill in $RequiredSkills) {
        if ($skillList -match [regex]::Escape($skill)) {
            Write-Log "  Skill: $skill ✓" -Level 'Success'
            $skillPassed++
        } else {
            Write-Log "  Skill: $skill ✗" -Level 'Error'
            $skillFailed++
        }
    }
    
    Write-Log "" -Level 'Info'
    Write-Log "CLI Tools: $passed passed, $failed failed" -Level 'Info'
    Write-Log "Hermes Skills: $skillPassed passed, $skillFailed failed" -Level 'Info'
    
    return ($failed -eq 0 -and $skillFailed -eq 0)
}

# ============================================================================
# MAIN ENTRY POINT
# ============================================================================

function Main {
    Write-Host "${Colors.Cyan}${Colors.Bold}"
    Write-Host "╔══════════════════════════════════════════════════════════════╗"
    Write-Host "║       Zero-Risk SaaS Stack - Windows Installer              ║"
    Write-Host "║       TanStack Start + Supabase + Cloudflare + Stripe       ║"
    Write-Host "╚══════════════════════════════════════════════════════════════╝"
    Write-Host "${Colors.Reset}"
    
    if ($DryRun) {
        Write-Log "DRY-RUN MODE - No changes will be made" -Level 'Warning'
    }
    
    Write-Log "Project root: $ProjectRoot" -Level 'Info'
    
    Check-ExecutionPolicy
    Check-SmartScreen
    
    $steps = @(
        @{ Name = 'Prerequisites'; Fn = { Check-Prerequisites } }
        @{ Name = 'Hermes Skills'; Fn = { Install-HermesSkills } }
        @{ Name = 'Supabase CLI'; Fn = { Install-SupabaseCLI } }
        @{ Name = 'Cloudflare Wrangler'; Fn = { Install-Wrangler } }
        @{ Name = 'Stripe CLI'; Fn = { Install-StripeCLI } }
        @{ Name = 'Project Structure'; Fn = { Setup-ProjectStructure } }
        @{ Name = '.env.example'; Fn = { Create-EnvExample } }
        @{ Name = 'Git Repository'; Fn = { Initialize-Git } }
        @{ Name = 'Verification'; Fn = { Verify-Installation } }
    )
    
    $overallSuccess = $true
    
    foreach ($step in $steps) {
        Write-Log "" -Level 'Info'
        $success = & $step.Fn
        if (-not $success) {
            Write-Log "Step failed: $($step.Name)" -Level 'Error'
            $overallSuccess = $false
            if (-not $DryRun) {
                $response = Read-Host "Continue with remaining steps? (y/N)"
                if ($response -notin @('y','Y','yes','Yes')) {
                    break
                }
            }
        }
    }
    
    Write-Host ""
    Write-Host "${Colors.Cyan}${Colors.Bold}═══ Installation Complete ═══${Colors.Reset}"
    
    if ($overallSuccess) {
        Write-Log "All steps completed successfully!" -Level 'Success'
        Write-Host ""
        Write-Log "Next steps:" -Level 'Info'
        Write-Log "  1. Copy .env.example to .env and fill in your credentials" -Level 'Info'
        Write-Log "  2. Run 'supabase init' to initialize Supabase project" -Level 'Info'
        Write-Log "  3. Run 'wrangler login' to authenticate with Cloudflare" -Level 'Info'
        Write-Log "  4. Run 'stripe login' to authenticate with Stripe" -Level 'Info'
        Write-Log "  5. Start building your SaaS!" -Level 'Info'
    } else {
        Write-Log "Some steps failed - review output above" -Level 'Warning'
        Write-Log "Re-run script to retry failed steps (idempotent)" -Level 'Info'
    }
    
    if ($DryRun) {
        Write-Log "This was a dry run - no changes were made" -Level 'Warning'
    }
    
    exit (if ($overallSuccess) { 0 } else { 1 })
}

Main