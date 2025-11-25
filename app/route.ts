// app/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const FRAMER_URL = 'https://streentline.framer.website/';

export async function GET(req: NextRequest) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const response = await fetch(FRAMER_URL, {
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        'Referer': FRAMER_URL,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return new NextResponse('Upstream site error', { status: 502 });
    }

    let html = await response.text();

    // CDN URLlarini almashtirish
    html = html.replace(/https:\/\/framerusercontent\.com\//g, '/cdn/framerusercontent.com/');
    html = html.replace(/https:\/\/uploads\.framerusercontent\.com\//g, '/cdn/uploads.framerusercontent.com/');
    html = html.replace(/https:\/\/ebb\.framer\.ai\//g, '/cdn/ebb.framer.ai/');
    html = html.replace(/https:\/\/frames\.framer\.ai\//g, '/cdn/frames.framer.ai/');
    html = html.replace(/https:\/\/cdn\.framer\.ai\//g, '/cdn/cdn.framer.ai/');
    html = html.replace(/https:\/\/api\.framer\.ai\//g, '/cdn/api.framer.ai/');

    // Framer badgesini o'chirish
    html = html.replace(/<!--\s*✨\s*Built with Framer.*?-->/g, '');
    html = html.replace(/<div id="__framer-badge-container"[^>]*>.*?<\/div>/gi, '');
    html = html.replace(/<meta[^>]*name="robots"[^>]*>/gi, '');

    // Yandex Metrika qo‘shish (misol)
    const yandexMetrikaCode = `
      <script>console.log('🔄 Vercel Proxy Active');</script>
      <script type="text/javascript">
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");
        ym(97023034,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
      </script>
      <noscript><div><img src="https://mc.yandex.ru/watch/97023034" style="position:absolute;left:-9999px;" alt=""/></div></noscript>
    `;
    html = html.replace(/<\/head>/i, `${yandexMetrikaCode}</head>`);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600', // 10 min caching
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (err) {
    console.error('Proxy Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
