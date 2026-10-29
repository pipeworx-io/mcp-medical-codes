# mcp-medical-codes

Medical codes MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1856+ live data sources. This is an independent, unofficial integration — not affiliated with, endorsed by, or published by the upstream provider.

## Tools

| Tool | Description |
|------|-------------|
| `search_icd10` | Search ICD-10-CM diagnosis/billing codes by keyword or code (keyless, offline source: NLM). E.g. "type 2 diabetes" -> [{code:"E11.9", description:"Type 2 diabetes mellitus without complications"}]. |
| `search_loinc` | Search LOINC codes (lab tests & clinical observations) by keyword (keyless). E.g. "hemoglobin a1c" -> LOINC number + long common name. |
| `search_medical_terms` | Search clinical term lists by keyword (keyless): system = "conditions" (problem/diagnosis names), "procedures" (procedure names), or "drugs" (RxTerms drug display names). |
| `search_icd10pcs` | Search ICD-10-PCS inpatient procedure codes by keyword or code prefix (keyless, offline: CMS FY${pcsMeta.fiscalYear} order file, ${pcsMeta.count} billable codes). Diagnoses are search_icd10; PCS is what a hospital bills the procedure itself under. E.g. "hip replacement" -> [{code:"0SR9019", description:"Replacement of Right Hip Joint with Metal Synthetic Substitute, Cemented, Open Approach"}]; "0SR9" returns that whole family. |
| `get_icd10pcs` | Look up one exact 7-character ICD-10-PCS code, plus the sibling codes for the same procedure on the same body part (keyless, offline: CMS FY${pcsMeta.fiscalYear}). E.g. "0SR9019" -> its title plus the other 0SR9* right-hip-replacement codes, which is how you find the uncemented or ceramic alternative to a code you already have. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "medical-codes": {
      "url": "https://gateway.pipeworx.io/medical-codes/mcp"
    }
  }
}
```

### What this endpoint actually serves

`tools/list` at `https://gateway.pipeworx.io/medical-codes/mcp` returns the tools in the table
above **plus the shared Pipeworx meta-tools** — `ask_pipeworx`,
`discover_tools`, `search_within`, `remember`/`recall` and the rest of the
gateway-wide set. So the tool count you see is larger than this table: a
single-pack endpoint currently lists roughly 30 shared tools alongside the
pack's own. The connection's `initialize` response states its exact scope, and
is the authoritative answer for a given day.

This is deliberate, not multiplexing by accident. The meta-tools are what let a
scoped connection answer a question this pack does not cover — via
`ask_pipeworx`, which routes across the whole catalog — without you adding a
second MCP server. There is currently no way to mount a pack endpoint without
them; if the extra schemas cost you more context than the routing is worth,
connect to the full gateway once rather than to several pack endpoints.

Or connect to the full Pipeworx gateway to get every pack's tools listed
directly, instead of just this one's:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

Both URLs reach the same gateway and the same 1856+ data sources. The
only difference is which pack's tools are listed **directly**; `ask_pipeworx`
reaches all of them from either one.

## No MCP client? Call it over HTTP

```bash
curl -X POST https://gateway.pipeworx.io/v1/tools/search_icd10 \
  -H 'Content-Type: application/json' \
  -d '{"query":"type 2 diabetes"}'
```

No account needed for the first calls. Inspect any tool: `GET https://gateway.pipeworx.io/v1/tools/search_icd10`. Find one: `POST https://gateway.pipeworx.io/v1/tools/search_packs` with `{"query":"..."}`.

## Run it from npm

`@pipeworx/mcp-medical-codes` is a local stdio bridge to the Pipeworx gateway: your MCP client
starts it with `npx`, and it forwards every call to the same
`https://gateway.pipeworx.io/medical-codes/mcp` endpoint shown above. It needs network access;
there is no offline mode.

```json
{
  "mcpServers": {
    "medical-codes": {
      "command": "npx",
      "args": ["-y", "@pipeworx/mcp-medical-codes"]
    }
  }
}
```

Without a key it calls anonymously, capped at 50 calls a day. A free account
raises that to 200 a day: get a key at https://pipeworx.io/signup and add
`"env": { "PIPEWORX_API_KEY": "<your key>" }` to the server entry.
The key is sent as a Bearer token, the same way a hosted connection sends it,
so calls are metered and billed exactly as they are there.

It lists **only** this pack's tools by default. Set `PIPEWORX_META_TOOLS=1` to
also list `ask_pipeworx` and the other gateway-wide tools.

Behind an HTTPS proxy: Node's built-in `fetch` does not read `HTTPS_PROXY` by
default. Newer Node releases honour it when `NODE_USE_ENV_PROXY=1` is set; check
your Node version's documentation.

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English —
this works on the pack endpoint above as well as on the full gateway:

```
ask_pipeworx({ question: "your question about Medical Codes data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
