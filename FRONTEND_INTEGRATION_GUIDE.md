# Transpose Backend - Frontend Integration Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Base URL & Environment](#base-url--environment)
3. [API Endpoints Reference](#api-endpoints-reference)
4. [Action Schemas & Validation](#action-schemas--validation)
5. [Error Handling](#error-handling)
6. [Authentication Flow](#authentication-flow)
7. [Data Models](#data-models)
8. [Integration Examples](#integration-examples)
9. [Environment Variables](#environment-variables)
10. [Testing Recommendations](#testing-recommendations)

---

## System Overview

**Transpose** is a natural language blockchain transaction agent built on:
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL + TypeORM
- **Queue System**: BullMQ + Redis
- **AI Agent**: LangChain + Groq (llama-3.3-70b-versatile)
- **Blockchain**: Viem (supports Base, Ethereum, Polygon, Arbitrum, Optimism)

**Key Feature**: Users interact with blockchain systems using **natural language queries** instead of technical commands. The AI agent parses intent and executes blockchain operations.

---

## Base URL & Environment

### Development
```
http://localhost:2039
```

### Production
```
https://api.transpose.io (replace with actual production URL)
```

### Port Configuration
Default port: `2039` (configurable via `APP_PORT` environment variable)

---

## API Endpoints Reference

### 1. POST /chat

**Purpose**: Main conversational AI endpoint - processes natural language queries and executes blockchain operations

**Request**
```typescript
interface ChatRequest {
  query: string;      // Natural language query
  userId?: string;    // Optional user ID for authenticated requests
}
```

**Response**
```typescript
interface ChatResponse {
  success: boolean;
  action: string;  // Action type: "signup" | "signin" | "transfer" | "swap" | "balance_check" | "portfolio" | "create_alias" | "resolve_alias"
  data: any;       // Action-specific response data
}
```

**Example Request**
```bash
curl -X POST http://localhost:2039/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "send 10 USDC to @alice on Base chain",
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

**Example Response (Transfer)**
```json
{
  "success": true,
  "action": "transfer",
  "data": {
    "transaction": {
      "id": "tx_abc123",
      "chain": "Base",
      "asset": "USDC",
      "amount": "10",
      "from": "0x123...",
      "to": "0x456...",
      "status": "pending",
      "txHash": "0x789...",
      "preview": "Send 10 USDC to @alice on Base"
    }
  }
}
```

**Supported Natural Language Queries**
- **Signup**: "sign up with email john@example.com"
- **Signin**: "login with my email john@example.com"
- **Transfer**: "send 5 ETH to 0x123... on Ethereum"
- **Swap**: "swap 100 USDC for ETH on Base using Uniswap"
- **Balance**: "what's my ETH balance on Base?"
- **Alias**: "create alias @alice for address 0x123..."
- **Portfolio**: "show my portfolio balances"

---

### 2. GET /health

**Purpose**: Health check endpoint for monitoring backend status

**Response**
```typescript
interface HealthResponse {
  status: "healthy" | "unhealthy";
  timestamp: string;  // ISO 8601 format
  availableTools: string[];  // List of AI agent tools
}
```

**Example Request**
```bash
curl http://localhost:2039/health
```

**Example Response**
```json
{
  "status": "healthy",
  "timestamp": "2025-02-01T12:00:00.000Z",
  "availableTools": [
    "signup",
    "signin",
    "transfer",
    "swap",
    "balance_check",
    "portfolio",
    "create_alias",
    "resolve_alias"
  ]
}
```

---

### 3. GET /metrics/queues

**Purpose**: Monitor background job queue metrics

**Response**
```typescript
interface QueueMetricsResponse {
  success: boolean;
  metrics: {
    wallet: QueueMetrics;
    transaction: QueueMetrics;
    swap: QueueMetrics;
    notification: QueueMetrics;
  };
}

interface QueueMetrics {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}
```

**Example Request**
```bash
curl http://localhost:2039/metrics/queues
```

**Example Response**
```json
{
  "success": true,
  "metrics": {
    "wallet": {
      "waiting": 0,
      "active": 2,
      "completed": 145,
      "failed": 3,
      "delayed": 0
    },
    "transaction": {
      "waiting": 5,
      "active": 10,
      "completed": 2341,
      "failed": 12,
      "delayed": 1
    },
    "swap": {
      "waiting": 2,
      "active": 3,
      "completed": 678,
      "failed": 8,
      "delayed": 0
    },
    "notification": {
      "waiting": 8,
      "active": 5,
      "completed": 5432,
      "failed": 45,
      "delayed": 2
    }
  }
}
```

---

## Action Schemas & Validation

All actions are validated using **Zod schemas**. The AI agent parses natural language into these structured formats.

### 1. Signup Action
```typescript
interface SignupAction {
  action: "signup";
  provider: "email" | "google" | "github";
  email: string;  // Valid email format
  password?: string;  // Required for email provider (min 8 chars)
  chain: "Base" | "Ethereum" | "Polygon" | "Arbitrum" | "Optimism";  // Default: "Base"
}
```

**Example**
```json
{
  "action": "signup",
  "provider": "email",
  "email": "alice@example.com",
  "password": "SecurePass123!",
  "chain": "Base"
}
```

**Response Data**
```typescript
interface SignupResponse {
  user: {
    id: string;  // UUID
    email: string;
    auth: "email" | "wallet" | "oauth";
    recovery: "email" | "phone";
    primaryWalletAddress: string | null;
    createdAt: string;  // ISO 8601
    updatedAt: string;  // ISO 8601
  };
  // Note: JWT tokens not yet implemented (coming soon)
}
```

---

### 2. Signin Action
```typescript
interface SigninAction {
  action: "signin";
  provider: "email" | "google" | "github";
  email: string;
  password?: string;  // Required for email provider
}
```

**Example**
```json
{
  "action": "signin",
  "provider": "email",
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

**Response Data**
```typescript
interface SigninResponse {
  user: {
    id: string;
    email: string;
    auth: "email" | "wallet" | "oauth";
    recovery: "email" | "phone";
    primaryWalletAddress: string | null;
    createdAt: string;
    updatedAt: string;
  };
  // Note: JWT tokens not yet implemented
  // accessToken?: string;
  // refreshToken?: string;
}
```

---

### 3. Create Alias Action
```typescript
interface CreateAliasAction {
  action: "create_alias";
  alias: string;  // Human-readable alias (e.g., "@alice")
  address: string;  // Wallet address (e.g., "0x123...")
  chain?: "Base" | "Ethereum" | "Polygon" | "Arbitrum" | "Optimism";
}
```

**Example**
```json
{
  "action": "create_alias",
  "alias": "@alice",
  "address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chain": "Base"
}
```

**Response Data**
```typescript
interface CreateAliasResponse {
  alias: {
    id: string;
    alias: string;
    aliasAddress: string;
    isVerified: boolean;
    ownerId: string;
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 4. Resolve Alias Action
```typescript
interface ResolveAliasAction {
  action: "resolve_alias";
  alias: string;  // Alias to resolve (e.g., "@alice")
}
```

**Example**
```json
{
  "action": "resolve_alias",
  "alias": "@alice"
}
```

**Response Data**
```typescript
interface ResolveAliasResponse {
  alias: string;
  address: string;
  isVerified: boolean;
}
```

---

### 5. Transfer Action
```typescript
interface TransferAction {
  action: "transfer";
  asset: string;  // Token symbol (e.g., "ETH", "USDC")
  amount: string;  // Amount as string to handle large/decimal values
  from: string;   // Sender address
  to: string;     // Receiver address or alias
  chain: "Base" | "Ethereum" | "Polygon" | "Arbitrum" | "Optimism";
}
```

**Example**
```json
{
  "action": "transfer",
  "asset": "USDC",
  "amount": "100.50",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "to": "@alice",
  "chain": "Base"
}
```

**Response Data**
```typescript
interface TransferResponse {
  transaction: {
    id: string;
    chain: "Base" | "Ethereum" | "Polygon" | "Arbitrum" | "Optimism";
    type: "transfer";
    preview: string;  // Human-readable summary
    userOp: string;   // Raw ERC-4337 operation payload
    fromAddress: string;
    toAddress: string;
    txHash: string;
    asset: string;
    amount: string;
    status: "pending" | "confirmed" | "failed";
    createdAt: string;
    updatedAt: string;
  };
}
```

---

### 6. Swap Action
```typescript
interface SwapAction {
  action: "swap";
  fromAsset: string;  // Source token (e.g., "USDC")
  toAsset: string;    // Destination token (e.g., "ETH")
  amount: string;     // Amount to swap
  protocol?: string;  // DEX protocol (e.g., "Uniswap", "Sushiswap")
  chain: "Base" | "Ethereum" | "Polygon" | "Arbitrum" | "Optimism";
  from?: string;      // Sender address (default: "UNKNOWN")
  to?: string;        // Receiver address (default: "UNKNOWN")
}
```

**Example**
```json
{
  "action": "swap",
  "fromAsset": "USDC",
  "toAsset": "ETH",
  "amount": "1000",
  "protocol": "Uniswap",
  "chain": "Base",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response Data**
```typescript
interface SwapResponse {
  swap: {
    id: string;
    txHash: string;
    protocol: string;
    fromAsset: string;
    toAsset: string;
    amountExpected: string;
    amountReceived: string;
    slippage: string;  // Percentage (e.g., "0.5")
    status: "pending" | "confirmed" | "failed";
    createdAt: string;
    updatedAt: string;
  };
  transaction: {
    id: string;
    chain: string;
    txHash: string;
    status: "pending" | "confirmed" | "failed";
  };
}
```

---

### 7. Balance Check Action
```typescript
interface BalanceCheckAction {
  action: "balance_check";
  asset?: string;    // Token symbol (default: "ETH")
  amount?: string;   // Not typically used for balance queries (default: "UNKNOWN")
  from?: string;     // Wallet address to check (default: "UNKNOWN")
  to?: string;       // Not typically used (default: "UNKNOWN")
  chain?: "Base" | "Ethereum" | "Polygon" | "Arbitrum" | "Optimism";  // Default: "Base"
}
```

**Example**
```json
{
  "action": "balance_check",
  "asset": "USDC",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "chain": "Base"
}
```

**Response Data**
```typescript
interface BalanceCheckResponse {
  address: string;
  chain: string;
  balances: Array<{
    asset: string;
    amount: string;  // Balance as string
    decimals: number;
    valueUSD?: string;  // USD value if available
  }>;
}
```

---

### 8. Portfolio Action
```typescript
interface PortfolioAction {
  action: "portfolio";
  view: "balances" | "activity" | "pulse";  // Default: "balances"
}
```

**Example**
```json
{
  "action": "portfolio",
  "view": "balances"
}
```

**Response Data**
```typescript
// For view: "balances"
interface PortfolioBalancesResponse {
  totalValueUSD: string;
  chains: Array<{
    chain: string;
    totalValueUSD: string;
    tokens: Array<{
      asset: string;
      amount: string;
      valueUSD: string;
    }>;
  }>;
}

// For view: "activity"
interface PortfolioActivityResponse {
  recentTransactions: Array<{
    id: string;
    type: "transfer" | "swap";
    chain: string;
    asset: string;
    amount: string;
    status: "pending" | "confirmed" | "failed";
    timestamp: string;
  }>;
}

// For view: "pulse"
interface PortfolioPulseResponse {
  summary: string;  // AI-generated portfolio summary
  insights: string[];
  recommendations: string[];
}
```

---

## Error Handling

### Error Response Structure
```typescript
interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    code?: string;  // Machine-readable error code
    details?: any;  // Additional error details
  };
}
```

### Error Classes & Status Codes

| Error Class | Status Code | Description | Example Scenario |
|------------|-------------|-------------|------------------|
| **ValidationError** | 400 | Invalid input data | Missing required fields, invalid email format, password too short |
| **AuthenticationError** | 401 | Authentication failed | Invalid credentials, token expired |
| **AuthorizationError** | 403 | Insufficient permissions | User not authorized to perform action |
| **NotFoundError** | 404 | Resource not found | User, wallet, or alias doesn't exist |
| **RateLimitError** | 429 | Too many requests | Rate limit exceeded |
| **InternalServerError** | 500 | Server error | Database connection failed, unexpected error |
| **BlockchainConnectionError** | 502 | Blockchain RPC failure | Viem client error, network timeout |

### Example Error Responses

**ValidationError (400)**
```json
{
  "success": false,
  "error": {
    "message": "Email and password are required",
    "statusCode": 400,
    "code": "VALIDATION_ERROR"
  }
}
```

**AuthenticationError (401)**
```json
{
  "success": false,
  "error": {
    "message": "Invalid email or password",
    "statusCode": 401,
    "code": "AUTHENTICATION_ERROR"
  }
}
```

**NotFoundError (404)**
```json
{
  "success": false,
  "error": {
    "message": "Alias '@alice' not found",
    "statusCode": 404,
    "code": "NOT_FOUND"
  }
}
```

**BlockchainConnectionError (502)**
```json
{
  "success": false,
  "error": {
    "message": "Failed to connect to Base blockchain network",
    "statusCode": 502,
    "code": "BLOCKCHAIN_CONNECTION_ERROR",
    "details": {
      "chain": "Base",
      "rpcUrl": "https://base-mainnet.g.alchemy.com/v2/..."
    }
  }
}
```

### Frontend Error Handling Best Practices

```typescript
// TypeScript/JavaScript example
async function sendTransaction(query: string, userId?: string) {
  try {
    const response = await fetch('http://localhost:2039/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      // Handle HTTP error
      throw new Error(data.error?.message || 'Request failed');
    }

    if (!data.success) {
      // Handle application error
      switch (data.error?.statusCode) {
        case 400:
          showValidationError(data.error.message);
          break;
        case 401:
          redirectToLogin();
          break;
        case 404:
          showNotFoundError(data.error.message);
          break;
        case 429:
          showRateLimitWarning();
          break;
        case 502:
          showBlockchainError(data.error.message);
          break;
        default:
          showGenericError(data.error.message);
      }
      return null;
    }

    return data;
  } catch (error) {
    console.error('Network error:', error);
    showNetworkError();
    return null;
  }
}
```

---

## Authentication Flow

### Current Implementation Status

⚠️ **Note**: JWT token generation is **not yet fully implemented**. The backend currently:
- ✅ Supports email/password signup and signin
- ✅ Hashes passwords with bcrypt (10 rounds)
- ✅ Returns user data after authentication
- ❌ Does not generate JWT access/refresh tokens yet (coming soon)
- ❌ OAuth (Google, GitHub) not yet implemented

### Email/Password Authentication

**1. Signup Flow**

```typescript
// Step 1: User submits signup form
const signupQuery = "sign up with email alice@example.com and password SecurePass123!";

// Step 2: Send to /chat endpoint
const response = await fetch('http://localhost:2039/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: signupQuery }),
});

const result = await response.json();

// Step 3: Handle response
if (result.success && result.action === 'signup') {
  const user = result.data.user;
  // Store user data locally
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userEmail', user.email);
  
  // TODO: When JWT is implemented, store tokens:
  // localStorage.setItem('accessToken', result.data.accessToken);
  // localStorage.setItem('refreshToken', result.data.refreshToken);
}
```

**2. Signin Flow**

```typescript
// Step 1: User submits login form
const signinQuery = "login with email alice@example.com and password SecurePass123!";

// Step 2: Send to /chat endpoint
const response = await fetch('http://localhost:2039/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: signinQuery }),
});

const result = await response.json();

// Step 3: Handle response
if (result.success && result.action === 'signin') {
  const user = result.data.user;
  // Store user data locally
  localStorage.setItem('userId', user.id);
  localStorage.setItem('userEmail', user.email);
  
  // Redirect to dashboard
  window.location.href = '/dashboard';
}
```

**3. Authenticated Requests (Current)**

Since JWT tokens are not yet implemented, include `userId` in chat requests:

```typescript
const userId = localStorage.getItem('userId');
const query = "send 10 USDC to @bob on Base";

const response = await fetch('http://localhost:2039/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    query, 
    userId  // Pass user ID for authenticated actions
  }),
});
```

**4. Future JWT Implementation (Coming Soon)**

When JWT tokens are implemented, the flow will change to:

```typescript
// After login, store tokens
localStorage.setItem('accessToken', result.data.accessToken);
localStorage.setItem('refreshToken', result.data.refreshToken);

// Include token in Authorization header
const response = await fetch('http://localhost:2039/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
  },
  body: JSON.stringify({ query }),
});

// Handle token expiration (401 errors)
if (response.status === 401) {
  // Refresh token logic
  await refreshAccessToken();
  // Retry request with new token
}
```

### Password Requirements
- Minimum length: **8 characters**
- Hashing: **bcrypt** with 10 salt rounds
- Storage: Hashed passwords stored in PostgreSQL

### Email Validation
- Format: Standard email regex pattern (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)
- Uniqueness: Enforced at database level

---

## Data Models

### User Entity
```typescript
interface User {
  id: string;  // UUID primary key
  email: string | null;  // Nullable for wallet-only auth
  password: string | null;  // Hashed with bcrypt
  auth: "wallet" | "email" | "oauth";
  recovery: "email" | "phone";
  primaryWalletAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations
  aliases: Alias[];
  intents: UserIntent[];
  swaps: Swap[];
}
```

### Wallet Entity
```typescript
interface Wallet {
  id: string;  // UUID primary key
  owner: User;  // Foreign key to User
  chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
  smartAccountAddress: string;  // Unique wallet address
  isPrimary: boolean;  // Default: false
  nonce: number;  // Transaction nonce (default: 0)
  createdAt: Date;
  updatedAt: Date;
}
```

### Transaction Entity
```typescript
interface Transaction {
  id: string;  // UUID primary key
  owner: User;  // Foreign key to User
  chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
  type: "transfer" | "swap";
  preview: string;  // Human-readable summary
  userOp: string;  // Raw ERC-4337 operation payload (text)
  fromAddress: string;
  toAddress: string;
  txHash: string;  // Unique transaction hash
  asset: string;  // Token symbol
  amount: string;  // Amount as string
  status: "pending" | "confirmed" | "failed";  // Default: "pending"
  createdAt: Date;
  updatedAt: Date;
}
```

### Swap Entity
```typescript
interface Swap {
  id: string;  // UUID primary key
  owner: User;  // Foreign key to Transaction
  txHash: string;  // Foreign key to Transaction.txHash
  protocol: string;  // DEX protocol name
  fromAsset: string;
  toAsset: string;
  amountExpected: string;
  amountReceived: string;
  slippage: string;  // Percentage (e.g., "0.5")
  status: "pending" | "confirmed" | "failed";  // Default: "pending"
  createdAt: Date;
  updatedAt: Date;
}
```

### Alias Entity
```typescript
interface Alias {
  id: string;  // UUID primary key
  owner: User;  // Foreign key to User
  ownerId: string;  // User UUID
  alias: string;  // Human-readable alias (max 100 chars)
  aliasAddress: string;  // Resolved wallet address (max 255 chars)
  isVerified: boolean;  // Default: false
  createdAt: Date;
  updatedAt: Date;
}
```

### UserIntent Entity
```typescript
interface UserIntent {
  id: string;  // UUID primary key
  owner: User;  // Foreign key to User
  rawQuery: string;  // Original user query (text)
  parsedAction: string;  // Parsed action type (JSON)
  agentResponse: string;  // AI agent response (text)
  createdAt: Date;
  updatedAt: Date;
}
```

### PriceCache Entity
```typescript
interface PriceCache {
  id: string;  // UUID primary key
  tokenSymbol: string;
  chain: "Base" | "Ethereum" | "Polygon" | "Optimism" | "Arbitrum";
  priceUSD: string;  // Price in USD (string for precision)
  timestamp: Date;  // Price fetch timestamp
  oracleSource: "CoinGecko" | "CoinMarketCap" | "Chainlink";
  createdAt: Date;
}
```

---

## Integration Examples

### React + TypeScript Integration

```typescript
// src/api/transpose.ts
import axios, { AxiosError } from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:2039';

interface ChatRequest {
  query: string;
  userId?: string;
}

interface ChatResponse {
  success: boolean;
  action: string;
  data: any;
}

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    statusCode: number;
    code?: string;
  };
}

export class TransposeAPI {
  private baseURL: string;

  constructor(baseURL: string = BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Send natural language query to AI agent
   */
  async chat(query: string, userId?: string): Promise<ChatResponse> {
    try {
      const response = await axios.post<ChatResponse>(
        `${this.baseURL}/chat`,
        { query, userId },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,  // 30 second timeout
        }
      );
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError<ErrorResponse>);
      throw error;
    }
  }

  /**
   * Check backend health
   */
  async health(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/health`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Get queue metrics
   */
  async getQueueMetrics(): Promise<any> {
    try {
      const response = await axios.get(`${this.baseURL}/metrics/queues`);
      return response.data;
    } catch (error) {
      this.handleError(error as AxiosError);
      throw error;
    }
  }

  /**
   * Centralized error handler
   */
  private handleError(error: AxiosError<ErrorResponse>) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          console.error('Validation error:', data.error?.message);
          break;
        case 401:
          console.error('Authentication error:', data.error?.message);
          // Redirect to login
          window.location.href = '/login';
          break;
        case 404:
          console.error('Not found:', data.error?.message);
          break;
        case 429:
          console.error('Rate limit exceeded');
          break;
        case 502:
          console.error('Blockchain connection error:', data.error?.message);
          break;
        default:
          console.error('Server error:', data.error?.message);
      }
    } else if (error.request) {
      console.error('Network error: No response received');
    } else {
      console.error('Request error:', error.message);
    }
  }
}

// Export singleton instance
export const transposeAPI = new TransposeAPI();
```

### React Component Example

```typescript
// src/components/ChatInterface.tsx
import React, { useState } from 'react';
import { transposeAPI } from '../api/transpose';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = localStorage.getItem('userId') || undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      // Send to backend
      const response = await transposeAPI.chat(input, userId);

      // Add assistant response
      const assistantMessage: Message = {
        role: 'assistant',
        content: JSON.stringify(response.data, null, 2),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Handle specific actions
      if (response.action === 'transfer' && response.success) {
        // Show transaction status
        console.log('Transaction initiated:', response.data.transaction);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message ${msg.role}`}>
            <div className="content">{msg.content}</div>
            <div className="timestamp">
              {msg.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        {loading && <div className="loading">Processing...</div>}
        {error && <div className="error">{error}</div>}
      </div>

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Send 10 USDC to @alice on Base..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};
```

### Vue.js Integration Example

```typescript
// src/composables/useTranspose.ts
import { ref, reactive } from 'vue';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:2039';

export function useTranspose() {
  const loading = ref(false);
  const error = ref<string | null>(null);
  const response = reactive<any>({});

  const chat = async (query: string, userId?: string) => {
    loading.value = true;
    error.value = null;

    try {
      const result = await axios.post(`${BASE_URL}/chat`, {
        query,
        userId,
      });
      
      Object.assign(response, result.data);
      return result.data;
    } catch (err: any) {
      error.value = err.response?.data?.error?.message || 'Request failed';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const checkHealth = async () => {
    try {
      const result = await axios.get(`${BASE_URL}/health`);
      return result.data;
    } catch (err: any) {
      console.error('Health check failed:', err);
      throw err;
    }
  };

  return {
    loading,
    error,
    response,
    chat,
    checkHealth,
  };
}
```

### Plain JavaScript (Fetch API)

```javascript
// src/api/transpose.js
const BASE_URL = 'http://localhost:2039';

/**
 * Send natural language query
 */
async function chat(query, userId = null) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, userId }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

/**
 * Example: Transfer tokens
 */
async function transferTokens(amount, token, recipient, chain) {
  const userId = localStorage.getItem('userId');
  const query = `send ${amount} ${token} to ${recipient} on ${chain}`;
  
  try {
    const result = await chat(query, userId);
    
    if (result.success && result.action === 'transfer') {
      console.log('Transfer initiated:', result.data.transaction);
      return result.data.transaction;
    }
  } catch (error) {
    console.error('Transfer failed:', error.message);
    throw error;
  }
}

/**
 * Example: Check balance
 */
async function checkBalance(token, address, chain) {
  const query = `what is the ${token} balance of ${address} on ${chain}?`;
  
  try {
    const result = await chat(query);
    
    if (result.success && result.action === 'balance_check') {
      console.log('Balance:', result.data.balances);
      return result.data.balances;
    }
  } catch (error) {
    console.error('Balance check failed:', error.message);
    throw error;
  }
}

// Export functions
export { chat, transferTokens, checkBalance };
```

---

## Environment Variables

### Backend Requirements

Create a `.env` file in the backend root directory:

```bash
# Server Configuration
APP_PORT=2039
NODE_ENV=development
LOG_LEVEL=debug

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_NAME=transpose

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Blockchain Configuration (Viem + Alchemy)
VIEM_API_KEY=your_alchemy_api_key_here
CHAIN_NETWORK=base-mainnet

# AI Agent Configuration (Groq)
GROQ_API_KEY=your_groq_api_key_here
LANGCHAIN_API_KEY=your_langchain_api_key_here
LANGSMITH_TRACING=false

# JWT Configuration (Not yet implemented)
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

### Frontend Environment Variables

Create a `.env` file in the frontend root directory:

```bash
# API Base URL
REACT_APP_API_URL=http://localhost:2039
# or for Vue.js:
VITE_API_URL=http://localhost:2039

# Environment
REACT_APP_ENV=development

# Optional: Enable debug logging
REACT_APP_DEBUG=true
```

### Production Configuration

For production deployments:

```bash
# Backend .env (production)
APP_PORT=2039
NODE_ENV=production
LOG_LEVEL=info

DB_HOST=your_postgres_host
DB_PORT=5432
DB_USER=transpose_prod
DB_PASSWORD=strong_production_password
DB_NAME=transpose_prod

REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_PASSWORD=strong_redis_password

VIEM_API_KEY=your_alchemy_production_key
GROQ_API_KEY=your_groq_production_key

JWT_ACCESS_SECRET=strong_random_secret_64_chars
JWT_REFRESH_SECRET=different_strong_random_secret_64_chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
```

```bash
# Frontend .env (production)
REACT_APP_API_URL=https://api.transpose.io
REACT_APP_ENV=production
REACT_APP_DEBUG=false
```

---

## Testing Recommendations

### 1. Unit Tests for API Client

```typescript
// __tests__/api/transpose.test.ts
import { TransposeAPI } from '../src/api/transpose';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';

describe('TransposeAPI', () => {
  let api: TransposeAPI;
  let mock: MockAdapter;

  beforeEach(() => {
    api = new TransposeAPI('http://localhost:2039');
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.restore();
  });

  test('chat() returns successful response', async () => {
    const mockResponse = {
      success: true,
      action: 'balance_check',
      data: {
        address: '0x123...',
        balances: [{ asset: 'ETH', amount: '1.5' }],
      },
    };

    mock.onPost('http://localhost:2039/chat').reply(200, mockResponse);

    const result = await api.chat('check my ETH balance');
    expect(result.success).toBe(true);
    expect(result.action).toBe('balance_check');
  });

  test('chat() handles validation error', async () => {
    const mockError = {
      success: false,
      error: {
        message: 'Query is required',
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      },
    };

    mock.onPost('http://localhost:2039/chat').reply(400, mockError);

    await expect(api.chat('')).rejects.toThrow();
  });

  test('health() returns status', async () => {
    const mockHealth = {
      status: 'healthy',
      timestamp: '2025-02-01T12:00:00.000Z',
      availableTools: ['signup', 'signin', 'transfer'],
    };

    mock.onGet('http://localhost:2039/health').reply(200, mockHealth);

    const result = await api.health();
    expect(result.status).toBe('healthy');
  });
});
```

### 2. Integration Tests

```typescript
// __tests__/integration/chat.test.ts
import { TransposeAPI } from '../src/api/transpose';

describe('Chat Integration Tests', () => {
  const api = new TransposeAPI('http://localhost:2039');
  let userId: string;

  test('signup new user', async () => {
    const result = await api.chat(
      'sign up with email test@example.com and password Test123456!'
    );
    
    expect(result.success).toBe(true);
    expect(result.action).toBe('signup');
    expect(result.data.user.email).toBe('test@example.com');
    
    userId = result.data.user.id;
  });

  test('signin existing user', async () => {
    const result = await api.chat(
      'login with email test@example.com and password Test123456!'
    );
    
    expect(result.success).toBe(true);
    expect(result.action).toBe('signin');
    expect(result.data.user.email).toBe('test@example.com');
  });

  test('check balance', async () => {
    const result = await api.chat(
      'what is my ETH balance on Base?',
      userId
    );
    
    expect(result.success).toBe(true);
    expect(result.action).toBe('balance_check');
    expect(result.data).toHaveProperty('balances');
  });
});
```

### 3. E2E Tests (Cypress)

```javascript
// cypress/e2e/transpose.cy.js
describe('Transpose Chat Interface', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('sends a balance check query', () => {
    cy.get('input[placeholder*="Send"]')
      .type('what is my ETH balance on Base?');
    
    cy.get('button[type="submit"]').click();
    
    cy.get('.message.assistant')
      .should('be.visible')
      .and('contain', 'balance_check');
  });

  it('handles signup flow', () => {
    cy.get('input[placeholder*="Send"]')
      .type('sign up with email newuser@example.com and password SecurePass123!');
    
    cy.get('button[type="submit"]').click();
    
    cy.get('.message.assistant')
      .should('be.visible')
      .and('contain', 'signup');
  });

  it('displays error for invalid request', () => {
    cy.get('input[placeholder*="Send"]')
      .type('invalid query without context');
    
    cy.get('button[type="submit"]').click();
    
    cy.get('.error')
      .should('be.visible');
  });
});
```

### 4. Load Testing

```javascript
// load-test.js (using Artillery)
module.exports = {
  config: {
    target: 'http://localhost:2039',
    phases: [
      { duration: 60, arrivalRate: 10 }, // 10 requests/sec for 1 minute
      { duration: 120, arrivalRate: 50 }, // Ramp up to 50/sec
    ],
  },
  scenarios: [
    {
      name: 'Chat requests',
      flow: [
        {
          post: {
            url: '/chat',
            json: {
              query: 'check my ETH balance on Base',
              userId: '{{ userId }}',
            },
          },
        },
      ],
    },
  ],
};
```

---

## WebSocket/Real-Time Updates

⚠️ **Note**: WebSocket support is **not yet implemented** in the backend. Currently, all communication is via HTTP REST endpoints.

### Future Implementation (Planned)

When WebSocket support is added, the pattern will be:

```typescript
// Future WebSocket client example
import io from 'socket.io-client';

const socket = io('http://localhost:2039', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

// Listen for transaction updates
socket.on('transaction:status', (data) => {
  console.log('Transaction status:', data);
  // Update UI with transaction status
});

// Listen for balance updates
socket.on('balance:updated', (data) => {
  console.log('Balance updated:', data);
  // Refresh balance display
});

// Listen for swap confirmations
socket.on('swap:completed', (data) => {
  console.log('Swap completed:', data);
  // Show success notification
});
```

### Current Polling Pattern

Until WebSockets are implemented, use polling to check transaction status:

```typescript
async function pollTransactionStatus(txHash: string, maxAttempts = 20) {
  const userId = localStorage.getItem('userId');
  
  for (let i = 0; i < maxAttempts; i++) {
    // Query transaction status
    const result = await transposeAPI.chat(
      `what is the status of transaction ${txHash}?`,
      userId
    );
    
    if (result.data.transaction.status === 'confirmed') {
      console.log('Transaction confirmed!');
      return result.data.transaction;
    } else if (result.data.transaction.status === 'failed') {
      throw new Error('Transaction failed');
    }
    
    // Wait 3 seconds before next attempt
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  throw new Error('Transaction status check timeout');
}
```

---

## Additional Notes

### Rate Limiting
- Rate limiting is **not currently enforced** but may be added in production
- Recommended client-side: Implement debouncing for user input (300-500ms delay)
- Plan for future rate limits: 100 requests/minute per user

### CORS Configuration
- Backend currently allows all origins (`*`) in development
- Production should restrict to specific frontend domains

### Request Timeouts
- Recommended timeout: **30 seconds** for `/chat` endpoint (AI processing takes time)
- Recommended timeout: **5 seconds** for `/health` and `/metrics/queues`

### Logging & Debugging
- Backend uses **Pino logger** with JSON structured logs
- Enable debug logging: Set `LOG_LEVEL=debug` in backend `.env`
- Frontend should log all API errors to console in development

### Performance Optimization
- Implement request caching for balance checks (5-10 second cache)
- Use optimistic UI updates for transactions (show pending state immediately)
- Debounce natural language input to reduce unnecessary API calls

### Security Best Practices
- **Never log sensitive data** (passwords, private keys, full API keys)
- Store JWT tokens in `httpOnly` cookies when implemented (not localStorage)
- Validate all user input on frontend before sending to backend
- Implement CSRF protection when JWT tokens are added

---

## Contact & Support

For questions or issues with integration:
- GitHub: [https://github.com/Dom-HTG/transpose](https://github.com/Dom-HTG/transpose)
- Issues: [https://github.com/Dom-HTG/transpose/issues](https://github.com/Dom-HTG/transpose/issues)

---

**Last Updated**: February 2025  
**Backend Version**: 1.0.0  
**Documentation Version**: 1.0.0
