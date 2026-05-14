# ChineseSaleApi - Project Instructions

## Project Overview

**Project Name:** ChineseSaleApi  
**Description:** A comprehensive .NET 8 REST API for managing donations, gifts, categories, users, and purchases in a Chinese charitable sales system. The API provides secure JWT-based authentication and authorization, with structured endpoints for managing donors, gift inventory, purchase orders, and user management.

**Repository:** [.NetApi-Angular-pro](https://github.com/YisNiz/.NetApi-Angular-pro)

---

## Architecture Overview

### Architecture Pattern
The project follows a **layered architecture** with clear separation of concerns:

```
Controllers ? Services ? Repositories ? Data (DbContext)
                ?
         DTOs (Data Transfer Objects)
```

### Core Components

1. **Controllers** - Handle HTTP requests and responses
   - `AuthController` - Authentication and login
   - `UserController` - User management
   - `DonorController` - Donor management
   - `GiftController` - Gift catalog management
   - `CategoryController` - Category management
   - `PurchaseController` - Purchase orders

2. **Services** - Business logic layer
   - `TokenService` - JWT token generation and management
   - `UserService` - User operations
   - `DonorService` - Donor operations
   - `GiftService` - Gift operations
   - `CategoryService` - Category operations
   - `PurchaseService` - Purchase order operations

3. **Repositories** - Data access layer
   - Implements the Repository pattern for database operations
   - Provides abstraction over Entity Framework Core

4. **Models** - Domain entities
   - `User` - System users
   - `Donor` - Donors
   - `Gift` - Gift items
   - `Category` - Gift categories
   - `Order` - Purchase orders
   - `OrderItem` - Items in orders
   - `Ticket` - Support tickets

5. **DTOs** - Data Transfer Objects for API contracts
   - `UserDto`, `DonorDto`, `GiftDto`, `CategoryDto`, `PurchaseDto`, `OrderItemDto`

6. **Data** - Database context
   - `ChineseSaleContextDb` - Entity Framework Core DbContext

### Middleware
- **RequestLogging** - Custom middleware for request logging
- **RateLimiting** - Custom middleware for rate limiting

---

## Technologies Used

### Framework & Platform
- **.NET 8** - Latest LTS .NET framework
- **ASP.NET Core** - Web API framework
- **C# 12** - Programming language

### Database & ORM
- **SQL Server** - Relational database
- **Entity Framework Core 9.0.11** - ORM for database operations

### Authentication & Security
- **JWT (JSON Web Tokens)** - Authentication mechanism
- **Microsoft.AspNetCore.Authentication.JwtBearer** - JWT bearer token handling

### API Documentation
- **Swagger/Swashbuckle** - API documentation and testing interface

### Logging
- **Serilog** - Structured logging framework
- **Serilog.AspNetCore** - Serilog integration with ASP.NET Core
- **Serilog.Sinks.Console** - Console output
- **Serilog.Sinks.File** - File logging with rolling intervals

### Testing
- **xUnit** - Unit testing framework
- **Moq** - Mocking framework for unit tests

### Dependencies
- **Microsoft.EntityFrameworkCore.Design** - EF Core design-time tools
- **Microsoft.EntityFrameworkCore.Tools** - Command-line tools
- **Microsoft.EntityFrameworkCore.SqlServer** - SQL Server provider
- **Microsoft.NET.Test.Sdk** - Test SDK

### CORS
- ASP.NET Core built-in CORS middleware configured for frontend at `http://localhost:4200`

---

## How to Run the Project Locally

### Prerequisites
- **.NET 8 SDK** - [Download here](https://dotnet.microsoft.com/download/dotnet/8.0)
- **SQL Server** - Local or network instance (LocalDB, SQL Server Express, or full version)
- **Visual Studio 2022** or **Visual Studio Code** (optional, but recommended)
- **Git** - For cloning the repository

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/YisNiz/.NetApi-Angular-pro.git
   cd server
   ```

2. **Navigate to the project directory**
   ```bash
   cd ChineseSaleApi
   ```

3. **Restore NuGet packages**
   ```bash
   dotnet restore
   ```

4. **Configure the database connection**
   - Open `appsettings.json`
   - Update the `ConnectionStrings` section with your SQL Server instance details:
     ```json
     "ConnectionStrings": {
       "DefaultConnection": "Server=YOUR_SERVER;DataBase=216259986ChineseSale;Integrated Security=SSPI;Persist Security Info=False;TrustServerCertificate=True;",
       "AnotherConnection": "Server=YOUR_SERVER;DataBase=216259986ChineseSale;Integrated Security=SSPI;Persist Security Info=False;TrustServerCertificate=True;"
     }
     ```
   - Replace `YOUR_SERVER` with your actual SQL Server instance name (e.g., `localhost`, `.\SQLEXPRESS`, or `Srv2\pupils`)

5. **Apply Entity Framework migrations**
   ```bash
   dotnet ef database update
   ```
   - If no migrations exist, you may need to create them first:
     ```bash
     dotnet ef migrations add InitialCreate
     dotnet ef database update
     ```

6. **Run the application**
   ```bash
   dotnet run
   ```
   - The API will start on `https://localhost:5001` (or the configured URL in `launchSettings.json`)

7. **Access Swagger UI**
   - In development environment, navigate to: `https://localhost:5001/swagger/index.html`
   - This provides an interactive API documentation and testing interface

---

## Setup & Environment Steps

### Environment Variables
The application respects the `ASPNETCORE_ENVIRONMENT` variable:
- **Development** - Full Swagger UI, detailed error pages
- **Production** - No Swagger UI, minimal error details, HTTPS required

Set environment variable:
```bash
# Windows
set ASPNETCORE_ENVIRONMENT=Development

# Linux/macOS
export ASPNETCORE_ENVIRONMENT=Development
```

### Configuration Files

**appsettings.json** - Base configuration with:
- Serilog logging configuration
- SQL Server connection strings
- JWT settings (SecretKey, Issuer, Audience, ExpiryMinutes)
- Allowed hosts

**appsettings.{Environment}.json** - Environment-specific overrides (auto-loaded based on environment)

### JWT Configuration
JWT settings in `appsettings.json`:
```json
"JwtSettings": {
  "SecretKey": "6bbd0a99-a4e7-4fbb-8c0e-2b1c9465b5c1",
  "Issuer": "ChineseSaleApi",
  "Audience": "ChineseSaleApiClients",
  "ExpiryMinutes": 60
}
```
- **SecretKey** - Change this to a strong, random key in production
- **ExpiryMinutes** - Token expiration time (default: 60 minutes)

### CORS Configuration
Currently configured to accept requests from:
- `http://localhost:4200` - Default Angular development server

Update in `Program.cs` if your frontend runs on a different port:
```csharp
var allowedOrigins = new[] { "http://localhost:4200" };
```

---

## Database Setup

### Database Details
- **Name:** `216259986ChineseSale`
- **Type:** SQL Server
- **ORM:** Entity Framework Core 9.0.11

### Database Entities

The database includes the following main tables:

| Entity | Purpose |
|--------|---------|
| **Users** | System user accounts with authentication |
| **Donors** | Donation sources (email must be unique) |
| **Categories** | Gift categories for organization |
| **Gifts** | Gift items in the inventory |
| **Orders** | Purchase/donation orders |
| **OrderItems** | Individual items within orders |
| **Tickets** | Support/issue tickets |

### Key Constraints
- `Donor.Email` - Unique constraint
- `User.UserName` - Unique constraint

### Migrations
Entity Framework Core migrations are managed through:
```bash
# Create a new migration
dotnet ef migrations add MigrationName

# Update database with pending migrations
dotnet ef database update

# Remove last migration (if not applied to DB)
dotnet ef migrations remove

# List all migrations
dotnet ef migrations list
```

---

## External Services & Dependencies

### JWT Authentication
- Tokens are generated by `TokenService`
- All protected endpoints require a valid JWT Bearer token in the Authorization header
- Token format: `Authorization: Bearer {token}`

### Logging
- **Log Location:** `Logs/log-{date}.txt` (daily rolling files, max 30 files retained)
- **Log Levels:** Configurable per component in `appsettings.json`
- **Context:** Includes machine name and thread ID

### Rate Limiting
- Custom rate limiting middleware is applied via `app.UseRateLimiting()`
- Configuration details should be reviewed in the middleware implementation

### CORS
- Configured for cross-origin requests from Angular frontend
- Methods allowed: All (`AllowAnyMethod`)
- Headers allowed: All (`AllowAnyHeader`)

---

## Development Notes

### Project Structure
```
ChineseSaleApi/
??? Controllers/        # API endpoints
??? Services/          # Business logic
??? Repositories/      # Data access
??? Models/            # Domain entities
??? Dto/               # Data transfer objects
??? Data/              # DbContext
??? Middleware/        # Custom middleware
??? Documentation/     # Project documentation
??? appsettings.json   # Configuration
??? Program.cs         # Application startup
```

### Running Tests
```bash
dotnet test
```

### Building for Production
```bash
dotnet publish -c Release -o ./publish
```

### Debugging
In Visual Studio:
1. Set breakpoints in code
2. Press `F5` or use Debug ? Start Debugging
3. Swagger UI can be used to test endpoints during debugging

In VS Code:
1. Install C# extension
2. Press `F5` to start debugging
3. Configuration in `.vscode/launch.json`

---

## Common Issues & Troubleshooting

### Database Connection Failed
- Verify SQL Server is running
- Check connection string in `appsettings.json`
- Ensure database name exists or EF migrations will create it
- Check Windows Authentication is enabled for SQL Server

### JWT Token Errors
- Verify `JwtSettings` in `appsettings.json` is configured
- Check token hasn't expired (default: 60 minutes)
- Ensure token is passed correctly: `Authorization: Bearer {token}`

### CORS Errors
- Verify frontend is running on `http://localhost:4200`
- Update `allowedOrigins` in `Program.cs` if using different port
- Clear browser cache if CORS headers were cached

### Port Already in Use
- Find and terminate process using the port
- Or change the port in `launchSettings.json`

---

## Additional Resources

- [Microsoft .NET 8 Documentation](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-8)
- [ASP.NET Core Documentation](https://learn.microsoft.com/en-us/aspnet/core/)
- [Entity Framework Core](https://learn.microsoft.com/en-us/ef/core/)
- [JWT.io](https://jwt.io/) - JWT token information
- [Swagger/OpenAPI](https://swagger.io/)
- [Serilog Documentation](https://serilog.net/)

---

**Last Updated:** December 2024  
**Maintainer:** YisNiz
