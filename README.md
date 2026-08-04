# mcp-medical-codes

Medical codes MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `search_icd10` | Search ICD-10-CM diagnosis/billing codes by keyword or code (keyless, offline source: NLM). E.g. "type 2 diabetes" -> [{code:"E11.9", description:"Type 2 diabetes mellitus without complications"}]. |
| `search_loinc` | Search LOINC codes (lab tests & clinical observations) by keyword (keyless). E.g. "hemoglobin a1c" -> LOINC number + long common name. |
| `search_medical_terms` | Search clinical term lists by keyword (keyless): system = "conditions" (problem/diagnosis names), "procedures" (procedure names), or "drugs" (RxTerms drug display names). |

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

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Medical Codes data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
