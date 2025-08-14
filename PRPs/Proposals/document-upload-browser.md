---
up: ["document-browser-panel", "pandoc-document-generator"]
related: ["document-chat-integration"]
---

# Document Upload to Browser Folder

## Role
Act as a frontend developer specializing in document management systems and file upload interfaces with backend storage integration.

## Objective
Support direct document upload to the document browser folder, saving documents to GitLab or local folder based on configuration, with integration to the Pandoc Document Generator output.

## Context
The system needs to enable document uploads directly to the document browser's storage. Key requirements include:

- Direct upload support to document browser folder
- Storage destination based on configuration (GitLab or local folder)
- Integration with Pandoc Document Generator prompt
- Upload/save button on generated documents (both actions perform the same function)
- Submission of generated documents to Document Browser Pane for storage

The feature connects the document generation workflow with the document storage system, ensuring generated documents can be easily saved to the configured storage backend.

## Instructions
Implement the following functionality:

1. **Document Upload Interface**
   - Add upload functionality to document browser
   - Support direct uploads to configured storage location
   - Handle both GitLab and local folder destinations based on configuration

2. **Pandoc Document Generator Integration**
   - Add upload/save button at the top of generated documents
   - Ensure button naming makes sense (upload or save, both performing same action)
   - Connect generated document output to upload mechanism

3. **Storage Backend Handling**
   - Detect current storage configuration (GitLab or local folder)
   - Route document uploads to appropriate backend
   - Submit documents to Document Browser Pane for storage

4. **Document Browser Pane Integration**
   - Ensure uploaded documents appear in Document Browser Pane
   - Maintain consistency with existing document organization
   - Handle document metadata and indexing

## Notes
The upload and save buttons should be functionally identical, as both result in storing the document in the configured location. The integration with Pandoc Document Generator ensures a seamless workflow from document generation to storage. The system must respect the current storage configuration and route documents accordingly to either GitLab or the local folder system.