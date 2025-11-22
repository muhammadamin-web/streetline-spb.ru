export const runtime = 'edge';

interface Params {
  path: string[];
}

export async function GET(request: Request, { params }: { params: Params }) {
  try {
    const pathSegments = await Promise.resolve(params.path);
    const domainWithPath = pathSegments?.join('/') || '';
    
    if (!domainWithPath) {
      return new Response('Not found', { status: 404 });
    }

    // Reconstruct the full URL
    const upstreamUrl = `https://${domainWithPath}`;

    // Fetch the resource
    const response = await fetch(upstreamUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      return new Response('Failed to fetch resource', { status: response.status });
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const data = await response.arrayBuffer();

    return new Response(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('CDN proxy error:', error);
    return new Response('CDN proxy error', { status: 500 });
  }
}

export async function HEAD(request: Request, { params }: { params: Params }) {
  try {
    const pathSegments = await Promise.resolve(params.path);
    const domainWithPath = pathSegments?.join('/') || '';
    
    if (!domainWithPath) {
      return new Response('Not found', { status: 404 });
    }

    const upstreamUrl = `https://${domainWithPath}`;
    const response = await fetch(upstreamUrl, {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    return new Response(null, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('CDN proxy HEAD error:', error);
    return new Response('CDN proxy error', { status: 500 });
  }
}
