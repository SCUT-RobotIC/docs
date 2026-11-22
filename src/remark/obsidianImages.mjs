import {existsSync} from 'node:fs';
import path from 'node:path';

const wikiImagePattern = /!\[\[([^\]\n]+?)\]\]/g;
const markdownSizeSuffixPattern = /^(.*?)\|(\d+)(?:x(\d+))?$/i;
const externalUrlPattern = /^(?:[a-z][a-z\d+.-]*:|\/)/i;

function parseWikiImage(source) {
  const [rawPath, ...metadata] = source.split('|');
  const imagePath = rawPath.trim();
  let width;
  let height;
  const altParts = [];

  for (const item of metadata) {
    const value = item.trim();
    const sizeMatch = value.match(/^(\d+)(?:x(\d+))?$/i);
    if (sizeMatch && width === undefined) {
      width = Number(sizeMatch[1]);
      height = sizeMatch[2] ? Number(sizeMatch[2]) : undefined;
    } else if (value) {
      altParts.push(value);
    }
  }

  const fallbackAlt =
    path.basename(imagePath).replace(/\.[^.]+$/, '') || '图片';
  return {
    path: imagePath,
    alt: altParts.join(' ') || fallbackAlt,
    width,
    height,
  };
}

function assertLocalImageExists(imagePath, markdownPath) {
  if (!markdownPath || externalUrlPattern.test(imagePath)) {
    return;
  }

  const decodedPath = decodeURI(imagePath.split(/[?#]/, 1)[0]);
  const resolvedPath = path.resolve(path.dirname(markdownPath), decodedPath);
  if (!existsSync(resolvedPath)) {
    throw new Error(
      `Image not found: ${imagePath}\nreferenced from ${markdownPath}`,
    );
  }
}

function convertWikiImages(textNode, markdownPath) {
  const matches = [...textNode.value.matchAll(wikiImagePattern)];
  if (matches.length === 0) {
    return [textNode];
  }

  const nodes = [];
  let offset = 0;
  for (const match of matches) {
    if (match.index > offset) {
      nodes.push({
        type: 'text',
        value: textNode.value.slice(offset, match.index),
      });
    }

    const image = parseWikiImage(match[1]);
    assertLocalImageExists(image.path, markdownPath);
    const imageNode = {
      type: 'image',
      url: image.path,
      alt:
        image.width === undefined
          ? image.alt
          : `${image.alt}|${image.width}${image.height === undefined ? '' : `x${image.height}`}`,
    };
    nodes.push(imageNode);
    offset = match.index + match[0].length;
  }

  if (offset < textNode.value.length) {
    nodes.push({type: 'text', value: textNode.value.slice(offset)});
  }
  return nodes;
}

function validateImage(imageNode, markdownPath) {
  assertLocalImageExists(imageNode.url, markdownPath);
}

function transformChildren(children, markdownPath) {
  return children.flatMap((node) => {
    if (node.type === 'text' && typeof node.value === 'string') {
      return convertWikiImages(node, markdownPath);
    }
    if (node.type === 'image') {
      validateImage(node, markdownPath);
      return [node];
    }
    if (node.children) {
      node.children = transformChildren(node.children, markdownPath);
    }
    return [node];
  });
}

export default function obsidianImages() {
  return (tree, file) => {
    if (tree.children) {
      tree.children = transformChildren(tree.children, file.path);
    }
  };
}

function getAttribute(node, name) {
  return node.attributes?.find(
    (attribute) => attribute.type === 'mdxJsxAttribute' && attribute.name === name,
  );
}

function setAttribute(node, name, value) {
  node.attributes ??= [];
  const existing = getAttribute(node, name);
  if (existing) {
    existing.value = value;
  } else {
    node.attributes.push({type: 'mdxJsxAttribute', name, value});
  }
}

function applyImageDimensions(node) {
  const altAttribute = getAttribute(node, 'alt');
  if (!altAttribute || typeof altAttribute.value !== 'string') {
    return;
  }

  const match = altAttribute.value.match(markdownSizeSuffixPattern);
  if (!match) {
    return;
  }

  const width = Number(match[2]);
  const height = match[3] ? Number(match[3]) : undefined;
  altAttribute.value = match[1].trim();
  node.attributes = node.attributes.filter(
    (attribute) =>
      attribute.type !== 'mdxJsxAttribute' ||
      !['width', 'height'].includes(attribute.name),
  );
  setAttribute(node, 'width', String(width));
  if (height !== undefined) {
    setAttribute(node, 'height', String(height));
  }
}

function transformRenderedImages(children) {
  for (const node of children) {
    if (
      (node.type === 'mdxJsxTextElement' ||
        node.type === 'mdxJsxFlowElement') &&
      node.name === 'img'
    ) {
      applyImageDimensions(node);
    }
    if (node.children) {
      transformRenderedImages(node.children);
    }
  }
}

export function obsidianImageSizes() {
  return (tree) => {
    if (tree.children) {
      transformRenderedImages(tree.children);
    }
  };
}
