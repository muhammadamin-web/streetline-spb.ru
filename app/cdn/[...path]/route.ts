// app/cdn/[...path]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

interface RouteContext {
  params: Promise<{ path: string[] }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const pathSegments = params.path || [];

    if (pathSegments.length === 0) return new NextResponse('Invalid path', { status: 400 });

    const domain = pathSegments[0];
    const resourcePath = pathSegments.slice(1).join('/');
    const upstreamUrl = `https://${domain}/${resourcePath}`;

    const searchParams = req.nextUrl.searchParams.toString();
    const fullUrl = searchParams ? `${upstreamUrl}?${searchParams}` : upstreamUrl;

    // Fetch with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        'Referer': 'https://streentline.framer.website/',
        'Accept': '*/*',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) return new NextResponse('Resource not found', { status: response.status });

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Proxy Error:', err);
    return new NextResponse(`Proxy error: ${err}`, { status: 500 });
  }
}

export async function HEAD(req: NextRequest, context: RouteContext) {
  return GET(req, context);
}
