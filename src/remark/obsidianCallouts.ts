type MarkdownNode = {
  type: string;
  name?: string;
  value?: string;
  children?: MarkdownNode[];
  attributes?: Record<string, string>;
  data?: Record<string, unknown>;
};

const calloutTypes: Record<string, string> = {
  note: 'info',
  tip: 'tip',
  info: 'note',
  warning: 'warning',
  caution: 'caution',
  danger: 'danger',
  important: 'danger',
  attention: 'warning',
  success: 'tip',
  question: 'warning',
};

const fallbackTitles: Record<string, string> = {
  question: 'Question',
  attention: 'Attention',
};

function getCalloutTitle(title: string): string {
  return title.replace(/`([^`]+)`/g, '$1').trim();
}

function convertCallout(node: MarkdownNode): MarkdownNode | null {
  if (node.type !== 'blockquote' || !node.children?.length) {
    return null;
  }

  const firstParagraph = node.children[0];
  const firstChild = firstParagraph?.children?.[0];
  if (
    firstParagraph?.type !== 'paragraph' ||
    firstChild?.type !== 'text' ||
    typeof firstChild.value !== 'string'
  ) {
    return null;
  }

  const match = firstChild.value.match(
    /^\[!\s*([^\]]+?)\s*\](?:[ \t]+([^\r\n]*))?(?:\r?\n|$)/i,
  );
  if (!match) {
    return null;
  }

  const sourceType = match[1].trim().toLowerCase();
  const admonitionType = calloutTypes[sourceType];
  if (!admonitionType) {
    return null;
  }

  const explicitTitle = getCalloutTitle(match[2] ?? '');
  const title = explicitTitle || fallbackTitles[sourceType] || '';
  const remainingText = firstChild.value.slice(match[0].length);
  if (remainingText) {
    firstChild.value = remainingText;
  } else {
    firstParagraph.children?.shift();
  }
  if (firstParagraph.children?.length === 0) {
    node.children.shift();
  }

  return {
    type: 'containerDirective',
    name: admonitionType,
    attributes: title ? {title} : {},
    data: {},
    children: title
      ? [
          {
            type: 'paragraph',
            data: {directiveLabel: true},
            children: [{type: 'text', value: title}],
          },
          ...node.children,
        ]
      : node.children,
  };
}

function transformChildren(children: MarkdownNode[]): MarkdownNode[] {
  return children.map((node) => {
    const converted = convertCallout(node);
    if (converted) {
      return converted;
    }
    if (node.children) {
      node.children = transformChildren(node.children);
    }
    return node;
  });
}

export default function obsidianCallouts() {
  return (tree: MarkdownNode) => {
    if (tree.children) {
      tree.children = transformChildren(tree.children);
    }
  };
}
