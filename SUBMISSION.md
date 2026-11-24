# Consent Compass — submission copy

## One-line pitch

Consent Compass is a portable, browser-native agent network that turns a proposed automated action into a visible permission plan before anything is sent, changed, purchased, deleted, or published.

## Project description

Agents can move quickly, but people still need a clear moment to understand and approve consequential actions. Consent Compass adds that moment without requiring an account, API key, or server.

The user describes a proposed action, its destination, and the categories of data involved. A portable two-agent network then frames the request, invokes a deterministic local risk-analysis action, and returns a decision map with a risk level, plain-language reasons, and specific approval checkpoints. The user can record approval locally and export the complete plan as audit-ready JSON.

The project demonstrates an open agent network with a public manifest, a public network definition, a front agent, a delegated specialist, declared capabilities, bounded execution, and an explicit human checkpoint. All analysis stays in the browser and makes zero external network calls after the static files load.

## How it was built

Consent Compass uses standard HTML, CSS, and JavaScript with no framework or build step. The runtime loads and validates the public manifest and network files, checks agent and capability references, enforces step and time budgets, and executes a locally registered `analyze_action` capability. The interface renders the resulting decision map and exports the audit record as JSON.

## What is distinctive

- Human approval is a first-class network outcome, not a hidden implementation detail.
- The risk analysis is deterministic, inspectable, and grounded in the declared action and data categories.
- The network is portable: the public JSON files describe the agents, roles, tools, and trust boundary.
- The demo requires no account, API key, backend, or private data.

## Challenges

The main design challenge was making delegation visible without making the interface feel technical. The runtime also needed strict limits so the demo could show useful multi-agent coordination while remaining predictable and safe.

## Accomplishments

- Built a working two-agent network with manifest validation.
- Added a bounded runtime with explicit step and elapsed-time limits.
- Added local approval recording and audit JSON export.
- Kept the entire application dependency-free and browser-native.

## What comes next

The next version will add signed approval receipts, reusable policy packs for common workflows, and adapters that let other agent runtimes request a Consent Compass decision before executing consequential tools.

## Suggested tags

agentic-web, ai-agents, human-in-the-loop, privacy, safety, javascript, open-source

## Repository details

- License: MIT
- Visibility: Public
- Primary language: JavaScript
- Suggested repository name: `consent-compass`
- Suggested description: `A portable human-approval layer for open agent networks.`

