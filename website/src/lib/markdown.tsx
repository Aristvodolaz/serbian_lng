import { Fragment, type ReactNode } from 'react';

// Small Markdown subset for our own legal texts: headings, paragraphs, lists,
// tables, **bold** and [links](/path). Output is React nodes, so no HTML injection.

const linkRe = /\[([^\]]+)\]\(([^)]+)\)/;

function inline(text: string, key: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((part, i) => {
    const k = `${key}-${i}`;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={k}>{part.slice(2, -2)}</strong>;
    }
    const m = part.match(linkRe);
    if (m) {
      const [, label, href] = m;
      // Only in-site and mailto links; anything else stays plain text.
      return href.startsWith('/') || href.startsWith('mailto:') ? (
        <a key={k} href={href} className="link">
          {label}
        </a>
      ) : (
        <Fragment key={k}>{label}</Fragment>
      );
    }
    return <Fragment key={k}>{part}</Fragment>;
  });
}

const listRe = /^(\d+\.|-)\s+/;
const isBlockStart = (line: string) => line.startsWith('#') || line.startsWith('|') || listRe.test(line);

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n').map((l) => l.trimEnd());
  const out: ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const k = `b${i}`;

    if (!line.trim()) {
      i++;
      continue;
    }

    if (line.startsWith('## ')) {
      out.push(<h2 key={k} className="mt-12 first:mt-0">{inline(line.slice(3), k)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith('# ')) {
      out.push(<h1 key={k} className="mb-8">{inline(line.slice(2), k)}</h1>);
      i++;
      continue;
    }

    if (line.startsWith('|')) {
      const rows: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) rows.push(lines[i++]);
      const cells = (r: string) => r.split('|').slice(1, -1).map((c) => c.trim());
      const [head, , ...body] = rows;
      out.push(
        <div key={k} className="my-6 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[15px]">
            <thead>
              <tr>
                {cells(head).map((c, j) => (
                  <th key={j} className="border-b border-field px-3 py-2 font-semibold">
                    {inline(c, `${k}h${j}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>
                  {cells(r).map((c, j) => (
                    <td key={j} className="border-b border-line px-3 py-2 align-top">
                      {inline(c, `${k}r${ri}c${j}`)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }

    if (listRe.test(line)) {
      const ordered = /^\d/.test(line);
      const items: string[] = [];
      while (i < lines.length) {
        const cur = lines[i];
        if (listRe.test(cur)) {
          items.push(cur.replace(listRe, ''));
        } else if (cur.trim() && cur.startsWith(' ')) {
          items[items.length - 1] += ' ' + cur.trim();
        } else {
          break;
        }
        i++;
      }
      const ListTag = ordered ? 'ol' : 'ul';
      out.push(
        <ListTag key={k} className={`my-4 max-w-prose space-y-2 pl-6 ${ordered ? 'list-decimal' : 'list-disc'}`}>
          {items.map((it, j) => (
            <li key={j}>{inline(it, `${k}i${j}`)}</li>
          ))}
        </ListTag>,
      );
      continue;
    }

    // Paragraph: consecutive lines until a blank line or another block.
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !isBlockStart(lines[i])) {
      para.push(lines[i].replace(/^>\s?/, '').trim());
      i++;
    }
    out.push(
      <p key={k} className="my-4 max-w-prose">
        {inline(para.join(' '), k)}
      </p>,
    );
  }

  return <>{out}</>;
}
