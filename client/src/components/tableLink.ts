import type { NavigateFunction } from 'react-router';

/**
 * A table cell's content as a real link, so it can be opened in a new tab. A plain click is handled by the
 * router instead of reloading the page. Modus table cell renderers return DOM elements, not React elements.
 */
export function tableLink(navigate: NavigateFunction, path: string, text: string): HTMLElement {
  const link = document.createElement('a');
  link.href = path;
  link.textContent = text;
  link.addEventListener('click', (event) => {
    // The row's own click handler would navigate too.
    event.stopPropagation();
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    navigate(path);
  });
  return link;
}
