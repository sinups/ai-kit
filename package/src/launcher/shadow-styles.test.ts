import { collectDocumentStyles, scopeCssToShadowRoot } from './shadow-styles';

describe('launcher/scopeCssToShadowRoot', () => {
  it('scopes document level selectors to the widget container', () => {
    expect(scopeCssToShadowRoot(':root { --a: 1 } :root[data-x] { --b: 2 }')).toBe(
      '.ae-shadow-root { --a: 1 } .ae-shadow-root[data-x] { --b: 2 }'
    );
    expect(scopeCssToShadowRoot('html, body { margin: 0 }')).toBe(
      '.ae-shadow-root, .ae-shadow-root { margin: 0 }'
    );
  });

  it('keeps selectors that only contain the words', () => {
    const css = '.body { color: red } .html-view { color: blue } [data-body] {}';
    expect(scopeCssToShadowRoot(css)).toBe(css);
  });
});

describe('launcher/collectDocumentStyles', () => {
  it('reads inline styles and stylesheet links from the head', () => {
    const doc = document.implementation.createHTMLDocument('host');
    doc.head.innerHTML =
      '<style>.a{}</style><link rel="stylesheet" href="https://cdn.example/kit.css"><link rel="icon" href="/x.ico">';
    expect(collectDocumentStyles(doc)).toEqual({
      texts: ['.a{}'],
      urls: ['https://cdn.example/kit.css'],
    });
  });
});
