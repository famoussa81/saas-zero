#!/usr/bin/env bash
# =============================================================================
# scaffold-saas-zero.sh - Automated TanStack Start + Supabase + Cloudflare scaffolding
# =============================================================================
# Creates TanStack Start project with Cloudflare adapter (@tanstack/start-cloudflare)
# Initializes Supabase project locally (supabase init + supabase start)
# Sets up Cloudflare Pages config (wrangler.toml)
# Installs all dependencies: @supabase/supabase-js, @tanstack/react-query, stripe, @sendinblue/client
# Installs shadcn/ui with New York style + all base components
# Configures Tailwind v4 with @theme (design tokens injected later)
# Sets up project structure: src/app, src/components, src/lib, supabase, workers, .github/workflows
# Creates .env.local from .env.example template
# Runs supabase gen types to generate TypeScript types
# Initializes git with initial commit
# Idempotent (can run multiple times)
# =============================================================================

set -euo pipefail

# Script metadata
readonly SCRIPT_NAME="scaffold-saas-zero.sh"
readonly SCRIPT_VERSION="1.0.0"

# Colors for output
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m' # No Color

# Configuration
readonly PROJECT_NAME="zero-risk-saas"
readonly TANSTACK_START_VERSION="latest"

# Flags
DRY_RUN=false
VERBOSE=false
SKIP_TANSTACK=false
SKIP_SUPABASE=false
SKIP_CLOUDFLARE=false
SKIP_DEPS=false
SKIP_SHADCN=false
SKIP_TAILWIND=false
SKIP_TYPES=false
SKIP_GIT=false
FORCE=false

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

Automated TanStack Start + Supabase + Cloudflare scaffolding for Zero-Risk SaaS Stack

OPTIONS:
    --dry-run           Show what would be done without executing
    --verbose           Enable verbose/debug output
    --skip-tanstack     Skip TanStack Start project creation
    --skip-supabase     Skip Supabase initialization
    --skip-cloudflare   Skip Cloudflare Pages/Wrangler config
    --skip-deps         Skip dependency installation
    --skip-shadcn       Skip shadcn/ui installation
    --skip-tailwind     Skip Tailwind v4 configuration
    --skip-types        Skip Supabase TypeScript type generation
    --skip-git          Skip git initialization
    --force             Force re-run even if files exist (overwrites)
    -h, --help          Show this help message
    -v, --version       Show version

EXAMPLES:
    $SCRIPT_NAME                    # Full scaffolding
    $SCRIPT_NAME --dry-run          # Preview what would happen
    $SCRIPT_NAME --verbose          # Verbose output
    $SCRIPT_NAME --skip-deps        # Skip npm install
    $SCRIPT_NAME --force            # Force overwrite existing files

EOF
}

show_version() {
    echo "$SCRIPT_NAME version $SCRIPT_VERSION"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
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

# Write file with idempotency
write_file_if_missing() {
    local file_path="$1"
    local content="$2"
    local description="${3:-$file_path}"

    if file_exists "$file_path" && [[ "$FORCE" != "true" ]]; then
        log_info "$description already exists, skipping (use --force to overwrite)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create $description"
        return 0
    fi

    mkdir -p "$(dirname "$file_path")"
    echo "$content" > "$file_path"
    log_success "Created $description"
}

# =============================================================================
# Prerequisite Checks
# =============================================================================
check_prerequisites() {
    log_step "Checking prerequisites"

    local missing=()

    if ! command_exists node; then
        missing+=("node")
    fi

    if ! command_exists npm; then
        missing+=("npm")
    fi

    if ! command_exists npx; then
        missing+=("npx")
    fi

    if ! command_exists git; then
        missing+=("git")
    fi

    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required commands: ${missing[*]}"
        log_info "Please install: Node.js 20+, npm, git"
        return 1
    fi

    local node_version
    node_version=$(node --version | sed 's/^v//')
    local major_version
    major_version=$(echo "$node_version" | cut -d. -f1)

    if [[ "$major_version" -lt 20 ]]; then
        log_error "Node.js $node_version is below required version 20+"
        return 1
    fi

    log_success "Node.js $node_version ✓"
    log_success "npm $(npm --version) ✓"
    log_success "git $(git --version | cut -d' ' -f3) ✓"
    return 0
}

# =============================================================================
# TanStack Start Project Creation
# =============================================================================
create_tanstack_start_project() {
    log_step "Creating TanStack Start project with Cloudflare adapter"

    if [[ "$SKIP_TANSTACK" == "true" ]]; then
        log_info "Skipping TanStack Start creation (--skip-tanstack)"
        return 0
    fi

    if file_exists "package.json" && [[ "$FORCE" != "true" ]]; then
        log_info "package.json already exists, skipping TanStack Start creation (use --force to overwrite)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create TanStack Start project with Cloudflare adapter"
        return 0
    fi

    # Create TanStack Start project with Cloudflare adapter
    run_cmd "npx create-tanstack-app@latest $PROJECT_NAME --template=cloudflare --no-install" \
        "Create TanStack Start project with Cloudflare adapter"

    # Move contents to current directory if created in subdirectory
    if dir_exists "$PROJECT_NAME"; then
        log_info "Moving project files from $PROJECT_NAME to current directory"
        mv "$PROJECT_NAME"/* .
        mv "$PROJECT_NAME"/.* . 2>/dev/null || true
        rmdir "$PROJECT_NAME"
    fi

    log_success "TanStack Start project created ✓"
}

# =============================================================================
# Supabase Initialization
# =============================================================================
init_supabase() {
    log_step "Initializing Supabase project locally"

    if [[ "$SKIP_SUPABASE" == "true" ]]; then
        log_info "Skipping Supabase initialization (--skip-supabase)"
        return 0
    fi

    if ! command_exists supabase; then
        log_warning "Supabase CLI not found. Install with: npm install -g supabase"
        log_info "Skipping Supabase initialization"
        return 0
    fi

    if file_exists "supabase/config.toml" && [[ "$FORCE" != "true" ]]; then
        log_info "Supabase already initialized (config.toml exists), skipping (use --force to re-run)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would run: supabase init"
        log_info "[DRY-RUN] Would run: supabase start"
        return 0
    fi

    # Initialize Supabase
    run_cmd "supabase init" "Initialize Supabase project"

    # Start Supabase (requires Docker)
    if command_exists docker && docker info >/dev/null 2>&1; then
        run_cmd "supabase start" "Start Supabase local development"
    else
        log_warning "Docker not available or not running. Skipping 'supabase start'"
        log_info "Run 'supabase start' manually when Docker is available"
    fi

    log_success "Supabase initialized ✓"
}

# =============================================================================
# Cloudflare Pages Configuration
# =============================================================================
setup_cloudflare() {
    log_step "Setting up Cloudflare Pages configuration (wrangler.toml)"

    if [[ "$SKIP_CLOUDFLARE" == "true" ]]; then
        log_info "Skipping Cloudflare configuration (--skip-cloudflare)"
        return 0
    fi

    if file_exists "wrangler.toml" && [[ "$FORCE" != "true" ]]; then
        log_info "wrangler.toml already exists, skipping (use --force to overwrite)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would create wrangler.toml"
        return 0
    fi

    cat > wrangler.toml << 'EOF'
name = "zero-risk-saas"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = ".output/public"

[build]
command = "npm run build"

[env]
# Environment variables are set in Cloudflare Pages dashboard
# or via wrangler secret put

[[kv_namespaces]]
binding = "CACHE"
id = "<your-kv-namespace-id>"
preview_id = "<your-preview-kv-namespace-id>"

[[d1_databases]]
binding = "DB"
database_name = "zero-risk-saas-db"
database_id = "<your-d1-database-id>"
preview_database_id = "<your-preview-d1-database-id>"

# Analytics
[analytics]
enabled = true
EOF

    log_success "wrangler.toml created ✓"
}

# =============================================================================
# Dependency Installation
# =============================================================================
install_dependencies() {
    log_step "Installing project dependencies"

    if [[ "$SKIP_DEPS" == "true" ]]; then
        log_info "Skipping dependency installation (--skip-deps)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would run: npm install"
        log_info "[DRY-RUN] Would install: @supabase/supabase-js @tanstack/react-query stripe @sendinblue/client"
        log_info "[DRY-RUN] Would install dev: @tanstack/start-cloudflare wrangler"
        return 0
    fi

    # Core dependencies
    local deps=(
        "@supabase/supabase-js"
        "@tanstack/react-query"
        "stripe"
        "@sendinblue/client"
        "zod"
        "clsx"
        "tailwind-merge"
        "lucide-react"
        "@radix-ui/react-slot"
        "@radix-ui/react-label"
        "@radix-ui/react-button"
        "@radix-ui/react-input"
        "@radix-ui/react-textarea"
        "@radix-ui/react-select"
        "@radix-ui/react-dialog"
        "@radix-ui/react-dropdown-menu"
        "@radix-ui/react-toast"
        "@radix-ui/react-avatar"
        "@radix-ui/react-separator"
        "@radix-ui/react-scroll-area"
        "@radix-ui/react-tabs"
        "@radix-ui/react-tooltip"
        "@radix-ui/react-popover"
        "@radix-ui/react-hover-card"
        "@radix-ui/react-navigation-menu"
        "@radix-ui/react-breadcrumb"
        "@radix-ui/react-collapsible"
        "@radix-ui/react-checkbox"
        "@radix-ui/react-radio-group"
        "@radix-ui/react-switch"
        "@radix-ui/react-progress"
        "@radix-ui/react-slider"
        "@radix-ui/react-alert-dialog"
        "@radix-ui/react-aspect-ratio"
        "@radix-ui/react-context-menu"
        "@radix-ui/react-hover-card"
        "@radix-ui/react-menubar"
        "@radix-ui/react-pagination"
        "@radix-ui/react-resizable"
        "@radix-ui/react-scroll-area"
    )

    log_info "Installing core dependencies..."
    run_cmd "npm install ${deps[*]}" "Install core dependencies"

    # Dev dependencies
    local dev_deps=(
        "@tanstack/start-cloudflare"
        "wrangler"
        "typescript"
        "@types/node"
        "@types/react"
        "@types/react-dom"
        "tailwindcss"
        "@tailwindcss/vite"
        "postcss"
        "autoprefixer"
        "eslint"
        "@eslint/js"
        "typescript-eslint"
        "eslint-plugin-react-hooks"
        "eslint-plugin-react-refresh"
        "prettier"
        "prettier-plugin-tailwindcss"
        "vitest"
        "@vitest/ui"
        "jsdom"
        "@testing-library/react"
        "@testing-library/jest-dom"
        "@playwright/test"
        "husky"
        "lint-staged"
    )

    log_info "Installing dev dependencies..."
    run_cmd "npm install -D ${dev_deps[*]}" "Install dev dependencies"

    log_success "Dependencies installed ✓"
}

# =============================================================================
# shadcn/ui Installation
# =============================================================================
install_shadcn() {
    log_step "Installing shadcn/ui with New York style"

    if [[ "$SKIP_SHADCN" == "true" ]]; then
        log_info "Skipping shadcn/ui installation (--skip-shadcn)"
        return 0
    fi

    if file_exists "components.json" && [[ "$FORCE" != "true" ]]; then
        log_info "shadcn/ui already installed (components.json exists), skipping (use --force to overwrite)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would run: npx shadcn@latest init --style=new-york --base-color=neutral --css-variables=true"
        log_info "[DRY-RUN] Would add all base components"
        return 0
    fi

    # Initialize shadcn/ui with New York style
    run_cmd "npx shadcn@latest init --style=new-york --base-color=neutral --css-variables=true --yes" \
        "Initialize shadcn/ui with New York style"

    # Add all base components
    local components=(
        "button"
        "input"
        "textarea"
        "label"
        "select"
        "dialog"
        "dropdown-menu"
        "toast"
        "avatar"
        "separator"
        "scroll-area"
        "tabs"
        "tooltip"
        "popover"
        "hover-card"
        "navigation-menu"
        "breadcrumb"
        "collapsible"
        "checkbox"
        "radio-group"
        "switch"
        "progress"
        "slider"
        "alert-dialog"
        "aspect-ratio"
        "context-menu"
        "menubar"
        "pagination"
        "resizable"
        "table"
        "card"
        "sheet"
        "skeleton"
        "badge"
        "calendar"
        "carousel"
        "chart"
        "combobox"
        "command"
        "drawer"
        "form"
        "input-otp"
        "sonner"
        "sidebar"
    )

    log_info "Adding shadcn/ui base components..."
    for component in "${components[@]}"; do
        run_cmd "npx shadcn@latest add $component --yes" "Add shadcn/ui component: $component"
    done

    log_success "shadcn/ui with New York style installed ✓"
}

# =============================================================================
# Tailwind v4 Configuration
# =============================================================================
configure_tailwind() {
    log_step "Configuring Tailwind v4 with @theme"

    if [[ "$SKIP_TAILWIND" == "true" ]]; then
        log_info "Skipping Tailwind configuration (--skip-tailwind)"
        return 0
    fi

    # Create/Update CSS file with @theme
    local css_file="src/app/global.css"

    if file_exists "$css_file" && [[ "$FORCE" != "true" ]]; then
        log_info "$css_file already exists, skipping (use --force to overwrite)"
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY-RUN] Would create $css_file with @theme"
        else
            ensure_dir "$(dirname "$css_file")"
            cat > "$css_file" << 'EOF'
@import "tailwindcss";

@theme {
  /* Colors - Design tokens will be injected here */
  --color-primary: 222.2 47.4% 11.2%;
  --color-primary-foreground: 210 40% 98%;
  --color-secondary: 210 40% 96.1%;
  --color-secondary-foreground: 222.2 47.4% 11.2%;
  --color-muted: 210 40% 96.1%;
  --color-muted-foreground: 215.4 16.3% 46.9%;
  --color-accent: 210 40% 96.1%;
  --color-accent-foreground: 222.2 47.4% 11.2%;
  --color-destructive: 0 84.2% 60.2%;
  --color-destructive-foreground: 210 40% 98%;
  --color-border: 214.3 31.8% 91.4%;
  --color-input: 214.3 31.8% 91.4%;
  --color-ring: 222.2 47.4% 11.2%;
  --color-background: 0 0% 100%;
  --color-foreground: 222.2 47.4% 11.2%;

  /* Radius */
  --radius: 0.5rem;
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;

  /* Typography */
  --font-sans: "Geist", system-ui, sans-serif;
  --font-mono: "Geist Mono", monospace;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-normal: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

@layer utilities {
  .container {
    @apply mx-auto max-w-7xl px-4 sm:px-6 lg:px-8;
  }
}
EOF
            log_success "Tailwind v4 global.css with @theme created ✓"
        fi
    fi

    # Create/update vite.config.ts for Tailwind v4
    local vite_config="vite.config.ts"

    if file_exists "$vite_config" && [[ "$FORCE" != "true" ]]; then
        log_info "$vite_config already exists, skipping (use --force to overwrite)"
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY-RUN] Would create/update $vite_config with Tailwind v4 plugin"
        else
            cat > "$vite_config" << 'EOF'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import tanstackStart from '@tanstack/start/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart({
      target: 'cloudflare',
    }),
  ],
})
EOF
            log_success "vite.config.ts with Tailwind v4 configured ✓"
        fi
    fi

    # Create/update postcss.config.js
    local postcss_config="postcss.config.js"

    if file_exists "$postcss_config" && [[ "$FORCE" != "true" ]]; then
        log_info "$postcss_config already exists, skipping (use --force to overwrite)"
    else
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY-RUN] Would create $postcss_config"
        else
            cat > "$postcss_config" << 'EOF'
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
EOF
            log_success "postcss.config.js created ✓"
        fi
    fi
}

# =============================================================================
# Project Structure Setup
# =============================================================================
setup_project_structure() {
    log_step "Setting up project structure"

    local dirs=(
        "src/app"
        "src/app/routes"
        "src/components"
        "src/components/ui"
        "src/lib"
        "src/lib/utils"
        "src/lib/supabase"
        "src/lib/stripe"
        "src/lib/email"
        "src/types"
        "src/hooks"
        "supabase"
        "supabase/migrations"
        "supabase/functions"
        "supabase/seed"
        "workers"
        ".github/workflows"
        "public"
    )

    for dir in "${dirs[@]}"; do
        ensure_dir "$dir"
    done

    # Create placeholder files to ensure directories are tracked by git
    local placeholders=(
        "src/app/routes/__root.tsx"
        "src/app/routes/index.tsx"
        "src/lib/utils/index.ts"
        "src/lib/supabase/client.ts"
        "src/lib/supabase/server.ts"
        "src/lib/stripe/client.ts"
        "src/lib/stripe/server.ts"
        "src/lib/email/client.ts"
        "src/types/index.ts"
        "src/hooks/use-auth.ts"
        "supabase/migrations/.gitkeep"
        "supabase/functions/.gitkeep"
        "supabase/seed/.gitkeep"
        "workers/.gitkeep"
        ".github/workflows/.gitkeep"
    )

    for file in "${placeholders[@]}"; do
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY-RUN] Would create placeholder: $file"
        else
            ensure_dir "$(dirname "$file")"
            if [[ ! -f "$file" ]]; then
                echo "// Placeholder for $file" > "$file"
            fi
        fi
    done

    log_success "Project structure created ✓"
}

# =============================================================================
# Environment File Creation
# =============================================================================
create_env_local() {
    log_step "Creating .env.local from .env.example template"

    if file_exists ".env.local" && [[ "$FORCE" != "true" ]]; then
        log_info ".env.local already exists, skipping (use --force to overwrite)"
        return 0
    fi

    if ! file_exists ".env.example"; then
        log_warning ".env.example not found, creating minimal .env.local"
        if [[ "$DRY_RUN" == "true" ]]; then
            log_info "[DRY-RUN] Would create minimal .env.local"
        else
            cat > .env.local << 'EOF'
# Zero-Risk SaaS Stack - Local Environment Variables
# Generated by scaffold-saas-zero.sh

# APP
NODE_ENV=development
APP_URL=http://localhost:3000
APP_NAME="Zero-Risk SaaS"

# SUPABASE (Local)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# STRIPE (Test)
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# BREVO
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@localhost
BREVO_SENDER_NAME="Zero-Risk SaaS"

# CLOUDFLARE
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_API_TOKEN=your-api-token

# FEATURE FLAGS
ENABLE_BILLING=true
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_ANALYTICS=false
EOF
            log_success ".env.local created from minimal template ✓"
        fi
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would copy .env.example to .env.local"
        return 0
    fi

    cp .env.example .env.local
    log_success ".env.local created from .env.example ✓"
}

# =============================================================================
# Supabase Type Generation
# =============================================================================
generate_supabase_types() {
    log_step "Generating Supabase TypeScript types"

    if [[ "$SKIP_TYPES" == "true" ]]; then
        log_info "Skipping type generation (--skip-types)"
        return 0
    fi

    if ! command_exists supabase; then
        log_warning "Supabase CLI not found. Skipping type generation."
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would run: supabase gen types typescript --local > src/types/supabase.ts"
        return 0
    fi

    # Check if Supabase is running
    if supabase status >/dev/null 2>&1; then
        run_cmd "supabase gen types typescript --local > src/types/supabase.ts" \
            "Generate Supabase TypeScript types from local instance"
        log_success "Supabase types generated at src/types/supabase.ts ✓"
    else
        log_warning "Supabase not running locally. Generating types from linked project..."
        if supabase projects list >/dev/null 2>&1; then
            run_cmd "supabase gen types typescript --project-id \$(supabase projects list --output json | jq -r '.[0].id') > src/types/supabase.ts" \
                "Generate Supabase TypeScript types from linked project"
            log_success "Supabase types generated at src/types/supabase.ts ✓"
        else
            log_warning "No Supabase project linked. Create types manually later with 'supabase gen types'"
            # Create placeholder
            ensure_dir "src/types"
            cat > src/types/supabase.ts << 'EOF'
// Supabase TypeScript types placeholder
// Run 'supabase gen types typescript --local > src/types/supabase.ts' to generate

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
      }
    }
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
    Enums: {
      [key: string]: string
    }
    CompositeTypes: {
      [key: string]: Record<string, unknown>
    }
  }
}
EOF
            log_info "Created placeholder types at src/types/supabase.ts"
        fi
    fi
}

# =============================================================================
# Git Initialization
# =============================================================================
init_git() {
    log_step "Initializing git repository"

    if [[ "$SKIP_GIT" == "true" ]]; then
        log_info "Skipping git initialization (--skip-git)"
        return 0
    fi

    if dir_exists ".git" && [[ "$FORCE" != "true" ]]; then
        log_info "Git repository already initialized, skipping (use --force to re-init)"
        return 0
    fi

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "[DRY-RUN] Would initialize git repository"
        log_info "[DRY-RUN] Would create .gitignore"
        log_info "[DRY-RUN] Would create initial commit"
        return 0
    fi

    # Initialize git
    run_cmd "git init" "Initialize git repository"

    # Create .gitignore if not exists
    if ! file_exists ".gitignore"; then
        cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build outputs
dist/
build/
.next/
out/
.output/

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

# TypeScript
*.tsbuildinfo

# Linting
.eslintcache
.stylelintcache

# Misc
*.tsbuildinfo
EOF
        log_success ".gitignore created ✓"
    fi

    # Stage and commit
    run_cmd "git add ." "Stage all files"
    run_cmd "git commit -m 'chore: initial scaffold from scaffold-saas-zero.sh'" "Create initial commit"

    log_success "Git repository initialized with initial commit ✓"
}

# =============================================================================
# Verification
# =============================================================================
verify_scaffold() {
    log_step "Verifying scaffold"

    local all_good=true

    # Check package.json
    if file_exists "package.json"; then
        log_success "package.json: EXISTS ✓"
    else
        log_error "package.json: MISSING"
        all_good=false
    fi

    # Check wrangler.toml
    if file_exists "wrangler.toml"; then
        log_success "wrangler.toml: EXISTS ✓"
    else
        log_warning "wrangler.toml: MISSING"
    fi

    # Check supabase config
    if file_exists "supabase/config.toml"; then
        log_success "supabase/config.toml: EXISTS ✓"
    else
        log_warning "supabase/config.toml: MISSING"
    fi

    # Check shadcn/ui
    if file_exists "components.json"; then
        log_success "components.json (shadcn/ui): EXISTS ✓"
    else
        log_warning "components.json: MISSING"
    fi

    # Check Tailwind config
    if file_exists "src/app/global.css"; then
        log_success "src/app/global.css (Tailwind v4): EXISTS ✓"
    else
        log_warning "src/app/global.css: MISSING"
    fi

    if file_exists "vite.config.ts"; then
        log_success "vite.config.ts: EXISTS ✓"
    else
        log_warning "vite.config.ts: MISSING"
    fi

    # Check project structure
    local required_dirs=(
        "src/app"
        "src/components"
        "src/lib"
        "supabase"
        "workers"
        ".github/workflows"
    )

    for dir in "${required_dirs[@]}"; do
        if dir_exists "$dir"; then
            log_success "$dir: EXISTS ✓"
        else
            log_warning "$dir: MISSING"
        fi
    done

    # Check .env.local
    if file_exists ".env.local"; then
        log_success ".env.local: EXISTS ✓"
    else
        log_warning ".env.local: MISSING"
    fi

    # Check Supabase types
    if file_exists "src/types/supabase.ts"; then
        log_success "src/types/supabase.ts: EXISTS ✓"
    else
        log_warning "src/types/supabase.ts: MISSING"
    fi

    # Check git
    if dir_exists ".git"; then
        log_success "Git repository: INITIALIZED ✓"
    else
        log_warning "Git repository: NOT INITIALIZED"
    fi

    echo
    if [[ "$all_good" == "true" ]]; then
        log_success "All critical checks passed! 🎉"
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
            --skip-tanstack)
                SKIP_TANSTACK=true
                shift
                ;;
            --skip-supabase)
                SKIP_SUPABASE=true
                shift
                ;;
            --skip-cloudflare)
                SKIP_CLOUDFLARE=true
                shift
                ;;
            --skip-deps)
                SKIP_DEPS=true
                shift
                ;;
            --skip-shadcn)
                SKIP_SHADCN=true
                shift
                ;;
            --skip-tailwind)
                SKIP_TAILWIND=true
                shift
                ;;
            --skip-types)
                SKIP_TYPES=true
                shift
                ;;
            --skip-git)
                SKIP_GIT=true
                shift
                ;;
            --force)
                FORCE=true
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
║                    scaffold-saas-zero.sh v1.0.0                             ║
║         Automated TanStack Start + Supabase + Cloudflare Scaffolding        ║
║              Zero-Risk SaaS Stack - Zero-Cost MVP for Solo Founders         ║
╚══════════════════════════════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"

    if [[ "$DRY_RUN" == "true" ]]; then
        log_warning "DRY-RUN MODE: No changes will be made"
    fi

    log_info "Working directory: $(pwd)"
    echo

    # Run scaffolding steps
    local failed=false

    check_prerequisites || failed=true

    if [[ "$failed" == "true" ]]; then
        log_error "Prerequisites not met. Please install Node.js 20+, npm, git first."
        exit 1
    fi

    create_tanstack_start_project || failed=true
    init_supabase || failed=true
    setup_cloudflare || failed=true
    install_dependencies || failed=true
    install_shadcn || failed=true
    configure_tailwind || failed=true
    setup_project_structure || failed=true
    create_env_local || failed=true
    generate_supabase_types || failed=true
    init_git || failed=true

    echo
    verify_scaffold

    echo
    log_step "Next Steps"
    echo "  1. Review and update .env.local with your credentials"
    echo "  2. Run 'supabase start' if Docker is available"
    echo "  3. Run 'wrangler login' to authenticate Cloudflare"
    echo "  4. Run 'stripe login' to authenticate Stripe"
    echo "  5. Start developing with 'npm run dev'"
    echo

    if [[ "$DRY_RUN" == "true" ]]; then
        log_info "Dry-run complete. Run without --dry-run to execute."
    else
        log_success "Scaffolding complete! 🚀"
    fi
}

# Run main function
main "$@"