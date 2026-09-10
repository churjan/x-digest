// Convert the digest's Markdown lists into cards without changing the source file.
const element = (tagName, properties = {}, children = []) => ({ type: 'element', tagName, properties, children });
const text = (value) => ({ type: 'text', value });
const plainText = (node) => node.value ?? (node.children ?? []).map(plainText).join('');
const isElement = (node, tag) => node.type === 'element' && node.tagName === tag;

function extract(node, matches) {
  const found = [];
  node.children = (node.children ?? []).flatMap((child) => {
    if (matches(child)) { found.push(child); return []; }
    if (child.children) found.push(...extract(child, matches));
    return [child];
  });
  return found;
}

export default function digestCards() {
  return (tree) => {
    const cards = [];
    const headings = [];
    let category = '';
    let lastCard;
    const remaining = [];

    const addImages = (card, images) => {
      for (const img of images) {
        img.properties = {
          ...img.properties,
          alt: img.properties.alt || `${card.title} · 配图`,
          loading: 'lazy', decoding: 'async', referrerPolicy: 'no-referrer',
        };
        card.media.children.push(element('div', {
          className: ['card-image'],
        }, [img]));
      }
    };

    for (const node of tree.children) {
      if (isElement(node, 'h2')) {
        category = plainText(node);
        headings.push(node);
        lastCard = undefined;
      } else if (category && isElement(node, 'ol')) {
        for (const item of node.children.filter((child) => isElement(child, 'li'))) {
          const images = extract(item, (child) => isElement(child, 'img'));
          let titleNode;
          extract(item, (child) => {
            if (!titleNode && isElement(child, 'strong')) { titleNode = child; return true; }
            return false;
          });
          const title = titleNode ? plainText(titleNode) : `${category}动态`;
          const sources = extract(item, (child) => isElement(child, 'a') && plainText(child) === '原文');
          // The bold headline is followed by a Markdown em dash separator.
          const trimStart = (parent) => {
            for (const child of parent.children ?? []) {
              if (child.type === 'text') {
                child.value = child.value.replace(/^\s*[—–-]?\s*/, '');
                if (child.value) return true;
              } else if (trimStart(child)) return true;
            }
            return false;
          };
          if (titleNode) trimStart(item);
          const media = element('div', { className: ['card-media'] });
          const card = { title, media };
          addImages(card, images);
          for (const source of sources) {
            source.properties = { ...source.properties, className: ['card-source'], target: '_blank', rel: 'noopener noreferrer', ariaLabel: `阅读原文：${title}` };
            source.children = [element('span', { ariaHidden: 'true' }, [text('↗')])];
          }
          const content = element('div', { className: ['card-content'] }, [
            element('h3', {}, titleNode?.children ?? [text(title)]),
            element('div', { className: ['card-description'] }, item.children),
            element('div', { className: ['card-meta'] }, [
              element('span', { className: ['card-category'] }, [text(category)]),
              element('div', { className: ['card-meta-end'] }, sources),
            ]),
          ]);
          cards.push(element('article', { className: ['digest-card'], 'data-category': category }, [media, content]));
          lastCard = card;
        }
      } else if (lastCard && isElement(node, 'p') && node.children.some((child) => isElement(child, 'img'))) {
        // Unindented screenshots in Markdown belong to the preceding item.
        addImages(lastCard, extract(node, (child) => isElement(child, 'img')));
        if (plainText(node).trim()) remaining.push(node);
      } else if (node.type !== 'text' || node.value.trim()) {
        remaining.push(node);
      }
    }
    if (cards.length) tree.children = [...remaining, ...headings, element('div', { className: ['digest-grid'] }, cards)];
  };
}
