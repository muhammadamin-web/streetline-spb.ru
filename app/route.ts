// app/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// Timeout fetch helper
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 8000) {
  return Promise.race([
    fetch(url, options),
    new Promise<Response>((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeout)
    ),
  ]) as Promise<Response>;
}

export async function GET(req: NextRequest) {
  try {
    const response = await fetchWithTimeout('https://streentline.framer.website/', {
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
      },
    });

    if (!response.ok) return new NextResponse('Upstream site error', { status: 502 });

    let html = await response.text();

    // CDN va boshqa URLlarni proxy qilish
    html = html.replace(/https:\/\/framerusercontent\.com\//g, '/cdn/framerusercontent.com/');
    html = html.replace(/https:\/\/framer\.com\//g, '/cdn/framer.com/');
    html = html.replace(/https:\/\/fonts\.gstatic\.com\//g, '/cdn/fonts.gstatic.com/');
    html = html.replace(/https:\/\/mc\.yandex\.ru\//g, '/cdn/mc.yandex.ru/');

    // Framer badges va robots meta taglarini olib tashlash
    html = html.replace(/<!--\s*✨\s*Built with Framer.*?-->/g, '');
    html = html.replace(/<div id="__framer-badge-container"[^>]*>.*?<\/div>/gi, '');
    html = html.replace(/<meta[^>]*name="robots"[^>]*>/gi, '');

    // Yandex Metrika qo‘shish
    const yandexMetrikaCode = `
      <script>console.log('🔄 Vercel Proxy Active');</script>
      <script type="text/javascript">
        (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
        m[i].l=1*new Date();
        for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
        k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
        (window,document,"script","/cdn/mc.yandex.ru/metrika/tag.js","ym");
        ym(97023034,"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});
      </script>
      <noscript><div><img src="/cdn/mc.yandex.ru/watch/97023034" style="position:absolute;left:-9999px;" alt=""/></div></noscript>
    `;
    
    html = html.replace(/<\/head>/i, `${yandexMetrikaCode}</head>`);

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('Error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
