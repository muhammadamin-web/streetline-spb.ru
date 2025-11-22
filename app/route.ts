export const runtime = 'edge';

const FRAMER_URL = 'https://streentline.framer.website';

export async function GET() {
  try {
    const response = await fetch(FRAMER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return new Response('Failed to fetch', { status: response.status });
    }

    let html = await response.text();

    // Replace CDN URLs
    html = html.replace(/https:\/\/framerusercontent\.com/g, '/cdn/framerusercontent.com');
    html = html.replace(/https:\/\/ebb\.framer\.ai/g, '/cdn/ebb.framer.ai');
    html = html.replace(/https:\/\/frames\.framer\.ai/g, '/cdn/frames.framer.ai');
    html = html.replace(/https:\/\/cdn\.framer\.ai/g, '/cdn/cdn.framer.ai');
    html = html.replace(/https:\/\/assets\.framer\.ai/g, '/cdn/assets.framer.ai');

    // Replace quoted URLs
    html = html.replace(/"https:\/\/framerusercontent\.com/g, '"/cdn/framerusercontent.com');
    html = html.replace(/"https:\/\/ebb\.framer\.ai/g, '"/cdn/ebb.framer.ai');
    html = html.replace(/"https:\/\/frames\.framer\.ai/g, '"/cdn/frames.framer.ai');
    html = html.replace(/"https:\/\/cdn\.framer\.ai/g, '"/cdn/cdn.framer.ai');
    html = html.replace(/"https:\/\/assets\.framer\.ai/g, '"/cdn/assets.framer.ai');

    // Replace CSS url() format
    html = html.replace(/url\(https:\/\/framerusercontent\.com/g, 'url(/cdn/framerusercontent.com');
    html = html.replace(/url\(https:\/\/ebb\.framer\.ai/g, 'url(/cdn/ebb.framer.ai');
    html = html.replace(/url\(https:\/\/frames\.framer\.ai/g, 'url(/cdn/frames.framer.ai');
    html = html.replace(/url\(https:\/\/cdn\.framer\.ai/g, 'url(/cdn/cdn.framer.ai');
    html = html.replace(/url\(https:\/\/assets\.framer\.ai/g, 'url(/cdn/assets.framer.ai');

    // Inject fetch interceptor for dynamic image loading
    const fetchInterceptor = `
    <script>
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      let url = args[0];
      if (typeof url === 'string') {
        if (url.includes('framerusercontent.com')) url = url.replace('https://framerusercontent.com', '/cdn/framerusercontent.com');
        if (url.includes('ebb.framer.ai')) url = url.replace('https://ebb.framer.ai', '/cdn/ebb.framer.ai');
        if (url.includes('frames.framer.ai')) url = url.replace('https://frames.framer.ai', '/cdn/frames.framer.ai');
        if (url.includes('cdn.framer.ai')) url = url.replace('https://cdn.framer.ai', '/cdn/cdn.framer.ai');
        if (url.includes('assets.framer.ai')) url = url.replace('https://assets.framer.ai', '/cdn/assets.framer.ai');
        args[0] = url;
      }
      return originalFetch.apply(this, args);
    };
    </script>
    `;

    html = html.replace('</head>', fetchInterceptor + '</head>');

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response('Proxy error', { status: 500 });
  }
}
