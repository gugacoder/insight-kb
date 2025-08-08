# STATE.md

System Signatures Map

Generated: 2025-08-08 
LibreChat Version: v0.8.0-rc1
Architecture: React + Node.js + MongoDB
Modules: 5 (Core LibreChat + NIC Insight Extensions)

---

## Module: Authentication & User Management

### API Endpoints
```yaml
- method: POST
  path: /api/auth/login
  accepts: {email: string, password: string, twoFactorCode?: string}
  returns: {token: string, refreshToken: string, user: object}

- method: POST
  path: /api/auth/register
  accepts: {name: string, email: string, password: string, confirm_password: string}
  returns: {user: object}

- method: POST
  path: /api/auth/logout
  returns: {message: string}

- method: POST
  path: /api/auth/refresh
  accepts: {refreshToken: string}
  returns: {token: string, refreshToken: string}

- method: POST
  path: /api/auth/resetPassword
  accepts: {token: string, password: string, confirm_password: string}
  returns: {message: string}

- method: GET
  path: /api/auth/2fa/enable
  returns: {qrCode: string, secret: string}

- method: POST
  path: /api/auth/2fa/verify
  accepts: {token: string}
  returns: {backupCodes: string[]}
```

### Data Models
```yaml
User:
  - _id: ObjectId
  - name: String
  - username: String (unique)
  - email: String (unique, required)
  - emailVerified: Boolean
  - password: String (hashed)
  - avatar: String
  - provider: String (local, google, github, etc.)
  - providerId: String
  - role: String (default: "USER")
  - refreshToken: [String]
  - plugins: [ObjectId] ref Plugin
  - balance: Number (default: 0)
  - twoFactorSecret: String
  - twoFactorEnabled: Boolean
  - twoFactorBackupCodes: [String]
  - createdAt: Date
  - updatedAt: Date
  relations:
    - hasMany: Conversation
    - hasMany: Message
    - hasMany: File
    - hasMany: Transaction
    - hasMany: Agent
    - hasMany: Assistant
```

### Public Interfaces
```yaml
- authenticateUser:
    purpose: Validate user credentials and return JWT
    accepts: email (string), password (string), twoFactorCode? (string)
    returns: {user, tokens} or error

- refreshUserToken:
    purpose: Generate new access token from refresh token
    accepts: refreshToken (string)
    returns: {accessToken, refreshToken} or error

- validateUserAccess:
    purpose: Check user permissions for resource access
    accepts: userId (string), resource (string), action (string)
    returns: boolean
```

### Business Rules
```yaml
- JWT tokens expire after 1 hour
- Refresh tokens expire after 7 days
- Email must be unique per user
- Passwords must be hashed with bcryptjs
- 2FA backup codes are single-use only
- User roles determine feature access permissions
- Account lockout after 5 failed login attempts
```

### External Dependencies
```yaml
- bcryptjs: ^2.4.3 (password hashing)
- jsonwebtoken: ^9.0.0 (JWT generation)
- passport: ^0.6.0 (authentication strategies)
- passport-jwt: ^4.0.1 (JWT strategy)
- passport-google-oauth20: ^2.0.0 (Google OAuth)
- passport-github2: ^0.1.12 (GitHub OAuth)
```

---

## Module: Conversation & Message Management

### API Endpoints
```yaml
- method: GET
  path: /api/convos
  accepts: {page?: number, pageSize?: number}
  returns: {conversations: object[], pages: number, pageNumber: number}

- method: GET
  path: /api/convos/:conversationId
  returns: {conversation: object}

- method: POST
  path: /api/convos/gen_title
  accepts: {conversationId: string, model: string}
  returns: {title: string}

- method: DELETE
  path: /api/convos
  accepts: {conversationId: string, source?: string}
  returns: {message: string}

- method: POST
  path: /api/convos/update
  accepts: {conversationId: string, title: string}
  returns: {conversation: object}

- method: GET
  path: /api/messages/:conversationId
  returns: {messages: object[]}

- method: POST
  path: /api/messages/:conversationId
  accepts: {message: object, endpoint: string, model: string}
  returns: {message: object, conversation: object}

- method: PUT
  path: /api/messages/:conversationId/:messageId
  accepts: {text: string}
  returns: {message: object}
```

### Data Models
```yaml
Conversation:
  - conversationId: String (unique, required, indexed)
  - title: String (default: "New Chat")
  - user: String (indexed, required)
  - messages: [ObjectId] ref Message
  - endpoint: String
  - model: String
  - modelLabel: String
  - promptPrefix: String
  - temperature: Number
  - topP: Number
  - topK: Number
  - context: String
  - top_p: Number
  - frequency_penalty: Number
  - presence_penalty: Number
  - max_tokens: Number
  - chatGptLabel: String
  - maxContextTokens: Number
  - agentOptions: Mixed
  - agent_id: String
  - tags: [String] (indexed)
  - files: [String]
  - expiredAt: Date
  - createdAt: Date
  - updatedAt: Date
  relations:
    - belongsTo: User
    - hasMany: Message
    - hasMany: File

Message:
  - messageId: String (unique, required, indexed)
  - conversationId: String (indexed, required)
  - user: String (indexed, required)
  - model: String
  - endpoint: String
  - text: String (required)
  - isCreatedByUser: Boolean (default: false)
  - error: Boolean (default: false)
  - parentMessageId: String
  - tokenCount: Number
  - plugin: Mixed
  - plugins: [Mixed]
  - finish_reason: String
  - unfinished: Boolean (default: false)
  - cancelled: Boolean (default: false)
  - isEdited: Boolean (default: false)
  - children: [String]
  - files: [Mixed]
  - searchResult: Boolean (default: false)
  - createdAt: Date
  - updatedAt: Date
  relations:
    - belongsTo: Conversation
    - belongsTo: User
    - hasMany: ToolCall
```

### Public Interfaces
```yaml
- getConversations:
    purpose: Retrieve paginated conversations for user
    accepts: userId (string), page (number), pageSize (number)
    returns: {conversations: object[], pagination: object}

- saveMessage:
    purpose: Store new message in conversation
    accepts: messageData (object)
    returns: Message object

- generateTitle:
    purpose: Auto-generate conversation title from content
    accepts: conversationId (string), model (string)
    returns: string

- searchMessages:
    purpose: Search messages by content and metadata
    accepts: query (string), filters (object)
    returns: Message[]
```

### Business Rules
```yaml
- Messages are ordered by creation timestamp
- Parent-child relationships track conversation threads
- Token counting for billing and limits
- Message editing creates version history
- Conversation titles auto-generated after 2+ messages
- Search indexing via MeiliSearch for full-text search
- File attachments linked via files array
- Conversations can have expiration dates for temp chats
```

### External Dependencies
```yaml
- meilisearch: ^0.38.0 (search indexing)
- tiktoken: ^1.0.15 (token counting)
- mongoose: ^8.12.1 (MongoDB ODM)
```

---

## Module: AI Clients & Model Integration

### API Endpoints
```yaml
- method: GET
  path: /api/endpoints
  returns: {endpoints: object[]}

- method: GET
  path: /api/models
  accepts: {endpoint?: string}
  returns: {models: object[]}

- method: POST
  path: /api/edit/openAI
  accepts: {conversationId: string, parentMessageId: string, text: string}
  returns: Server-Sent Events stream

- method: POST
  path: /api/edit/anthropic
  accepts: {conversationId: string, parentMessageId: string, text: string}
  returns: Server-Sent Events stream

- method: POST
  path: /api/edit/google
  accepts: {conversationId: string, parentMessageId: string, text: string}
  returns: Server-Sent Events stream
```

### Data Models
```yaml
Preset:
  - presetId: String (unique)
  - user: String (indexed)
  - title: String (required)
  - endpoint: String (required)
  - model: String
  - modelLabel: String
  - promptPrefix: String
  - temperature: Number (min: 0, max: 2)
  - topP: Number (min: 0, max: 1)
  - topK: Number (min: 0, max: 40)
  - maxOutputTokens: Number
  - maxContextTokens: Number
  - context: String
  - examples: [Mixed]
  - chatGptLabel: String
  - max_tokens: Number
  - frequency_penalty: Number
  - presence_penalty: Number
  - resendFiles: Boolean
  - imageDetail: String
  - iconURL: String
  - greeting: String
  - spec: String
  - createdAt: Date
  - updatedAt: Date
```

### Public Interfaces
```yaml
- createLLMClient:
    purpose: Initialize AI provider client
    accepts: endpoint (string), credentials (object), options (object)
    returns: LLM Client instance

- streamChatCompletion:
    purpose: Stream AI responses via Server-Sent Events
    accepts: messages (array), model (string), options (object)
    returns: EventSource stream

- validateModelAccess:
    purpose: Check user access to specific models
    accepts: userId (string), endpoint (string), model (string)
    returns: boolean

- countTokens:
    purpose: Calculate token usage for billing
    accepts: text (string), model (string)
    returns: number
```

### Business Rules
```yaml
- Model access controlled by user permissions and API keys
- Token limits enforced per model and user tier
- Streaming responses via Server-Sent Events
- Multiple AI providers supported (OpenAI, Anthropic, Google, etc.)
- Model-specific parameter validation
- Rate limiting per endpoint and user
- Conversation context managed within token limits
- File attachments processed per model capabilities
```

### External Dependencies
```yaml
- openai: ^5.10.1 (OpenAI API client)
- @anthropic-ai/sdk: ^0.52.0 (Anthropic API client)
- @google/generative-ai: ^0.24.0 (Google Gemini client)
- @langchain/openai: ^0.5.18 (LangChain OpenAI integration)
- @langchain/google-genai: ^0.2.13 (LangChain Google integration)
- ollama: ^0.5.0 (Ollama local model client)
- tiktoken: ^1.0.15 (OpenAI tokenization)
```

---

## Module: File Management & Processing

### API Endpoints
```yaml
- method: GET
  path: /api/files
  accepts: {page?: number, pageSize?: number}
  returns: {files: object[], pages: number}

- method: POST
  path: /api/files
  accepts: multipart/form-data {file: File}
  returns: {file: object}

- method: DELETE
  path: /api/files
  accepts: {files: string[]}
  returns: {message: string}

- method: GET
  path: /api/files/config
  returns: {fileConfig: object}

- method: GET
  path: /api/files/download/:userId/:file_id
  returns: File stream

- method: POST
  path: /api/files/images
  accepts: multipart/form-data {file: File}
  returns: {file: object, url: string}
```

### Data Models
```yaml
File:
  - user: ObjectId (ref User, indexed, required)
  - conversationId: String (ref Conversation, indexed)
  - file_id: String (indexed, required)
  - temp_file_id: String
  - bytes: Number (required)
  - filename: String (required)
  - filepath: String (required)
  - object: String (required)
  - purpose: String (default: "assistants")
  - source: String (enum: FileSources)
  - type: String (enum: file, image, avatar, etc.)
  - width: Number (for images)
  - height: Number (for images)
  - context: String
  - embedded: Boolean (default: false)
  - metadata: Mixed
  - usage: Mixed
  - assistants: [ObjectId]
  - agents: [ObjectId]
  - createdAt: Date
  - updatedAt: Date
  relations:
    - belongsTo: User
    - belongsTo: Conversation
    - belongsToMany: Assistant
    - belongsToMany: Agent
```

### Public Interfaces
```yaml
- uploadFile:
    purpose: Process and store uploaded files
    accepts: fileData (FormData), userId (string)
    returns: File object

- processFileForAI:
    purpose: Extract text/metadata for AI processing
    accepts: fileId (string), processingType (string)
    returns: {content: string, metadata: object}

- generateFileDownloadUrl:
    purpose: Create secure download URL
    accepts: fileId (string), userId (string)
    returns: string

- deleteUserFiles:
    purpose: Remove files and cleanup storage
    accepts: fileIds (string[]), userId (string)
    returns: boolean
```

### Business Rules
```yaml
- File uploads limited by user tier and file type
- Supported formats: PDF, DOCX, TXT, CSV, JSON, images
- Image resizing and format conversion for web display
- Vector embeddings generated for document search
- Storage backends: local, S3, Firebase, Azure
- File sharing controlled by conversation access
- Automatic cleanup of temporary files
- File processing for AI model compatibility
```

### External Dependencies
```yaml
- multer: ^2.0.2 (file upload middleware)
- sharp: ^0.33.5 (image processing)
- file-type: ^18.7.0 (file type detection)
- @aws-sdk/client-s3: ^3.758.0 (S3 storage)
- @azure/storage-blob: ^12.27.0 (Azure storage)
- firebase: ^11.0.2 (Firebase storage)
```

---

## Module: Agents & Assistants

### API Endpoints
```yaml
- method: GET
  path: /api/agents
  returns: {agents: object[]}

- method: POST
  path: /api/agents
  accepts: {name: string, description: string, instructions: string, model: string}
  returns: {agent: object}

- method: PUT
  path: /api/agents/:agentId
  accepts: {name?: string, description?: string, instructions?: string}
  returns: {agent: object}

- method: DELETE
  path: /api/agents/:agentId
  returns: {message: string}

- method: GET
  path: /api/assistants/v1
  returns: {assistants: object[]}

- method: POST
  path: /api/assistants/v1
  accepts: {name: string, model: string, instructions: string, tools?: object[]}
  returns: {assistant: object}

- method: POST
  path: /api/assistants/v1/:assistantId/chat
  accepts: {message: string, thread_id?: string}
  returns: Server-Sent Events stream
```

### Data Models
```yaml
Agent:
  - agent_id: String (unique, required)
  - user: ObjectId (ref User, required)
  - name: String (required)
  - description: String
  - instructions: String (required)
  - model: String (required)
  - provider: String (required)
  - tools: [Mixed]
  - tool_resources: Mixed
  - metadata: Mixed
  - model_parameters: Mixed
  - avatar: Mixed
  - createdAt: Date
  - updatedAt: Date
  relations:
    - belongsTo: User
    - hasMany: File
Assistant:
  - assistant_id: String (unique, required)
  - user: ObjectId (ref User, required)
  - name: String (required)
  - description: String
  - instructions: String (required)
  - model: String (required)
  - tools: [Mixed]
  - metadata: Mixed
  - createdAt: Date
  - updatedAt: Date
  relations:
    - belongsTo: User
    - hasMany: File


### Public Interfaces
```yaml
- createAgent:
    purpose: Create new AI agent with custom instructions
    accepts: agentData (object), userId (string)
    returns: Agent object

- initializeAssistant:
    purpose: Set up OpenAI-style assistant with tools
    accepts: assistantConfig (object), userId (string)
    returns: Assistant object

- executeAgentTask:
    purpose: Run agent with tools and context
    accepts: agentId (string), task (string), context (object)
    returns: execution result

- manageAgentTools:
    purpose: Configure available tools for agent
    accepts: agentId (string), tools (array)
    returns: updated agent configuration
```

### Business Rules
```yaml
- Agents are user-specific and cannot be shared between users
- Each agent must have a specified model and provider
- Tool access controlled by user permissions and API quotas
- Agent instructions can include system prompts and examples
- Assistants follow OpenAI API standards for compatibility
- File attachments processed according to agent capabilities
- Agent conversations logged for debugging and improvement
```

### External Dependencies
```yaml
- @librechat/agents: ^2.4.72 (agent execution framework)
- @langchain/core: ^0.3.62 (LangChain core utilities)
- @langchain/community: ^0.3.47 (community tools)
```


---

## System-Wide Configuration

### Environment Requirements
```yaml
- runtime: Node.js 20+
- database: MongoDB 6.0+
- cache: Redis 7+ (optional)
- search: MeiliSearch 1.5+ (optional)
- storage: Local filesystem, S3, Azure, or Firebase
```

### Global Business Rules
```yaml
- All API responses include request correlation IDs
- Rate limiting enforced per user and endpoint
- File uploads limited by user tier (free: 20MB, pro: 100MB)
- Conversations auto-expire after 30 days for free users
- Search indexing updates within 5 seconds of content changes
- Token usage tracked for billing and quota enforcement
- All user data isolated by userId for multi-tenancy
- CORS enabled for specified frontend domains only
```

### Integration Points
```yaml
Authentication → Conversations:
  - interface: validateUserAccess
  - contract: Provides user context for conversation ownership

Files → Messages:
  - interface: attachFilesToMessage
  - contract: Links file references to message content

Agents → AI Models:
  - interface: createLLMClient
  - contract: Configures model access with agent parameters

Search → Conversations:
  - interface: indexConversationContent  
  - contract: Enables full-text search across user messages

Frontend → Backend:
  - interface: React Query + REST APIs
  - contract: Type-safe data fetching with optimistic updates
```

