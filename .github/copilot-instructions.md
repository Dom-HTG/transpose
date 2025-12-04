# Transpose AI Coding Agent Instructions

## Project Overview

Transpose is a **natural language blockchain transaction agent** that enables users to interact with blockchain systems (primarily Base chain) using conversational language instead of technical commands. The system uses **LangChain + Groq (llama-3.3-70b)** to parse user intent and **viem** for blockchain execution.

## Architecture Pattern

### Clean Architecture Layers

The codebase follows **Domain-Driven Design (DDD)** principles with clear separation:

```
src/
├── domain/          # Business logic layer (services, repositories, entities)
├── infrastructure/  # External concerns (database, blockchain, agent, queues)
├── internal/        # Orchestration & coordination logic
├── lib/             # Shared utilities (logger, errors, types)
└── app/             # Background workers & job processors (BullMQ)
```

**Key Pattern**: Services are injected with `pino.Logger` and `DataSource` in constructors. All domain services follow the pattern:

```typescript
constructor(private applogger: pino.Logger, appDataSource: DataSource) {
  this.logger = applogger;
  this.dataSource = appDataSource;
}
```

### Agent Workflow

1. **User Input** → `/chat` endpoint receives natural language query
2. **LangChain Agent** (`AgentManager`) parses query into structured JSON using Zod schemas
3. **ToolOrchestrator** maps the parsed action to appropriate tool (transfer, swap, balance_check)
4. **Domain Service** executes the blockchain operation via viem

## Critical Development Practices

### Database & Entities

- Use **TypeORM** with decorators (`@Entity`, `@Column`, `@ManyToOne`, etc.)
- All entities extend `BaseEntity` (provides `id`, `createdAt`, `updatedAt`)
- Entity files live in `infrastructure/database/entities/`
- Always use the injected `DataSource` from services: `this.dataSource.getRepository(EntityName)`

### Async/Await Requirements

**CRITICAL**: Always `await` database operations and async functions:

```typescript
// ✅ CORRECT
const user = await userRepository.findOne({ where: { email } });
const isMatch = await bcrypt.compare(password, hash);

// ❌ WRONG - Returns Promise, not value
const user = userRepository.findOne({ where: { email } });
```

### Configuration Management

- Environment variables loaded via `AppConfigs` class from `src/config/.env`
- Config structure: `BaseConfig` → `{ server, db, chain, agent }`
- Access via `this.config.server.port`, `this.config.db.host`, etc.

### Error Handling

Custom error hierarchy in `lib/errors/error.ts`:

- `ValidationError` (400) - Invalid input
- `AuthenticationError` (401) - Auth failures
- `AuthorizationError` (403) - Permission denied

Express routes use `next(error)` to pass errors to centralized `errorHandler` middleware.

### Agent Schema Design

All blockchain actions defined as **Zod discriminated unions** in `infrastructure/agent/schema.ts`:

- `transferSchema` - token transfers
- `swapSchema` - token swaps
- `balanceSchema` - balance queries

The agent prompt in `agent.ts` includes examples that match these schemas exactly.

### Tool Registration

Tools are registered in `AgentTools` class and mapped in `ToolOrchestrator`:

```typescript
this.toolRegistry = {
  transfer: this.tools.transferTool(),
  swap: this.tools.swapTool(),
  balance_check: this.tools.balanceCheckTool(),
};
```

## Development Workflow

### Local Development

```bash
npm run cli              # Run CLI interface
npm run server:dev       # Start dev server with hot reload (ts-node-dev)
npm run build            # Compile TypeScript to dist/
npm run format           # Format code with Prettier
```

### Docker Deployment

Multi-stage Dockerfile:

- **Stage 1 (builder)**: Install deps, build TypeScript
- **Stage 2 (runtime)**: Copy built files, install prod deps only

Port: `3059` (configured via `APP_PORT` env var)

## Common Pitfalls to Avoid

1. **Missing await** on database queries or bcrypt operations → Will return Promise instead of value
2. **Not awaiting `bootstrapDependencies()`** in `index.ts` → Race conditions on startup
3. **Hardcoding values** instead of using `this.config` → Breaks environment-based config
4. **Importing unused dependencies** → Check imports, especially in error files
5. **Typos in config property names** → Use exact names: `langsmithTracing` not `langmsithTracing`

## Integration Points

### LangChain Agent Integration

- Model: Groq's `llama-3.3-70b-versatile` (temperature: 0 for deterministic output)
- Structured output via `StructuredOutputParser.fromZodSchema()`
- Chain: `RunnablePassthrough` → `ChatPromptTemplate` → `ChatGroq` → `Parser`

### Database Integration

- PostgreSQL via TypeORM
- Connection pooling: 10 connections
- Auto-sync enabled in development (`synchronize: true`)
- Entities: User, Wallet, Transaction, Swap, Alias, UserIntent, PriceCache

### Blockchain Integration

- viem client for Base chain interactions (API key in `VIEM_API_KEY`)
- Support for: Base, Ethereum, Polygon, Optimism, Arbitrum

### Background Jobs (Planned)

- BullMQ + Redis for job queues
- Workers: `swap.worker.ts`, `transaction.worker.ts`, `wallet.worker.ts`
- Job processors in `app/jobs/`

## Authentication Pattern

Routes like `/auth/email/signup` are bound to service methods:

```typescript
this.app.post("/auth/email/signup", this.user.signUpEmail.bind(this.user));
```

This preserves `this` context for service methods that need access to `this.logger` and `this.dataSource`.

## Logging Strategy

- **Pino logger** initialized in `bootstrapDependencies()`
- Log levels: `debug`, `info`, `warn`, `error`, `trace`
- All HTTP requests logged with method, URL, and body
- Critical paths: DB connection, agent responses, orchestrator results

---

**When in doubt**: Follow existing patterns in `domain/` services, always `await` async operations, and use injected dependencies (logger, dataSource) rather than creating new instances.
