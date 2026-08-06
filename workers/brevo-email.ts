// =============================================================================
// Brevo Email Sender - Cloudflare Worker
// Handles transactional email sending via Brevo API with queue and retries
// =============================================================================

import { createClient, SupabaseClient } from "@supabase/supabase-js";

/// <reference types="@cloudflare/workers-types" />

// Cloudflare Worker types
interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

// =============================================================================
// Types & Interfaces
// =============================================================================

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  BREVO_API_KEY: string;
}

interface EmailQueueRecord {
  id: string;
  to_email: string;
  to_name: string | null;
  from_email: string | null;
  from_name: string | null;
  subject: string;
  html_content: string | null;
  text_content: string | null;
  template_id: string | null;
  template_data: Record<string, unknown>;
  status: "pending" | "sending" | "sent" | "failed" | "cancelled";
  attempts: number;
  max_attempts: number;
  last_error: string | null;
  scheduled_for: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
}

interface BrevoEmailPayload {
  sender: {
    email: string;
    name?: string;
  };
  to: Array<{
    email: string;
    name?: string;
  }>;
  subject: string;
  htmlContent?: string;
  textContent?: string;
  templateId?: number;
  params?: Record<string, unknown>;
}

interface BrevoResponse {
  messageId: string;
}

interface BrevoError {
  code: string;
  message: string;
}

// =============================================================================
// Configuration
// =============================================================================

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_FROM_EMAIL = "noreply@yourdomain.com";
const DEFAULT_FROM_NAME = "YourApp";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000; // 5 seconds between retries

// =============================================================================
// Main Worker Export
// =============================================================================

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Initialize Supabase client with service role
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
      },
    );

    // Route handling
    try {
      if (path === "/send" && request.method === "POST") {
        return await handleSendEmail(request, env, supabase);
      }

      if (path === "/queue" && request.method === "POST") {
        return await handleQueueEmail(request, env, supabase);
      }

      if (path === "/process" && request.method === "POST") {
        return await handleProcessQueue(env, supabase);
      }

      if (path === "/status" && request.method === "GET") {
        return await handleGetEmailStatus(request, env, supabase);
      }

      if (path === "/retry" && request.method === "POST") {
        return await handleRetryFailed(env, supabase);
      }

      return new Response("Not Found", { status: 404 });
    } catch (error) {
      console.error("Unhandled error in brevo-email worker:", error);
      return new Response("Internal server error", { status: 500 });
    }
  },

  // Scheduled handler for processing email queue (can be triggered by cron)
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const supabase = createClient(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: { persistSession: false },
      },
    );

    console.log("Scheduled email queue processing triggered");
    await processEmailQueue(env, supabase);
  },
};

// =============================================================================
// Handler Functions
// =============================================================================

async function handleSendEmail(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      to_email: string;
      to_name?: string;
      from_email?: string;
      from_name?: string;
      subject: string;
      html_content?: string;
      text_content?: string;
      template_id?: number;
      template_data?: Record<string, unknown>;
    };

    // Validate required fields
    if (!body.to_email || !body.subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_email, subject" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Send email directly via Brevo
    const result = await sendEmailViaBrevo(env, {
      sender: {
        email: body.from_email || DEFAULT_FROM_EMAIL,
        name: body.from_name || DEFAULT_FROM_NAME,
      },
      to: [
        {
          email: body.to_email,
          name: body.to_name,
        },
      ],
      subject: body.subject,
      htmlContent: body.html_content,
      textContent: body.text_content,
      templateId: body.template_id,
      params: body.template_data,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to send email",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function handleQueueEmail(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      to_email: string;
      to_name?: string;
      from_email?: string;
      from_name?: string;
      subject: string;
      html_content?: string;
      text_content?: string;
      template_id?: string;
      template_data?: Record<string, unknown>;
      scheduled_for?: string;
      max_attempts?: number;
    };

    // Validate required fields
    if (!body.to_email || !body.subject) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: to_email, subject" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Insert into email queue
    const insertData = {
      to_email: body.to_email,
      to_name: body.to_name,
      from_email: body.from_email,
      from_name: body.from_name,
      subject: body.subject,
      html_content: body.html_content,
      text_content: body.text_content,
      template_id: body.template_id,
      template_data: body.template_data || {},
      status: "pending",
      attempts: 0,
      max_attempts: body.max_attempts || MAX_RETRIES,
      scheduled_for: body.scheduled_for || new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("email_queue")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error queuing email:", error);
      return new Response(JSON.stringify({ error: "Failed to queue email" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, email_id: data.id }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error queueing email:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to queue email",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function handleProcessQueue(
  env: Env,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    await processEmailQueue(env, supabase);
    return new Response(
      JSON.stringify({ success: true, message: "Queue processing completed" }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing queue:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to process queue",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function handleGetEmailStatus(
  request: Request,
  env: Env,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const emailId = url.searchParams.get("id");

    if (!emailId) {
      return new Response(JSON.stringify({ error: "Missing email ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data, error } = await supabase
      .from("email_queue")
      .select("*")
      .eq("id", emailId)
      .single();

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting email status:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to get email status",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

async function handleRetryFailed(
  env: Env,
  supabase: SupabaseClient,
): Promise<Response> {
  try {
    // Reset failed emails to pending for retry
    const { data, error } = await supabase
      .from("email_queue")
      .update({
        status: "pending",
        attempts: 0,
        last_error: null,
      })
      .eq("status", "failed")
      .lt("attempts", MAX_RETRIES);

    if (error) {
      console.error("Error resetting failed emails:", error);
      return new Response(JSON.stringify({ error: "Failed to retry emails" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Failed emails reset for retry",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error retrying failed emails:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Failed to retry emails",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// =============================================================================
// Core Email Processing Logic
// =============================================================================

async function processEmailQueue(
  env: Env,
  supabase: SupabaseClient,
): Promise<void> {
  const now = new Date().toISOString();

  // Get pending emails that are scheduled for now or earlier
  const { data: emails, error } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .lt("attempts", MAX_RETRIES)
    .order("scheduled_for", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Error fetching email queue:", error);
    return;
  }

  if (!emails || emails.length === 0) {
    console.log("No pending emails to process");
    return;
  }

  console.log(`Processing ${emails.length} emails from queue`);

  // Process each email
  for (const email of emails) {
    await processSingleEmail(env, supabase, email as EmailQueueRecord);
  }
}

async function processSingleEmail(
  env: Env,
  supabase: SupabaseClient,
  email: EmailQueueRecord,
): Promise<void> {
  const emailId = email.id;

  try {
    // Mark as sending
    await supabase
      .from("email_queue")
      .update({
        status: "sending",
        attempts: email.attempts + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailId);

    // Prepare Brevo payload
    const payload: BrevoEmailPayload = {
      sender: {
        email: email.from_email || DEFAULT_FROM_EMAIL,
        name: email.from_name || DEFAULT_FROM_NAME,
      },
      to: [
        {
          email: email.to_email,
          name: email.to_name || undefined,
        },
      ],
      subject: email.subject,
      htmlContent: email.html_content || undefined,
      textContent: email.text_content || undefined,
      templateId: email.template_id
        ? parseInt(email.template_id, 10)
        : undefined,
      params: email.template_data,
    };

    // Send via Brevo
    const result = await sendEmailViaBrevo(env, payload);

    // Mark as sent
    await supabase
      .from("email_queue")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", emailId);

    console.log(`Email ${emailId} sent successfully: ${result.messageId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error(`Error sending email ${emailId}:`, errorMessage);

    // Check if we should retry
    const shouldRetry =
      email.attempts + 1 < (email.max_attempts || MAX_RETRIES);

    if (shouldRetry) {
      // Schedule retry with exponential backoff
      const delayMs = RETRY_DELAY_MS * Math.pow(2, email.attempts);
      const retryAt = new Date(Date.now() + delayMs).toISOString();

      await supabase
        .from("email_queue")
        .update({
          status: "pending",
          last_error: errorMessage,
          scheduled_for: retryAt,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emailId);

      console.log(`Email ${emailId} scheduled for retry at ${retryAt}`);
    } else {
      // Max retries reached, mark as failed
      await supabase
        .from("email_queue")
        .update({
          status: "failed",
          last_error: errorMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", emailId);

      console.log(
        `Email ${emailId} failed after ${email.max_attempts} attempts`,
      );
    }
  }
}

async function sendEmailViaBrevo(
  env: Env,
  payload: BrevoEmailPayload,
): Promise<BrevoResponse> {
  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": env.BREVO_API_KEY,
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as BrevoResponse | BrevoError;

  if (!response.ok) {
    const error = data as BrevoError;
    throw new Error(`Brevo API error: ${error.code} - ${error.message}`);
  }

  return data as BrevoResponse;
}
