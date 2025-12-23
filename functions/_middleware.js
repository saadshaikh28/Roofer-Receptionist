export async function onRequest(context) {
    const { request, next, env } = context;
    const url = new URL(request.url);

    // 1. Determine the config name
    let configName = url.searchParams.get('config');

    // Subdomain detection (e.g., rooferafreen.pages.dev)
    if (!configName) {
        const hostname = url.hostname;
        const parts = hostname.split('.');
        if (parts.length > 2 && !hostname.includes('localhost') && !hostname.includes('127.0.0.1')) {
            configName = parts[0];
        }
    }

    // If no config found, just serve the page as is
    if (!configName) {
        return next();
    }

    // 2. Fetch the config JSON from the static assets
    // We use the internal ASSETS binding to fetch the file safely
    const configUrl = new URL(`/configs/${configName}.json`, url.origin);
    const configResponse = await env.ASSETS.fetch(configUrl);

    if (!configResponse.ok) {
        // If the specific config doesn't exist, maybe fallback to default or just proceed
        return next();
    }

    const config = await configResponse.json();
    const displayName = config.companyName || config.name || "Roofer";
    const pageTitle = `${displayName} - Roofing Estimate`;
    const pageDesc = config.description || "Get an accurate roofing estimate in minutes. Interactive and easy to use.";

    // Get the current full URL without query params for og:url
    const cleanUrl = `${url.protocol}//${url.host}${url.pathname}?config=${configName}`;
    const screenshotUrl = `https://s0.wp.com/mshots/v1/${encodeURIComponent(cleanUrl)}?w=1200&h=630`;

    // 3. Use HTMLRewriter to swap the meta tags on the fly
    const response = await next();

    return new HTMLRewriter()
        .on('title', {
            element(e) {
                e.setInnerContent(pageTitle);
            }
        })
        .on('meta[property="og:title"]', {
            element(e) {
                e.setAttribute('content', pageTitle);
            }
        })
        .on('meta[property="og:description"]', {
            element(e) {
                e.setAttribute('content', pageDesc);
            }
        })
        .on('meta[property="og:url"]', {
            element(e) {
                e.setAttribute('content', cleanUrl);
            }
        })
        .on('meta[property="og:image"]', {
            element(e) {
                e.setAttribute('content', screenshotUrl);
            }
        })
        .on('meta[property="twitter:title"]', {
            element(e) {
                e.setAttribute('content', pageTitle);
            }
        })
        .on('meta[property="twitter:description"]', {
            element(e) {
                e.setAttribute('content', pageDesc);
            }
        })
        .on('meta[property="twitter:url"]', {
            element(e) {
                e.setAttribute('content', cleanUrl);
            }
        })
        .on('meta[property="twitter:image"]', {
            element(e) {
                e.setAttribute('content', screenshotUrl);
            }
        })
        .transform(response);
}
