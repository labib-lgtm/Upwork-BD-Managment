import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FIRECRAWL_API = "https://api.firecrawl.dev/v2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "Firecrawl not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { job_link } = await req.json();
    if (!job_link || typeof job_link !== "string") {
      return new Response(JSON.stringify({ error: "job_link is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cache first
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: cached } = await supabase
      .from("job_post_cache")
      .select("*")
      .eq("job_link", job_link)
      .maybeSingle();

    if (cached) {
      // Return cached if scraped within last 24 hours
      const scrapedAt = new Date(cached.scraped_at).getTime();
      const now = Date.now();
      if (now - scrapedAt < 24 * 60 * 60 * 1000) {
        return new Response(JSON.stringify({ data: cached, source: "cache" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Scrape with Firecrawl
    const scrapeRes = await fetch(`${FIRECRAWL_API}/scrape`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: job_link,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const scrapeData = await scrapeRes.json();
    if (!scrapeRes.ok) {
      return new Response(
        JSON.stringify({ error: `Scrape failed: ${scrapeData.error || scrapeRes.statusText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";

    if (!markdown || markdown.length < 50) {
      return new Response(
        JSON.stringify({ error: "Could not extract content from job post. The page may require login." }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract structured data with AI
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You extract structured data from Upwork job post content. Return ONLY valid JSON with these fields:
{
  "title": "job title string",
  "description": "full job description text",
  "budget_text": "budget or hourly range as shown e.g. '$500-$1,000' or '$25-$50/hr'",
  "job_type": "fixed or hourly",
  "skills": ["skill1", "skill2"],
  "experience_level": "Entry/Intermediate/Expert or null",
  "client_location": "country or null",
  "client_total_spent": "amount string or null",
  "client_hire_count": "number string or null",
  "client_rating": "rating string or null",
  "client_reviews": "review count string or null",
  "client_payment_verified": true/false,
  "posted_date": "date string or null"
}
If a field cannot be found, use null. Do not add any text outside the JSON.`,
          },
          {
            role: "user",
            content: `Extract job post data from this content:\n\n${markdown.substring(0, 8000)}`,
          },
        ],
        temperature: 0.1,
      }),
    });

    const aiData = await aiRes.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "{}";

    // Parse AI response
    let parsed: Record<string, unknown>;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    } catch {
      parsed = {};
    }

    // Upsert to cache
    const cacheRow = {
      job_link,
      title: parsed.title as string || null,
      description: parsed.description as string || null,
      budget_text: parsed.budget_text as string || null,
      job_type: parsed.job_type as string || null,
      skills: Array.isArray(parsed.skills) ? parsed.skills : null,
      experience_level: parsed.experience_level as string || null,
      client_location: parsed.client_location as string || null,
      client_total_spent: parsed.client_total_spent as string || null,
      client_hire_count: parsed.client_hire_count as string || null,
      client_rating: parsed.client_rating as string || null,
      client_reviews: parsed.client_reviews as string || null,
      client_payment_verified: parsed.client_payment_verified as boolean ?? null,
      posted_date: parsed.posted_date as string || null,
      scraped_at: new Date().toISOString(),
      raw_data: { markdown: markdown.substring(0, 10000), parsed },
    };

    const { data: upserted, error: upsertErr } = await supabase
      .from("job_post_cache")
      .upsert(cacheRow, { onConflict: "job_link" })
      .select()
      .single();

    if (upsertErr) {
      console.error("Cache upsert error:", upsertErr);
    }

    return new Response(
      JSON.stringify({ data: upserted || cacheRow, source: "scraped" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("scrape-job-post error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
