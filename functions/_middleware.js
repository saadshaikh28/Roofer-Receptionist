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

    // 3. Detect the roofer's name from subdomain (e.g., 'rooferafreen' from 'rooferafreen.pages.dev')
    const hostname = url.hostname;
    const parts = hostname.split('.');
    let clientName = null;

    if (parts.length > 2 && parts[1] === 'pages' && parts[2] === 'dev') {
        clientName = parts[0];
    }

    // If no subdomain detected or we're on a custom domain, we could add fallback logic here
    if (!clientName) return response;

    try {
        // 4. Fetch the config file directly from your assets
        const configUrl = new URL(`/configs/${clientName}.json`, url.origin);
        const configResponse = await env.ASSETS.fetch(configUrl.toString());

        if (!configResponse.ok) return response;

        const config = await configResponse.json();
        const companyName = config.companyName || config.name || "Roofer";
        const pageTitle = `${companyName} - Roofing Cost Estimate`;
        const fullImageUrl = new URL("hero-bg.png", url.origin).toString();

        // 5. Use HTMLRewriter to inject the dynamic metadata
        // This happens at the "Edge", so scrapers like WhatsApp see it immediately
        return new HTMLRewriter()
            .on("title", {
                element(el) {
                    el.setInnerContent(pageTitle);
                },
            })
            .on('meta[property="og:title"]', {
                element(el) {
                    el.setAttribute("content", pageTitle);
                },
            })
            .on('meta[property="twitter:title"]', {
                element(el) {
                    el.setAttribute("content", pageTitle);
                },
            })
            .on('meta[property="og:image"]', {
                element(el) {
                    el.setAttribute("content", fullImageUrl);
                },
            })
            .on('meta[property="twitter:image"]', {
                element(el) {
                    el.setAttribute("content", fullImageUrl);
                },
            })
            .transform(response);
    } catch (error) {
        console.error("Middleware error:", error);
        return response;
    }
}
