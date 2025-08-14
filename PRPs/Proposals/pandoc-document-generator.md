---
up: ["document-browser-panel"]
related: ["document-upload-browser"]
---

# Pandoc Document Generation from Markdown with Template Support

## Role
Act as a backend developer specializing in document processing pipelines and integration of Pandoc with web applications for multi-format document generation.

## Objective
Create a feature that generates PDFs from DOCX and DOCX from prompts, where conversations produce well-structured Markdown that is passed to a tool using Pandoc with templates to generate documents in various formats.

## Context
The system needs to integrate document generation capabilities into the chat interface. Key aspects include:

- Generation of PDFs from DOCX files
- Generation of DOCX from prompts
- Conversations that produce well-structured Markdown as responses
- Integration with Pandoc for document processing
- Support for all export types available in Pandoc
- Template system supporting any Pandoc-compatible template
- Templates sourced from:
  - A system folder with default templates
  - Uploaded as attachments in generation requests
- Generated documents opening in the artifact box, similar to clicking documents in the document browser (PRPs/Proposals/document-browser-pane.md)

## Instructions
Implement the following components:

1. **Markdown Generation from Chat**
   - Ensure conversations produce well-structured Markdown responses
   - Maintain proper formatting for document generation
   - Handle different document structure requests (reports, articles, etc.)

2. **Pandoc Integration Tool**
   - Create a tool that receives Markdown input
   - Accept optional template parameter
   - Support all Pandoc export formats
   - Process documents using Pandoc with specified templates

3. **Template Management**
   - Set up a default templates folder in the system
   - Support template upload via chat attachments
   - Validate Pandoc template compatibility
   - Allow template selection during document generation

4. **Document Generation Flow**
   - Accept generation requests with format specification
   - Process Markdown through Pandoc with selected template
   - Handle PDF from DOCX conversion
   - Handle DOCX generation from prompts
   - Support all Pandoc-supported output formats

5. **Artifact Box Integration**
   - Display generated documents in the artifact box
   - Implement same behavior as document browser clicks
   - Enable preview and download of generated files
   - Maintain consistency with existing document browser functionality

6. **Document Upload and Storage**
   - Add upload/save button at the top of generated documents
   - Support direct upload to document browser folder
   - Save documents to GitLab or local folder based on configuration
   - Submit generated documents to Document Browser Pane for storage
   - Ensure compatibility with both GitLab and local storage backends

## Notes
The tool should be a seamless integration where users can request document generation naturally in conversation. The system must handle both template management and document processing efficiently. The generated document should appear in the artifact box exactly as if clicked from the document explorer implemented in PRPs/Proposals/document-browser-pane.md. 

Key considerations:
- The upload/save functionality should make logical sense to users, as both actions result in storing the document
- Document storage should seamlessly integrate with the Document Browser Pane's existing storage infrastructure
- Support for both GitLab and local folder storage ensures flexibility across different deployment scenarios
- Consider implementing caching for frequently used templates and error handling for incompatible template-format combinations