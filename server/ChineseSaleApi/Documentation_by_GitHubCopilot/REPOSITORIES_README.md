# ChineseSaleApi - Repositories Guide

This document provides a detailed overview of all repositories in the ChineseSaleApi project, their responsibilities, interactions, and implementation details.

---

## Table of Contents

1. [Repository Pattern Overview](#repository-pattern-overview)
2. [DonorRepository](#donorrepository)
3. [UserRepository](#userrepository)
4. [GiftRepository](#giftrepository)
5. [CategoryRepository](#categoryrepository)
6. [PurchaseRepository](#purchaserepository)
7. [Repository Interactions](#repository-interactions)
8. [Database Context](#database-context)
9. [How to Set Up and Run](#how-to-set-up-and-run)
10. [Special Notes and Configurations](#special-notes-and-configurations)

---

## Repository Pattern Overview

The ChineseSaleApi project implements the **Repository Pattern**, a data access abstraction layer that provides a collection-like interface for accessing domain objects.

### Benefits of This Pattern
- **Abstraction**: Separates business logic from data access logic
- **Testability**: Easy to mock repositories for unit testing
- **Maintainability**: Centralized data access logic
- **Flexibility**: Can switch database implementations without affecting services

### Architecture
```
Service Layer (Services)
        ?
Repository Layer (Repositories)
        ?
Data Access Layer (Entity Framework Core + DbContext)
        ?
SQL Server Database
```

### Generic Interface Pattern
Each repository has:
- **Interface**: Defines the contract (e.g., `IDonorRepository`)
- **Implementation**: Concrete implementation (e.g., `DonorRepository`)
- **DbContext**: Access to `ChineseSaleContextDb`

---

## DonorRepository

### Purpose & Responsibility
Manages all data access operations related to **Donors** - entities that contribute gifts to the system.

**Key Responsibilities:**
- Create, read, update, and delete donor records
- Validate email uniqueness
- Retrieve donor-specific gifts
- Filter and search donors by various criteria

### Main Classes & Methods

#### Interface: `IDonorRepository`
```csharp
public interface IDonorRepository
{
    Task<IEnumerable<Donor>> GetAllDonors();
    Task AddDonor(Donor donor);
    Task<bool> ExistsByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email, int id);
    Task DeleteByIdAsync(Donor donor);
    Task UpdateDonorAsync(Donor donor);
    Task<List<Gift>> GetDonorGiftsByIdAsync(int donorId);
    Task<bool> DonorExistsAsync(int id);
    Task<Donor?> DonorFindAsync(int id);
    Task<IEnumerable<Donor>> FilterDonorsAsync(FilterDonorDto filter);
}
```

#### Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `GetAllDonors()` | Retrieves all donors from database | `IEnumerable<Donor>` |
| `AddDonor(Donor)` | Creates a new donor record | `Task` |
| `ExistsByEmailAsync(string)` | Checks if email already exists | `bool` |
| `ExistsByEmailAsync(string, int)` | Checks email uniqueness excluding a donor ID | `bool` |
| `DonorFindAsync(int)` | Finds donor by ID | `Donor?` |
| `DeleteByIdAsync(Donor)` | Soft deletes a donor | `Task` |
| `UpdateDonorAsync(Donor)` | Updates donor information | `Task` |
| `GetDonorGiftsByIdAsync(int)` | Gets all gifts contributed by a donor | `List<Gift>` |
| `DonorExistsAsync(int)` | Checks if donor exists | `bool` |
| `FilterDonorsAsync(FilterDonorDto)` | Searches donors with filters | `IEnumerable<Donor>` |

#### Key Features
- **Email Uniqueness Validation**: Two-part validation (on creation and update)
- **Gift Association**: Retrieves related gifts with full details (Category, Donor)
- **Filtering**: Supports filtering by Name, Email, and GiftId
- **Eager Loading**: Uses `.Include()` for related entities to prevent N+1 queries

### Database Model: `Donor`
```csharp
public class Donor
{
    public int Id { get; set; }
    public required string Name { get; set; }
    [EmailAddress]
    public required string Email { get; set; }
    public ICollection<Gift> Gifts { get; set; } = new List<Gift>();
}
```

### How It Interacts with Other Repositories
- **GiftRepository**: Donors contribute gifts; `GetDonorGiftsByIdAsync()` retrieves related gifts
- **Services**: `DonorService` uses `DonorRepository` for business logic operations
- **Controllers**: `DonorController` handles HTTP requests and delegates to `DonorService`

### Special Notes
- Email validation ensures unique donor records
- The `FilterDonorsAsync()` method supports advanced search capabilities with nullable filters
- Uses Entity Framework's LINQ queries for database operations

---

## UserRepository

### Purpose & Responsibility
Manages user account operations including **authentication, shopping carts, and checkout** functionality.

**Key Responsibilities:**
- User registration and authentication
- Shopping cart management
- Gift discovery and sorting
- Purchase/checkout operations
- Cart item management

### Main Classes & Methods

#### Interface: `IUserRepository`
```csharp
public interface IUserRepository
{
    Task<User> CreateAsync(User user);
    Task<bool> EmailExistsAsync(string email);
    Task<User?> GetByEmailAsync(string email);
    Task<List<Gift>> SortingGiftsAsync(string? sortParam);
    Task AddGiftToCartAsync(int userId, Gift gift);
    Task<Gift?> GiftFindAsync(int giftId);
    Task<Order?> GetCartItemsAsync(int userId);
    Task<bool> IsGiftInCartAsync(int userId, int giftId);
    Task<bool> DeleteItemFromCartAsync(int userId, int giftId);
    Task<bool> LessAmountItemFromCartAsync(int userId, int giftId);
    Task<List<string?>?> CheckoutAsync(int userId);
}
```

#### Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `CreateAsync(User)` | Registers a new user | `User` |
| `EmailExistsAsync(string)` | Validates email uniqueness | `bool` |
| `GetByEmailAsync(string)` | Authentication lookup | `User?` |
| `SortingGiftsAsync(string?)` | Retrieves gifts with sorting | `List<Gift>` |
| `AddGiftToCartAsync(int, Gift)` | Adds gift to user's cart | `Task` |
| `GiftFindAsync(int)` | Locates a gift by ID | `Gift?` |
| `GetCartItemsAsync(int)` | Retrieves all cart items with details | `Order?` |
| `IsGiftInCartAsync(int, int)` | Checks if gift is in cart | `bool` |
| `DeleteItemFromCartAsync(int, int)` | Removes all instances of a gift | `bool` |
| `LessAmountItemFromCartAsync(int, int)` | Decrements one gift instance | `bool` |
| `CheckoutAsync(int)` | Processes purchase and creates tickets | `List<string?>?` |

#### Key Features

**Authentication:**
- User registration with password hashing
- Email-based login lookup
- User roles support (User/Admin via `UserStatus` enum)

**Shopping Cart:**
- Creates Order if it doesn't exist
- Adds items as OrderItems
- Full cart state tracking with included relationships

**Gift Sorting:**
Supports multiple sort parameters:
- `"price"` - Orders by ticket cost (descending)
- `"category"` - Orders by category name (descending)
- Default - No sorting

**Checkout Process:**
1. Validates cart existence and items
2. Checks gift availability (not already won)
3. Collects unavailable gifts for return value
4. Uses database transactions for data consistency
5. Creates Ticket records for purchased gifts
6. Cleans up Order and OrderItems
7. Rolls back on errors (race condition handling)

### Database Model: `User`
```csharp
public enum UserStatus { User = 0, Admin = 1 }

public class User
{
    public int Id { get; set; }
    [EmailAddress]
    public required string UserName { get; set; }
    public required string Name { get; set; }
    public required string PasswordHash { get; set; }
    [Phone]
    public string? Phone { get; set; }
    public UserStatus Role { get; set; } = UserStatus.User;
}
```

### How It Interacts with Other Repositories
- **GiftRepository**: Retrieves gift details, validates existence
- **Purchase Operations**: Creates Tickets, updates Gift.WinnerUserId
- **OrderManagement**: Direct manipulation of Order and OrderItem entities
- **Services**: `UserService` wraps with business logic (password hashing, validation)

### Special Notes
- **Transaction Safety**: Checkout uses `BeginTransactionAsync()` to prevent race conditions
- **Cart Structure**: Carts are stored as Orders with OrderItems (not as separate Cart entity)
- **Username Field**: `UserName` is used for both email and username (validated as email)
- **Implicit Cart Creation**: Cart (Order) is auto-created when first item is added
- **Gift Availability Check**: Checks `WinnerUserId` to determine if gift is already purchased

---

## GiftRepository

### Purpose & Responsibility
Manages **Gift** records - items that donors contribute and users can purchase tickets for.

**Key Responsibilities:**
- CRUD operations on gifts
- Gift search and filtering
- Picture/image URL management
- Validation of related entities (Donor, Category)
- Gift reporting and statistics

### Main Classes & Methods

#### Interface: `IGiftRepository`
```csharp
public interface IGiftRepository
{
    Task<List<Gift>> GetAllGiftsAsync();
    Task AddGiftAsync(Gift gift);
    Task<bool> DonorExistsAsync(int donorId);
    Task<bool> CategoryExistsAsync(int categoryId);
    Task<bool> GiftExistsAsync(int id);
    Task DeleteGiftAsync(Gift gift);
    Task<Gift?> GiftFindAsync(int id);
    Task AddPictureToGiftAsync(Gift gift, string pictureurl);
    Task<Donor?> GetDonorByGiftIdAsync(int giftId);
    Task<List<Gift>> SearchGiftsAsync(SearchGiftDto parameter);
    Task<Gift?> GetGiftByIdAsync(int id);
    Task SaveChangesAsync();
}
```

#### Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `GetAllGiftsAsync()` | Retrieves all gifts with related data | `List<Gift>` |
| `AddGiftAsync(Gift)` | Creates a new gift record | `Task` |
| `DonorExistsAsync(int)` | Validates donor exists before gift creation | `bool` |
| `CategoryExistsAsync(int)` | Validates category exists before gift creation | `bool` |
| `GiftExistsAsync(int)` | Checks if gift exists by ID | `bool` |
| `GiftFindAsync(int)` | Finds gift by ID for deletion | `Gift?` |
| `DeleteGiftAsync(Gift)` | Removes a gift record | `Task` |
| `AddPictureToGiftAsync(Gift, string)` | Updates picture URL | `Task` |
| `GetDonorByGiftIdAsync(int)` | Retrieves donor associated with gift | `Donor?` |
| `SearchGiftsAsync(SearchGiftDto)` | Advanced search with multiple filters | `List<Gift>` |
| `GetGiftByIdAsync(int)` | Retrieves single gift with all details | `Gift?` |
| `SaveChangesAsync()` | Explicit save for manual changes | `Task` |

#### Key Features

**Eager Loading Strategy:**
All read operations include:
- `.Include(g => g.Category)` - Category details
- `.Include(g => g.Donor)` - Donor information
- `.Include(g => g.WinnerUser)` - Purchase winner details

**Search Capabilities:**
Supports filtering by:
- Gift Name (partial match)
- Donor Name (partial match)
- Number of Tickets sold

**Image Management:**
- `AddPictureToGiftAsync()` allows updating gift picture URLs
- Uses explicit `SaveChangesAsync()` for flexibility

### Database Model: `Gift`
```csharp
public class Gift
{
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int Id { get; set; }
    public required string Name { get; set; }
    public required int TicketCost { get; set; }
    public string? Description { get; set; }
    public string? PictureUrl { get; set; }
    public required int DonorId { get; set; }
    public Donor? Donor { get; set; }
    public required int CategoryId { get; set; }
    public Category? Category { get; set; }
    [ForeignKey("WinnerUser")]
    public int? WinnerUserId { get; set; }
    public User? WinnerUser { get; set; }
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}
```

### How It Interacts with Other Repositories
- **DonorRepository**: Validates donor existence; gifts belong to donors
- **CategoryRepository**: Validates category existence; gifts belong to categories
- **UserRepository**: Tracks WinnerUserId; gifts are purchased by users
- **PurchaseRepository**: Reports on gift sales and winners
- **Services**: `GiftService` manages business logic around gift creation/updates

### Special Notes
- **Identity Key**: `GiftId` uses auto-increment identity
- **Winner Tracking**: `WinnerUserId` is nullable; NULL indicates unpurchased gift
- **Validation**: Checks donor and category existence before allowing gift creation
- **Ticket Collection**: Tracks all purchase records for reporting

---

## CategoryRepository

### Purpose & Responsibility
Manages **Category** records - classification system for organizing gifts.

**Key Responsibilities:**
- CRUD operations for categories
- Category existence validation
- Prevent duplicate category names
- Update category information

### Main Classes & Methods

#### Interface: `ICategoryRepository`
```csharp
public interface ICategoryRepository
{
    Task<List<Category>> GetAllCategoriesAsync();
    Task AddCategoryAsync(Category category);
    Task<bool> CategoryIsExistAsync(string name);
    Task DeleteCategoryAsync(int id);
    Task UpdateCategoryAsync(Category category);
}
```

#### Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `GetAllCategoriesAsync()` | Retrieves all categories | `List<Category>` |
| `AddCategoryAsync(Category)` | Creates a new category | `Task` |
| `CategoryIsExistAsync(string)` | Checks if category name exists | `bool` |
| `DeleteCategoryAsync(int)` | Removes a category by ID | `Task` |
| `UpdateCategoryAsync(Category)` | Updates category information | `Task` |

#### Key Features

**Error Handling:**
- `DeleteCategoryAsync()` throws `KeyNotFoundException` if category not found
- `UpdateCategoryAsync()` throws `KeyNotFoundException` if category not found

**Simplicity:**
- Smallest repository - focused on single responsibility
- Only manages Category name field
- Prevents duplicate category names through validation

### Database Model: `Category`
```csharp
public class Category
{
    public int Id { get; set; }
    public required string Name { get; set; }
    public ICollection<Gift> Gifts { get; set; } = new List<Gift>();
}
```

### How It Interacts with Other Repositories
- **GiftRepository**: Validates category existence; gifts must belong to a category
- **CategoryService**: Provides business logic validation
- **CategoryController**: Handles HTTP CRUD requests

### Special Notes
- **Unique Constraint**: Category names should be unique (enforced in service layer)
- **Cascade Delete**: Deleting a category may cascade to associated gifts (database dependent)
- **Simple Model**: Category only contains Id and Name

---

## PurchaseRepository

### Purpose & Responsibility
Manages **purchase and sales reporting** operations - tracking which users bought tickets for gifts.

**Key Responsibilities:**
- Report on all purchases and winners
- Retrieve buyer details for specific gifts
- Generate sales revenue reports
- Sort and analyze purchase data
- Update gift with winner information

### Main Classes & Methods

#### Interface: `IPurchaseRepository`
```csharp
public interface IPurchaseRepository
{
    Task<List<Gift>> GetAllPurchasesAsync();
    Task<List<Ticket>> GetBuyersDetailsByGiftIdAsync(int giftId);
    Task<bool> GiftExistsAsync(int giftId);
    Task<List<Gift>> MakeGiftsAndWinnersReportAsync();
    Task<int> MakeTotalSalesRevenueReportAsync();
    Task<List<Gift>> SortingGiftsAsync(string? sortParam);
    Task UpdateGiftAsync(int giftId, int winnerUserId);
}
```

#### Key Methods

| Method | Purpose | Returns |
|--------|---------|---------|
| `GetAllPurchasesAsync()` | Retrieves all gifts with ticket and winner info | `List<Gift>` |
| `GetBuyersDetailsByGiftIdAsync(int)` | Gets all ticket buyers for a specific gift | `List<Ticket>` |
| `GiftExistsAsync(int)` | Validates gift exists | `bool` |
| `UpdateGiftAsync(int, int)` | Sets winner for a gift | `Task` |
| `MakeGiftsAndWinnersReportAsync()` | Full report of gifts and their winners | `List<Gift>` |
| `MakeTotalSalesRevenueReportAsync()` | Calculates total revenue | `int` |
| `SortingGiftsAsync(string?)` | Sorts gifts by various criteria | `List<Gift>` |

#### Key Features

**Reporting Capabilities:**
1. **Gifts & Winners Report**: Shows all gifts with winner details
2. **Buyer Details**: Lists all tickets purchased for a specific gift
3. **Revenue Report**: Calculates total sales revenue from all tickets

**Sorting Options:**
- `"price"` - Orders by ticket cost (descending)
- `"purchases"` - Orders by number of tickets sold (descending)
- Default - Orders by ID (ascending)

**Winner Management:**
- Sets `WinnerUserId` on gift record
- Tracks the user who won/purchased each gift

### Database Model: `Ticket`
```csharp
public class Ticket
{
    public int Id { get; set; }
    public int GiftId { get; set; }
    public Gift? Gift { get; set; }
    public int UserId { get; set; }
    public User? User { get; set; }
    public DateTime PurchaseDate { get; set; }
}
```

### How It Interacts with Other Repositories
- **GiftRepository**: Queries gift data with ticket information
- **UserRepository**: Works with Ticket creation during checkout
- **PurchaseService**: Provides business logic for purchase reporting
- **PurchaseController**: Delivers reports to users

### Special Notes
- **Read-Heavy**: Primarily for reporting and analysis
- **Revenue Calculation**: Sums `Gift.TicketCost` from all Ticket records
- **Eager Loading**: Includes User and WinnerUser data for complete reports
- **Purchase Count**: Uses `.Count()` on Tickets collection for sorting

---

## Repository Interactions

### Dependency Flow

```
???????????????????????????????????????????????????????????
?                   Controllers                            ?
???????????????????????????????????????????????????????????
?  (DonorController) (UserController) (GiftController)    ?
?  (CategoryController) (PurchaseController)               ?
???????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????
?                    Services                              ?
???????????????????????????????????????????????????????????
? (DonorService) (UserService) (GiftService)              ?
? (CategoryService) (PurchaseService)                      ?
???????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????
?                  Repositories                            ?
???????????????????????????????????????????????????????????
? (DonorRepository) (UserRepository) (GiftRepository)      ?
? (CategoryRepository) (PurchaseRepository)                ?
???????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????
?              ChineseSaleContextDb (DbContext)            ?
?         Entity Framework Core + SQL Server Driver        ?
???????????????????????????????????????????????????????????
                           ?
???????????????????????????????????????????????????????????
?                  SQL Server Database                     ?
?            (216259986ChineseSale)                        ?
???????????????????????????????????????????????????????????
```

### Cross-Repository Communication

| From Repository | To Repository | Method | Purpose |
|-----------------|---------------|--------|---------|
| DonorRepository | - | `GetDonorGiftsByIdAsync()` | Retrieve associated gifts |
| GiftRepository | DonorRepository | Via `Gift.DonorId` | Validate donor exists |
| GiftRepository | CategoryRepository | Via `Gift.CategoryId` | Validate category exists |
| UserRepository | GiftRepository | `GiftFindAsync()` | Find gift for cart |
| UserRepository | - | Creates Order/OrderItem | Shopping cart mgmt |
| PurchaseRepository | UserRepository | Via `Ticket.UserId` | Track purchasers |
| PurchaseRepository | GiftRepository | Via `Ticket.GiftId` | Report purchases |

---

## Database Context

### ChineseSaleContextDb

The `ChineseSaleContextDb` is the Entity Framework Core DbContext that manages all database operations.

```csharp
public class ChineseSaleContextDb: DbContext
{
    public ChineseSaleContextDb(DbContextOptions<ChineseSaleContextDb> options) 
        : base(options) { }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Donor>()
            .HasIndex(d => d.Email)
            .IsUnique();

        modelBuilder.Entity<User>()
            .HasIndex(u => u.UserName)
            .IsUnique();
    }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Donor> Donors => Set<Donor>();
    public DbSet<Gift> Gifts => Set<Gift>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
}
```

### Key Constraints
- **Donor.Email**: Unique index to prevent duplicate donor emails
- **User.UserName**: Unique index to prevent duplicate usernames

### DbSets (Tables)
1. **Categories** - Gift categories
2. **Donors** - Gift donors
3. **Gifts** - Gift items
4. **Tickets** - Purchase records
5. **Users** - User accounts
6. **Orders** - Shopping carts
7. **OrderItems** - Items in shopping carts

---

## How to Set Up and Run

### Prerequisites
- .NET 8 SDK
- SQL Server (LocalDB, Express, or Full)
- Visual Studio 2022 or VS Code

### Step 1: Restore Dependencies
```bash
cd ChineseSaleApi
dotnet restore
```

### Step 2: Update Database Connection
Edit `appsettings.json`:
```json
"ConnectionStrings": {
  "AnotherConnection": "Server=YOUR_SERVER;DataBase=216259986ChineseSale;Integrated Security=SSPI;Persist Security Info=False;TrustServerCertificate=True;"
}
```

### Step 3: Apply Migrations
```bash
dotnet ef database update
```

### Step 4: Run the Application
```bash
dotnet run
```

### Step 5: Test Repositories via Swagger
Navigate to: `https://localhost:5001/swagger/index.html`

---

### Testing Repositories Individually

Each repository can be tested through its respective service and controller:

#### Test DonorRepository
```bash
POST /api/donor/add
{
  "name": "John Doe",
  "email": "john@example.com"
}

GET /api/donor/all
GET /api/donor/{id}/gifts
```

#### Test GiftRepository
```bash
POST /api/gift/add
{
  "name": "Gift Name",
  "ticketCost": 100,
  "description": "Description",
  "donorId": 1,
  "categoryId": 1
}

GET /api/gift/all
GET /api/gift/search?name=partialname
```

#### Test UserRepository (via Shopping)
```bash
POST /api/auth/register
{
  "userName": "user@example.com",
  "name": "User Name",
  "passwordHash": "hashedpassword"
}

POST /api/user/add-to-cart
{
  "userId": 1,
  "giftId": 1
}

GET /api/user/{id}/cart
POST /api/user/checkout
```

#### Test CategoryRepository
```bash
POST /api/category/add
{
  "name": "Electronics"
}

GET /api/category/all
```

#### Test PurchaseRepository
```bash
GET /api/purchase/all
GET /api/purchase/{giftId}/buyers
GET /api/purchase/report/revenue
```

---

## Special Notes and Configurations

### 1. Async/Await Pattern
All repositories use async methods (`Task`, `Task<T>`) to prevent blocking database calls:
```csharp
public async Task<IEnumerable<Donor>> GetAllDonors()
{
    return await _context.Donors.ToListAsync();
}
```

### 2. DbContext Injection
All repositories receive `ChineseSaleContextDb` through dependency injection:
```csharp
public DonorRepository(ChineseSaleContextDb context)
{
    _context = context;
}
```

### 3. Eager Loading (Include)
Prevents N+1 query problem:
```csharp
return await _context.Gifts
    .Include(g => g.Category)
    .Include(g => g.Donor)
    .Include(g => g.WinnerUser)
    .ToListAsync();
```

### 4. Transaction Safety
UserRepository.CheckoutAsync uses transactions:
```csharp
using var tx = await _context.Database.BeginTransactionAsync();
try
{
    // Operations
    await tx.CommitAsync();
}
catch
{
    await tx.RollbackAsync();
    throw;
}
```

### 5. Nullability Handling
Return nullable types for optional results:
```csharp
public async Task<Donor?> DonorFindAsync(int id)
{
    return await _context.Donors.FindAsync(id);
}
```

### 6. Configuration in Program.cs
Repositories are registered as scoped services:
```csharp
builder.Services.AddScoped<IDonorRepository, DonorRepository>();
builder.Services.AddScoped<IGiftRepository, GiftRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();
```

### 7. Error Handling
Some repositories throw exceptions for validation:
```csharp
public async Task DeleteCategoryAsync(int id)
{
    var category = await _context.Categories.FindAsync(id);
    if (category == null)
        throw new KeyNotFoundException("Category not found");
    // Delete logic
}
```

### 8. Email and Username Validation
Unique constraints are enforced at the database level with indexes:
- `Donor.Email` - Unique
- `User.UserName` - Unique

### 9. Cart Implementation
Shopping carts are implemented using Order/OrderItem entities, not a separate Cart entity:
- `Order` = Shopping cart
- `OrderItem` = Item in cart
- Auto-created on first add

### 10. Checkout Process Details
- Creates `Ticket` records for successful purchases
- Uses double-check pattern to prevent race conditions
- Returns list of unavailable gifts for client feedback
- Cleans up Order records after purchase

---

## Migration Management

### View Migrations
```bash
dotnet ef migrations list
```

### Create New Migration
```bash
dotnet ef migrations add MigrationName
```

### Revert Last Migration
```bash
dotnet ef migrations remove
```

### Update Database
```bash
dotnet ef database update
```

### Generate SQL Script
```bash
dotnet ef migrations script
```

---

## Troubleshooting

### Database Connection Failed
- Verify SQL Server is running
- Check `appsettings.json` connection string
- Use SQL Server Management Studio to verify database exists

### Migrations Won't Apply
```bash
# Reset and start fresh
dotnet ef database drop
dotnet ef database update
```

### Entity Navigation Issues
- Ensure `.Include()` is used for related entities
- Check foreign key relationships in DbContext
- Verify lazy loading is properly configured

### Transaction Rollback Issues
- Ensure database supports transactions (SQL Server does)
- Verify transaction isolation level in appsettings
- Check for long-running transactions

---

## Summary

The repositories in ChineseSaleApi follow best practices:
- ? Single Responsibility Principle
- ? Dependency Injection
- ? Async/Await patterns
- ? Eager loading to prevent N+1 queries
- ? Transaction support for critical operations
- ? Comprehensive error handling
- ? Database constraint enforcement
- ? Clear interface contracts

Each repository focuses on its domain (Donors, Users, Gifts, Categories, Purchases) while maintaining clean dependencies through the DbContext.

---

**Last Updated:** December 2024  
**Maintainer:** YisNiz
