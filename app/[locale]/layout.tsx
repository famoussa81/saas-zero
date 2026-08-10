import { Metadata } from "next";
import { DM_Sans, Syne } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "@/styles/globals.css";
import { AnalyticsProvider } from "@/components/providers/AnalyticsProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

interface Props {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return {
    // metadataBase résout les images OG relatives (voir ns-optimize / SEO)
    metadataBase: new URL(appUrl),
    title: {
      default: "SaaS Zero - Build SaaS Faster",
      template: "%s | SaaS Zero",
    },
    description:
      "A complete SaaS starter kit with Next.js 14, Supabase, Stripe, and more.",
    keywords: ["saas", "starter", "nextjs", "supabase", "stripe"],
    authors: [{ name: "SaaS Zero Team" }],
    creator: "SaaS Zero",
    publisher: "SaaS Zero",
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      type: "website",
      locale: resolvedParams.locale === "en" ? "en_US" : "fr_FR",
      url: "https://saas-zero.dev",
      siteName: "SaaS Zero",
      title: "SaaS Zero - Build SaaS Faster",
      description:
        "A complete SaaS starter kit with Next.js 14, Supabase, Stripe, and more.",
      images: [
        {
          url: "/images/og-image.svg",
          width: 1200,
          height: 630,
          alt: "SaaS Zero",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "SaaS Zero",
      description:
        "A complete SaaS starter kit with Next.js 14, Supabase, Stripe, and more.",
      images: ["/images/og-image.svg"],
    },
    verification: {
      google: "google-site-verification-code",
    },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale || "fr";
  const messages = await getMessages({ locale });

  return (
    <html lang={locale} className={`${dmSans.variable} ${syne.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <AnalyticsProvider>
          <NextIntlClientProvider locale={locale} messages={messages}>
            <main id="main" role="main">
              {children}
            </main>
          </NextIntlClientProvider>
        </AnalyticsProvider>
        <script
          defer
          data-domain="saas-zero.dev"
          src="https://plausible.io/js/script.js"
        />
      </body>
    </html>
  );
}
