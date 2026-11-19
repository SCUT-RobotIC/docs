import {
  existsSync,
  readFileSync,
  readdirSync,
} from 'node:fs';
import path from 'node:path';

const documentPattern = /\.mdx?$/i;
const indexDocumentPattern = /^index\.mdx?$/i;
const collator = new Intl.Collator('zh-CN');

function readOrder(directory) {
  const orderFile = path.join(directory, '_order.json');
  if (!existsSync(orderFile)) {
    return [];
  }

  const parsed = JSON.parse(readFileSync(orderFile, 'utf8'));
  if (!Array.isArray(parsed.order) || parsed.order.some((item) => typeof item !== 'string')) {
    throw new Error(`${orderFile} must contain an "order" array of strings`);
  }
  return parsed.order;
}

function sortEntries(directory, entries) {
  const order = readOrder(directory);
  const rank = new Map();
  for (const [index, entry] of order.entries()) {
    rank.set(entry, index);
  }

  const getRank = (entry) => {
    const stem = entry.document
      ? entry.name.replace(documentPattern, '')
      : undefined;
    return rank.get(entry.name) ?? (stem ? rank.get(stem) : undefined);
  };

  return [...entries].sort((left, right) => {
    const leftRank = getRank(left);
    const rightRank = getRank(right);
    if (leftRank !== undefined || rightRank !== undefined) {
      if (leftRank === undefined) {
        return 1;
      }
      if (rightRank === undefined) {
        return -1;
      }
      return leftRank - rightRank;
    }
    return collator.compare(left.name, right.name);
  });
}

function toDocumentId(contentRoot, filePath) {
  return path
    .relative(contentRoot, filePath)
    .split(path.sep)
    .map((segment) => {
      const match = segment.match(
        /^(\d+(?:\.\d+)*)(?:\s*[._-]?\s*)(.+)$/,
      );
      return match ? match[2] : segment;
    })
    .join('/')
    .replace(documentPattern, '');
}

function listContentEntries(directory) {
  return readdirSync(directory, {withFileTypes: true})
    .filter((entry) => !entry.name.startsWith('.'))
    .map((entry) => {
      if (entry.isDirectory()) {
        return {kind: 'directory', name: entry.name, path: path.join(directory, entry.name)};
      }
      if (entry.isFile() && documentPattern.test(entry.name)) {
        return {
          kind: 'document',
          document: !indexDocumentPattern.test(entry.name),
          name: entry.name,
          path: path.join(directory, entry.name),
        };
      }
      return null;
    })
    .filter(Boolean);
}

function buildDirectoryItem(contentRoot, directory, depth) {
  const entries = listContentEntries(directory);
  const indexEntry = entries.find(
    (entry) => entry.kind === 'document' && !entry.document,
  );
  const contentEntries = entries.filter((entry) => entry !== indexEntry);
  const items = [];

  for (const entry of sortEntries(directory, contentEntries)) {
    if (entry.kind === 'directory') {
      const child = buildDirectoryItem(contentRoot, entry.path, depth + 1);
      if (child) {
        items.push(child);
      }
    } else if (entry.document) {
      items.push({
        type: 'doc',
        id: toDocumentId(contentRoot, entry.path),
      });
    }
  }

  const indexId = indexEntry
    ? toDocumentId(contentRoot, indexEntry.path)
    : undefined;
  const label = path.basename(directory);

  if (items.length === 0) {
    return indexId ? {type: 'doc', id: indexId, label} : null;
  }

  return {
    type: 'category',
    label,
    collapsed: depth !== 0,
    ...(indexId ? {link: {type: 'doc', id: indexId}} : {}),
    items,
  };
}

function hasDocuments(directory) {
  return readdirSync(directory, {withFileTypes: true}).some((entry) => {
    if (entry.isDirectory()) {
      return !entry.name.startsWith('.') && hasDocuments(path.join(directory, entry.name));
    }
    return entry.isFile() && documentPattern.test(entry.name);
  });
}

export function knowledgeBaseSidebarId(name) {
  const encodedName = Buffer.from(name, 'utf8').toString('hex');
  return `knowledgeBaseSidebar-${encodedName}`;
}

export function discoverKnowledgeBases(contentRoot) {
  const directories = readdirSync(contentRoot, {withFileTypes: true})
    .filter(
      (entry) =>
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        hasDocuments(path.join(contentRoot, entry.name)),
    )
    .map((entry) => ({
      kind: 'directory',
      name: entry.name,
      path: path.join(contentRoot, entry.name),
    }));

  return sortEntries(contentRoot, directories).map((entry) => ({
    name: entry.name,
    directory: entry.path,
    sidebarId: knowledgeBaseSidebarId(entry.name),
  }));
}

export function buildKnowledgeSidebars(contentRoot) {
  return Object.fromEntries(
    discoverKnowledgeBases(contentRoot).map((knowledgeBase) => {
      const root = buildDirectoryItem(
        contentRoot,
        knowledgeBase.directory,
        0,
      );
      return [knowledgeBase.sidebarId, root ? [root] : []];
    }),
  );
}
