/**
 * Advanced loadContent with support for script attributes (async, defer, module)
 * @param {string|Node} target - Target element selector or the element itself.
 * @param {string} url - URL to fetch.
 * @param {boolean} replace - Replace element (true) or insert inside (false).
 */
export async function loadContent(target, url, replace = false) {
  // console.debug(`Loading content for '${target}'`)

  const targetElement = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!targetElement) {
    console.error(`Target element not found: '${target}'`)
    return
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const html = await response.text();

    const fragment = document.createRange().createContextualFragment(html);
    replace ? targetElement.replaceWith(fragment) : targetElement.replaceChildren(fragment);
  }
  catch (error) {
    console.error("Failed to load content:", error);
  }
}