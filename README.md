# Consent Compass

Consent Compass turns a proposed agent action into a human readable permission plan before any external operation occurs. It publishes a portable two agent network and runs it entirely in the browser.

## Try it

Open the GitHub Pages site linked in this repository's About panel. Describe an action, choose its data categories, and build a permission plan. Review the risk reasons and checkpoints, then record approval locally and export the audit JSON.

## Open Agentic Web files

- `agent-manifest.json` — site manifest and trust policy
- `consent-compass.network.json` — portable two agent network
- `runtime.js` — browser runtime, validation, bounded delegation, and local action
- `links.json` — explicit peer bindings (empty by default)
- `index.html` — user interface

## Run locally

Serve the repository root over HTTP:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Safety model

- Declarative network files contain no credentials.
- The runtime refuses undeclared agents and actions.
- Execution is limited to eight steps and five seconds.
- Risk analysis is local and deterministic.
- A person reviews and records approval before any proposed action proceeds.
- The export contains the decision plan but no browser secrets.

## License

MIT
