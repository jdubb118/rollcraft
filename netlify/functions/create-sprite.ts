/**
 * Netlify Function: /api/create-sprite
 * Accepts a photo, sends to PixelLab API, returns pixel art sprite.
 * The API key is stored server-side — never exposed to the browser.
 */

export default async function handler(req: Request): Promise<Response> {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'POST only' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json() as {
      photo?: string;      // base64 encoded photo (optional)
      description?: string; // text description of character
      size?: number;        // sprite size (default 32)
      belt?: string;        // belt level for evolution sprite
    };

    const PIXELLAB_KEY = process.env.PIXELLAB_SECRET;
    if (!PIXELLAB_KEY) {
      return new Response(JSON.stringify({ error: 'API not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const size = body.size || 32;
    const headers = {
      'Authorization': `Bearer ${PIXELLAB_KEY}`,
      'Content-Type': 'application/json',
    };

    let result;

    if (body.photo) {
      // Photo-to-pixel-art conversion
      result = await fetch('https://api.pixellab.ai/v2/generate-image-v2', {
        method: 'POST', headers,
        body: JSON.stringify({
          description: body.description || 'BJJ fighter in gi, front facing, full body, pixel art game character sprite',
          image_size: { width: size, height: size },
          no_background: true,
          reference_images: [{ image: { type: 'base64', base64: body.photo, format: 'png' } }],
        }),
      });
    } else {
      // Text-only generation
      const beltDescriptions: Record<string, string> = {
        white: 'small skinny nervous beginner in oversized white gi, wide eyes, slouching',
        blue: 'lean athletic fighter in blue gi, confident stance, slight muscle',
        purple: 'fit muscular fighter in purple gi, strong stance, calm expression',
        brown: 'powerful broad-shouldered fighter in brown gi, intense focused expression',
        black: 'elite master in black gi, peak physique, zen expression, warrior stance',
      };

      const desc = body.belt && beltDescriptions[body.belt]
        ? `${beltDescriptions[body.belt]}, front facing, full body, pixel art game character sprite`
        : body.description || 'BJJ fighter in white gi, standing stance, front facing, full body, pixel art character sprite';

      result = await fetch('https://api.pixellab.ai/v2/generate-image-v2', {
        method: 'POST', headers,
        body: JSON.stringify({
          description: desc,
          image_size: { width: size, height: size },
          no_background: true,
        }),
      });
    }

    const data = await result.json();

    // Handle async job
    if (data.background_job_id) {
      // Poll for up to 90 seconds
      for (let i = 0; i < 30; i++) {
        await new Promise(r => setTimeout(r, 3000));
        const poll = await fetch(
          `https://api.pixellab.ai/v2/background-jobs/${data.background_job_id}`,
          { headers }
        );
        const job = await poll.json();

        if (job.status === 'completed') {
          const img = job.image?.base64 || job.images?.[0]?.base64;
          if (img) {
            return new Response(JSON.stringify({ image: img }), {
              status: 200,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        if (job.status === 'failed') break;
      }

      return new Response(JSON.stringify({ error: 'Generation timed out. Try again.' }), {
        status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle sync response
    if (data.image?.base64) {
      return new Response(JSON.stringify({ image: data.image.base64 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Generation failed', detail: data }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

export const config = { path: '/api/create-sprite' };
