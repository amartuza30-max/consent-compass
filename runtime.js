const MAX_STEPS = 8;
const MAX_ELAPSED_MS = 5000;

class ConsentRuntime {
  constructor() {
    this.manifest = null;
    this.network = null;
    this.actions = new Map();
    this.audit = [];
    this.registerAction("analyze_action", this.analyzeAction.bind(this));
  }

  async load() {
    const [manifestResponse, networkResponse] = await Promise.all([
      fetch("./agent-manifest.json"),
      fetch("./consent-compass.network.json")
    ]);
    if (!manifestResponse.ok || !networkResponse.ok) throw new Error("Public agent files could not be loaded.");
    this.manifest = await manifestResponse.json();
    this.network = await networkResponse.json();
    this.validate();
    return this;
  }

  validate() {
    if (this.manifest.front_man !== this.network.front_man) throw new Error("Front agent mismatch.");
    const names = this.network.tools.map(tool => tool.name);
    if (new Set(names).size !== names.length) throw new Error("Duplicate agent name.");
    if (!names.includes(this.network.front_man)) throw new Error("Front agent missing.");
    for (const agent of this.network.tools) {
      for (const tool of agent.tools || []) {
        if (!names.includes(tool) && !this.actions.has(tool)) throw new Error(`Unknown capability: ${tool}`);
      }
    }
  }

  async run(input) {
    const started = performance.now();
    let steps = 0;
    const tick = () => {
      steps += 1;
      if (steps > MAX_STEPS || performance.now() - started > MAX_ELAPSED_MS) throw new Error("Execution budget exceeded.");
    };
    tick();
    const coordinator = this.getAgent("consent_coordinator");
    if (!input.action_text || input.action_text.trim().length < 3) throw new Error("Describe an action first.");
    tick();
    this.getAgent("risk_analyst");
    tick();
    const analysis = await this.actions.get("analyze_action")(input);
    const plan = {
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      network: this.network.name,
      front_agent: coordinator.name,
      agent_steps: steps,
      input,
      ...analysis,
      decision: "pending"
    };
    this.audit.push(plan);
    return plan;
  }

  getAgent(name) {
    const agent = this.network.tools.find(item => item.name === name);
    if (!agent) throw new Error(`Agent not declared: ${name}`);
    return agent;
  }

  registerAction(name, handler) {
    this.actions.set(name, handler);
  }

  async analyzeAction(input) {
    const text = `${input.action_text} ${input.destination || ""}`.toLowerCase();
    const data = input.data_categories || [];
    const reasons = [];
    let score = 0;
    const add = (points, reason) => { score += points; reasons.push(reason); };
    if (/send|email|upload|share|publish|post|submit|message/.test(text)) add(3, "The action transmits information outside this browser.");
    if (/delete|cancel|remove|overwrite|withdraw/.test(text)) add(4, "The action may be difficult or impossible to reverse.");
    if (/buy|pay|purchase|transfer|invoice|bank/.test(text) || data.includes("financial data")) add(5, "Financial data or a transaction may be involved.");
    if (/public|publish|post/.test(text) || data.includes("public content")) add(3, "The result may become publicly visible.");
    if (data.includes("private files")) add(3, "A private file may leave its current trust boundary.");
    if (data.includes("identity data")) add(4, "Identity information may be disclosed.");
    if (data.includes("contact information")) add(2, "Contact information may be shared with another party.");
    if (input.destination) add(1, `The destination must be verified: ${input.destination}.`);
    if (!reasons.length) reasons.push("No write, transmission, identity, financial, or irreversible signals were detected.");
    const risk_level = score >= 8 ? "high" : score >= 4 ? "medium" : "low";
    const checkpoints = [
      "Confirm the action description matches the user's current intent.",
      input.destination ? `Verify the destination is exactly “${input.destination}”.` : "Name and verify any external destination before proceeding.",
      data.length ? `Review the data categories: ${data.join(", ")}.` : "Confirm that no private or sensitive data is included.",
      risk_level === "low" ? "Record the review before execution." : "Request explicit human approval immediately before execution."
    ];
    return { risk_level, risk_score: score, reasons, checkpoints, network_calls: 0 };
  }
}

const form = document.querySelector("#action-form");
const empty = document.querySelector("#empty-state");
const result = document.querySelector("#result");
const state = document.querySelector("#runtime-state");
const badge = document.querySelector("#risk-badge");
const reasons = document.querySelector("#reasons");
const checkpoints = document.querySelector("#checkpoints");
const approve = document.querySelector("#approve");
const record = document.querySelector("#record");
const decisionStatus = document.querySelector("#decision-status");
let currentPlan = null;

const runtime = new ConsentRuntime();
runtime.load().then(() => state.textContent = "Manifest validated · runtime ready").catch(error => state.textContent = error.message);

form.addEventListener("submit", async event => {
  event.preventDefault();
  state.textContent = "Running bounded agent network…";
  approve.checked = false;
  record.disabled = true;
  decisionStatus.textContent = "Not approved";
  try {
    const data_categories = [...document.querySelectorAll('.chips input:checked')].map(input => input.value);
    currentPlan = await runtime.run({
      action_text: document.querySelector("#action").value.trim(),
      destination: document.querySelector("#destination").value.trim(),
      data_categories
    });
    badge.textContent = currentPlan.risk_level.toUpperCase();
    badge.className = `risk-${currentPlan.risk_level}`;
    document.querySelector("#agent-steps").textContent = currentPlan.agent_steps;
    reasons.replaceChildren(...currentPlan.reasons.map(text => Object.assign(document.createElement("li"), { textContent: text })));
    checkpoints.replaceChildren(...currentPlan.checkpoints.map(text => Object.assign(document.createElement("li"), { textContent: text })));
    empty.hidden = true;
    result.hidden = false;
    state.textContent = `Plan ${currentPlan.id.slice(0, 8)} · no external calls`;
  } catch (error) {
    state.textContent = error.message;
  }
});

approve.addEventListener("change", () => record.disabled = !approve.checked);
record.addEventListener("click", () => {
  if (!currentPlan || !approve.checked) return;
  currentPlan.decision = "approved-for-execution";
  currentPlan.approved_at = new Date().toISOString();
  decisionStatus.textContent = "Approval recorded locally";
  record.disabled = true;
});

document.querySelector("#export").addEventListener("click", () => {
  if (!currentPlan) return;
  const blob = new Blob([JSON.stringify(currentPlan, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = Object.assign(document.createElement("a"), { href: url, download: `consent-plan-${currentPlan.id.slice(0, 8)}.json` });
  anchor.click();
  URL.revokeObjectURL(url);
});
