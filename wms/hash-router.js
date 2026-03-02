// HASH ROUTER
import routes from "/wms/routes.json" with { type: "json" };

const titlePrefix = ''
const titleSuffix = ''

// Function that watches the url and calls the urlLocationHandler
async function hashRouterHandler(hashChangeEvent) {

  // console.debug("hashRouterHandler hashChangeEvent", hashChangeEvent);

  const oldURLRoute = routeFromURL(new URL(hashChangeEvent.oldURL))
  const newURLRoute = routeFromURL(new URL(hashChangeEvent.newURL))
  // console.debug("oldURLRoute", oldURLRoute)
  // console.debug("newURLRoute", newURLRoute)

  // * Anchor link click handling
  if (newURLRoute.type == "anchor") {
    console.debug('Router alert: Anchor link, redirect avoided.');
    const newPath = oldURLRoute.path ? `/#page/${oldURLRoute.path}#${newURLRoute.hash}` : `/#page#${newURLRoute.hash}`
    window.history.replaceState(null, null, newPath)
    return
  }

  const route = routeFromURL()
  console.debug("Hash change - route:", route)
  const newPath = route.path

  navigate(newPath);
  // ? maybe
  // return route
};

// * Expects a direct path (no more parsing)
// * Only checks if path exists
export async function navigate(p) {

  // Check page exists
  if (!routes[p]) {
    console.error(`Navigator Error: Location "${p}" doesn't exist, redirecting to 404.`)
    p = "404"
  }

  // const page = routes[location];
  updatePageContent(p)

  // Jump to the top of the page
  window.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant"
  })
}


async function updatePageContent(p) {

  const page = routes[p]
  const blocksContainer = document.querySelector("#wms-blocks")

  // DEV Log all properties
  // for (const property in page) {
  //   if (!Object.hasOwn(page, property)) continue;
  //   console.debug(`${property}: ${page[property]}`);
  // }

  // Meta
  document.title = `${titlePrefix}${page.title}${titleSuffix}`
  document.querySelector('meta[name="description"]')?.setAttribute("content", page.description);

  // Content
  const blocks = await createBlocks(p)
  blocksContainer.replaceChildren(document.createRange().createContextualFragment(blocks.join("\n")))   // Fragment allows executing scripts inside loaded HTML (dangerous for prod, fine for local dev)

  // Active link class
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href')
      .replace('/#page/', '')
      .replace('#page/', '')
      .replace('/page/', '');

    if (href === p) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}


async function createBlocks(p) {

  let blocksDivs = []
  for (const block of routes[p].blocks) {

    const div = document.createElement("div")
    const filepath = `./pages/${block.src}.html`
    let html

    // Load inner HTML from external file given provided filename
    try {
      const response = await fetch(filepath);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      html = await response.text();
    }
    catch (error) {
      console.error("Failed to load content:", error);
    }

    // If the provided path doesn't lead to an existing file, fetch returns the content of the current file
    // Check if the server returned the main index.html instead of the requested partial
    if (html.includes("<!DOCTYPE html>")) {
      throw new Error(`File not found (Server returned full page): ${filepath}`);
    }

    // Inner content
    div.innerHTML = html;

    // If block type is not set we'll assume it's "content"
    if (!block.type) block.type = "content"

    // Attributes
    const vDataAttr =
      block.type == "content" ? "data-v-d084fd22"
        : "meta" ? "data-v-0dccd748"
          : ""
    div.setAttribute(vDataAttr, "")
    div.setAttribute("class", block.class || "")
    div.setAttribute("id", block.id || "")

    blocksDivs.push(div.outerHTML)
  }
  return blocksDivs
}

/**
 * Extracts route parameters
 * 
 * @returns Route parameters
 */
function routeFromURL(urlString = window.location.href) {

  const url = new URL(urlString);

  let type =
    url.hash.startsWith('#page/') ? "redirect"
      : url.hash.startsWith('#') ? "anchor"
        : null

  const UrlHashSegments = url.hash.split("#")
  UrlHashSegments.shift()  // remove unnecessary first empty item
  // console.debug("UrlHashSegments", UrlHashSegments)

  const path =
    type == "redirect" ? UrlHashSegments[0].replace("page/", "")
      : null

  // const hash = type == "redirect" && UrlHashSegments.length > 1 ? UrlHashSegments.at(-1) : null

  const hash =
    type == "redirect" && UrlHashSegments.length > 1 ? UrlHashSegments.at(-1)
      : type == "anchor" ? UrlHashSegments.at(-1)
        : null


  // if type anchor - last array item (always)
  // if type spa - last item if more than 1 item

  const route = { path, hash, type }
  // console.debug("route object", route)
  return route
}

export function initRouter(initialPath = "index") {

  // Handle hash change (which equates to a redirect in an SPA)
  window.addEventListener("hashchange", hashRouterHandler);

  // First load
  navigate(routeFromURL().path || initialPath)
  // debug
  // console.debug("= FIRST PAGE LOAD =")
}

