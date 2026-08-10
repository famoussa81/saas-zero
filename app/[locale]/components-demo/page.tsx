import { Metadata } from "next";
import Link from "next/link";
import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Toaster, toast as sonnerToast } from "@/components/ui/sonner";
import { Check, Mail, Settings, User, X, ChevronDown } from "lucide-react";

export const metadata: Metadata = {
  title: "Components Demo",
  description: "SaaS Zero - UI Components Showcase",
};

export default function ComponentsDemoPage() {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 glass sticky top-0 z-10">
          <div className="container flex items-center justify-between h-16 md:h-20">
            <Link
              href="/fr"
              className="font-display font-bold text-xl md:text-2xl text-foreground flex items-center gap-2"
            >
              <span className="gradient-text">SaaS</span> Zero
            </Link>
            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/fr"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Accueil
              </Link>
              <Link
                href="/fr/components-demo"
                className="text-sm font-medium text-primary"
              >
                Composants
              </Link>
            </nav>
          </div>
        </header>

        <main className="container py-16 sm:py-24 lg:py-32">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h1 className="font-display font-bold tracking-tight text-4xl md:text-5xl lg:text-6xl text-foreground mb-6">
                UI Components <span className="gradient-text">Showcase</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tous les composants de design system SaaS Zero avec tokens,
                animations et accessibilité intégrés.
              </p>
            </div>

            <Toaster position="top-right" />

            {/* Buttons Section */}
            <section
              className="mb-16 scroll-reveal"
              data-testid="components-buttons"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Boutons
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button variant="default" size="default">
                  Default
                </Button>
                <Button variant="destructive" size="default">
                  Destructive
                </Button>
                <Button variant="outline" size="default">
                  Outline
                </Button>
                <Button variant="secondary" size="default">
                  Secondary
                </Button>
                <Button variant="ghost" size="default">
                  Ghost
                </Button>
                <Button variant="link" size="default">
                  Link
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button variant="default" size="sm">
                  Small
                </Button>
                <Button variant="default" size="default">
                  Default
                </Button>
                <Button variant="default" size="lg">
                  Large
                </Button>
                <Button variant="default" size="xl">
                  Extra Large
                </Button>
                <Button variant="default" size="icon">
                  <Check className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 mt-4">
                <Button variant="default" disabled>
                  Disabled
                </Button>
                <Button variant="default" asChild>
                  <Link href="/fr">As Child Link</Link>
                </Button>
              </div>
            </section>

            {/* Badges Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-1"
              data-testid="components-badges"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Badges
              </h2>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
              </div>
            </section>

            {/* Cards Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-2"
              data-testid="components-cards"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Cartes
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Title</CardTitle>
                    <CardDescription>
                      Card description goes here with more details about the
                      content.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      This is the card content area. You can put any content
                      here.
                    </p>
                  </CardContent>
                  <CardFooter className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm">
                      Cancel
                    </Button>
                    <Button variant="default" size="sm">
                      Save
                    </Button>
                  </CardFooter>
                </Card>
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                  <CardHeader>
                    <CardTitle>Gradient Card</CardTitle>
                    <CardDescription>
                      Card with gradient background and primary border.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Styled with CSS custom properties from design tokens.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Dialog Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-3"
              data-testid="components-dialog"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Dialog / Modal
              </h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Action</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to proceed? This action cannot be
                      undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button
                      variant="ghost"
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDialogOpen(false)}
                    >
                      Confirm
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </section>

            {/* Dropdown Menu Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-4"
              data-testid="components-dropdown"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Dropdown Menu
              </h2>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    Open Menu <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {}}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {}}>
                    <Mail className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {}}
                    className="text-destructive focus:text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </section>

            {/* Tabs Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-5"
              data-testid="components-tabs"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Tabs
              </h2>
              <Tabs defaultValue="account">
                <TabsList>
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                <TabsContent value="account">
                  <div className="space-y-4 py-4">
                    <p className="text-muted-foreground">
                      Account settings content goes here.
                    </p>
                    <Button variant="default">Save Changes</Button>
                  </div>
                </TabsContent>
                <TabsContent value="password">
                  <div className="space-y-4 py-4">
                    <p className="text-muted-foreground">
                      Change your password.
                    </p>
                    <Button variant="default">Update Password</Button>
                  </div>
                </TabsContent>
                <TabsContent value="billing">
                  <div className="space-y-4 py-4">
                    <p className="text-muted-foreground">
                      Manage your billing information.
                    </p>
                    <Button variant="default">Update Billing</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </section>

            {/* Accordion Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-6"
              data-testid="components-accordion"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Accordion
              </h2>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger>What is SaaS Zero?</AccordionTrigger>
                  <AccordionContent>
                    SaaS Zero is a complete SaaS starter kit with Next.js 14,
                    Supabase, Stripe, and Vercel. It includes authentication,
                    billing, team management, and more - all production-ready.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                  <AccordionTrigger>
                    How does the pipeline work?
                  </AccordionTrigger>
                  <AccordionContent>
                    The /ns-ship pipeline has 6 phases: Discovery, Scaffold,
                    Design, Build, Verify, and Deploy. Each phase has
                    deterministic quality gates that must pass before
                    proceeding.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                  <AccordionTrigger>
                    Can I customize the design system?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! The design system uses CSS custom properties for all
                    tokens. You can override colors, spacing, typography, and
                    more by updating the values in globals.css.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </section>

            {/* Avatar Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-7"
              data-testid="components-avatar"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Avatar
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar>
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>SC</AvatarFallback>
                </Avatar>
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src="https://github.com/vercel.png"
                    alt="@vercel"
                  />
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
                <Avatar className="h-16 w-16">
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
              </div>
            </section>

            {/* Switch Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-8"
              data-testid="components-switch"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Switch
              </h2>
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3">
                  <Switch id="switch-1" defaultChecked />
                  <label htmlFor="switch-1" className="text-sm font-medium">
                    Enable notifications
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="switch-2" />
                  <label htmlFor="switch-2" className="text-sm font-medium">
                    Dark mode
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <Switch id="switch-3" disabled />
                  <label
                    htmlFor="switch-3"
                    className="text-sm font-medium text-muted-foreground"
                  >
                    Disabled
                  </label>
                </div>
              </div>
            </section>

            {/* Tooltip Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-9"
              data-testid="components-tooltip"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Tooltip
              </h2>
              <div className="flex flex-wrap items-center gap-4">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Hover me</Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p>This is a tooltip</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Top</Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">Tooltip on top</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Right</Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Tooltip on right</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Bottom</Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    Tooltip on bottom
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline">Left</Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">Tooltip on left</TooltipContent>
                </Tooltip>
              </div>
            </section>

            {/* Form Elements Section */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-10"
              data-testid="components-forms"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Form Elements
              </h2>
              <div className="space-y-6 max-w-md">
                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="text-sm font-medium text-foreground"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-foreground"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="text-sm font-medium text-foreground"
                  >
                    Message
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    placeholder="Your message..."
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <Button variant="default">Submit</Button>
              </div>
            </section>

            {/* Toast Demo */}
            <section
              className="mb-16 scroll-reveal scroll-reveal-delay-11"
              data-testid="components-toast"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Toast Notifications
              </h2>
              <div className="flex flex-wrap gap-4">
                <Button
                  onClick={() =>
                    sonnerToast("Default toast", {
                      description: "This is a default toast message",
                    })
                  }
                >
                  Default
                </Button>
                <Button
                  onClick={() =>
                    sonnerToast.success("Success!", {
                      description: "Operation completed successfully",
                    })
                  }
                >
                  Success
                </Button>
                <Button
                  onClick={() =>
                    sonnerToast.error("Error!", {
                      description: "Something went wrong",
                    })
                  }
                >
                  Error
                </Button>
                <Button
                  onClick={() =>
                    sonnerToast.warning("Warning!", {
                      description: "Please check your input",
                    })
                  }
                >
                  Warning
                </Button>
                <Button
                  onClick={() =>
                    sonnerToast.info("Info", {
                      description: "Here is some information",
                    })
                  }
                >
                  Info
                </Button>
                <Button
                  onClick={() =>
                    sonnerToast.loading("Loading...", {
                      description: "Please wait",
                    })
                  }
                >
                  Loading
                </Button>
              </div>
            </section>

            {/* Typography */}
            <section
              className="scroll-reveal scroll-reveal-delay-12"
              data-testid="components-typography"
            >
              <h2 className="font-display font-bold text-2xl md:text-3xl text-foreground mb-6">
                Typography
              </h2>
              <div className="prose max-w-none">
                <h1>Heading 1 - Display Font (Syne)</h1>
                <h2>Heading 2 - Display Font (Syne)</h2>
                <h3>Heading 3 - Display Font (Syne)</h3>
                <h4>Heading 4 - Display Font (Syne)</h4>
                <p>
                  Body text uses DM Sans for excellent readability. This is a
                  paragraph with <strong>bold text</strong>,{" "}
                  <em>italic text</em>, and{" "}
                  <a href="/fr" className="text-primary underline">
                    links
                  </a>
                  .
                </p>
                <blockquote>
                  <p>
                    &ldquo;Design is not just what it looks like and feels like.
                    Design is how it works.&rdquo;
                  </p>
                  <footer>&mdash; Steve Jobs</footer>
                </blockquote>
                <ul>
                  <li>List item one</li>
                  <li>List item two</li>
                  <li>List item three</li>
                </ul>
                <ol>
                  <li>Ordered item one</li>
                  <li>Ordered item two</li>
                  <li>Ordered item three</li>
                </ol>
                <pre>
                  <code>{`// Code block with syntax highlighting
function greet(name: string): string {
  return \`Hello, \${name}!\`;
}`}</code>
                </pre>
              </div>
            </section>
          </div>
        </main>

        <footer className="border-t border-border/50 py-12">
          <div className="container text-center">
            <Link
              href="/fr"
              className="font-display font-bold text-xl text-foreground mb-4 inline-block"
            >
              <span className="gradient-text">SaaS</span> Zero
            </Link>
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} SaaS Zero. Construit avec
              Next.js 14, Supabase, Stripe, Vercel.
            </p>
          </div>
        </footer>

        {/* Scroll reveal observer */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                  document.querySelectorAll('.scroll-reveal').forEach(el => el.classList.add('visible'));
                  return;
                }
                const observer = new IntersectionObserver((entries) => {
                  entries.forEach(entry => {
                    if (entry.isIntersecting) {
                      entry.target.classList.add('visible');
                    }
                  });
                }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
                document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
              })();
            `,
          }}
        />
      </div>
    </TooltipProvider>
  );
}
