export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);

    // 1. Optimize: Only transform the main HTML entry points
    // This saves your 100k request limit by ignoring CSS, JS, and Images
    const isHtmlRequest = url.pathname === "/" || url.pathname === "/index.html";
    if (!isHtmlRequest) {
        return next();
    }

    // 2. Fetch the original response
    const response = await next();

    // 3. Detect the roofer's name from hostname
    const hostname = url.hostname;
    let clientName = null;

    // Handles: rooferkausar.pages.dev, rooferkausar.customdomain.com, etc.
    // We look for the first part of the hostname
    if (hostname.includes('.pages.dev')) {
        clientName = hostname.split('.')[0];
    } else if (!hostname.includes('localhost') && hostname.includes('.')) {
        // If it's a custom domain, we might need a different strategy or a mapping
        // For now, let's assume the first part of the custom domain is the client name
        // or just fallback to 'roofer_config'
        clientName = hostname.split('.')[0];
    }

    if (!clientName || clientName === 'www') return response;

    try {
        const configUrl = new URL(`/configs/${clientName}.json`, url.origin);
        const configResponse = await env.ASSETS.fetch(configUrl.toString());

        if (!configResponse.ok) {
            // Log error to Cloudflare console but return generic response
            console.log(`Config not found for: ${clientName}`);
            return response;
        }

        const config = await configResponse.json();
        const companyName = config.companyName || config.name || "Roofer";
        const pageTitle = `${companyName} - Roofing Cost Estimate`;
        const description = `Get an accurate roofing estimate from ${companyName} in minutes. Interactive and easy to use.`;

        // Use a more reliable screenshot service (thum.io is often faster than mshots)
        // We remove the timestamp to allow caching, making it instant for 99% of users
        const screenshotUrl = `https://image.thum.io/get/width/1200/crop/630/noanim/https://${url.hostname}`;

        // 5. Use HTMLRewriter to inject the dynamic metadata AND optimize the page for bots
        let transformedResponse = new HTMLRewriter()
            .on("title", {
                element(el) { el.setInnerContent(pageTitle); },
            })
            .on('meta[name="description"]', {
                element(el) { el.setAttribute("content", description); },
            })
            .on('meta[property="og:title"]', {
                element(el) { el.setAttribute("content", pageTitle); },
            })
            .on('meta[property="og:site_name"]', {
                element(el) { el.setAttribute("content", companyName); },
            })
            // Direct injection into the H1 so the screenshot service sees it immediately
            .on('.hero-title', {
                element(el) {
                    el.setInnerContent(`
            <span class="line">Roofing Cost Estimate</span>
            <span class="line brand-line">by <span class="company-brand">${companyName}</span></span>
          `, { html: true });
                }
            })
            // Inject bot-only styles to disable heavy 3D/animations (speeds up screenshots)
            .on('head', {
                element(el) {
                    el.append(`
            <style>
              /* Hide heavy assets to speed up screenshot services */
              #canvas-container, .particles { display: none !important; }
              .hero { background: #111827 !important; } /* Fallback background */
              * { animation: none !important; transition: none !important; }
            </style>
          `, { html: true });
                }
            })
            .on('meta[property="og:image"]', {
                element(el) { el.setAttribute("content", screenshotUrl); },
            })
            .on('meta[property="twitter:image"]', {
                element(el) { el.setAttribute("content", screenshotUrl); },
            })
            .on('meta[property="og:url"]', {
                element(el) { el.setAttribute("content", url.origin); },
            })
            .transform(response);


        // Add headers to prevent caching while we are fixing the preview issues
        const newHeaders = new Headers(transformedResponse.headers);
        newHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");
        newHeaders.set("Pragma", "no-cache");
        newHeaders.set("Expires", "0");

        return new Response(transformedResponse.body, {
            ...transformedResponse,
            headers: newHeaders
        });

    } catch (error) {
        console.error("Middleware error:", error);
        return response;
    }
}
