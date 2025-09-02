# 🪙 Natural Language Blockchain Transaction Agent

This repository contains the backend for an **agentic AI system** that abstracts blockchain complexities, allowing users to perform blockchain transactions using **natural language**.  
For example:  
> "Send 2 BTC to Alice"  
> "Swap 0.5 ETH for USDC on Base"  

The system translates user instructions into structured blockchain transactions and executes them safely on the **Base chain**.

---

## 🚀 Features
- Natural language → blockchain transaction parsing
- Secure execution of transactions via [viem](https://viem.sh/)  
- Modular **clean architecture** (DDD-inspired): `handlers`, `services`, `repositories`
- Background job processing with **Redis + BullMQ**
- Scalable foundation with **Docker** and **TypeScript**
- Flexible AI model integration for NLP parsing (OpenAI, Gemini, or local models)
- Transaction status tracking and retry system

---
/Transpose
├── package.json
├── tsconfig.json
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .gitignore
├── README.md
└── src
├── index.ts              # Process entrypoint (starts server)
├── server.ts             # Express app config + bootstrapping
├── routes.ts             # Single place for all routes
│
├── config
│   └── index.ts          # Env configs, constants
│
├── domain
│   ├── user
│   │   ├── user.entity.ts
│   │   ├── user.repository.ts
│   │   ├── user.service.ts
│   │   └── user.handler.ts
│   │
│   ├── wallet
│   │   ├── wallet.entity.ts
│   │   ├── wallet.repository.ts
│   │   ├── wallet.service.ts
│   │   └── wallet.handler.ts
│   │
│   ├── transaction
│   │   ├── transaction.entity.ts
│   │   ├── transaction.repository.ts
│   │   ├── transaction.service.ts
│   │   └── transaction.handler.ts
│   │
│   └── portfolio
│       ├── portfolio.entity.ts
│       ├── portfolio.repository.ts
│       ├── portfolio.service.ts
│       └── portfolio.handler.ts
│
├── application
│   └── jobs
│       └── transactionProcessor.job.ts
│
├── infrastructure
│   ├── database
│   │   └── postgres.ts   # DB connection + migrations hook
│   │
│   ├── queue-cache
│   │   └── bullmq.ts     # Redis + BullMQ setup
│   │
│   ├── llm
│   │   └── ollama.client.ts
│   │
│   └── chain
│       └── viem.client.ts
│
└── lib
├── errors.ts
├── logger.ts
└── types.ts

## 🛠️ Tech Stack

- **TypeScript** — main backend language  
- **Express.js** — HTTP server framework  
- **Viem** — blockchain SDK for interacting with the Base chain  
- **BullMQ + Redis** — background job queues & task scheduling  
- **Docker** — containerized deployment  
- **Jest** — testing framework  
