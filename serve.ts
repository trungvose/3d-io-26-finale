// Deno Deploy entrypoint. Serves the Vite-built `dist/` folder as static files,
// and reproduces the dynamic demo handlers that the Node dev server (server.js)
// provides, so the streaming / fetch-backed demos work when hosted too.
//
// IMPORTANT: this is the ONLY file Deno should use as its deploy entrypoint.
// Do NOT point Deno at index.html or src/main.js — those are pre-build source
// that import the bare specifiers `three` / `three/addons/*`, which only resolve
// through Vite's aliases (see vite.config.js). Deno can't resolve them and the
// deploy fails with: Import "three/addons/controls/OrbitControls.js" not a
// dependency. The built bundle in dist/ has those imports already inlined.
//
// Run `vite build` (i.e. `npm run build`) before this serves anything — the
// dynamic routes below read the chrome-injected index.html out of dist/.
import { serveDir } from "@std/http/file-server";

const DIST = "dist";
const enc = new TextEncoder();
const HTML = { "content-type": "text/html; charset=utf-8" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Read a built (chrome-injected) demo document out of dist/.
const readDoc = (rel: string) => Deno.readTextFile(`${DIST}/${rel}`);

// --- demos/patching-clock: stream the initial doc, then a <template> patch
//     with the current time every second, holding the connection open. ---
async function clockResponse(): Promise<Response> {
  const doc = await readDoc("demos/patching-clock/index.html");
  let timer: ReturnType<typeof setInterval> | undefined;
  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(enc.encode(doc));
      timer = setInterval(() => {
        const time = new Date().toLocaleTimeString();
        controller.enqueue(enc.encode(
          `\n<template for="clock">\n   <?start name="clock">\n      <span>${time}</span>\n   <?end>\n</template>\n`,
        ));
      }, 1000);
    },
    cancel() {
      if (timer !== undefined) clearInterval(timer);
    },
  });
  return new Response(body, { headers: HTML });
}

// --- demos/patching-user-data: stream the initial doc, then a single profile
//     patch after 2.5s, then close. ---
async function userDataResponse(): Promise<Response> {
  const doc = await readDoc("demos/patching-user-data/index.html");
  const body = new ReadableStream({
    async start(controller) {
      controller.enqueue(enc.encode(doc));
      await sleep(2500);
      controller.enqueue(enc.encode(`
<template for="user-data">
  <div class="product-image">PK</div>
  <div class="product-info">
    <h2>Paul Kinlan</h2>
    <div class="price">$99 / hr</div>
    <div class="role">Chrome Developer Relations</div>
    <p class="bio">Lead for Chrome Developer Relations at Google. Passionate about the web, open standards, and building great developer experiences.</p>
    <button class="buy-btn">Hire Now</button>
  </div>
</template>
`));
      controller.close();
    },
  });
  return new Response(body, { headers: HTML });
}

// --- demos/islands-html/rss: server-side fetch + parse a couple of RSS feeds. ---
async function fetchAndParseRSS(url: string) {
  try {
    const text = await (await fetch(url)).text();
    const items: { title: string; link: string }[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match: RegExpExecArray | null;
    let count = 0;
    while ((match = itemRegex.exec(text)) !== null && count < 3) {
      const itemContent = match[1];
      const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
      const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
      if (titleMatch && linkMatch) {
        const title = titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/, "$1");
        items.push({ title, link: linkMatch[1] });
        count++;
      }
    }
    return items;
  } catch (e) {
    console.error(`Failed to fetch RSS from ${url}:`, e);
    return [];
  }
}

async function rssResponse(): Promise<Response> {
  try {
    const [paulItems, aifocusItems] = await Promise.all([
      fetchAndParseRSS("https://paul.kinlan.me/index.xml"),
      fetchAndParseRSS("https://aifoc.us/index.xml"),
    ]);
    let html = '<div class="island-content"><h4>paul.kinlan.me</h4><ul>';
    for (const item of paulItems) html += `<li><a href="${item.link}">${item.title}</a></li>`;
    html += "</ul><h4>aifoc.us</h4><ul>";
    for (const item of aifocusItems) html += `<li><a href="${item.link}">${item.title}</a></li>`;
    html += "</ul></div>";
    return new Response(html, { headers: HTML });
  } catch {
    return new Response('<div class="island-content">Error loading feeds</div>', { headers: HTML });
  }
}

// --- demos/islands-html/github: server-side fetch of recent GitHub activity. ---
async function githubResponse(): Promise<Response> {
  try {
    const events = await (await fetch("https://api.github.com/users/paulkinlan/events", {
      headers: { "User-Agent": "Deno" },
    })).json();
    let html = '<div class="island-content"><ul>';
    const count = Math.min(events.length, 3);
    for (let i = 0; i < count; i++) {
      const event = events[i];
      let description: string;
      if (event.type === "PushEvent") description = `Pushed to <code>${event.repo.name}</code>`;
      else if (event.type === "IssuesEvent") description = `${event.payload.action} issue on <code>${event.repo.name}</code>`;
      else if (event.type === "WatchEvent") description = `Starred <code>${event.repo.name}</code>`;
      else description = `${event.type.replace("Event", "")} on <code>${event.repo.name}</code>`;
      html += `<li>${description}</li>`;
    }
    html += "</ul></div>";
    return new Response(html, { headers: HTML });
  } catch (err) {
    console.error("Failed to fetch GitHub activity:", err);
    return new Response('<div class="island-content">Error loading GitHub activity</div>', { headers: HTML });
  }
}

// --- demos/islands-html/projects: a static fragment, delayed 1s. ---
async function projectsResponse(): Promise<Response> {
  await sleep(1000);
  return new Response(`
  <div class="island-content">
    <ul>
      <li><strong>Web MCP</strong> - Model Context Protocol for Web</li>
      <li><strong>HTML in Canvas</strong> - Native rendering</li>
      <li><strong>WebGPU Demos</strong></li>
    </ul>
  </div>
`, { headers: HTML });
}

Deno.serve((req) => {
  const { pathname } = new URL(req.url);

  switch (pathname) {
    case "/demos/patching-clock/":
    case "/demos/patching-clock/index.html":
      return clockResponse();
    case "/demos/patching-user-data/":
    case "/demos/patching-user-data/index.html":
      return userDataResponse();
    case "/demos/islands-html/rss":
      return rssResponse();
    case "/demos/islands-html/github":
      return githubResponse();
    case "/demos/islands-html/projects":
      return projectsResponse();
  }

  // Everything else (including the islands-html shell, which is chrome-injected
  // at build time) is a plain static asset from dist/.
  return serveDir(req, { fsRoot: DIST, quiet: true });
});
