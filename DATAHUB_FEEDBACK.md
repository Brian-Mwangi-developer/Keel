# DataHub Feedback — Keel Hackathon Build

## What worked well

**MCP Server (Model Context Protocol)**
- DataHub's own MCP server (`mcp-server-datahub`) is load-bearing for the agent chapter. It's well-designed, surfaces real read-only tools (lineage, entities, queries, schema), and the stdio spawn/tool-calling pattern is clean and debuggable.
- The agent's ability to genuinely investigate using the same tools a human would use (not a scripted rule engine) was only possible because DataHub exposed this interface.

**Lineage Graph as a First-Class API**
- Multi-hop lineage walks (upstream, downstream, paths-between) are queryable via both GraphQL and the MCP tools. This is the load-bearing primitive for Keel's entire trust model.
- DataHub's lineage correctness directly translates to trust score correctness. The graph structure is expressive enough to model real data flows.

**Ownership Aspect & DataHub Domains**
- The `ownership` aspect on entities is native and queryable, making it possible to route notifications to real teams/groups without hand-configuration.
- DataHub Domains (reused in this build as the "department" abstraction) map cleanly to organizational structure. Using them instead of inventing a parallel config layer saved significant complexity.

**Assertion Entities as Real Quality Rules**
- Assertions aren't bolted on; they're native entities with lineage, ownership, and live run events. Writing trust scores back as structured properties and deprecation status means Keel isn't a read-only dashboard — it's part of DataHub's graph itself.

**Timeline API (Schema Change History)**
- For detecting schema churn as a hygiene factor, the Timeline API's schema-change history is exactly what's needed. It integrates directly with freshness/stability scoring without requiring a separate audit table.

---

## Where we got stuck or lost time

### 1. **GraphQL Response Caching / Context Staleness After Writes**
**The Problem:**
When we emitted a mutation (e.g., `set_deprecation` to flag an asset, or `add_owner` to assign ownership), the very next read query — even over the same connection/session — sometimes returned stale state from before the write was committed. We'd have to re-issue the query or batch the write and read into a single operation to guarantee we saw the new state.

**Why it matters:**
- In Keel's incident-resolution flow, we mark an asset fixed (unflag + re-pass assertion), then immediately fetch its state to confirm and display recovery. Cache staleness meant the UI would show the old red score even though the write succeeded.
- We worked around it by embedding fetches inside the mutation response (not ideal for separation of concerns) and sometimes re-issuing reads with explicit cache-busting parameters.

**What would help:**
- Document cache TTLs and invalidation scoping per GraphQL operation (e.g., does a mutation on entity X invalidate cached reads of X's lineage? Just X itself? The whole graph?).
- Expose a cache-control parameter on reads (e.g., `?cache=false` or `@cached(ttl: 0)` in queries) so callers can opt into fresh data when consistency is critical.
- Or: ensure MCP mutations invalidate the GMS cache for affected entities, so `get_entities` after a write always reflects the change.

### 2. **CorpGroup Slack Integration Gap**
**The Problem:**
DataHub's `CorpGroup` entity has no `slack_channel_id` or similar field. There's no native way to map "which Slack channel does @data-engineering use?" from DataHub directly.

**Impact:**
For department-based notifications, we had to hand-configure a JSON file (`department_channels.json`) mapping domain URNs to Slack channel IDs, rather than letting DataHub's own group model carry that metadata. This is a small config file, but it breaks the principle that DataHub should be the source of truth for organizational structure.

**What would help:**
- Add a `contact_info` or `integrations` aspect to `CorpGroup` that can hold Slack workspace ID + channel ID, Teams channel, Pagerduty escalation policy, etc.
- Or: a simple extension point (custom properties?) where integrations can store normalized "how do you reach this team?" metadata.

### 3. **No Native Failing-Check / Severity Tagging on Assertions**
**The Problem:**
Assertion entities have no dedicated `severity` field. We worked around it by attaching Slack tags (`urn:li:tag:keel:severity:critical`) to assertions, which works but feels indirect.

**Why it matters:**
- The agent needs to prioritize critical failures differently (escalate higher, shorter time budget before default to human).
- The UI needs to visually distinguish "failed a warning check" from "failed a critical check" without parsing tag URNs.

**What would help:**
- Add a native `severity: Enum("critical", "warning", "info")` field to `AssertionDefinition`.
- Or: a standard tag naming convention / schema that DataHub itself understands and surfaces (not just user-defined tags).

### 4. **Mutations Don't Validate Against Live Schema / Lineage**
**The Problem:**
When writing a deprecation flag, setting ownership, or creating an assertion, DataHub accepts the mutation without checking if the URN actually exists or is in the right state. You get back a 200 OK even if you're flagging a non-existent entity or creating a duplicate assertion.

**Why it matters:**
- Silent failures are hard to debug. We'd write an owner assignment only to discover it didn't take because of a typo in the URN or a permission issue buried in a generic error.
- Validation errors aren't returned in a structured way (e.g., a `validation_errors` field in the response); you have to watch the logs or re-read the entity to see if it actually changed.

**What would help:**
- Return a `success: bool` + structured `errors: [{code, message, field}]` from mutations, not just HTTP 200/500.
- Let callers opt into validation (e.g., `&validate=true` on a mutation) so they can fail fast without the cost of full validation every time.

### 5. **Docs Gap: MCP Tool Availability by DataHub Version**
**The Problem:**
DataHub's MCP server tools vary by GMS version. We spent time discovering which tools were available in the version running locally (`searchAcrossEntities`, `get_lineage`, `list_schema_fields` all work; `get_dataset_queries` exists but return shape varies by version).

**Why it matters:**
- The agent's investigation quality depends on what tools are available. If a tool doesn't exist or changed shape, the LLM's tool calls fail ungracefully.
- We had to write defensive fallbacks ("if this tool call fails, try this other approach") which adds complexity and reduces reliability.

**What would help:**
- Publish a version matrix: "MCP tools available by DataHub GMS version" (like a browser compatibility table, but for tools).
- The MCP server should advertise its own capabilities on startup (e.g., an introspection endpoint) so clients can adapt without trial-and-error.

---

## If you had unlimited time: Top priorities

### 1. **Real-Time Change Streams (MetadataChangeLog Subscriptions)**
**Why it matters:**
Right now, Keel polls `GET /assets` and `GET /pipeline/feed` to detect when scores need recomputing or when incidents open. A proper event stream would let us react instantly when upstream lineage changes, assertions flip, or ownership shifts.

**For teams like us:**
- Governance/observability products live or die on "did I catch the problem before anyone acted on the bad number?" Real-time feels table-stakes.
- Trust scores that update live as metadata changes would let us show "this just broke 30 seconds ago" instead of "we noticed it on the last poll cycle."

### 2. **Governance Actions as Native Workflows**
**Why it matters:**
Today, marking an asset "unsafe to consume" (deprecation flag) is a separate mutation from "who should I notify and how?" Keel has to stitch these together as code.

**Imagine this in DataHub:**
- A native "incident" or "governance action" entity that bundles: what's wrong (failing assertion), why it matters (blast radius / downstream consumers), who owns it, what action is recommended (flag/notify/reassign), and explicit approval audit trail.
- Integrations (Slack, PagerDuty, Jira) could subscribe to these workflows and auto-create tickets/alerts without custom code.

**For teams like us:**
- This would let Keel be a governance recommender + orchestrator without reimplementing incident management from scratch. The agent would draft the action; DataHub would route it, audit it, and execute integrations.

### 3. **Structured Property Schema / Validation**
**Why it matters:**
Keel writes trust scores and incident memory as untyped structured properties. There's no schema to say "this property must be an integer 0-100" or "this array of objects must have these fields." DataHub accepts anything.

**What we'd want:**
- Let organizations define a schema for their structured properties (JSON Schema or similar).
- DataHub validates writes against that schema, rejecting invalid data.
- The GraphQL API could expose typed fields (`trustScore: Int!`) instead of opaque JSON blobs.

**For teams like us:**
- We could guarantee the trust score is always valid without defensive type-checking in the app layer.
- Downstream systems (BI tools, data catalogs, automation) could rely on the schema instead of assuming the shape.

### 4. **Multi-Tenant / RBAC for Governance Actions**
**Why it matters:**
Today, marking an asset deprecated or assigning an owner is visible to everyone in the DataHub instance, but there's no way to restrict "who can approve an incident fix" or "which teams can see which assets' governance history."

**What's needed:**
- RBAC for governance actions (e.g., "only domain owners can mark assets fixed," "Finance can only see incidents on financial assets").
- Audit logs that show who approved what and when.

**For teams like us:**
- Multi-team DataHub instances (common in large orgs) need guardrails so one team can't accidentally unflag another team's asset or approve an incident they're not qualified to handle.

---

## Closing

DataHub is genuinely useful for the "know what your data is made of" half of this problem. The lineage graph, assertions, ownership, and MCP tool surface are well-designed. The gap isn't in DataHub's core; it's in the integration/orchestration layer — once DataHub tells us what's wrong, there's no native way to route approvals, execute remediations, or keep strong consistency between writes and reads.

Keel works *because* it treats DataHub as load-bearing (not just a source of read-only metadata), but that integration is manual. If DataHub itself had native workflows for governance actions, real-time change streams, and better mutation semantics, products like Keel could be simpler, faster, and more reliable.
