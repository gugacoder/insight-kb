---
up: ["document-browser-panel"]
related: ["document-upload-browser", "workspace-selector"]
---

# Document Chat Integration with File Reference System

## Role
Act as a full-stack developer specializing in React frontend development and chat interface design with file management capabilities.

## Objective
Implement a document conversation feature that allows users to chat with opened documents from the document browser panel, with automatic file referencing using @ mentions and file index browsing with # shortcuts.

## Context
This feature builds upon the existing document browser panel in NIC Insight. The system should enable seamless interaction between document viewing and chat functionality. Key components include:

- Document browser panel integration (existing)
- Chat interface enhancement for file references
- @ mention system for automatic file inclusion
- # shortcut system for file index browsing
- Real-time document context integration

The feature requires coordination between the document browser UI, chat input system, and file management backend to provide a unified document conversation experience.

## Instructions
Implement the following functionality:

1. **Document Mention Button**
   - Add a mention option that appears at the top of opened documents in the document browser panel
   - Clicking the mention button automatically inserts the file reference with @ symbol into the active chat
   - Ensure the reference includes proper file path and context

2. **@ Mention System**
   - Enable @ symbol typing in chat to trigger file reference autocomplete
   - Display available files from the document browser when @ is typed
   - Allow selection and automatic insertion of file references into chat messages
   - Maintain file context when referenced in conversations

3. **# File Index Browsing**
   - Implement # shortcut in chat input to open file index overlay
   - Display all available files from the document explorer in an easily browsable format
   - Enable quick selection and inclusion of multiple files as conversation context
   - Support search/filter functionality within the file index

4. **Chat-Document Integration**
   - Establish connection between opened documents and active chat sessions
   - Ensure referenced files maintain their content context in conversations
   - Handle file updates and maintain conversation relevance
   - Implement proper error handling for missing or inaccessible files

## Notes
The implementation should leverage the existing document browser panel infrastructure without requiring major architectural changes. The feature should feel natural and intuitive, allowing users to seamlessly transition between document viewing and conversational interaction. Consider performance implications when loading file content into chat context and implement appropriate caching strategies.