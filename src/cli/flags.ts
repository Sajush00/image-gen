export interface FlagDef {
  alias?: string;
  count?: number;
}

export function parseFlags(args: string[], defs: Record<string, FlagDef>) {
  const flags: Record<string, string[]> = {};
  const remaining: string[] = [];

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    let matched: string | null = null;

    for (const [name, def] of Object.entries(defs)) {
      if (a === `-${def.alias ?? name}` || a === `--${name}` || (name.length === 1 && a.startsWith("-") && !a.startsWith("--") && a.includes(name))) {
        matched = name;
        break;
      }
    }

    if (matched) {
      const n = defs[matched].count ?? 1;
      const vals: string[] = [];
      for (let j = 0; j < n && i + 1 + j < args.length; j++) {
        vals.push(args[i + 1 + j]);
      }
      flags[matched] = [...(flags[matched] ?? []), ...vals];
      i += n;
    } else {
      remaining.push(a);
    }
  }

  return { flags, remaining };
}
