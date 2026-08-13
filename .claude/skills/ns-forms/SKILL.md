---
name: ns-forms
description: Forms backend using Supabase Edge Functions for contact forms, newsletter subscriptions, and lead capture. Handles validation, database storage, and email notifications via Brevo.
---

# Forms Backend with Supabase Edge Functions

## Contrat design (non négociable)

Avant d'écrire du JSX, lire dans cet ordre :

1. **`DESIGN-CHOICE.md`** (racine) — palette, ambiance, élément signature, tier de motion.
2. **`src/styles/globals.css`** — les tokens réellement définis. Ne pas en inventer.
3. **`src/components/ui/`** — 28 primitives Radix + CVA déjà là. Ne pas les réécrire (et ne jamais en créer dans `components/ui/`).
4. **`.claude/design/UI-CONTRACT.md`** — densité, cinq états, cartes KPI, tables, formulaires, accessibilité, dark mode.

Si `DESIGN-CHOICE.md` est encore le template non rempli : s'arrêter et le signaler. Générer de l'UI sans direction artistique décidée produit exactement le générique que la pipeline existe pour éviter.

Aucune valeur en dur — couleur, espacement, rayon, ombre, taille de police. Avant de rendre la main :

```bash
pnpm design:tokens:audit
```

## Architecture

```
Frontend (ContactForm.tsx)
    ↓ POST /api/contact
Supabase Edge Function (contact)
    ↓ Insert into contact_submissions table
    ↓ Trigger Brevo email notification
    ↓ Return success/error
```

## Database Schema

```sql
-- Contact form submissions
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter subscriptions
CREATE TABLE newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT DEFAULT 'website',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  confirmed_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can insert contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can read contact submissions" ON contact_submissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Public can insert newsletter subscriptions" ON newsletter_subscriptions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated users can manage newsletter" ON newsletter_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');
```

## Edge Function: Contact Form

```typescript
// supabase/functions/contact/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json();

    // Validate required fields
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "subject",
      "message",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return new Response(
          JSON.stringify({ error: `Missing required field: ${field}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert into database
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert({
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email,
        company: body.company || null,
        subject: body.subject,
        message: body.message,
        status: "new",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Send notification email via Brevo
    // await sendNotificationEmail(data)

    return new Response(
      JSON.stringify({
        success: true,
        message: "Message sent successfully",
        id: data.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## Frontend Integration

```tsx
// components/forms/ContactForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface ContactFormProps {
  onSuccess?: () => void;
  className?: string;
}

export function ContactForm({ onSuccess, className }: ContactFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = searchParams.get("locale") || "fr";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const validateField = (name: string, value: string) => {
    if (!value.trim()) return "This field is required";
    if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return "Invalid email";
    }
    return "";
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitStatus("success");
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      setSubmitStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to send message",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {/* Form fields */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full md:w-auto px-8 py-4 bg-primary text-primary-foreground text-lg font-semibold rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
      >
        {isSubmitting ? "Sending..." : "Send Message"}
      </button>
    </form>
  );
}
```

## API Route

```typescript
// app/api/contact/route.ts
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate
    const requiredFields = [
      "firstName",
      "lastName",
      "email",
      "subject",
      "message",
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    // Call Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/contact`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || "Failed to send message" },
        { status: response.status },
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Brevo (for email notifications)
BREVO_API_KEY=your-brevo-api-key
BREVO_SENDER_EMAIL=noreply@yourdomain.com
BREVO_SENDER_NAME=Your Site Name
```

## Testing

```bash
# Test locally
supabase functions serve contact --env-file .env.local

# Deploy
supabase functions deploy contact
```

## Security Considerations

- **Rate limiting**: Implement rate limiting at Edge Function level
- **Validation**: Server-side validation on all fields
- **CSRF**: Use CSRF tokens for form submissions
- **Rate limiting**: Implement at Edge/Vercel level
- **Spam protection**: Add honeypot field or reCAPTCHA
- **Sanitization**: Sanitize all user inputs before storage
