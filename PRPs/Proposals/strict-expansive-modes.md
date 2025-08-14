---
up: ["workspace-rage-api"]
related: []
---

# Strict and Expansive Response Modes

## Role
Act as a backend developer specializing in LLM context management and response filtering systems.

## Objective
Add Strict and Expansive modes to control how the LLM generates responses based on context sources.

## Context
The system needs two distinct response modes:

**Strict Mode:**
- Responses come only from context passed to the LLM
- Context comes largely from Rage API
- User remains confined to their workspace
- Restriction can be deactivated with specific phrases

**Expansive Mode:**
- No confinement to workspace
- Unrestricted response generation

**Override Phrases for Strict Mode:**
- "Pense para além da workspace"
- "Pense para além da área de trabalho"
- "Investigue na internet"

## Instructions
Implement the following modes:

1. **Strict Mode Implementation**
   - Limit responses to only the context passed to LLM
   - Ensure context primarily comes from Rage API
   - Keep user confined to their workspace context
   - Implement override detection for specific phrases

2. **Expansive Mode Implementation**
   - Allow unrestricted response generation
   - No workspace confinement
   - Full LLM capabilities available

3. **Override Mechanism**
   - Detect override phrases in Strict Mode
   - Temporarily disable restrictions when phrases detected
   - Handle phrases: "Pense para além da workspace", "Pense para além da área de trabalho", "Investigue na internet"

4. **Mode Switching**
   - Implement mode selection interface
   - Maintain mode state across conversations
   - Clear indication of current mode to user

## Notes
In Strict Mode, users are intentionally confined to their workspace context, creating a focused environment based on Rage API content. The override mechanism provides an escape hatch when users explicitly request broader thinking or internet investigation.