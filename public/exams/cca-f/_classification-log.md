# CCA-F Question Classification Log

Run at: 2026-04-20T19:42:59.678979

Total questions classified: 364 / 364

## Per-scenario counts

- Scenario 1 (Customer Support Resolution Agent): 74 questions
- Scenario 2 (Code Generation with Claude Code): 60 questions
- Scenario 3 (Multi-Agent Research System): 77 questions
- Scenario 4 (Developer Productivity with Claude): 51 questions
- Scenario 5 (Claude Code for CI/CD): 34 questions
- Scenario 6 (Structured Data Extraction): 68 questions

## Per-domain / scenario breakdown

- `domain-1-agentic` -> scenario 1: 43
- `domain-1-agentic` -> scenario 3: 44
- `domain-2-claude-code` -> scenario 2: 60
- `domain-2-claude-code` -> scenario 5: 13
- `domain-3-prompt-engineering` -> scenario 5: 21
- `domain-3-prompt-engineering` -> scenario 6: 51
- `domain-4-mcp` -> scenario 1: 9
- `domain-4-mcp` -> scenario 4: 51
- `domain-5-context` -> scenario 1: 22
- `domain-5-context` -> scenario 3: 33
- `domain-5-context` -> scenario 6: 17

## Method

- Domain -> allowed scenarios was enforced from `_scenarios.md` "Domains tested".
- Within the allowed set, each candidate scenario scored by keyword hits derived
  from its CORRECT/ANTI-PATTERN pairs (see `_classify.py`).
- Tiebreaker: scenario with fewer domains tested (more specific); then first in list.
- Zero-hit fallback: domain-1 -> 1, domain-2 -> 2, domain-3 -> 6, domain-4 -> 4, domain-5 -> 1.

## Ambiguous / tiebroken / fallback cases (n=79)

- `certsafari-domain-1-agentic-23979` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-23980` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-23984` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-23985` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-23986` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24075` (domain=domain-1-agentic): tie at score 2; chose scenario 3 from tied=['3', '1']
- `certsafari-domain-1-agentic-24076` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24140` (domain=domain-1-agentic): tie at score 1; chose scenario 3 from tied=['3', '1']
- `certsafari-domain-1-agentic-24141` (domain=domain-1-agentic): tie at score 1; chose scenario 3 from tied=['3', '1']
- `certsafari-domain-1-agentic-24160` (domain=domain-1-agentic): tie at score 1; chose scenario 3 from tied=['3', '1']
- `certsafari-domain-1-agentic-24163` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24169` (domain=domain-1-agentic): tie at score 1; chose scenario 3 from tied=['3', '1']
- `certsafari-domain-1-agentic-24229` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24230` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24231` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24233` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24237` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24238` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-24240` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-27620` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-28727` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-31370` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-1-agentic-32828` (domain=domain-1-agentic): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3'])
- `certsafari-domain-2-claude-code-24017` (domain=domain-2-claude-code): tie at score 1; chose scenario 2 from tied=['2', '5']
- `certsafari-domain-2-claude-code-24023` (domain=domain-2-claude-code): tie at score 1; chose scenario 2 from tied=['2', '5']
- `certsafari-domain-2-claude-code-24024` (domain=domain-2-claude-code): tie at score 1; chose scenario 2 from tied=['2', '5']
- `certsafari-domain-2-claude-code-24241` (domain=domain-2-claude-code): tie at score 2; chose scenario 2 from tied=['2', '5']
- `certsafari-domain-3-prompt-engineering-24095` (domain=domain-3-prompt-engineering): tie at score 1; chose scenario 5 from tied=['5', '6']
- `certsafari-domain-3-prompt-engineering-24121` (domain=domain-3-prompt-engineering): tie at score 1; chose scenario 5 from tied=['5', '6']
- `certsafari-domain-3-prompt-engineering-24122` (domain=domain-3-prompt-engineering): tie at score 1; chose scenario 5 from tied=['5', '6']
- `certsafari-domain-3-prompt-engineering-24130` (domain=domain-3-prompt-engineering): no keyword hit; used domain fallback; chose scenario 6 (candidates=['2', '5', '6'])
- `certsafari-domain-3-prompt-engineering-24183` (domain=domain-3-prompt-engineering): tie at score 1; chose scenario 5 from tied=['5', '6']
- `certsafari-domain-3-prompt-engineering-28771` (domain=domain-3-prompt-engineering): no keyword hit; used domain fallback; chose scenario 6 (candidates=['2', '5', '6'])
- `certsafari-domain-3-prompt-engineering-32821` (domain=domain-3-prompt-engineering): no keyword hit; used domain fallback; chose scenario 6 (candidates=['2', '5', '6'])
- `certsafari-domain-4-mcp-24063` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24066` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24109` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24113` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24114` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24115` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24117` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24145` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24147` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24148` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24150` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24152` (domain=domain-4-mcp): tie at score 1; chose scenario 4 from tied=['4', '1']
- `certsafari-domain-4-mcp-24154` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24155` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24156` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24266` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24267` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24268` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24270` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24271` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24273` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24275` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-24276` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-31739` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-32440` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-32826` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-32827` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-4-mcp-32832` (domain=domain-4-mcp): no keyword hit; used domain fallback; chose scenario 4 (candidates=['1', '4'])
- `certsafari-domain-5-context-24026` (domain=domain-5-context): tie at score 2; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24032` (domain=domain-5-context): tie at score 2; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24100` (domain=domain-5-context): tie at score 1; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24101` (domain=domain-5-context): tie at score 1; chose scenario 3 from tied=['3', '6', '1']
- `certsafari-domain-5-context-24104` (domain=domain-5-context): tie at score 2; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24195` (domain=domain-5-context): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3', '6'])
- `certsafari-domain-5-context-24198` (domain=domain-5-context): tie at score 3; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24199` (domain=domain-5-context): tie at score 1; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24202` (domain=domain-5-context): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3', '6'])
- `certsafari-domain-5-context-24203` (domain=domain-5-context): tie at score 1; chose scenario 3 from tied=['3', '6', '1']
- `certsafari-domain-5-context-24204` (domain=domain-5-context): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3', '6'])
- `certsafari-domain-5-context-24253` (domain=domain-5-context): tie at score 2; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24254` (domain=domain-5-context): tie at score 2; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24255` (domain=domain-5-context): tie at score 1; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24262` (domain=domain-5-context): tie at score 1; chose scenario 3 from tied=['3', '6']
- `certsafari-domain-5-context-24284` (domain=domain-5-context): tie at score 1; chose scenario 6 from tied=['6', '1']
- `certsafari-domain-5-context-24297` (domain=domain-5-context): no keyword hit; used domain fallback; chose scenario 1 (candidates=['1', '3', '6'])

## Time to complete: 0.04s
