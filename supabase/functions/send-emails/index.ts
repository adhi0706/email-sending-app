import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SendEmailRequest {
  clientIds: string[];
  subject: string;
  body: string;
  customFields?: Record<string, string>;
}

interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
}

function personalizeContent(
  content: string,
  client: Client,
  customFields?: Record<string, string>
): string {
  let personalized = content;

  personalized = personalized.replace(/\{\{name\}\}/g, client.name);
  personalized = personalized.replace(/\{\{email\}\}/g, client.email);
  personalized = personalized.replace(/\{\{company\}\}/g, client.company);

  if (customFields) {
    Object.entries(customFields).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      personalized = personalized.replace(regex, value);
    });
  }

  return personalized;
}

async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const emailUser = Deno.env.get("EMAIL_USER");
  const emailPass = Deno.env.get("EMAIL_PASS");
  const smtpHost = Deno.env.get("SMTP_HOST") || "smtp.gmail.com";
  const smtpPort = Deno.env.get("SMTP_PORT") || "587";

  if (!emailUser || !emailPass) {
    throw new Error("Email credentials not configured");
  }

  const emailData = {
    from: emailUser,
    to,
    subject,
    html: body.replace(/\n/g, '<br>'),
  };

  const boundary = "----=_Part_" + Date.now();
  const emailContent = [
    `From: ${emailData.from}`,
    `To: ${emailData.to}`,
    `Subject: ${emailData.subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    emailData.html,
    `--${boundary}--`,
  ].join('\r\n');

  const auth = btoa(`${emailUser}:${emailPass}`);

  const response = await fetch(`https://${smtpHost}:${smtpPort}`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'message/rfc822',
    },
    body: emailContent,
  });

  if (!response.ok) {
    throw new Error(`Failed to send email: ${response.statusText}`);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { clientIds, subject, body, customFields }: SendEmailRequest = await req.json();

    if (!clientIds || clientIds.length === 0) {
      return new Response(
        JSON.stringify({ error: "Client IDs are required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (clientIds.length > 100) {
      return new Response(
        JSON.stringify({ error: "Cannot send more than 100 emails per batch" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, email, company")
      .in("id", clientIds)
      .eq("user_id", user.id);

    if (clientsError || !clients) {
      return new Response(
        JSON.stringify({ error: "Failed to fetch clients" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = {
      sent: 0,
      failed: 0,
      logs: [] as Array<{ clientId: string; status: string; error?: string }>,
    };

    for (let i = 0; i < clients.length; i++) {
      const client = clients[i];

      const personalizedSubject = personalizeContent(subject, client, customFields);
      const personalizedBody = personalizeContent(body, client, customFields);

      try {
        await sendEmail(client.email, personalizedSubject, personalizedBody);

        await supabase.from("email_logs").insert({
          user_id: user.id,
          client_id: client.id,
          subject: personalizedSubject,
          body: personalizedBody,
          status: "sent",
        });

        results.sent++;
        results.logs.push({
          clientId: client.id,
          status: "sent",
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";

        await supabase.from("email_logs").insert({
          user_id: user.id,
          client_id: client.id,
          subject: personalizedSubject,
          body: personalizedBody,
          status: "failed",
          error_message: errorMessage,
        });

        results.failed++;
        results.logs.push({
          clientId: client.id,
          status: "failed",
          error: errorMessage,
        });
      }

      if (i < clients.length - 1) {
        await delay(2000);
      }
    }

    return new Response(
      JSON.stringify(results),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error sending emails:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
