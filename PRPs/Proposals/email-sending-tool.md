---
up: ["smtp-email-configuration"]
related: ["pandoc-document-generator"]
---

# Email Sending Tool with Markdown Content

## Role
Act as a backend developer specializing in email integration, configuration management, and Markdown-to-email conversion with attachment handling.

## Objective
Add email sending capability when the user has configured their email in the configuration boxes, allowing the chat to send emails with current information when requested.

## Context
The system needs email sending functionality with the following requirements:

- Email sending only available when user has configured email in configuration boxes
- Tool that can send emails when requested in chat
- Send email with current information when asked
- Attached files marked with @ in prompts should be sent as attachments
- Email content will be the produced Markdown
- If Markdown contains images, images should be included

## Instructions
Implement the following components:

1. **Email Configuration Management**
   - Check if user has configured email in configuration boxes
   - Validate email configuration before sending
   - Store and manage email settings securely

2. **Email Sending Tool**
   - Create tool that sends emails upon chat request
   - Send email with current information when requested
   - Handle email composition and delivery

3. **Attachment Handling**
   - Process files referenced with @ in prompts
   - Attach referenced files to email
   - Support multiple attachments

4. **Markdown Content Processing**
   - Use produced Markdown as email content
   - Convert Markdown to email-compatible format
   - Include images from Markdown in email

5. **Image Handling**
   - Extract images from Markdown content
   - Embed or attach images in email
   - Ensure images display correctly in email clients

## Notes
The email sending feature depends on proper email configuration in the configuration boxes. The system should seamlessly convert Markdown content to email format while preserving formatting and including all referenced attachments and images. Files mentioned with @ in the prompt will be automatically attached to the email.