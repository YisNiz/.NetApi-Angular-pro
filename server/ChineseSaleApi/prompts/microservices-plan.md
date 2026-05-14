# ChineseSaleApi - Microservices Decomposition Plan

**Document Version:** 1.0  
**Date:** December 2024  
**Status:** Production-Ready Architecture Plan  
**Target Audience:** Development Team, DevOps, Solution Architects

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Monolithic Architecture Analysis](#current-monolithic-architecture-analysis)
3. [Bounded Contexts](#bounded-contexts)
4. [Microservices Design](#microservices-design)
5. [Database-per-Service Strategy](#database-per-service-strategy)
6. [Inter-Service Communication](#inter-service-communication)
7. [Authentication & Authorization](#authentication--authorization)
8. [API Gateway](#api-gateway)
9. [Deployment Strategy](#deployment-strategy)
10. [Migration Plan](#migration-plan)
11. [Microservice Folder Structure](#microservice-folder-structure)
12. [Risks, Trade-offs & Scalability](#risks-trade-offs--scalability)

---

## Executive Summary

This document outlines a strategic migration from a monolithic ASP.NET Core Web API (ChineseSaleApi) to a microservices architecture. The current monolith handles authentication, gift management, donor operations, category management, user accounts, and purchase tracking through a single SQL Server database and unified codebase.

**Key Objectives:**
- ? Improve scalability and independent deployment
- ? Enable team-based development (separate teams per service)
- ? Support polyglot persistence (different DB technologies per service)
- ? Maintain backward compatibility during migration
- ? Implement proper inter-service communication patterns
- ? Ensure security, monitoring, and observability

**Proposed Timeline:** 6-9 months for full migration
**Initial Scope:** 2-3 microservices in Phase 1

---

## Current Monolithic Architecture Analysis

### Existing Controllers & Responsibilities

```
???????????????????????????????????????????????????????????????
?              ChineseSaleApi (Monolith)                       ?
???????????????????????????????????????????????????????????????
?                                                               ?
?  AuthController          ? Authentication & JWT tokens       ?
?  UserController          ? User account management & cart    ?
?  DonorController         ? Donor CRUD operations             ?
?  CategoryController      ? Gift category management          ?
?  GiftController          ? Gift inventory management         ?
?  PurchaseController      ? Purchase & sales reporting        ?
?                                                               ?
???????????????????????????????????????????????????????????????
?                    Single SQL Server Database                ?
?  (Users, Donors, Gifts, Categories, Orders, Tickets, etc.)  ?
???????????????????????????????????????????????????????????????
```

### Pain Points in Current Architecture

| Pain Point | Impact | Severity |
|-----------|--------|----------|
| **Tight Coupling** | Changes in one domain affect others | High |
| **Single Database** | Database locks, scaling bottlenecks | High |
| **Shared DTOs** | Cascading changes across controllers | Medium |
| **Monolithic Deployment** | Must deploy entire app for single fix | High |
| **Team Coordination** | Multiple teams conflict on codebase | Medium |
| **Scalability Limits** | Cannot scale gift service independently from auth | High |
| **Technology Lock-in** | All services use same tech stack | Medium |

---

## Bounded Contexts

Based on Domain-Driven Design (DDD) principles, we identify the following bounded contexts from the current application:

### 1. **Identity & Access Management (IAM) Context**
**Responsible for:** User authentication, JWT token generation, authorization policies

**Current Components:**
- `AuthController` - Login, registration, token generation
- `TokenService` - JWT token lifecycle management
- `User` model - User identity representation

**Business Rules:**
- Unique username/email per user
- Password hashing and validation
- JWT token expiration and refresh
- Role-based access control (User/Admin)

**Data:** Users, authentication logs

---

### 2. **Gift Catalog Context**
**Responsible for:** Gift inventory, catalog management, product information

**Current Components:**
- `GiftController` - Gift CRUD and search
- `GiftRepository` / `GiftService` - Gift operations
- `Gift` model - Gift entity with metadata

**Business Rules:**
- Gifts belong to categories and donors
- Gift availability tracking (WinnerUserId nullable check)
- Gift search and filtering
- Picture/image URL management
- Unique gift identification

**Data:** Gifts, gift metadata, pictures

---

### 3. **Donor Management Context**
**Responsible for:** Donor information, donor-contributed gifts

**Current Components:**
- `DonorController` - Donor CRUD
- `DonorRepository` / `DonorService` - Donor operations
- `Donor` model - Donor entity

**Business Rules:**
- Unique email per donor
- Donors can contribute multiple gifts
- Donor filtering and search
- Email validation

**Data:** Donors, contact information

---

### 4. **Category Management Context**
**Responsible for:** Gift categorization and taxonomy

**Current Components:**
- `CategoryController` - Category CRUD
- `CategoryRepository` / `CategoryService` - Category operations
- `Category` model - Category entity

**Business Rules:**
- Unique category names (enforced in service layer)
- Categories organize gifts
- Category deletion/update cascading

**Data:** Categories, category metadata

---

### 5. **Shopping & Orders Context**
**Responsible for:** Shopping cart, order management, purchase coordination

**Current Components:**
- `UserController` (partial) - Cart operations
- `UserRepository` (partial) - Cart management, checkout
- `Order` / `OrderItem` models - Shopping cart representation

**Business Rules:**
- Cart belongs to a user
- Implicit cart creation on first item add
- Cart item quantity tracking
- Checkout validation and transaction handling
- Race condition prevention during checkout

**Data:** Orders, OrderItems (shopping cart representation)

---

### 6. **Purchase & Sales Context**
**Responsible for:** Purchase transactions, ticket generation, sales reporting

**Current Components:**
- `PurchaseController` - Purchase reports
- `PurchaseRepository` / `PurchaseService` - Purchase operations
- `Ticket` model - Purchase ticket/record

**Business Rules:**
- Ticket creation on successful purchase
- Gift winner tracking (WinnerUserId)
- Sales revenue calculation
- Purchase history and reporting
- Double-check pattern for race conditions

**Data:** Tickets (purchases), sales analytics

---

## Microservices Design

### Proposed Microservices Architecture

```
????????????????????????????????????????????????????????????????????????????
?                            API Gateway (Kong/Ocelot)                     ?
?              Route, Rate Limit, Authenticate, Log Requests               ?
????????????????????????????????????????????????????????????????????????????
               ?               ?              ?              ?
       ????????????????  ????????????? ????????????  ?????????????
       ?               ?  ?            ? ?          ?  ?           ?
   ??????????????????  ? ??????????? ? ? ??????? ? ???????????? ?
   ? Auth Service  ?  ? ?  Gift    ? ? ? ?Cat ? ? ??Purchase ? ?
   ?               ?  ? ?  Service ? ? ? ?Svc ? ? ?? Service  ? ?
   ? • JWT tokens  ?  ? ?          ? ? ? ?    ? ? ??          ? ?
   ? • User auth   ?  ? ? • CRUD   ? ? ? ?CRUD? ? ?? • Tickets? ?
   ? • Register    ?  ? ? • Search ? ? ? ?    ? ? ?? • Reports? ?
   ?????????????????  ? ???????????? ? ? ??????? ? ???????????? ?
      ?                ?    ?         ? ?    ?    ? ? ?          ?
   ???????????????????? ??????????? ? ? ???????? ? ??????????? ?
   ? Identity DB    ?? ?Gift DB   ? ? ? ?Cat ??? ? ??Purchase? ?
   ? (SQL Server)   ?? ?(SQL)     ? ? ? ? DB  ?? ? ??  DB    ? ?
   ??????????????????? ???????????? ? ? ??????? ? ??????????? ?
                     ??????????????????????????????

    ????????????????????????????????????????????????????????????????????
    ?  Orders/Shopping Service (NEW)                                   ?
    ?  • Cart management         • Checkout coordination               ?
    ?  • Inventory checks        • Order validation                    ?
    ????????????????????????????????????????????????????????????????????
           ?
       ????????????????????????????????
       ?  Orders DB (SQL Server)      ?
       ?  (Orders, OrderItems tables) ?
       ????????????????????????????????

    ????????????????????????????????????????????????????????????????????
    ?  Donor Service (NEW)                                              ?
    ?  • Donor CRUD                 • Donor filtering                   ?
    ?  • Email validation           • Gift contributor info             ?
    ????????????????????????????????????????????????????????????????????
           ?
       ????????????????????????????????
       ?  Donor DB (SQL Server)       ?
       ?  (Donors table)              ?
       ????????????????????????????????
```

### Microservices Breakdown

#### **Service 1: Identity & Access Service (AuthService)**

**Responsibility:**
- User registration and password management
- JWT token generation and validation
- User profile management
- Role-based access control

**API Endpoints:**
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/validate-token
GET    /api/v1/auth/profile/{userId}
PUT    /api/v1/auth/profile/{userId}
POST   /api/v1/auth/logout
GET    /api/v1/auth/users (admin only)
```

**Dependencies:** None (foundational service)

**Technology Stack:**
- ASP.NET Core 8 (C#)
- SQL Server
- Entity Framework Core 9
- IdentityService pattern for user management

---

#### **Service 2: Gift Catalog Service (GiftService)**

**Responsibility:**
- Gift inventory management (CRUD)
- Gift catalog browsing and search
- Gift metadata (description, pictures, pricing)
- Category association
- Gift availability tracking

**API Endpoints:**
```
GET    /api/v1/gifts                    (browse catalog)
GET    /api/v1/gifts/{id}               (gift details)
POST   /api/v1/gifts                    (create gift - admin)
PUT    /api/v1/gifts/{id}               (update gift)
DELETE /api/v1/gifts/{id}               (delete gift)
GET    /api/v1/gifts/search             (search/filter)
POST   /api/v1/gifts/{id}/picture       (upload picture)
GET    /api/v1/gifts/available          (filter by availability)
```

**Dependencies:** 
- Category Service (for category info)
- Auth Service (for JWT validation)

**Technology Stack:**
- ASP.NET Core 8
- SQL Server
- Entity Framework Core 9
- Azure Blob Storage (for pictures)

**Internal Events Published:**
- `GiftCreated` ? Triggers catalog indexing
- `GiftUpdated` ? Cache invalidation
- `GiftDeleted` ? Inventory cleanup

---

#### **Service 3: Donor Service (DonorService)**

**Responsibility:**
- Donor information management
- Donor registration and updates
- Email uniqueness validation
- Donor filtering and search
- Relationship to contributed gifts

**API Endpoints:**
```
GET    /api/v1/donors                   (list donors)
GET    /api/v1/donors/{id}              (donor details)
POST   /api/v1/donors                   (register donor)
PUT    /api/v1/donors/{id}              (update donor)
DELETE /api/v1/donors/{id}              (remove donor)
GET    /api/v1/donors/{id}/gifts        (donor's gifts)
GET    /api/v1/donors/search            (search donors)
```

**Dependencies:**
- Auth Service (for JWT validation)
- Gift Service (for gift info - optional call)

**Technology Stack:**
- ASP.NET Core 8
- SQL Server
- Entity Framework Core 9

**Internal Events Published:**
- `DonorRegistered` ? Welcome email, metrics
- `DonorUpdated` ? Notification to related gifts

---

#### **Service 4: Category Service (CategoryService)**

**Responsibility:**
- Gift category management (CRUD)
- Taxonomy definition
- Category-to-gift mapping

**API Endpoints:**
```
GET    /api/v1/categories                (list all)
GET    /api/v1/categories/{id}           (category details)
POST   /api/v1/categories                (create - admin)
PUT    /api/v1/categories/{id}           (update - admin)
DELETE /api/v1/categories/{id}           (delete - admin)
GET    /api/v1/categories/{id}/gifts     (gifts in category)
```

**Dependencies:**
- Auth Service (for JWT validation)

**Technology Stack:**
- ASP.NET Core 8
- SQL Server
- Entity Framework Core 9
- Redis (for caching categories - high read frequency)

**Internal Events Published:**
- `CategoryCreated` ? Add to catalog
- `CategoryDeleted` ? Validate gift orphaning

---

#### **Service 5: Orders & Shopping Service (OrdersService)**

**Responsibility:**
- Shopping cart management
- Order creation and validation
- Inventory coordination for checkout
- Cart item management
- Checkout orchestration

**API Endpoints:**
```
GET    /api/v1/orders/cart/{userId}     (view cart)
POST   /api/v1/orders/cart              (add to cart)
PUT    /api/v1/orders/cart/{itemId}     (update quantity)
DELETE /api/v1/orders/cart/{itemId}     (remove item)
POST   /api/v1/orders/checkout          (process checkout)
GET    /api/v1/orders/{orderId}         (order details)
GET    /api/v1/orders                   (user's orders)
```

**Dependencies:**
- Auth Service (JWT validation, user info)
- Gift Service (gift availability, pricing)
- Purchase Service (ticket creation - async event)

**Technology Stack:**
- ASP.NET Core 8
- SQL Server (Orders DB)
- Distributed caching (Redis) for cart sessions
- Message Queue (RabbitMQ/Azure Service Bus) for checkout events

**Internal Events Published:**
- `CartCreated` ? Track user engagement
- `CheckoutInitiated` ? Prevent concurrent checkouts
- `CheckoutCompleted` ? Trigger ticket generation
- `CheckoutFailed` ? Notify user, offer retry

---

#### **Service 6: Purchase & Sales Service (PurchaseService)**

**Responsibility:**
- Purchase ticket generation
- Sales reporting and analytics
- Revenue calculation
- Purchase history
- Gift winner tracking

**API Endpoints:**
```
GET    /api/v1/purchases                (all purchases)
GET    /api/v1/purchases/{giftId}       (buyers for gift)
GET    /api/v1/purchases/reports/revenue  (total revenue)
GET    /api/v1/purchases/reports/gifts-winners  (gifts & winners)
POST   /api/v1/purchases/{giftId}/winner  (set winner - admin)
GET    /api/v1/purchases/user/{userId}  (user's purchases)
```

**Dependencies:**
- Auth Service (JWT validation)
- Gift Service (gift info)
- Orders Service (checkout events)

**Technology Stack:**
- ASP.NET Core 8
- SQL Server (Purchases DB)
- Message Queue (RabbitMQ) for async ticket creation
- Data warehouse (optional: SQL DW for analytics)

**Internal Events Consumed:**
- `CheckoutCompleted` ? Create tickets
- `GiftUpdated` ? Update purchase cache

**Internal Events Published:**
- `TicketGenerated` ? Analytics, notifications
- `GiftWinnerSet` ? Gift service notification

---

### Service Interaction Matrix

| From Service | To Service | Method | Purpose |
|-------------|-----------|--------|---------|
| Orders | Gift Service | REST API | Check gift availability & pricing |
| Orders | Auth Service | JWT validation (middleware) | Authenticate user |
| Purchase | Gift Service | REST API | Get gift details for ticket |
| Purchase | Orders Service | Event subscription | Consume checkout events |
| Gift | Category Service | REST API | Validate category existence |
| Gift | Auth Service | JWT validation (middleware) | Authorize admin operations |
| Donor | Auth Service | JWT validation (middleware) | Authenticate requests |

---

## Database-per-Service Strategy

### Database Separation Model

Each microservice has its own dedicated database to ensure:
- **Loose Coupling:** Services don't share schemas
- **Independent Scaling:** Scale high-traffic services separately
- **Technology Freedom:** Different services can use different DBs

### Database Allocation

```
???????????????????????????????????????????????????????????????????
?  SERVICE          ?  DATABASE NAME      ?  TABLES              ?
??????????????????????????????????????????????????????????????????
? Auth Service      ? ChineseSale_Auth    ? Users                ?
?                   ?                     ? RefreshTokens        ?
?                   ?                     ? AuditLogs            ?
??????????????????????????????????????????????????????????????????
? Gift Service      ? ChineseSale_Gifts   ? Gifts                ?
?                   ?                     ? GiftPictures         ?
?                   ?                     ? GiftAvailability     ?
??????????????????????????????????????????????????????????????????
? Donor Service     ? ChineseSale_Donors  ? Donors               ?
?                   ?                     ? DonorAudit           ?
??????????????????????????????????????????????????????????????????
? Category Service  ? ChineseSale_Catalog ? Categories           ?
?                   ?                     ? CategoryMetadata     ?
??????????????????????????????????????????????????????????????????
? Orders Service    ? ChineseSale_Orders  ? Orders               ?
?                   ?                     ? OrderItems           ?
?                   ?                     ? CartSessions         ?
??????????????????????????????????????????????????????????????????
? Purchase Service  ? ChineseSale_Sales   ? Tickets              ?
?                   ?                     ? SalesMetrics         ?
?                   ?                     ? GiftWinners          ?
???????????????????????????????????????????????????????????????????
```

### Physical Database Topology

```
SQL Server Instance 1 (Production Primary)
??? ChineseSale_Auth
??? ChineseSale_Gifts
??? ChineseSale_Donors

SQL Server Instance 2 (Secondary, High-Volume)
??? ChineseSale_Catalog
??? ChineseSale_Orders
??? ChineseSale_Sales

Backup Strategy:
??? Daily full backups (all databases)
??? Hourly transaction log backups
??? Geo-replicated backups to Azure Blob Storage
??? Point-in-time restore capability (30 days)
```

### Data Consistency Strategy

**Problem:** How to maintain consistency across databases when services are decoupled?

**Solution:** Event-driven architecture with eventual consistency

```
????????????????         Event          ????????????????
?   Orders     ???????????????????????  ?   Purchase   ?
?   Service    ?  CheckoutCompleted     ?   Service    ?
????????????????                        ????????????????
      ?                                        ?
      ? Ticket created in Purchase DB         ?
      ? (async, may take 1-2 seconds)        ?
      ?                                        ?
      ??????????????????????????????????????????

Compensation Mechanism:
If Purchase Service fails to create ticket:
1. CheckoutCompleted event stays in queue
2. Retry with exponential backoff
3. After max retries, alert admin and rollback order
```

### Schema Evolution Strategy

**Challenge:** How to evolve schemas without breaking services?

**Solution:** Database versioning with migration scripts

```
ChineseSale_Auth/Migrations/
??? 001_InitialCreate.sql
??? 002_AddRefreshTokens.sql
??? 003_AddAuditLog.sql
??? 004_AddMfaSupport.sql

Each service manages its own migrations:
- Backward compatibility for 2-3 versions
- Blue-Green deployments for zero-downtime migrations
- Rollback procedures documented
```

### Shared Reference Data (Read-Only)

**Problem:** Multiple services need to reference the same data (e.g., Categories used by Gifts)

**Solution:** Reference tables with eventual consistency

```
OPTION A: Category Cache Replication
- Category Service is source of truth
- Gift Service caches categories locally
- On category update, event triggers cache refresh
- Stale cache is acceptable for short periods

OPTION B: Query Synchronously
- Gift Service queries Category Service for validation
- Add timeout (1 second) and circuit breaker
- Fallback to cached data if service unavailable

OPTION C: Denormalization
- Gift Service stores category name (read-only copy)
- No foreign key constraint
- Accept eventual consistency
```

**Recommended Approach:** Hybrid (Option A + Option C)
- Cache categories locally for read performance
- Accept 30-60 second delay for new categories
- Update cache on service startup

---

## Inter-Service Communication

### Communication Patterns Overview

```
SYNCHRONOUS (REST)
??? Gift Service ? Category Service
??? Orders Service ? Gift Service
??? Real-time validation required

ASYNCHRONOUS (Events/Messaging)
??? Orders Service ? Purchase Service (CheckoutCompleted)
??? Purchase Service ? Gift Service (GiftWinnerSet)
??? Gifts Service ? Donors Service (GiftCreated)

BROADCAST/PUBLISH-SUBSCRIBE
??? Category updated ? All services refresh cache
??? Gift availability changed ? Orders service notified
??? User registered ? Email notification service
```

### Implementation Strategy

#### **1. REST API Communication (Synchronous)**

**Used for:** Gift availability checks, category validation

**Implementation with Resilience Patterns:**

```csharp
// Service-to-service HTTP client with resilience
public class GiftServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly IAsyncPolicy<HttpResponseMessage> _policy;

    public GiftServiceClient(HttpClient httpClient, IPollyPolicyRegistry policies)
    {
        _httpClient = httpClient;
        // Resilience: Retry 3 times, fallback to cache
        _policy = Policy
            .HandleResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
            .Or<HttpRequestException>()
            .CircuitBreakerAsync(handledEventsAllowedBeforeBreaking: 5, 
                durationOfBreak: TimeSpan.FromSeconds(30))
            .WrapAsync(Policy
                .TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(2)));
    }

    public async Task<GiftDto> GetGiftAsync(int giftId)
    {
        var response = await _policy.ExecuteAsync(() =>
            _httpClient.GetAsync($"https://gift-service/api/v1/gifts/{giftId}"));
        
        return await response.Content.ReadAsAsync<GiftDto>();
    }
}
```

**Configuration:**
- **Timeout:** 2 seconds
- **Retries:** 3 with exponential backoff
- **Circuit Breaker:** Open after 5 failures, retry after 30 seconds
- **Fallback:** Cache or default response

---

#### **2. Asynchronous Event-Driven Communication**

**Message Broker:** RabbitMQ or Azure Service Bus

**Event Flow Example: Checkout Process**

```
Step 1: Customer clicks "Checkout"
????????????????
? Orders       ?
? Service      ?
? Validates    ?
? cart items   ?
????????????????
         ?
         ?? Check gift availability (REST to Gift Service)
         ?? Validate user balance (internal DB)
         ?
         ?? If OK: Publish event
            ?
            ?????????????????????????????????
            ?  CheckoutCompletedEvent       ?
            ?  {                            ?
            ?    OrderId: 12345             ?
            ?    UserId: 789                ?
            ?    Items: [GiftIds...]        ?
            ?    Amount: 500                ?
            ?    Timestamp: 2024-02-20...   ?
            ?  }                            ?
            ?????????????????????????????????
                     ?
                     ???? RabbitMQ Topic Exchange
                     ?    "orders.events"
                     ?
Step 2: Purchase Service subscribes to CheckoutCompleted
????????????????????
? Purchase Service ????? Consumes event
? Creates tickets  ?
? for each gift    ?
????????????????????
                     ?
                     ?? Publishes: TicketCreatedEvent
                        ???? Analytics, Email notifications
```

**Event Schema (JSON):**

```json
{
  "eventId": "evt_12345",
  "eventType": "OrderPlaced",
  "aggregateId": "order_98765",
  "aggregateType": "Order",
  "timestamp": "2024-02-20T10:30:00Z",
  "version": 1,
  "data": {
    "orderId": "order_98765",
    "userId": "user_123",
    "items": [
      {"giftId": 1, "quantity": 2, "price": 100},
      {"giftId": 2, "quantity": 1, "price": 250}
    ],
    "totalAmount": 450,
    "status": "Completed"
  },
  "metadata": {
    "userId": "user_123",
    "correlationId": "corr_abc123",
    "causationId": "cmd_xyz789"
  }
}
```

**RabbitMQ Setup:**

```
Exchange: ChineseSale.Orders
??? Topic: order.created
??? Topic: order.completed
??? Topic: order.failed
??? Topic: order.cancelled

Exchange: ChineseSale.Purchases
??? Topic: ticket.created
??? Topic: ticket.issued
??? Topic: sales.revenue_updated

Exchange: ChineseSale.Catalog
??? Topic: gift.created
??? Topic: gift.updated
??? Topic: gift.deleted
??? Topic: category.updated

Queues:
??? purchase-service-order-events (durable, auto-ack disabled)
??? notification-service-events
??? analytics-service-events
```

**Publisher Implementation:**

```csharp
// In Orders Service
public class OrderService
{
    private readonly IEventPublisher _eventPublisher;

    public async Task<OrderResult> CheckoutAsync(int userId, List<int> giftIds)
    {
        // Validation logic...
        
        var order = new Order { UserId = userId, Items = items };
        await _orderRepository.AddAsync(order);
        await _orderRepository.SaveAsync();

        // Publish event
        var @event = new CheckoutCompletedEvent
        {
            OrderId = order.Id,
            UserId = userId,
            Items = giftIds,
            Amount = total,
            Timestamp = DateTime.UtcNow
        };

        await _eventPublisher.PublishAsync(@event, "order.completed");
        
        return new OrderResult { Success = true, OrderId = order.Id };
    }
}
```

**Subscriber Implementation:**

```csharp
// In Purchase Service
public class OrderEventHandler : IEventHandler<CheckoutCompletedEvent>
{
    private readonly IPurchaseService _purchaseService;
    private readonly ILogger<OrderEventHandler> _logger;

    public async Task HandleAsync(CheckoutCompletedEvent @event)
    {
        try
        {
            _logger.LogInformation($"Creating tickets for order {*event.OrderId}");
            
            foreach (var giftId in @event.Items)
            {
                var ticket = new Ticket
                {
                    GiftId = giftId,
                    UserId = @event.UserId,
                    PurchaseDate = DateTime.UtcNow
                };
                
                await _purchaseService.CreateTicketAsync(ticket);
            }

            _logger.LogInformation($"Tickets created successfully for order {@event.OrderId}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Failed to create tickets for order {@event.OrderId}");
            throw; // Let RabbitMQ handle retry
        }
    }
}
```

---

#### **3. Saga Pattern for Distributed Transactions**

**Use Case:** Coordinating checkout across multiple services

```
Choreography-based Saga:

1. Orders Service receives checkout request
   ?? Create Order (local DB)
   ?? Reserve inventory (call Gift Service)
   ?? Publish: "CheckoutStarted"

2. Gift Service listens to "CheckoutStarted"
   ?? Lock gift inventory
   ?? Publish: "InventoryReserved"

3. Purchase Service listens to "InventoryReserved"
   ?? Create tickets
   ?? Publish: "TicketsCreated"

4. Orders Service listens to "TicketsCreated"
   ?? Update order status to "Completed"
   ?? Release hold on funds
   ?? Publish: "CheckoutCompleted"

FAILURE SCENARIO:
If any step fails, compensating transactions execute in reverse:
- Gift Service failed to reserve ? Publish "InventoryReservationFailed"
- Purchase Service ? Cancel reservation, notify user
```

---

### Chosen Communication Stack

**Primary:** RabbitMQ 4.0+
- Open source, battle-tested
- Message durability and persistence
- Dead-letter queues for failed messages
- Consumer groups for horizontal scaling

**Secondary:** REST for simple queries
- Lightweight for real-time validation
- With circuit breakers for resilience

**Integration Library:** MassTransit
- Simplified pub/sub abstraction over RabbitMQ
- Built-in retry policies
- Saga pattern support
- Distributed tracing integration

---

## Authentication & Authorization

### JWT Architecture in Microservices

#### **Problem with Monolith JWT:**
Currently, all services share the same JWT secret and validation logic. In microservices:
- Services are independently deployed
- Need decentralized token validation
- Different services may have different authorization rules
- Token revocation needs to be consistent

#### **Solution: Centralized Token Validation**

```
???????????????????????????????????????????????????????????
?               API Gateway (Kong)                         ?
?  ?????????????????????????????????????????????????????? ?
?  ? JWT Validation Middleware                          ? ?
?  ? • Extract token from Authorization header          ? ?
?  ? • Validate signature & expiry                      ? ?
?  ? • Check token blacklist (Redis)                    ? ?
?  ? • Extract claims (userId, roles)                   ? ?
?  ?????????????????????????????????????????????????????? ?
???????????????????????????????????????????????????????????
     ?              ?              ?             ?
  ??????         ??????        ??????       ???????
  ?Gift?         ?Doer?        ?Ord?       ?Purch?
  ?Svc ?         ?Svc ?        ?Svc?       ?Svc  ?
  ??????         ??????        ?????       ???????
  
Receives request with:
X-User-Id: user_123
X-User-Roles: ["User", "Premium"]
X-Request-Id: corr_abc123
```

### JWT Token Structure

```json
{
  "sub": "user_123",
  "email": "user@example.com",
  "name": "John Doe",
  "iat": 1708419000,
  "exp": 1708505400,
  "roles": ["User", "Premium"],
  "permissions": ["read:gifts", "write:cart", "read:purchases"],
  "iss": "https://auth-service.api.local",
  "aud": "chineseSaleAPI"
}
```

### Token Lifecycle Management

#### **1. Token Generation (Auth Service)**

```csharp
public class TokenService
{
    private readonly IConfiguration _config;

    public TokenResponse GenerateToken(User user)
    {
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_config["JwtSettings:SecretKey"]));
        
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.UserName),
            new(ClaimTypes.Name, user.Name),
            new(ClaimTypes.Role, user.Role.ToString()),
            new("userId", user.Id.ToString()),
            new("iat", DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                int.Parse(_config["JwtSettings:ExpiryMinutes"])),
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
        );

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();
        
        // Store refresh token in Auth Service DB
        await _refreshTokenRepository.AddAsync(new RefreshToken
        {
            UserId = user.Id,
            Token = refreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IsRevoked = false
        });

        return new TokenResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresIn = 3600, // 1 hour in seconds
            TokenType = "Bearer"
        };
    }
}
```

#### **2. Token Validation (API Gateway)**

```csharp
// Kong Kong plugin or ASP.NET Core middleware
public class JwtValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ITokenValidator _tokenValidator;
    private readonly IRedisCache _cache;

    public async Task InvokeAsync(HttpContext context)
    {
        var token = ExtractToken(context);
        
        if (!string.IsNullOrEmpty(token))
        {
            // Check blacklist first (fast path)
            if (await _cache.ExistsAsync($"blacklist:{token}"))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsJsonAsync(
                    new { message = "Token has been revoked" });
                return;
            }

            // Validate JWT signature & claims
            var principal = _tokenValidator.ValidateToken(token);
            if (principal != null)
            {
                context.User = principal;
                context.Items["UserId"] = principal.FindFirst("userId")?.Value;
                context.Items["UserRoles"] = principal.FindAll(ClaimTypes.Role);
            }
        }

        await _next(context);
    }
}
```

#### **3. Token Refresh (Auth Service)**

```csharp
public class AuthController : ControllerBase
{
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var storedToken = await _refreshTokenRepository
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken);

        if (storedToken == null || storedToken.IsRevoked || 
            storedToken.ExpiresAt < DateTime.UtcNow)
        {
            return Unauthorized(new { message = "Invalid refresh token" });
        }

        var user = await _userRepository.GetByIdAsync(storedToken.UserId);
        var newTokens = _tokenService.GenerateToken(user);

        // Revoke old refresh token
        storedToken.IsRevoked = true;
        await _refreshTokenRepository.UpdateAsync(storedToken);

        return Ok(newTokens);
    }
}
```

### Authorization: Role-Based Access Control (RBAC)

#### **Roles Definition**

| Role | Description | Permissions |
|------|-------------|-------------|
| **User** | Regular user | read:gifts, read:categories, write:cart, read:purchases |
| **Donor** | Gift contributor | write:gifts, read:own_gifts, write:donor_profile |
| **Admin** | System administrator | write:*, delete:*, read:*, write:categories |
| **Moderator** | Content reviewer | read:*, write:categories, moderate:gifts |

#### **Implementation in Services**

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class GiftController : ControllerBase
{
    // Only authenticated users can view gifts
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllGifts()
    {
        return Ok(await _giftService.GetAllAsync());
    }

    // Only admins can create gifts
    [HttpPost]
    [Authorize(Roles = "Admin,Donor")]
    public async Task<IActionResult> CreateGift([FromBody] CreateGiftDto dto)
    {
        return Ok(await _giftService.CreateAsync(dto));
    }

    // Only admins can delete
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteGift(int id)
    {
        await _giftService.DeleteAsync(id);
        return NoContent();
    }
}
```

### Token Revocation & Blacklist

**Problem:** User logs out or changes password - token should be invalid immediately

**Solution:** Token blacklist in Redis

```csharp
[HttpPost("logout")]
[Authorize]
public async Task<IActionResult> Logout()
{
    var token = ExtractTokenFromRequest();
    var expirationTime = GetTokenExpiration(token);
    
    // Add token to blacklist with expiration = token expiry
    await _redisCache.SetAsync(
        $"blacklist:{token}", 
        "revoked", 
        expirationTime - DateTime.UtcNow);

    return Ok(new { message = "Logged out successfully" });
}
```

**Redis Key Structure:**
```
blacklist:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... 
??? Value: "revoked"
??? TTL: 3600 (seconds, matches token expiry)
??? Auto-expires with TTL
```

### Cross-Service Authorization

**Problem:** Purchase Service needs to verify user permissions when creating tickets

**Solution:** Pass authorization context in headers (via API Gateway)

```csharp
// API Gateway adds these headers before routing to services
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
X-User-Id: user_123
X-User-Roles: Admin,User
X-Request-Id: corr_abc123
X-Request-Time: 2024-02-20T10:30:00Z

// Each service extracts and uses these headers
public class PurchaseService
{
    public async Task<TicketResponse> CreateTicketAsync(int giftId)
    {
        var userId = _httpContextAccessor.HttpContext.Request
            .Headers["X-User-Id"];
        
        // Create ticket for this user
        var ticket = new Ticket 
        { 
            GiftId = giftId, 
            UserId = int.Parse(userId) 
        };
        
        await _ticketRepository.AddAsync(ticket);
        return new TicketResponse { Success = true };
    }
}
```

### Secret Management

**Challenge:** Each microservice needs JWT secret, DB connection strings, API keys

**Solution:** Centralized secret manager

```
????????????????????????????????????????????????????????
?        HashiCorp Vault (or Azure Key Vault)          ?
?                                                       ?
?  /chineseSale/auth/jwt-secret                        ?
?  /chineseSale/auth/db-connection                     ?
?  /chineseSale/gifts/db-connection                    ?
?  /chineseSale/rabbitmq-connection                    ?
?  /chineseSale/storage-account-key                    ?
????????????????????????????????????????????????????????
         ?                ?              ?
         ?                ?              ?
    ???????????      ???????????    ??????????
    ? Auth    ?      ?  Gift   ?    ? Orders ?
    ? Service ?      ? Service ?    ? Service?
    ???????????      ???????????    ??????????
         ?                ?              ?
         ?????????????????????????????????
                  ?              ?
         Reads secrets on startup
         Caches for 1 hour
         Rotates on change event
```

---

## API Gateway

### API Gateway Responsibilities

```
??????????????????????????????????????????????????????????????
?              API Gateway (Kong / Ocelot)                   ?
??????????????????????????????????????????????????????????????
?                                                              ?
? 1. Request Routing                                          ?
?    GET /api/v1/gifts ? Gift Service:5001                   ?
?    POST /api/v1/orders ? Orders Service:5002               ?
?                                                              ?
? 2. Authentication & Authorization                          ?
?    • JWT validation                                         ?
?    • Token blacklist checking                              ?
?    • Request signing                                       ?
?                                                              ?
? 3. Rate Limiting                                            ?
?    • 1000 req/min per user                                 ?
?    • 10000 req/min per IP                                  ?
?    • Burst protection                                      ?
?                                                              ?
? 4. Request/Response Transformation                         ?
?    • Header injection (X-User-Id, X-Request-Id)           ?
?    • Protocol translation (REST)                          ?
?    • Compression (gzip)                                   ?
?                                                              ?
? 5. Logging & Monitoring                                    ?
?    • Request/response logging                              ?
?    • Correlation IDs                                       ?
?    • Performance metrics                                   ?
?                                                              ?
? 6. Security                                                 ?
?    • CORS handling                                          ?
?    • XSS/CSRF protection                                   ?
?    • Request validation                                    ?
?                                                              ?
? 7. Caching                                                  ?
?    • Cache GET requests                                    ?
?    • Cache invalidation on mutations                       ?
?    • TTL management                                        ?
?                                                              ?
??????????????????????????????????????????????????????????????
```

### Recommended: Kong API Gateway

**Why Kong?**
- Open source, high-performance (nginx-based)
- Plugin ecosystem (OAuth, rate limiting, logging)
- Service mesh integration (Kong for Kubernetes)
- Community support

**Architecture:**

```
Internet (Angular Frontend)
    ?
    ?? HTTPS (443)
    ?
    ?
????????????????????????????
?   Kong API Gateway       ?
?  (Load Balanced)         ?
?  ??????????????????????  ?
?  ? Auth Plugin        ?  ?
?  ? Rate Limit Plugin  ?  ?
?  ? Logging Plugin     ?  ?
?  ? CORS Plugin        ?  ?
?  ??????????????????????  ?
????????????????????????????
   ?   ?     ?      ?
   ?   ?     ?      ???? Purchase Service (5005)
   ?   ?     ??????????? Orders Service (5004)
   ?   ?????????????????? Category Service (5003)
   ?
   ?????????????????????? Auth Service (5001)
                           Gift Service (5002)
                           Donor Service (5006)
```

### Kong Configuration (YAML)

```yaml
# kong.yml
_format_version: "3.0"

services:
  - name: auth-service
    host: auth-service
    port: 5001
    protocol: http
    path: /
    routes:
      - name: auth-route
        paths:
          - /api/v1/auth

  - name: gift-service
    host: gift-service
    port: 5002
    protocol: http
    routes:
      - name: gift-route
        paths:
          - /api/v1/gifts

  - name: category-service
    host: category-service
    port: 5003
    protocol: http
    routes:
      - name: category-route
        paths:
          - /api/v1/categories

  - name: orders-service
    host: orders-service
    port: 5004
    protocol: http
    routes:
      - name: orders-route
        paths:
          - /api/v1/orders

  - name: purchase-service
    host: purchase-service
    port: 5005
    protocol: http
    routes:
      - name: purchase-route
        paths:
          - /api/v1/purchases

# Plugins
plugins:
  - name: jwt
    service: auth-service
    config:
      secret_is_base64: false
      key_claim_name: sub

  - name: rate-limiting
    global: true
    config:
      minute: 1000
      hour: 50000
      redis_host: redis
      redis_port: 6379

  - name: cors
    global: true
    config:
      origins:
        - "http://localhost:4200"
        - "https://app.chineseSale.com"
      methods:
        - GET
        - POST
        - PUT
        - DELETE
        - OPTIONS
      headers:
        - Content-Type
        - Authorization
      max_age: 3600

  - name: request-transformer
    global: true
    config:
      add:
        headers:
          - X-Request-Id:$request_id
          - X-Request-Time:$time_iso8601

  - name: response-transformer
    global: true
    config:
      add:
        headers:
          - X-API-Version:v1
          - X-Response-Time:$header_X-Kong-Request-Id
```

### Alternative: Ocelot (.NET-based)

If preferring .NET ecosystem, Ocelot is viable:

```csharp
// ocelot.json
{
  "Routes": [
    {
      "DownstreamPathTemplate": "/api/v1/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "auth-service",
          "Port": 5001
        }
      ],
      "UpstreamPathTemplate": "/api/v1/auth/{everything}",
      "UpstreamHttpMethod": [ "GET", "POST" ],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "Bearer",
        "AllowedScopes": []
      },
      "RateLimitOptions": {
        "ClientWhiteList": [],
        "EnableRateLimiting": true,
        "Period": "1m",
        "PeriodTimespan": 60,
        "Limit": 1000
      }
    },
    // Similar for other services
  ]
}
```

---

## Deployment Strategy

### Container Strategy

#### **Docker Images per Service**

```dockerfile
# Each service gets its own Dockerfile
# File: AuthService.Dockerfile

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ChineseSaleApi.Auth/*.csproj ./ChineseSaleApi.Auth/
RUN dotnet restore ChineseSaleApi.Auth/ChineseSaleApi.Auth.csproj

COPY ChineseSaleApi.Auth/ ./ChineseSaleApi.Auth/
RUN dotnet publish -c Release -o /app ChineseSaleApi.Auth/ChineseSaleApi.Auth.csproj

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5001

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD dotnet run --no-build -- /health || exit 1

ENTRYPOINT ["dotnet", "ChineseSaleApi.Auth.dll"]
```

#### **Docker Compose (Local Development)**

```yaml
# docker-compose.yml

version: '3.8'

services:
  # Databases
  auth-db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "DevPassword123!"
      ACCEPT_EULA: "Y"
    ports:
      - "1433:1433"
    volumes:
      - auth_db_data:/var/opt/mssql

  gift-db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      SA_PASSWORD: "DevPassword123!"
      ACCEPT_EULA: "Y"
    ports:
      - "1434:1433"
    volumes:
      - gift_db_data:/var/opt/mssql

  # Message Broker
  rabbitmq:
    image: rabbitmq:3.12-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Microservices
  auth-service:
    build:
      context: .
      dockerfile: Services/AuthService/Dockerfile
    ports:
      - "5001:5001"
    environment:
      ConnectionStrings__Default: "Server=auth-db;Database=ChineseSale_Auth;User Id=sa;Password=DevPassword123!"
      JwtSettings__SecretKey: "your-secret-key-min-32-chars-long"
      RabbitMQ__Host: "rabbitmq"
    depends_on:
      - auth-db
      - rabbitmq
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  gift-service:
    build:
      context: .
      dockerfile: Services/GiftService/Dockerfile
    ports:
      - "5002:5002"
    environment:
      ConnectionStrings__Default: "Server=gift-db;Database=ChineseSale_Gifts;User Id=sa;Password=DevPassword123!"
      RabbitMQ__Host: "rabbitmq"
      Auth__ServiceUrl: "http://auth-service:5001"
    depends_on:
      - gift-db
      - rabbitmq
      - auth-service
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5002/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Repeat for other services...

  # API Gateway
  kong-db:
    image: postgres:15
    environment:
      POSTGRES_USER: kong
      POSTGRES_DB: kong
      POSTGRES_PASSWORD: kong
    volumes:
      - kong_db_data:/var/lib/postgresql/data

  kong-migrations:
    image: kong:3.4
    command: kong migrations bootstrap
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-db
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
    depends_on:
      - kong-db

  kong:
    image: kong:3.4
    ports:
      - "8000:8000"  # Proxy
      - "8443:8443"  # Proxy SSL
      - "8001:8001"  # Admin API
    environment:
      KONG_DATABASE: postgres
      KONG_PG_HOST: kong-db
      KONG_PG_USER: kong
      KONG_PG_PASSWORD: kong
      KONG_PROXY_ACCESS_LOG: /dev/stdout
      KONG_ADMIN_ACCESS_LOG: /dev/stdout
      KONG_PROXY_ERROR_LOG: /dev/stderr
      KONG_ADMIN_ERROR_LOG: /dev/stderr
      KONG_ADMIN_LISTEN: 0.0.0.0:8001
    depends_on:
      - kong-migrations

volumes:
  auth_db_data:
  gift_db_data:
  rabbitmq_data:
  redis_data:
  kong_db_data:

networks:
  default:
    name: chineseSale-network
```

**Run with:** `docker-compose up`

### Kubernetes Deployment

#### **Kubernetes Architecture**

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: chineseSale-prod

---
# k8s/auth-service/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: chineseSale-prod
spec:
  replicas: 3  # Horizontal scaling
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
    spec:
      serviceAccountName: auth-service
      containers:
      - name: auth-service
        image: chineseSale/auth-service:v1.0.0
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5001
          name: http
        
        env:
        - name: ASPNETCORE_ENVIRONMENT
          value: "Production"
        - name: ConnectionStrings__Default
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: db-connection
        - name: JwtSettings__SecretKey
          valueFrom:
            secretKeyRef:
              name: auth-secrets
              key: jwt-secret
        - name: RabbitMQ__Host
          value: "rabbitmq-service.chineseSale-infra"

        # Resource limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Health checks
        livenessProbe:
          httpGet:
            path: /health/live
            port: 5001
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5

        readinessProbe:
          httpGet:
            path: /health/ready
            port: 5001
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3

      # Pod disruption budget for zero-downtime deployments
      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
          - weight: 100
            podAffinityTerm:
              labelSelector:
                matchExpressions:
                - key: app
                  operator: In
                  values:
                  - auth-service
              topologyKey: kubernetes.io/hostname

---
# k8s/auth-service/service.yaml
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: chineseSale-prod
spec:
  selector:
    app: auth-service
  type: ClusterIP
  ports:
  - port: 5001
    targetPort: 5001
    name: http

---
# k8s/auth-service/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: chineseSale-prod
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30

---
# k8s/secrets/auth-secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: auth-secrets
  namespace: chineseSale-prod
type: Opaque
stringData:
  db-connection: "Server=auth-db-service.chineseSale-infra;Database=ChineseSale_Auth;User Id=sa;Password=XXX"
  jwt-secret: "your-secret-key-min-32-chars-long"
```

**Kubernetes Deployment Process:**

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Create secrets
kubectl apply -f k8s/secrets/auth-secrets.yaml

# 3. Deploy services
kubectl apply -f k8s/auth-service/

# 4. Monitor rollout
kubectl rollout status deployment/auth-service -n chineseSale-prod

# 5. Port forward for testing
kubectl port-forward svc/auth-service 5001:5001 -n chineseSale-prod
```

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/deploy-microservices.yml

name: Deploy Microservices

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ develop ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        service: 
          - AuthService
          - GiftService
          - DonorService
          - CategoryService
          - OrdersService
          - PurchaseService
    
    permissions:
      contents: read
      packages: write

    steps:
    - uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}
        tags: |
          type=ref,event=branch
          type=semver,pattern={{version}}
          type=sha

    - name: Build and push Docker image
      uses: docker/build-push-action@v4
      with:
        context: ./Services/${{ matrix.service }}
        push: ${{ github.event_name != 'pull_request' }}
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}:buildcache
        cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.service }}:buildcache,mode=max

  run-tests:
    runs-on: ubuntu-latest
    needs: build-and-push
    
    steps:
    - uses: actions/checkout@v3

    - name: Set up .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: '8.0.x'

    - name: Restore dependencies
      run: dotnet restore

    - name: Run unit tests
      run: dotnet test --no-restore --verbosity normal

    - name: Run integration tests
      run: |
        docker-compose up -d
        sleep 30
        dotnet test --filter Category=Integration --no-restore
        docker-compose down

  deploy-to-kubernetes:
    runs-on: ubuntu-latest
    needs: run-tests
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3

    - name: Set up Kubernetes
      uses: azure/setup-kubectl@v3
      with:
        version: 'v1.27.0'

    - name: Configure kubectl
      run: |
        mkdir -p $HOME/.kube
        echo "${{ secrets.KUBE_CONFIG }}" | base64 -d > $HOME/.kube/config
        chmod 600 $HOME/.kube/config

    - name: Deploy services
      run: |
        kubectl apply -f k8s/namespace.yaml
        kubectl apply -f k8s/secrets/
        kubectl apply -f k8s/*/
        kubectl rollout status deployment/auth-service -n chineseSale-prod --timeout=5m

    - name: Verify deployment
      run: |
        kubectl get pods -n chineseSale-prod
        kubectl get svc -n chineseSale-prod
```

---

## Migration Plan

### Phase Overview

```
CURRENT STATE (Month 0)        ?        FINAL STATE (Month 6-9)
???????????????????????                 ????????????????????????
?   Monolithic        ?                 ?   Microservices      ?
?   ChineseSaleApi    ?                 ?   Architecture       ?
?                     ?                 ?                      ?
? - Single Database   ?                 ? - 6 Services         ?
? - Shared code       ?                 ? - 6 Databases        ?
? - Tightly coupled   ?                 ? - Event-driven       ?
? - Single deployment ?                 ? - Independent deploy ?
???????????????????????                 ????????????????????????
```

### Detailed Migration Strategy: Strangler Fig Pattern

**Concept:** Incrementally replace monolith components with microservices, running both in parallel until the monolith is fully replaced.

#### **Phase 1: Foundation (Month 1-2)**

**Goal:** Establish infrastructure and deploy first service

**Deliverables:**
1. Set up Kubernetes cluster (local or cloud)
2. Deploy message broker (RabbitMQ)
3. Deploy Redis cache
4. Deploy API Gateway (Kong)
5. Deploy Auth Service as first microservice
6. Establish CI/CD pipeline

**Steps:**

```
WEEK 1-2: Infrastructure Setup
??? Provision Kubernetes cluster (3 nodes minimum)
??? Install Helm, Prometheus, ELK stack
??? Configure storage (PVC for databases)
??? Setup secrets management (Vault)
??? Configure DNS and SSL/TLS

WEEK 3-4: Auth Service Migration
??? Create Auth Service project from monolith
??? Extract User model and repositories
??? Implement JWT token generation
??? Deploy in Kubernetes
??? Setup database (ChineseSale_Auth)
??? Integration tests pass
??? Smoke tests in production

WEEK 5: API Gateway Setup
??? Deploy Kong in Kubernetes
??? Configure routes to Auth Service
??? Setup rate limiting plugins
??? Setup CORS and security headers
??? Frontend points to Kong instead of monolith
??? Monolith and Auth Service run in parallel

WEEK 6-7: Monitoring & Stabilization
??? Setup Prometheus metrics collection
??? Deploy Grafana dashboards
??? Configure alerts for Auth Service
??? Monitor error rates and latency
??? Performance tuning
??? Document issues and resolutions
```

**Success Criteria:**
- ? Auth Service handles >90% of auth requests
- ? Latency < 100ms for token generation
- ? 99.9% uptime in staging
- ? Successful logins on both monolith and new service
- ? Team trained on new deployment process

---

#### **Phase 2: Catalog Services (Month 2-4)**

**Goal:** Migrate Gift and Category services

**Deliverables:**
1. Gift Service (independent deployment)
2. Category Service (independent deployment)
3. Event-driven communication (Gift Service ? Purchase Service)
4. Database separation (ChineseSale_Gifts, ChineseSale_Catalog)

**Timeline:**

```
WEEK 8-10: Category Service
??? Create Category Service
??? Migrate CategoryRepository/Service
??? Separate database (ChineseSale_Catalog)
??? Deploy in Kubernetes
??? Setup Kong routes
??? Run parallel with monolith
??? Gradual traffic shift (10% ? 50% ? 100%)
??? Decommission monolith category code

WEEK 11-12: Gift Service (Part 1 - CRUD)
??? Create Gift Service
??? Migrate GiftRepository/Service
??? Setup ChineseSale_Gifts database
??? Implement basic CRUD operations
??? Deploy in Kubernetes
??? Setup Kong routes
??? 50% traffic to new service

WEEK 13: Establish Event System
??? Deploy RabbitMQ message broker
??? Create event publisher/subscriber
??? Define event schemas (JSON)
??? Setup dead-letter queues
??? Test event delivery

WEEK 14-15: Gift Service (Part 2 - Events)
??? Gift creation publishes GiftCreated event
??? Implement event handlers in Purchase Service
??? Test end-to-end gift creation ? reporting
??? 100% traffic to Gift Service
??? Remove gift CRUD from monolith

WEEK 16: Integration Testing
??? Load tests with 1000 concurrent users
??? Chaos testing (kill services, verify recovery)
??? Data consistency validation
??? Backup and recovery procedures
??? Performance benchmarking
```

**Key Decisions:**
- Question: "Should Gift and Category services run in same database?"
  - **Answer:** NO - separate databases for independent scaling
  - Category is read-heavy (cache in Redis)
  - Gift is write-heavy (needs separate DB)

- Question: "How to handle gift-category relationship?"
  - **Answer:** Denormalization + eventual consistency
    - Gift stores category name (read-only copy)
    - Gift Service caches categories on startup
    - On category update, async event triggers cache refresh
    - Stale category names acceptable for short periods

**Success Criteria:**
- ? Category Service handles 100% of requests
- ? Gift Service handles 100% of requests
- ? Event delivery 99.99% success rate
- ? Zero data loss during migration
- ? Performance equal to or better than monolith

---

#### **Phase 3: Donor Service (Month 4-5)**

**Goal:** Migrate Donor management

**Timeline:**

```
WEEK 17-19: Donor Service Development
??? Create Donor Service
??? Migrate DonorRepository/Service
??? Setup ChineseSale_Donors database
??? Implement email uniqueness validation
??? Deploy in Kubernetes
??? 50% traffic shift

WEEK 20: Testing & Stabilization
??? Unit tests (90%+ coverage)
??? Integration tests with Gift Service
??? Load tests
??? 100% traffic to Donor Service

WEEK 21: Cleanup
??? Decommission donor code from monolith
??? Archive old migrations
??? Document schema changes
```

**No major complexity - straightforward CRUD service**

---

#### **Phase 4: Orders & Shopping (Month 5-7)**

**Goal:** Migrate shopping cart and order management

**This is CRITICAL - most complex service**

**Timeline:**

```
WEEK 22-24: Orders Service Design
??? Design order workflow
??? Define saga pattern for checkout
??? Setup ChineseSale_Orders database
??? Design cart session management (Redis)
??? Plan checkout orchestration
??? Design failure recovery

WEEK 25-26: Initial Implementation
??? Create Orders Service
??? Implement cart CRUD
??? Implement gift-to-cart operations
??? Deploy in Kubernetes
??? 20% traffic (non-critical paths only)
??? Monitor for issues

WEEK 27-28: Checkout Saga
??? Implement checkout orchestration
??? Design compensation logic (rollback)
??? Event publishing: CheckoutStarted
??? Event publishing: CheckoutCompleted
??? Integration with Gift Service (inventory check)
??? Integration with Purchase Service (ticket creation)
??? Chaos testing (service failures, network issues)
??? 50% traffic

WEEK 29-30: Data Migration
??? Migrate Orders table from monolith
??? Data consistency verification
??? Audit: compare old vs new order records
??? Test refund/cancellation scenarios
??? 100% traffic

WEEK 31: Stabilization & Monitoring
??? Monitor error rates
??? Performance tuning
??? Optimize database queries
??? Cache tuning
??? Documentation
```

**Complexity Points:**
1. **Race Conditions:** Multiple users checking out simultaneously
   - Solution: Distributed locking (Redis)
   - Test: Stress test with 100+ concurrent checkouts
2. **Data Consistency:** Orders split across services
   - Solution: Saga with compensating transactions
3. **Fallback:** If Purchase Service down, must queue orders
   - Solution: Message queue (RabbitMQ) with retry

---

#### **Phase 5: Purchase & Reporting (Month 7-8)**

**Goal:** Migrate purchase tracking and sales reporting

**Timeline:**

```
WEEK 32-33: Purchase Service Development
??? Create Purchase Service
??? Setup ChineseSale_Sales database
??? Implement ticket creation from events
??? Implement sales reporting
??? Deploy in Kubernetes
??? Consumer of CheckoutCompleted events

WEEK 34: Analytics & Reporting
??? Implement revenue reports
??? Implement gifts & winners reports
??? Add caching for report queries
??? Deploy optional data warehouse (SQL DW)
??? 100% traffic

WEEK 35: Performance Optimization
??? Index optimization for reporting
??? Query optimization
??? Caching strategy for reports
??? Load testing with 1000 concurrent report requests
```

---

#### **Phase 6: Cleanup & Optimization (Month 8-9)**

**Goal:** Decommission monolith, optimize microservices

**Timeline:**

```
WEEK 36-37: Monolith Decommissioning
??? Move all traffic to microservices (100%)
??? Final data consistency check
??? Shutdown monolith services
??? Archive monolith code in git tag
??? Final smoke tests
??? Update documentation

WEEK 38-39: Optimization & Hardening
??? Performance profiling
??? Memory leak detection
??? Security audit
??? Load testing (100% traffic + spikes)
??? Disaster recovery testing
??? Playbook updates

WEEK 40-41: Team Training & Handoff
??? Document all services
??? Create runbooks for operations
??? Train on-call engineers
??? Setup alerting (PagerDuty)
??? Establish SLOs (99.9% uptime)
??? Knowledge transfer complete
```

---

### Data Migration Strategy

#### **Step-by-Step Process**

```
???????????????????????????????????????????????????????????
?  MONOLITH (Single Database)                            ?
?  ????????????????????????????????????????????????????  ?
?  ? Users | Donors | Gifts | Orders | Tickets | Cats?  ?
?  ????????????????????????????????????????????????????  ?
???????????????????????????????????????????????????????????
                    ?
                    ? Phase 1: Read-Only Extract
                    ? (Monolith unchanged)
                    ?
???????????????????????????????????????????????????????????
?  NEW DATABASES (Running Parallel)                      ?
?  ???????????? ???????????? ???????????? ???????????   ?
?  ? Auth DB  ? ? Gifts DB ? ?Orders DB ? ?Sales DB ?   ?
?  ???????????? ???????????? ???????????? ???????????   ?
???????????????????????????????????????????????????????????
                    ?
                    ? Phase 2: Writes Split
                    ? (New writes ? NEW databases)
                    ? (Reads ? Both old and new)
                    ?
???????????????????????????????????????????????????????????
?  DUAL WRITE PERIOD (Week 4-6)                          ?
?  • New Users table gets all user creations             ?
?  • New Gifts table gets new gifts                      ?
?  • Monolith still serves reads from old DB             ?
?  • Async background job reconciles data                ?
???????????????????????????????????????????????????????????
                    ?
                    ? Phase 3: Traffic Cutover
                    ? • Switch reads to new DB
                    ? • Validate data consistency
                    ? • Monitor for issues
                    ?
???????????????????????????????????????????????????????????
?  CUTOVER COMPLETE (Week 7)                             ?
?  • All reads from microservice DBs                     ?
?  • All writes to microservice DBs                      ?
?  • Monolith kept as fallback for 1 week                ?
?  • Then safely decommissioned                          ?
???????????????????????????????????????????????????????????
```

**Data Validation Script (SQL)**

```sql
-- Verify data consistency between old and new
USE ChineseSale_Auth

SELECT 
    'Users' as TableName,
    (SELECT COUNT(*) FROM dbo.Users) as NewDBCount,
    (SELECT COUNT(*) FROM ChineseSale_Monolith.dbo.Users) as OldDBCount,
    CASE 
        WHEN (SELECT COUNT(*) FROM dbo.Users) = 
             (SELECT COUNT(*) FROM ChineseSale_Monolith.dbo.Users)
        THEN 'MATCH'
        ELSE 'MISMATCH'
    END as Status

-- Compare checksums
SELECT 
    CHECKSUM_AGG(CHECKSUM(Id, Email, Name, Role)) as NewDB_Checksum
FROM dbo.Users

UNION ALL

SELECT 
    CHECKSUM_AGG(CHECKSUM(Id, Email, Name, Role)) as OldDB_Checksum
FROM ChineseSale_Monolith.dbo.Users
```

---

### Parallel Running (Critical)

**Must-Have Mechanics:**

```csharp
// In monolith, during transition period
public class HybridUserRepository : IUserRepository
{
    private readonly IUserRepository _monolithRepo;
    private readonly IUserRepository _newAuthServiceClient;
    private readonly ILogger<HybridUserRepository> _logger;

    // Reads from monolith (legacy)
    public async Task<User> GetByEmailAsync(string email)
    {
        return await _monolithRepo.GetByEmailAsync(email);
    }

    // Writes to BOTH (dual-write)
    public async Task<User> CreateAsync(User user)
    {
        var legacyResult = await _monolithRepo.CreateAsync(user);
        
        try
        {
            // Also write to new Auth Service
            var newResult = await _newAuthServiceClient.CreateAsync(user);
            _logger.LogInformation($"Dual-write successful for user {user.Id}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"New service write failed for user {user.Id}, created in legacy only");
            // Don't throw - prefer eventual consistency
        }

        return legacyResult;
    }
}
```

**Data Reconciliation Job:**

```csharp
// Runs every 5 minutes to sync missed writes
public class DataReconciliationService
{
    public async Task SyncUsersAsync()
    {
        var monolithUsers = await _monolithRepo.GetAllAsync();
        var newServiceUsers = await _newAuthServiceClient.GetAllAsync();

        foreach (var user in monolithUsers)
        {
            var existsInNew = newServiceUsers.Any(u => u.Id == user.Id);
            
            if (!existsInNew)
            {
                _logger.LogWarning($"User {user.Id} missing in new service, syncing...");
                await _newAuthServiceClient.CreateAsync(user);
            }
        }
    }
}
```

---

### Rollback Strategy

**If critical issue during migration:**

```
SCENARIO: Auth Service crashes, all new users can't login

IMMEDIATE RESPONSE (< 5 minutes):
1. API Gateway switches all traffic back to monolith
2. Monolith continues serving from legacy User table
3. Engineering team investigates issue

INVESTIGATION (5-30 minutes):
1. Review logs, identify root cause
2. Fix code
3. Test in staging

REMEDIATION OPTIONS:
A) Fix and re-deploy (if simple fix, < 30 min)
   ? Gradual traffic shift back (10% ? 50% ? 100%)
   
B) Keep on monolith for now (if complex)
   ? Schedule retry for next phase
   ? Continue with other services
   
C) Permanent rollback (if architectural issue)
   ? Revert to monolith architecture
   ? Re-evaluate microservices strategy
```

**Automated Rollback (Kong):**

```yaml
# Kong policy: if Auth Service error rate > 5%, switch to fallback
policies:
  - name: health-check
    config:
      interval: 10s
      timeout: 5s
      unhealthy_threshold: 3
      healthy_threshold: 1
    
    action_on_unhealthy: shift_traffic_to
      fallback_target: monolith-auth-service:5001
```

---

## Microservice Folder Structure

### Overall Repository Structure

```
microservices-root/
?
??? .github/
?   ??? workflows/
?       ??? build-and-test.yml
?       ??? deploy-staging.yml
?       ??? deploy-production.yml
?
??? docker-compose.yml                 # Local dev environment
??? docker-compose.prod.yml            # Staging/prod compose
?
??? k8s/                               # Kubernetes manifests
?   ??? namespace.yaml
?   ??? storage/
?   ??? secrets/
?   ??? configmaps/
?   ??? services/
?       ??? auth-service/
?       ??? gift-service/
?       ??? donor-service/
?       ??? category-service/
?       ??? orders-service/
?       ??? purchase-service/
?
??? infrastructure/
?   ??? ansible/                      # Infrastructure as Code
?   ??? terraform/
?   ?   ??? variables.tf
?   ?   ??? main.tf
?   ?   ??? kubernetes.tf
?   ?   ??? networking.tf
?   ?   ??? databases.tf
?   ??? monitoring/
?       ??? prometheus/
?       ??? grafana/
?       ??? alerting/
?
??? Services/                         # All microservices
?   ?
?   ??? AuthService/
?   ?   ??? ChineseSaleApi.Auth.csproj
?   ?   ??? Dockerfile
?   ?   ??? .dockerignore
?   ?   ?
?   ?   ??? src/
?   ?   ?   ??? Controllers/
?   ?   ?   ?   ??? AuthController.cs
?   ?   ?   ?
?   ?   ?   ??? Services/
?   ?   ?   ?   ??? IAuthService.cs
?   ?   ?   ?   ??? AuthService.cs
?   ?   ?   ?   ??? ITokenService.cs
?   ?   ?   ?   ??? TokenService.cs
?   ?   ?   ?   ??? IPasswordService.cs
?   ?   ?   ?
?   ?   ?   ??? Repositories/
?   ?   ?   ?   ??? IUserRepository.cs
?   ?   ?   ?   ??? UserRepository.cs
?   ?   ?   ?   ??? IRefreshTokenRepository.cs
?   ?   ?   ?   ??? RefreshTokenRepository.cs
?   ?   ?   ?
?   ?   ?   ??? Data/
?   ?   ?   ?   ??? AuthDbContext.cs
?   ?   ?   ?   ??? Migrations/
?   ?   ?   ?       ??? 001_InitialCreate.cs
?   ?   ?   ?       ??? 002_AddRefreshTokens.cs
?   ?   ?   ?
?   ?   ?   ??? Models/
?   ?   ?   ?   ??? User.cs
?   ?   ?   ?   ??? RefreshToken.cs
?   ?   ?   ?   ??? AuditLog.cs
?   ?   ?   ?
?   ?   ?   ??? DTOs/
?   ?   ?   ?   ??? Request/
?   ?   ?   ?   ?   ??? LoginRequest.cs
?   ?   ?   ?   ?   ??? RegisterRequest.cs
?   ?   ?   ?   ?   ??? RefreshTokenRequest.cs
?   ?   ?   ?   ??? Response/
?   ?   ?   ?       ??? TokenResponse.cs
?   ?   ?   ?       ??? UserResponse.cs
?   ?   ?   ?       ??? ErrorResponse.cs
?   ?   ?   ?
?   ?   ?   ??? Extensions/
?   ?   ?   ?   ??? ServiceCollectionExtensions.cs
?   ?   ?   ?   ??? ConfigurationExtensions.cs
?   ?   ?   ?   ??? MiddlewareExtensions.cs
?   ?   ?   ?
?   ?   ?   ??? Middleware/
?   ?   ?   ?   ??? ExceptionHandlingMiddleware.cs
?   ?   ?   ?   ??? RequestLoggingMiddleware.cs
?   ?   ?   ?   ??? CorrelationIdMiddleware.cs
?   ?   ?   ?
?   ?   ?   ??? Utilities/
?   ?   ?   ?   ??? PasswordHasher.cs
?   ?   ?   ?   ??? TokenGenerator.cs
?   ?   ?   ?
?   ?   ?   ??? Program.cs
?   ?   ?
?   ?   ??? tests/
?   ?   ?   ??? AuthService.UnitTests/
?   ?   ?   ?   ??? Services/
?   ?   ?   ?   ?   ??? TokenServiceTests.cs
?   ?   ?   ?   ??? Repositories/
?   ?   ?   ?   ?   ??? UserRepositoryTests.cs
?   ?   ?   ?   ??? AuthServiceTests.csproj
?   ?   ?   ?
?   ?   ?   ??? AuthService.IntegrationTests/
?   ?   ?       ??? Controllers/
?   ?   ?       ?   ??? AuthControllerTests.cs
?   ?   ?       ??? AuthServiceIntegrationTests.csproj
?   ?   ?
?   ?   ??? appsettings.json
?   ?   ??? appsettings.Development.json
?   ?   ??? appsettings.Staging.json
?   ?   ??? appsettings.Production.json
?   ?   ?
?   ?   ??? .env.example
?   ?   ??? README.md
?   ?
?   ??? GiftService/
?   ?   ??? ChineseSaleApi.Gifts.csproj
?   ?   ??? Dockerfile
?   ?   ??? src/
?   ?   ?   ??? Controllers/
?   ?   ?   ?   ??? GiftController.cs
?   ?   ?   ??? Services/
?   ?   ?   ?   ??? IGiftService.cs
?   ?   ?   ?   ??? GiftService.cs
?   ?   ?   ??? Repositories/
?   ?   ?   ??? Data/
?   ?   ?   ?   ??? GiftDbContext.cs
?   ?   ?   ??? Models/
?   ?   ?   ?   ??? Gift.cs
?   ?   ?   ??? DTOs/
?   ?   ?   ??? Events/
?   ?   ?   ?   ??? GiftCreatedEvent.cs
?   ?   ?   ?   ??? GiftUpdatedEvent.cs
?   ?   ?   ?   ??? EventPublisher.cs
?   ?   ?   ??? Extensions/
?   ?   ?   ??? Middleware/
?   ?   ?   ??? Program.cs
?   ?   ??? tests/
?   ?   ??? appsettings*.json
?   ?
?   ??? DonorService/
?   ?   ??? (Similar structure to GiftService)
?   ?
?   ??? CategoryService/
?   ?   ??? src/
?   ?   ?   ??? Controllers/
?   ?   ?   ??? Services/
?   ?   ?   ??? Cache/
?   ?   ?   ?   ??? CategoryCacheService.cs  # Redis caching
?   ?   ?   ??? ...
?   ?   ?
?   ?   ??? tests/
?   ?
?   ??? OrdersService/
?   ?   ??? src/
?   ?   ?   ??? Controllers/
?   ?   ?   ??? Services/
?   ?   ?   ??? Sagas/
?   ?   ?   ?   ??? CheckoutSaga.cs        # Saga orchestration
?   ?   ?   ??? EventHandlers/
?   ?   ?   ??? Cache/
?   ?   ?   ?   ??? CartSessionCache.cs
?   ?   ?   ??? ...
?   ?   ?
?   ?   ??? tests/
?   ?
?   ??? PurchaseService/
?       ??? src/
?       ?   ??? Controllers/
?       ?   ??? Services/
?       ?   ??? EventHandlers/
?       ?   ?   ??? CheckoutCompletedEventHandler.cs
?       ?   ??? Analytics/
?       ?   ??? ...
?       ?
?       ??? tests/
?
??? Shared/                          # Shared libraries
?   ?
?   ??? ChineseSaleApi.Shared.csproj
?   ?   ?
?   ?   ??? DTOs/
?   ?   ?   ??? Common/
?   ?   ?   ?   ??? ErrorResponse.cs
?   ?   ?   ?   ??? PagedResult.cs
?   ?   ?   ??? Events/
?   ?   ?       ??? Event base classes
?   ?   ?
?   ?   ??? Events/
?   ?   ?   ??? IEvent.cs
?   ?   ?   ??? EventBus.cs
?   ?   ?   ??? Event definitions (shared across services)
?   ?   ?
?   ?   ??? Exceptions/
?   ?   ?   ??? ApplicationException.cs
?   ?   ?   ??? ValidationException.cs
?   ?   ?   ??? NotFoundException.cs
?   ?   ?
?   ?   ??? Extensions/
?   ?   ?   ??? HttpClientExtensions.cs
?   ?   ?   ??? ServiceCollectionExtensions.cs
?   ?   ?   ??? StringExtensions.cs
?   ?   ?
?   ?   ??? Middleware/
?   ?   ?   ??? ExceptionHandlingMiddleware.cs
?   ?   ?   ??? CorrelationIdMiddleware.cs
?   ?   ?   ??? RequestLoggingMiddleware.cs
?   ?   ?
?   ?   ??? Utilities/
?   ?   ?   ??? JwtTokenValidator.cs
?   ?   ?
?   ?   ??? Constants/
?   ?   ?   ??? ClaimTypes.cs
?   ?   ?   ??? EventTypes.cs
?   ?   ?   ??? ErrorCodes.cs
?   ?   ?
?   ?   ??? Contracts/
?   ?       ??? IRepository.cs
?   ?       ??? IService.cs
?   ?       ??? IEventHandler.cs
?   ?
?   ??? ChineseSaleApi.Shared.Tests/
?       ??? (Tests for shared library)
?
??? ApiGateway/
?   ??? Kong/
?   ?   ??? kong.yml
?   ?   ??? Dockerfile
?   ?   ??? plugins/
?   ?   ??? docker-compose.yml
?   ?
?   ??? Ocelot/ (Alternative)
?       ??? ocelot.json
?       ??? OcelotGateway.csproj
?       ??? Program.cs
?
??? docs/
?   ??? ARCHITECTURE.md
?   ??? API_DOCUMENTATION.md
?   ??? DEPLOYMENT_GUIDE.md
?   ??? RUNBOOK.md
?   ??? TROUBLESHOOTING.md
?   ??? MIGRATION_LOG.md
?
??? scripts/
?   ??? deploy-local.sh
?   ??? deploy-staging.sh
?   ??? deploy-production.sh
?   ??? backup-databases.sh
?   ??? health-check.sh
?
??? .gitignore
??? CONTRIBUTING.md
??? README.md
??? LICENSE
```

### Per-Service Structure (Example: GiftService)

```
Services/GiftService/
?
??? ChineseSaleApi.Gifts.csproj
?
??? src/
?   ??? Program.cs                    # Entry point
?   ?   ??? ConfigureLogging()
?   ?   ??? ConfigureServices()
?   ?   ??? ConfigureMiddleware()
?   ?   ??? ConfigureEndpoints()
?   ?
?   ??? Controllers/
?   ?   ??? GiftController.cs         # REST endpoints
?   ?   ?   ??? [HttpGet]             # GET /api/v1/gifts
?   ?   ?   ??? [HttpPost]            # POST /api/v1/gifts
?   ?   ?   ??? [HttpPut("{id}")]     # PUT /api/v1/gifts/{id}
?   ?   ?   ??? [HttpDelete("{id}")]  # DELETE /api/v1/gifts/{id}
?   ?   ?
?   ?   ??? HealthController.cs       # /health endpoints
?   ?       ??? /health/live          # Liveness probe
?   ?       ??? /health/ready         # Readiness probe
?   ?
?   ??? Services/
?   ?   ??? IGiftService.cs           # Service interface
?   ?   ??? GiftService.cs            # Business logic
?   ?   ?   ??? GetAllAsync()
?   ?   ?   ??? GetByIdAsync()
?   ?   ?   ??? CreateAsync()
?   ?   ?   ??? UpdateAsync()
?   ?   ?   ??? DeleteAsync()
?   ?   ?
?   ?   ??? ICategoryClient.cs        # HTTP client to Category Service
?   ?   ??? CategoryClient.cs
?   ?   ?
?   ?   ??? EventPublisher.cs         # Publish GiftCreated, etc.
?   ?
?   ??? Repositories/
?   ?   ??? IGiftRepository.cs
?   ?   ??? GiftRepository.cs
?   ?   ?   ??? GetAllAsync()
?   ?   ?   ??? GetByIdAsync()
?   ?   ?   ??? AddAsync()
?   ?   ?   ??? UpdateAsync()
?   ?   ?   ??? DeleteAsync()
?   ?   ?   ??? SearchAsync()
?   ?   ?
?   ?   ??? GiftSpecification.cs      # DDD Specification pattern
?   ?
?   ??? Data/
?   ?   ??? GiftDbContext.cs
?   ?   ?   ??? OnModelCreating()
?   ?   ?   ??? DbSets
?   ?   ?
?   ?   ??? Migrations/
?   ?       ??? 001_InitialCreate.cs
?   ?       ??? 002_AddPictureTable.cs
?   ?
?   ??? Models/
?   ?   ??? Gift.cs                  # Domain entity
?   ?   ?   ??? Id
?   ?   ?   ??? Name
?   ?   ?   ??? Price
?   ?   ?   ??? DonorId
?   ?   ?   ??? CategoryName (denormalized)
?   ?   ?   ??? Validations
?   ?   ?
?   ?   ??? GiftPicture.cs
?   ?   ??? ValueObjects/
?   ?       ??? Price.cs              # Value object
?   ?
?   ??? DTOs/
?   ?   ??? Request/
?   ?   ?   ??? CreateGiftRequest.cs
?   ?   ?   ??? UpdateGiftRequest.cs
?   ?   ?   ??? SearchGiftRequest.cs
?   ?   ?
?   ?   ??? Response/
?   ?       ??? GiftResponse.cs
?   ?       ??? GiftDetailResponse.cs
?   ?       ??? GiftListResponse.cs
?   ?
?   ??? Events/
?   ?   ??? GiftCreatedEvent.cs
?   ?   ??? GiftUpdatedEvent.cs
?   ?   ??? GiftDeletedEvent.cs
?   ?   ??? GiftEventPublisher.cs
?   ?
?   ??? Validators/
?   ?   ??? CreateGiftRequestValidator.cs
?   ?   ??? SearchGiftRequestValidator.cs
?   ?
?   ??? Exceptions/
?   ?   ??? GiftNotFoundException.cs
?   ?   ??? InvalidGiftException.cs
?   ?   ??? GiftAlreadyExistsException.cs
?   ?
?   ??? Utilities/
?   ?   ??? GiftMapper.cs             # DTO ? Model mapping
?   ?
?   ??? Extensions/
?   ?   ??? ServiceCollectionExtensions.cs
?   ?   ?   ??? AddGiftServices(IServiceCollection)
?   ?   ??? HttpClientExtensions.cs
?   ?   ??? ExceptionExtensions.cs
?   ?
?   ??? Middleware/
?   ?   ??? ValidationMiddleware.cs
?   ?   ??? ErrorHandlingMiddleware.cs
?   ?
?   ??? Logging/
?   ?   ??? GiftServiceLogger.cs      # Structured logging
?   ?
?   ??? Configuration/
?   ?   ??? GiftServiceOptions.cs     # Options pattern
?   ?   ??? DatabaseOptions.cs
?   ?
?   ??? Constants/
?   ?   ??? GiftConstants.cs
?   ?
?   ??? Health/
?       ??? GiftServiceHealthCheck.cs
?       ??? DatabaseHealthCheck.cs
?
??? tests/
?   ?
?   ??? GiftService.UnitTests/
?   ?   ??? GiftService.UnitTests.csproj
?   ?   ?
?   ?   ??? Services/
?   ?   ?   ??? GiftServiceTests.cs
?   ?   ?       ??? CreateAsync_WithValidRequest_ReturnsSuccess
?   ?   ?       ??? CreateAsync_WithDuplicateName_ThrowsException
?   ?   ?       ??? ...
?   ?   ?
?   ?   ??? Repositories/
?   ?   ?   ??? GiftRepositoryTests.cs
?   ?   ?
?   ?   ??? Validators/
?   ?   ?   ??? CreateGiftRequestValidatorTests.cs
?   ?   ?
?   ?   ??? Mocks/
?   ?   ?   ??? MockGiftRepository.cs
?   ?   ?
?   ?   ??? Fixtures/
?   ?       ??? GiftFixtures.cs       # Test data builders
?   ?
?   ??? GiftService.IntegrationTests/
?   ?   ??? GiftService.IntegrationTests.csproj
?   ?   ?
?   ?   ??? Controllers/
?   ?   ?   ??? GiftControllerTests.cs
?   ?   ?       ??? GetAll_ReturnsOkWithData
?   ?   ?       ??? Create_WithValidData_ReturnCreated
?   ?   ?       ??? ...
?   ?   ?
?   ?   ??? Services/
?   ?   ?   ??? GiftServiceIntegrationTests.cs
?   ?   ?
?   ?   ??? Fixtures/
?   ?   ?   ??? DatabaseFixture.cs    # Shared test DB
?   ?   ?
?   ?   ??? TestContainers/
?   ?   ?   ??? SqlServerContainer.cs # Testcontainers integration
?   ?   ?
?   ?   ??? appsettings.Testing.json
?   ?
?   ??? GiftService.EndToEndTests/
?       ??? GiftService.E2ETests.csproj
?       ??? Scenarios/
?       ?   ??? CreateGiftScenario.cs
?       ?   ??? SearchGiftScenario.cs
?       ??? appsettings.E2E.json
?
??? appsettings.json                 # Default config
?   ??? Logging
?   ??? ConnectionStrings
?   ??? Services (URLs to other services)
?   ??? RabbitMQ
?
??? appsettings.Development.json     # Dev overrides
??? appsettings.Staging.json         # Staging overrides
??? appsettings.Production.json      # Prod overrides
?
??? .env.example                     # Environment variables template
?   ??? DATABASE_CONNECTION_STRING
?   ??? JWT_SECRET
?   ??? RABBITMQ_HOST
?   ??? CATEGORY_SERVICE_URL
?
??? Dockerfile                       # Multi-stage build
?   ??? Build stage
?   ??? Test stage
?   ??? Runtime stage
?
??? .dockerignore
??? README.md
??? CONTRIBUTING.md
```

### Folder Structure Key Principles

```
? DO:
- One responsibility per folder
- Models and DTOs separated
- Tests mirror source structure
- Clear naming conventions
- Shared utilities in Shared project
- Configuration centralized

? DON'T:
- Mix models, services, repositories
- Deeply nested folders (max 5 levels)
- Shared business logic in Shared
- Tests in same folder as source
- Magic strings (use constants)
- Service locator pattern
```

---

## Risks, Trade-offs & Scalability

### Major Risks

#### **Risk 1: Distributed System Complexity**

**Problem:** Microservices are inherently more complex than monolith
- Network latency between services
- Partial failures (one service down, others work)
- Data consistency issues
- Debugging across multiple services

**Mitigation:**
- ? Comprehensive monitoring (Prometheus, ELK)
- ? Distributed tracing (Jaeger)
- ? Service mesh (Istio) for traffic management
- ? Circuit breakers (Polly)
- ? Extensive testing (unit, integration, E2E)

**Acceptance:** Extra complexity is worth the benefits (independent scaling, deployment)

---

#### **Risk 2: Data Consistency & Saga Failures**

**Problem:** Checkout saga might fail mid-transaction
- Order created but ticket not created
- Gift locked but order cancelled
- Orphaned data across services

**Example Scenario:**
```
1. Orders Service: Order created ?
2. Orders Service: Emit CheckoutCompleted ?
3. RabbitMQ: Message queued ?
4. Purchase Service: Crashes before creating ticket ?
5. Result: Order exists but no ticket generated
```

**Mitigation:**
```csharp
// Dead-letter queue pattern
RabbitMQ Configuration:
??? Main queue: order.completed
??? DLQ: order.completed.deadletter
    (Messages here if processing fails 3x)

// Monitoring
??? Alert if DLQ has messages
??? Manual intervention required

// Compensation logic
If Purchase Service fails:
1. CheckoutCompleted event stays in DLQ
2. Admin notified to investigate
3. Manual retry or order cancellation
```

**Acceptance:** Eventual consistency acceptable, with monitoring

---

#### **Risk 3: Inter-Service Communication Failures**

**Problem:** Orders Service calls Gift Service to check availability, but Gift Service is down

**Scenario:**
```
Orders Service ? Gift Service (TIMEOUT)
                    ? (Network issue or service crash)

Result: Customer can't checkout
```

**Mitigation:**
```csharp
// Circuit breaker pattern
var policy = Policy
    .Handle<HttpRequestException>()
    .Or<TimeoutRejectedException>()
    .CircuitBreakerAsync(
        handledEventsAllowedBeforeBreaking: 5,
        durationOfBreak: TimeSpan.FromSeconds(30));

// Fallback: Accept order but mark as "pending validation"
// Async background job validates later
```

**Acceptance:** Some orders queued for delayed validation, monitored

---

#### **Risk 4: Secret Management & Security**

**Problem:** Each service needs secrets (JWT key, DB password, API keys)

**Scenarios:**
- Secret leaked in git repo
- Secret rotation breaks service
- Unauthorized access to Vault

**Mitigation:**
```
? Use HashiCorp Vault or Azure Key Vault
? Rotate secrets every 90 days
? Audit all secret access
? Never commit secrets to git (use .gitignore)
? RBAC for who can access which secrets
```

---

#### **Risk 5: Database Scale-Out Bottlenecks**

**Problem:** Even with separate DBs, SQL Server might become bottleneck
- High I/O for reporting queries
- Backup/restore of large databases
- Network bandwidth

**Mitigation:**
```
Short-term (Year 1):
??? Optimize queries & indexes
??? Redis caching for reads
??? Database replication (read replicas)
??? Archive old data

Medium-term (Year 2-3):
??? Add data warehouse (SQL DW) for analytics
??? Implement CQRS pattern (separate read/write DBs)
??? Event sourcing for audit trail

Long-term (Year 3+):
??? Consider sharding for high-scale services
??? Evaluate NoSQL for specific services
```

---

### Major Trade-offs

#### **Trade-off 1: Consistency vs. Availability**

| Aspect | Monolith | Microservices |
|--------|----------|---------------|
| **Consistency** | Strong (ACID) | Eventual (within 1-5s) |
| **Availability** | Single point of failure | Better (one service down ? all down) |
| **Latency** | Low (in-process calls) | Higher (network) |
| **Complexity** | Simple | Complex |

**Decision:** Accept eventual consistency for better availability

---

#### **Trade-off 2: Network Calls vs. Data Duplication**

**Option A: REST Calls (Synchronous)**
```
Orders Service needs category name for order confirmation
??? Call Category Service: GET /categories/1
??? Pros: Always current
??? Cons: Network latency, if Category Service down ? fail
```

**Option B: Denormalization (Eventual Consistency)**
```
Orders Service stores category name locally
??? Category Service sends UpdateEvent on change
??? Orders Service updates cache
??? Pros: Fast, independent
??? Cons: Stale data for 30-60 seconds
```

**Decision:** Hybrid approach
- Read-heavy: Denormalize + cache
- Write operations: Validate via REST (sync)

---

#### **Trade-off 3: Synchronous vs. Asynchronous Communication**

| Style | Pros | Cons |
|-------|------|------|
| **Synchronous (REST)** | Simple, real-time | Coupling, fragile, slow |
| **Asynchronous (Events)** | Decoupled, scalable | Complex, eventual consistency |

**Decision:** Use both strategically
- Real-time validation: REST (Gift availability)
- Notifications: Events (TicketCreated ? Email)

---

#### **Trade-off 4: Polyglot vs. Uniform Stack**

**Option A: All .NET 8 (Current)**
- Pros: Team expertise, code sharing
- Cons: Lock-in, can't use best tool for job

**Option B: Polyglot (Go for Orders, Node for Cache)**
- Pros: Optimize each service
- Cons: Operational complexity, team skills

**Decision:** Stay .NET 8 for now
- Revisit in year 2 if specific service needs different tech
- Example: High-volume caching service could use Go

---

### Scalability Considerations

#### **Horizontal Scaling Example: Gift Service**

**Scenario:** Black Friday - 10x traffic expected

```
BEFORE (Monolith):
???????????????????????????
?   ChineseSaleApi        ?
?   (CPU: 80%, Memory: 90%)  ?  ? Can't scale selectively
?   All services affected    ?
???????????????????????????

AFTER (Microservices):
????????????  ????????????  ????????????
? Auth     ?  ? Gift     ?  ? Category ?
? Service  ?  ? Service  ?  ? Service  ?
? 1 pod    ?  ? 10 pods  ?  ? 2 pods   ?  ? Scale only Gift!
? (CPU:30%)   ? (CPU:70%)?  ?(CPU:20%) ?
????????????  ????????????  ????????????
```

**Kubernetes HPA Configuration:**

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: gift-service-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: gift-service
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

**Result:**
- Normal load: 3 pods
- Heavy load: Auto-scale to 20 pods (< 5 seconds)
- Load distributes across replicas
- Better response time, 99.9% availability

---

#### **Database Scalability: Read Replicas**

```
Primary (Writes)
    ?
    ??? Replica 1 (Read-only)
    ??? Replica 2 (Read-only)
    ??? Replica 3 (Read-only)

Gift Service:
??? Write queries ? Primary
??? Read queries (catalog) ? Replica 1 (least loaded)
??? Reporting queries ? Replica 3 (dedicated)
```

**Benefit:** Can handle 3x read traffic without primary DB saturation

---

#### **Cache-Based Scalability: Redis**

```
Without caching:
GET /api/v1/categories
??? Query database: 50ms
??? Process: 10ms
??? Total: 60ms per request

With Redis:
GET /api/v1/categories (cached)
??? Redis hit: 2ms
??? Total: 2ms per request

Result: 30x faster, 90% less DB load
```

---

### Monitoring & Observability Requirements

**Essential Metrics:**

```
Application Metrics:
??? Response time (p50, p95, p99)
??? Request rate (req/sec)
??? Error rate (errors/sec)
??? Success rate (%)
??? Cassette size distribution
??? Business metrics (orders/hour, revenue)

Infrastructure Metrics:
??? CPU usage per pod
??? Memory usage per pod
??? Network I/O
??? Disk I/O
??? Pod startup time
??? Image pull latency

Database Metrics:
??? Query execution time
??? Slow queries (>100ms)
??? Connection pool usage
??? Lock contention
??? Replication lag
??? Backup success rate

Messaging Metrics:
??? Message queue depth
??? Message publish latency
??? Subscriber lag
??? Dead-letter queue size
```

**Alerting Strategy:**

```
CRITICAL (Immediate Page):
??? Service down (pod crash)
??? Database unreachable
??? API error rate > 10% (5 min)
??? Message queue depth > 10000

WARNING (Issue ticket):
??? CPU > 80% for 10 minutes
??? Memory > 80%
??? Response time p99 > 1 second
??? DLQ has messages
```

---

### Cost Implications

**Hardware Costs:**

```
MONOLITH:
??? 2 large servers (high availability)
??? 1 database server
??? Load balancer
??? Estimated: $2000/month

MICROSERVICES:
??? Kubernetes cluster (3 master nodes): $1500
??? Worker nodes (auto-scale 5-20): $2000
??? RabbitMQ cluster: $300
??? Redis: $200
??? Vault: $200
??? Monitoring (Prometheus, Grafana): $150
??? Storage (EBS, backups): $500
??? Estimated: $4850/month

ROI: 6-12 months (when multiple teams can work in parallel)
```

---

## Conclusion & Next Steps

### Key Takeaways

? **Recommended Approach:**
1. Use strangler fig pattern (parallel running)
2. Start with Auth Service (lowest risk)
3. Move to Category ? Gift ? Orders ? Purchase (logical order)
4. Use RabbitMQ for async communication
5. Implement comprehensive monitoring from day 1

?? **Critical Success Factors:**
- Strong DevOps/SRE team
- Comprehensive testing strategy
- Clear ownership (each team owns 1-2 services)
- Monitoring and alerting from start
- Runbooks for operational issues

---

### Immediate Action Items (Next 2 Weeks)

- [ ] Create Kubernetes cluster (local K3d or cloud)
- [ ] Setup CI/CD pipeline (GitHub Actions)
- [ ] Create shared library (ChineseSaleApi.Shared)
- [ ] Extract Auth Service from monolith
- [ ] Deploy Auth Service to Kubernetes
- [ ] Configure API Gateway (Kong)
- [ ] Setup monitoring (Prometheus + Grafana)
- [ ] Document architecture decisions

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Next Review:** March 2025  
**Status:** Ready for Implementation
