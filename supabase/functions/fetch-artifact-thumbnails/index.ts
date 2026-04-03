import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { cr_id } = await req.json();
    if (!cr_id || typeof cr_id !== "string") {
      return new Response(JSON.stringify({ error: "cr_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: artifacts, error } = await supabase
      .from("artifacts")
      .select("id, type, url, thumbnail_url")
      .eq("cr_id", cr_id);

    if (error || !artifacts) {
      return new Response(JSON.stringify({ error: "Failed to fetch artifacts" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;

    for (const artifact of artifacts) {
      if (artifact.thumbnail_url) continue;

      let thumbnailUrl: string | null = null;

      if (artifact.type === "figma" || artifact.url?.includes("figma.com")) {
        // Try oEmbed first
        try {
          const oembedUrl = `https://www.figma.com/api/oembed?url=${encodeURIComponent(artifact.url)}`;
          const resp = await fetch(oembedUrl);
          if (resp.ok) {
            const data = await resp.json();
            thumbnailUrl = data.thumbnail_url || null;
          } else {
            await resp.text(); // consume body
          }
        } catch {
          // oEmbed failed
        }

        // Fallback: fetch the Figma page and extract og:image meta tag
        if (!thumbnailUrl) {
          try {
            const pageResp = await fetch(artifact.url, {
              headers: { "User-Agent": "Mozilla/5.0 (compatible; LensFlare/1.0)" },
              redirect: "follow",
            });
            if (pageResp.ok) {
              const html = await pageResp.text();
              const ogMatch = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
              if (ogMatch) {
                thumbnailUrl = ogMatch[1];
              }
            } else {
              await pageResp.text();
            }
          } catch {
            // page fetch failed
          }
        }
      } else if (artifact.type === "loom" || artifact.url?.includes("loom.com")) {
        const match = artifact.url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
        if (match) {
          thumbnailUrl = `https://cdn.loom.com/sessions/thumbnails/${match[1]}-with-play.gif`;
        }
      }

      if (thumbnailUrl) {
        await supabase
          .from("artifacts")
          .update({ thumbnail_url: thumbnailUrl })
          .eq("id", artifact.id);
        updated++;
      }
    }

    return new Response(JSON.stringify({ updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
