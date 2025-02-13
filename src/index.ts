import { parseDocument } from "htmlparser2";
import type { Plugin } from "vite";

type ChildNode = ReturnType<typeof parseDocument>["children"][0];

export function compile(source: string) {
  source = transformExpAttr(source);
  source = source.replaceAll("\\r\\n", " ");
  const nodes = parseDocument(source).children;

  const script_nodes = nodes.filter(
    (node) => node.type === "script" && node.name === "script",
  );

  const template = tranformNodes({ nodes });

  return template;
}

export function tranformNodes({ nodes }: { nodes: ChildNode[] }) {
  if (nodes.length === 0) return "undefined";

  const stack: string[] = [];
  let skip_count = 0;

  for (const [index, child] of nodes.entries()) {
    if (skip_count > 0) continue;
    if (child.type !== "tag") continue;

    if (["$else", "$elseif"].some((key) => key in child.attribs)) continue;

    if ("$if" in child.attribs) {
      const elseif_nodes: ChildNode[] = [];
      let else_node: ChildNode | undefined = undefined;
      let current = child.next;

      while (current) {
        const next = current.next;
        if (!next) break;
        if (next.type !== "tag") {
          current = current.next;
          continue;
        }

        current = next;

        if ("$elseif" in current.attribs) {
          elseif_nodes.push(current);
          continue;
        }

        if ("$else" in current.attribs) {
          else_node = current;
          break;
        }
      }

      const node_template = `h(Match, ${JSON.stringify({ when: child.attribs.$if, ...child.attribs, $if: undefined })}, ${tranformNodes({ nodes: child.children })})`;
      const elseif_template = elseif_nodes
        .map((node) => {
          if (node.type !== "tag") return "";

          const attr = {
            when: node.attribs.$elseif?.slice(1, -1),
            ...node.attribs,
            $elseif: undefined,
          };

          return `h(Match, ${JSON.stringify(attr)}, ${tranformNodes({ nodes: node.children })})`;
        })
        .join(",");

      const else_template = else_node
        ? `h(Match, {}, ${tranformNodes({ nodes: else_node.children })})`
        : "";

      stack.push(
        `h(Switch, {}, [${node_template}, ${elseif_template}, ${else_template}])`,
      );

      continue;
    }

    stack.push(`h("${child.name}", ${JSON.stringify(child.attribs)})`);
  }

  return stack.join(",");
}

export function gasi(): Plugin {
  return {
    name: "vite-plugin-gasi",
    enforce: "pre",
    resolveId(source, importer, options) {
      if (source.endsWith(".solid")) return source;
    },
    load(id) {
      if (id.endsWith(".solid")) return id;
    },
    transform(code, id, options) {
      if (id.endsWith(".solid")) return compile(code);
    },
  };
}

export function transformExpAttr(source: string) {
  return source.replace(
    /([$]*\w+)={(.+)}/g,
    (_, key, value) => `${key}="{${value}}"`,
  );
}
