---
up: []
related: []
---

# SMTP Email Configuration System

## Role
Act as a full-stack developer specializing in email configuration interfaces, SMTP auto-discovery, and user-friendly configuration testing systems.

## Objective
Add an email configuration system that focuses on sending messages using SMTP, with automatic configuration discovery and advanced manual options.

## Context
The system needs SMTP configuration for sending emails with the following requirements:

- Focus on SMTP configuration (only need to send messages)
- User inputs parameters and system tests configuration to discover correct settings
- Advanced mode allows manual tweaking
- Automatic inference based on email suffix (e.g., "@gmail")
- Automatic inference of:
  - Port
  - SSL usage
  - Endpoint
- System tests and discovers real parameters, then authorizes transmission
- Test interface sends email immediately with configurations
- Test email asks user to verify receipt
- Test email is sent to user's own email
- Advanced box allows full email configuration
- Support for unknown email configurations through manual setup
- During auto-discovery, if user provides email and SMTP address, system can infer port and SSL
- User can still manually mark these options
- Interface needs to be very user-friendly

## Instructions
Implement the following components:

1. **Basic Configuration Interface**
   - User-friendly email input field
   - Automatic suffix detection (e.g., "@gmail")
   - Automatic parameter inference based on email provider
   - Simple interface for common email providers

2. **Auto-Discovery System**
   - Detect email suffix and infer SMTP settings
   - Automatic port detection
   - SSL/TLS configuration inference
   - Endpoint discovery
   - Test discovered configurations

3. **Configuration Testing**
   - Send test email immediately upon configuration
   - Send test email to user's own address
   - Request user verification of email receipt
   - Authorize transmission after successful test

4. **Advanced Configuration Mode**
   - Manual SMTP server input
   - Manual port configuration
   - SSL/TLS toggle options
   - Full parameter control for unknown providers
   - Combination of auto-discovery and manual tweaking

5. **Smart Inference Logic**
   - When email and SMTP address provided, infer port and SSL
   - Allow manual override of inferred settings
   - Support for unknown email configurations
   - Flexible configuration options

## Notes
The interface must be very user-friendly, balancing automatic configuration for common providers with advanced options for custom setups. The system should make intelligent inferences while allowing users to override any automatic decisions. The test email verification ensures configurations work before authorizing the system for regular email sending.