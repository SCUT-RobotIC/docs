import {execFileSync} from 'node:child_process';
import path from 'node:path';

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function getLastUpdate(filePath) {
  const relativePath = path
    .relative(process.cwd(), filePath)
    .split(path.sep)
    .join('/');

  const timestamp = execFileSync(
    'git',
    ['log', '-1', '--format=%ct', '--', relativePath],
    {
      cwd: process.cwd(),
      encoding: 'utf8',
    },
  ).trim();
  return timestamp
    ? {
        iso: new Date(Number(timestamp) * 1000).toISOString(),
        display: dateTimeFormatter.format(new Date(Number(timestamp) * 1000)),
      }
    : undefined;
}

export default function lastUpdated() {
  return (tree, file) => {
    if (!file.path || !tree.children) {
      return;
    }

    const lastUpdate = getLastUpdate(file.path);
    if (!lastUpdate) {
      return;
    }

    const titleIndex = tree.children.findIndex(
      (node) => node.type === 'heading' && node.depth === 1,
    );
    if (titleIndex === -1) {
      return;
    }

    tree.children.splice(titleIndex + 1, 0, {
      type: 'paragraph',
      data: {
        hName: 'p',
        hProperties: {
          className: ['doc-last-updated'],
          'data-doc-updated-at': lastUpdate.iso,
        },
      },
      children: [{type: 'text', value: `更新时间：${lastUpdate.display}`}],
    });
  };
}
