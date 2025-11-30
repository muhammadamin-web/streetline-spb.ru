import type { Context } from "https://edge.netlify.com";

export default async (request: Request, context: Context) => {
  const url = new URL(request.url);
  const path = url.pathname;

  if (path === "/") {
    try {
      const html = await fetch("https://streetline-spb-ru-git-main-muhammadamin-webs-projects.vercel.app").then(r => r.text());
      const rewritten = html.replace(/https:\/\/framerusercontent\.com/g, "/cdn/framerusercontent.com");
      return new Response(rewritten, {
        headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache" }
      });
    } catch (e) {
      return new Response("HTML proxy error", { status: 500 });
    }
  }

  if (path.startsWith("/cdn/")) {
    try {
      const tail = path.replace("/cdn/", "");
      return await fetch(`https://${tail}`);
    } catch (e) {
      return new Response("CDN proxy error", { status: 500 });
    }
  }

  return await context.next();
};
