#!/usr/bin/env bash
# =============================================================================
# install-saas-zero.sh - One-click installer for Zero-Risk SaaS Stack
# =============================================================================
# Installs: Node.js 20+ check, Supabase CLI, Cloudflare Wrangler, Stripe CLI
# Claude Code skills/agents ship with the repo (.claude/) — no external install.
# Sets up project structure and initializes git
# Cross-platform: macOS, Linux, WSL
# Idempotent: safe to run multiple times
# =============================================================================

set -euo pipefail

# Script metadata
readonly SCRIPT_NAME="install-saas-zero.sh"
readonly SCRIPT_VERSION="1.0.0"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly REQUIRED_NODE_VERSION="20"
readonly PROJECT_DIRS=(
    ".claude/skills"
    ".claude/agents"
    ".claude/commands"
    ".claude/hooks"
    ".claude/scripts"
    ".github/workflows"
    "supabase"
    "workers"
)

# Flags
DRY_RUN=false
VERBOSE=false
SKIP_CLI_TOOLS=false
SKIP_PROJECT=false
SKIP_GIT=false

# =============================================================================
# Logging Functions
# =============================================================================
log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_debug() {
    if [[ "$VERBOSE" == "true" ]]; then
        echo -e "${CYAN}[DEBUG]${NC} $*"
    fi
}

log_step() {
    echo -e "\n${CYAN}==>${NC} $*"
}

# =============================================================================
# Helper Functions
# =============================================================================
show_help() {
    cat << EOF
Usage: $SCRIPT_NAME [OPTIONS]

One-click installer for Zero-Risk SaaS Stack (TanStack Start + Supabase + Cloudflare Pages + Stripe + Brevo)

OPTIONS:
    --dry-run           Show what would be done without executing
    --verbose           Enable verbose/debug output
    --skip-cli-tools    Skip Supabase, Wrangler, Stripe CLI installation
    --skip-project      Skip project structure setup
    --skip-git          Skip git initialization
    -h, --help          Show this help message
    -v, --version       Show version

EXAMPLES:
    $SCRIPT_NAME                    # Full installation
    $SCRIPT_NAME --dry-run          # Preview what would happen
    $SCRIPT_NAME --verbose          # Verbose output
    $SCRIPT_NAME --skip-cli-tools   # Skip external CLI tools

EOF
}

show_version() {
    echo "$SCRIPT_NAME version $SCRIPT_VERSION"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check if running in WSL
is_wsl() {
    [[ -f /proc/version ]] && grep -qi microsoft /proc/version
}

# Check if running on macOS
is_macos() {
    [[ "$(uname -s)" == "Darwin" ]]
}

# Check if running on Linux (including WSL and Git Bash/MSYS)
is_linux() {
    local uname_s
    uname_s=$(uname -s)
    [[ "$uname_s" == "Linux" ]] || [[ "$uname_s" == MINGW* ]] || [[ "$uname_s" == MSYS* ]] || [[ "$uname_s" == CYGWIN* ]]
}

# Get OS name
get_os() {
    if is_macos; then
        echo "macos"
    elif is_linux; then
        if is_wsl; then
            echo "wsl"
        else
            echo "linux"
        fi
    else
        echo "unknown"
    fi
}

# Run command with dry-run support
run_cmd() {
    local cmd="$1"
    local description="${2:-$cmd}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would execute: $description"
        log_debug "Command: $cmd"
        return 0
    fi
    
    log_debug "Executing: $description"
    log_debug "Command: $cmd"
    
    if eval "$cmd"; then
        log_debug "Command succeeded: $description"
        return 0
    else
        local exit_code=$?
        log_error "Command failed (exit code $exit_code): $description"
        return $exit_code
    fi
}

# Check if file exists
file_exists() {
    [[ -f "$1" ]]
}

# Check if directory exists
dir_exists() {
    [[ -d "$1" ]]
}

# Create directory if not exists
ensure_dir() {
    local dir="$1"
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create directory: $dir"
        return 0
    fi
    if [[ ! -d "$dir" ]]; then
        mkdir -p "$dir"
        log_debug "Created directory: $dir"
    else
        log_debug "Directory already exists: $dir"
    fi
}

# =============================================================================
# Installation Functions
# =============================================================================

check_node() {
    log_step "Checking Node.js version"
    
    if ! command_exists node; then
        log_error "Node.js is not installed"
        log_info "Please install Node.js ${REQUIRED_NODE_VERSION}+ from https://nodejs.org/"
        return 1
    fi
    
    local node_version
    node_version=$(node --version | sed 's/^v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)
    
    if [[ "$major_version" -ge "$REQUIRED_NODE_VERSION" ]]; then
        log_success "Node.js $node_version (>= ${REQUIRED_NODE_VERSION}) ✓"
        return 0
    else
        log_error "Node.js $node_version is below required version ${REQUIRED_NODE_VERSION}+"
        log_info "Please upgrade Node.js from https://nodejs.org/"
        return 1
    fi
}

check_npm() {
    log_step "Checking npm"
    
    if ! command_exists npm; then
        log_error "npm is not installed (should come with Node.js)"
        return 1
    fi
    
    local npm_version
    npm_version=$(npm --version)
    log_success "npm $npm_version ✓"
    return 0
}

install_supabase_cli() {
    log_step "Installing Supabase CLI"
    
    if command_exists supabase; then
        local version
        version=$(supabase --version 2>/dev/null | head -1)
        log_success "Supabase CLI already installed ($version) ✓"
        return 0
    fi
    
    local os
    os=$(get_os)
    
    case "$os" in
        macos)
            if command_exists brew; then
                run_cmd "brew install supabase/tap/supabase" "Install Supabase CLI via Homebrew"
            else
                log_error "Homebrew not found. Please install from https://brew.sh/"
                return 1
            fi
            ;;
        linux|wsl)
            # Try npm first, then fallback to binary
            if command_exists npm; then
                run_cmd "npm install -g supabase" "Install Supabase CLI via npm"
            else
                log_error "npm not available for Supabase CLI installation"
                return 1
            fi
            ;;
        *)
            log_error "Unsupported OS for Supabase CLI: $os"
            return 1
            ;;
    esac
    
    log_success "Supabase CLI installed ✓"
}

install_wrangler() {
    log_step "Installing Cloudflare Wrangler"
    
    if command_exists wrangler; then
        local version
        version=$(wrangler --version 2>/dev/null | head -1)
        log_success "Wrangler already installed ($version) ✓"
        return 0
    fi
    
    if command_exists npm; then
        run_cmd "npm install -g wrangler" "Install Wrangler via npm"
        log_success "Wrangler installed ✓"
    else
        log_error "npm not available for Wrangler installation"
        return 1
    fi
}

install_stripe_cli() {
    log_step "Installing Stripe CLI"
    
    if command_exists stripe; then
        local version
        version=$(stripe version 2>/dev/null | head -1)
        log_success "Stripe CLI already installed ($version) ✓"
        return 0
    fi
    
    local os
    os=$(get_os)
    
    case "$os" in
        macos)
            if command_exists brew; then
                run_cmd "brew install stripe/stripe-cli/stripe" "Install Stripe CLI via Homebrew"
            else
                log_error "Homebrew not found. Please install from https://brew.sh/"
                return 1
            fi
            ;;
        linux|wsl)
            # Try npm first
            if command_exists npm; then
                run_cmd "npm install -g stripe" "Install Stripe CLI via npm"
            else
                log_error "npm not available for Stripe CLI installation"
                return 1
            fi
            ;;
        *)
            log_error "Unsupported OS for Stripe CLI: $os"
            return 1
            ;;
    esac
    
    log_success "Stripe CLI installed ✓"
}

install_cli_tools() {
    log_step "Installing CLI tools (Supabase, Wrangler, Stripe)"
    
    if [[ "$SKIP_CLI_TOOLS" == "true" ]]; then
        log_info "Skipping CLI tools installation (--skip-cli-tools)"
        return 0
    fi
    
    install_supabase_cli
    install_wrangler
    install_stripe_cli
}

setup_project_structure() {
    log_step "Setting up project structure"
    
    if [[ "$SKIP_PROJECT" == "true" ]]; then
        log_info "Skipping project structure setup (--skip-project)"
        return 0
    fi
    
    for dir in "${PROJECT_DIRS[@]}"; do
        ensure_dir "$dir"
    done
    
    log_success "Project structure created ✓"
}

create_env_example() {
    log_step "Creating .env.example"
    
    local env_file=".env.example"
    
    if file_exists "$env_file" && [[ "$DRY_RUN" != "true" ]]; then
        log_info ".env.example already exists, skipping"
        return 0
    fi
    
    cat > "$env_file" << 'EOF'
# Zero-Risk SaaS Stack - Environment Variables Template
# Copy this file to .env and fill in your values
# NEVER commit .env to version control!

# =============================================================================
# APPLICATION
# =============================================================================
NODE_ENV=development
APP_URL=http://localhost:3000
APP_NAME="Zero-Risk SaaS"

# =============================================================================
# SUPABASE
# =============================================================================
# Get these from your Supabase project dashboard: https://supabase.com/dashboard
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_JWT_SECRET=your-jwt-secret

# =============================================================================
# DATABASE (Supabase Postgres)
# =============================================================================
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
DIRECT_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# =============================================================================
# AUTH
# =============================================================================
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-auth-secret-generate-with-openssl-rand-base64-32
AUTH_URL=http://localhost:3000/api/auth

# OAuth Providers (optional)
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# =============================================================================
# STRIPE
# =============================================================================
# Get these from Stripe Dashboard: https://dashboard.stripe.com/apikeys
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# Stripe Price IDs (create products in Stripe Dashboard)
STRIPE_PRICE_ID_MONTHLY=price_monthly
STRIPE_PRICE_ID_YEARLY=price_yearly

# =============================================================================
# BREVO (Email)
# =============================================================================
# Get from Brevo Dashboard: https://app.brevo.com/settings/keys
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME="Zero-Risk SaaS"

# =============================================================================
# CLOUDFLARE
# =============================================================================
# Get from Cloudflare Dashboard: https://dash.cloudflare.com/profile/api-tokens
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ZONE_ID=your-zone-id

# Cloudflare Pages
CLOUDFLARE_PAGES_PROJECT_NAME=zero-risk-saas

# =============================================================================
# FEATURE FLAGS
# =============================================================================
ENABLE_BILLING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_ANALYTICS=false

# =============================================================================
# OPTIONAL: Analytics / Monitoring
# =============================================================================
# POSTHOG_API_KEY=
# SENTRY_DSN=
EOF
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create .env.example"
    else
        log_success ".env.example created ✓"
    fi
}

init_git() {
    log_step "Initializing git repository"
    
    if [[ "$SKIP_GIT" == "true" ]]; then
        log_info "Skipping git initialization (--skip-git)"
        return 0
    fi
    
    if dir_exists ".git"; then
        log_info "Git repository already initialized ✓"
        return 0
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would initialize git repository"
        return 0
    fi
    
    run_cmd "git init" "Initialize git repository"
    run_cmd "git add ." "Stage all files"
    run_cmd "git commit -m 'chore: initial commit from install-saas-zero.sh'" "Create initial commit"
    
    log_success "Git repository initialized ✓"
}

create_gitignore() {
    log_step "Creating .gitignore"
    
    local gitignore_file=".gitignore"
    
    if file_exists "$gitignore_file" && [[ "$DRY_RUN" != "true" ]]; then
        log_info ".gitignore already exists, skipping"
        return 0
    fi
    
    cat > "$gitignore_file" << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/

# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Supabase
supabase/.temp/
supabase/functions/**/node_modules/

# Cloudflare
.wrangler/
worker-configuration.d.ts

# Misc
*.tsbuildinfo
.eslintcache
.stylelintcache
EOF
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create .gitignore"
    else
        log_success ".gitignore created ✓"
    fi
}

create_readme() {
    log_step "Creating README.md"
    
    local readme_file="README.md"
    
    if file_exists "$readme_file" && [[ "$DRY_RUN" != "true" ]]; then
        log_info "README.md already exists, skipping"
        return 0
    fi
    
    cat > "$readme_file" << 'EOF'
# Zero-Risk SaaS Stack

> **Zero-cost MVP for solo founders** — TanStack Start + Supabase + Cloudflare Pages + Stripe + Brevo

## 🚀 Quick Start

```bash
# One-click installation
./install-saas-zero.sh

# Or with options
./install-saas-zero.sh --dry-run    # Preview changes
./install-saas-zero.sh --verbose    # Verbose output
```

## 📦 Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | TanStack Start | Full-stack React framework |
| **Database/Auth** | Supabase | Postgres + Auth + Realtime |
| **Hosting** | Cloudflare Pages | Edge hosting + Functions |
| **Payments** | Stripe | Subscriptions + Checkout |
| **Email** | Brevo | Transactional emails |
| **AI Assistant** | Claude Code | Development workflow automation |

## 🛠️ Project Structure

```
.
├── .claude/              # Claude Code configuration
│   ├── skills/           # Custom skills
│   ├── agents/           # Agent definitions
│   ├── commands/         # Custom commands
│   ├── hooks/            # Git hooks
│   └── scripts/          # Utility scripts
├── .github/workflows/    # CI/CD pipelines
├── supabase/             # Supabase config & migrations
├── workers/              # Cloudflare Workers
├── src/                  # Application source
└── install-saas-zero.sh  # This installer
```

## ⚙️ Configuration

1. Copy `.env.example` to `.env`
2. Fill in your credentials:
   - Supabase project keys
   - Stripe API keys
   - Brevo API key
   - Cloudflare credentials

## 📋 Available Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

# Database
npm run db:push          # Push schema to Supabase
npm run db:studio        # Open Supabase Studio

# Deployment
npm run deploy:pages     # Deploy to Cloudflare Pages
npm run deploy:workers   # Deploy Cloudflare Workers

# Testing
npm run test             # Run tests
npm run test:e2e         # Run E2E tests
npm run lint             # Lint code
```

## 🤖 Claude Code Skills & Agents

Skills et agents livrés dans `.claude/` — aucun install externe :

- `/ns-ship` — Pipeline discovery → deploy (sous-agents Claude Code)
- `/ns-verify` — Les 14 quality gates déterministes
- `/ns-doctor` — Diagnostic de la toolchain (env, CLI, services)
- `/ns-design` — Design system, tokens, composants
- Agents `saas-*` — core, auth, billing, ui, qa, perf, compliance

## 📚 Documentation

- [TanStack Start](https://tanstack.com/start)
- [Supabase](https://supabase.com/docs)
- [Cloudflare Pages](https://pages.cloudflare.com/docs)
- [Stripe](https://stripe.com/docs)
- [Brevo](https://developers.brevo.com/)
- [Claude Code](https://docs.anthropic.com/en/docs/claude-code)

## 💰 Cost Breakdown (Monthly)

| Service | Free Tier | Paid Tier |
|---------|-----------|-----------|
| Supabase | 500MB DB, 1GB bandwidth | $25/mo Pro |
| Cloudflare Pages | Unlimited | $20/mo Pro |
| Stripe | 2.9% + 30¢/txn | Same |
| Brevo | 300 emails/day | $25/mo Starter |
| **Total** | **$0** | **~$70/mo** |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Run `./install-saas-zero.sh` to set up
4. Make changes with tests
5. Submit a PR

## 📄 License

MIT License — feel free to use for your own projects!
EOF
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create README.md"
    else
        log_success "README.md created ✓"
    fi
}

verify_installation() {
    log_step "Verifying installation"
    
    local all_good=true
    
    # Check Node.js
    if command_exists node; then
        local node_version
        node_version=$(node --version)
        log_success "Node.js: $node_version ✓"
    else
        log_error "Node.js: NOT FOUND"
        all_good=false
    fi
    
    # Check npm
    if command_exists npm; then
        local npm_version
        npm_version=$(npm --version)
        log_success "npm: $npm_version ✓"
    else
        log_error "npm: NOT FOUND"
        all_good=false
    fi
    
    # Check Claude Code
    if command_exists claude; then
        local claude_version
        claude_version=$(claude --version 2>/dev/null || echo "unknown")
        log_success "Claude Code: $claude_version ✓"
    else
        log_warning "Claude Code: NOT FOUND (pipelines ns-* ne fonctionneront pas sans lui)"
    fi

    # Check Supabase CLI
    if command_exists supabase; then
        local version
        version=$(supabase --version 2>/dev/null | head -1)
        log_success "Supabase CLI: $version ✓"
    else
        log_warning "Supabase CLI: NOT INSTALLED"
    fi
    
    # Check Wrangler
    if command_exists wrangler; then
        local version
        version=$(wrangler --version 2>/dev/null | head -1)
        log_success "Wrangler: $version ✓"
    else
        log_warning "Wrangler: NOT INSTALLED"
    fi
    
    # Check Stripe CLI
    if command_exists stripe; then
        local version
        version=$(stripe version 2>/dev/null | head -1)
        log_success "Stripe CLI: $version ✓"
    else
        log_warning "Stripe CLI: NOT INSTALLED"
    fi
    
    # Check project structure
    local missing_dirs=()
    for dir in "${PROJECT_DIRS[@]}"; do
        if [[ ! -d "$dir" ]]; then
            missing_dirs+=("$dir")
        fi
    done
    
    if [[ ${#missing_dirs[@]} -eq 0 ]]; then
        log_success "Project structure: All directories exist ✓"
    else
        log_warning "Project structure: Missing directories: ${missing_dirs[*]}"
        all_good=false
    fi
    
    # Check .env.example
    if file_exists ".env.example"; then
        log_success ".env.example: EXISTS ✓"
    else
        log_warning ".env.example: MISSING"
        all_good=false
    fi
    
    # Check git
    if dir_exists ".git"; then
        log_success "Git: INITIALIZED ✓"
    else
        log_warning "Git: NOT INITIALIZED"
    fi
    
    echo
    if [[ "$all_good" == "true" ]]; then
        log_success "All checks passed! 🎉"
        return 0
    else
        log_warning "Some components need attention (see above)"
        return 1
    fi
}

# =============================================================================
# Main Function
# =============================================================================
main() {
    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                shift
                ;;
            --skip-cli-tools)
                SKIP_CLI_TOOLS=true
                shift
                ;;
            --skip-project)
                SKIP_PROJECT=true
                shift
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                show_version
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Print banner
    echo -e "${CYAN}"
    cat << 'EOF'
╔══════════════════════════════════════════════════════════════════════════════╗
║                    install-saas-zero.sh v1.0.0                              ║
║              Zero-Risk SaaS Stack One-Click Installer                       ║
║         TanStack Start + Supabase + Cloudflare + Stripe + Brevo            ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY-RUN MODE: No changes will be made"
    fi
    
    log_info "OS: $(get_os)"
    log_info "Working directory: $(pwd)"
    echo
    
    # Run installation steps
    local failed=false
    
    check_node || failed=true
    check_npm || failed=true
    
    if [[ "$failed" == "true" ]]; then
        log_error "Prerequisites not met. Please install Node.js ${REQUIRED_NODE_VERSION}+ first."
        exit 1
    fi
    
    # Claude Code skills/agents livrés avec le repo (.claude/) — pas d'installation externe.
    install_cli_tools || failed=true
    setup_project_structure || failed=true
    create_env_example || failed=true
    create_gitignore || failed=true
    create_readme || failed=true
    init_git || failed=true
    
    echo
    verify_installation
    
    echo
    log_step "Next Steps"
    echo "  1. Copy .env.example to .env and fill in your credentials"
    echo "  2. Run 'npm install' to install project dependencies"
    echo "  3. Run 'supabase init' to initialize Supabase (if not done)"
    echo "  4. Run 'wrangler login' to authenticate Cloudflare"
    echo "  5. Run 'stripe login' to authenticate Stripe"
    echo "  6. Start developing with 'npm run dev'"
    echo
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry-run complete. Run without --dry-run to execute."
    else
        log_success "Installation complete! 🚀"
    fi
}

# Run main function
main "$@"