interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Medical codes MCP.
 *
 * Keyless: look up clinical codes and terminology via the NLM Clinical Tables
 * API — ICD-10-CM diagnosis codes, LOINC lab/observation codes, and condition /
 * procedure / drug term search. Free, no key. Complements the health stack
 * (openfda/rxnorm/clinicaltrials/pubmed) with the billing/terminology layer.
 */


const BASE = 'https://clinicaltables.nlm.nih.gov/api';
const UA = 'pipeworx-mcp-medical-codes/1.0 (+https://pipeworx.io)';

async function ct(table: string, params: Record<string, string>): Promise<any[]> {
  const p = new URLSearchParams(params);
  const res = await fetch(`${BASE}/${table}/v3/search?${p}`, { headers: { Accept: 'application/json', 'User-Agent': UA } });
  if (!res.ok) throw new Error(`NLM Clinical Tables error: ${res.status} ${await res.text().then((t) => t.slice(0, 120))}`);
  return res.json(); // [total, [keys], extra, [displayRows]]
}

const tools: McpToolExport['tools'] = [
  {
    name: 'search_icd10',
    description: 'Search ICD-10-CM diagnosis/billing codes by keyword or code (keyless, offline source: NLM). E.g. "type 2 diabetes" -> [{code:"E11.9", description:"Type 2 diabetes mellitus without complications"}].',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'A condition name or an ICD-10 code fragment.' }, limit: { type: 'number', description: 'Max results (1-100, default 15).' } }, required: ['query'] },
  },
  {
    name: 'search_loinc',
    description: 'Search LOINC codes (lab tests & clinical observations) by keyword (keyless). E.g. "hemoglobin a1c" -> LOINC number + long common name.',
    inputSchema: { type: 'object', properties: { query: { type: 'string', description: 'A lab test / observation name.' }, limit: { type: 'number', description: 'Max results (1-100, default 15).' } }, required: ['query'] },
  },
  {
    name: 'search_medical_terms',
    description: 'Search clinical term lists by keyword (keyless): system = "conditions" (problem/diagnosis names), "procedures" (procedure names), or "drugs" (RxTerms drug display names).',
    inputSchema: {
      type: 'object',
      properties: {
        system: { type: 'string', description: 'conditions | procedures | drugs.' },
        query: { type: 'string', description: 'Keyword to search.' },
        limit: { type: 'number', description: 'Max results (1-100, default 15).' },
      },
      required: ['system', 'query'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const query = reqStr(args, 'query', '"diabetes"');
  const limit = clamp(numArg(args.limit, 15), 1, 100);
  switch (name) {
    case 'search_icd10': {
      const r = await ct('icd10cm', { sf: 'code,name', df: 'code,name', terms: query, maxList: String(limit) });
      return { query, total: r[0], count: (r[3] ?? []).length, results: (r[3] ?? []).map((row: string[]) => ({ code: row[0], description: row[1] })) };
    }
    case 'search_loinc': {
      const r = await ct('loinc_items', { df: 'LOINC_NUM,LONG_COMMON_NAME', terms: query, maxList: String(limit) });
      return { query, total: r[0], count: (r[3] ?? []).length, results: (r[3] ?? []).map((row: string[]) => ({ loinc: row[0], name: row[1] })) };
    }
    case 'search_medical_terms': {
      const system = reqStr(args, 'system', '"conditions"').toLowerCase();
      const map: Record<string, { table: string; df?: string }> = { conditions: { table: 'conditions' }, procedures: { table: 'procedures' }, drugs: { table: 'rxterms', df: 'DISPLAY_NAME' } };
      const cfg = map[system];
      if (!cfg) return { error: `Unknown system "${system}". Use conditions, procedures, or drugs.` };
      const params: Record<string, string> = { terms: query, maxList: String(limit) };
      if (cfg.df) params.df = cfg.df;
      const r = await ct(cfg.table, params);
      const rows = cfg.df ? (r[3] ?? []).map((row: string[]) => row[0]) : (r[1] ?? []);
      return { system, query, total: r[0], count: rows.length, results: rows };
    }
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

function reqStr(args: Record<string, unknown>, key: string, ex: string): string {
  const v = args[key];
  if (typeof v !== 'string' || !v.trim()) throw new Error(`Required argument "${key}" is missing. Pass a string like ${ex}.`);
  return v;
}
function numArg(v: unknown, d: number): number { const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN; return Number.isFinite(n) ? n : d; }
function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, Math.trunc(n))); }

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
