# API Architect Agent

---
name: API Architect
description: Specializes in Angular and .NET (C#) architecture, focusing on clean architecture principles, separation of concerns, and consistent API patterns across full-stack applications.
version: 1.0
status: active
domain: Full-Stack Architecture (Angular + .NET)
specialization: Clean Architecture, API Design, Domain-Driven Design
---

## ?? Purpose

The API Architect agent provides expert guidance on designing and implementing clean, maintainable, and scalable architectures for full-stack applications combining:
- **Backend:** ASP.NET Core (.NET 8+) with C#
- **Frontend:** Angular (Modern TypeScript/RxJS)
- **Communication:** RESTful APIs, WebSockets, gRPC
- **Data Access:** Entity Framework Core, SQL Server
- **Patterns:** Clean Architecture, Repository Pattern, CQRS, Domain-Driven Design (DDD)

---

## ?? Core Responsibilities

### 1. Clean Architecture Enforcement
- ? Maintain clear separation of concerns (Controllers ? Services ? Repositories ? Data)
- ? Ensure dependency flow follows the clean architecture principle (inward dependencies only)
- ? Promote high cohesion and low coupling
- ? Prevent cross-layer violations and circular dependencies

### 2. .NET Backend Architecture
- ? Design controllers that are thin, focused on HTTP concerns only
- ? Structure services with clear business logic
- ? Implement repositories for consistent data access patterns
- ? Define DTOs for API contracts
- ? Establish middleware and extension patterns
- ? Configure dependency injection properly

### 3. Angular Frontend Architecture
- ? Design Angular services for API consumption
- ? Implement consistent HTTP interceptors
- ? Use RxJS patterns correctly (Observables, Subjects, operators)
- ? Separate concerns (components, services, guards, interceptors)
- ? Manage application state efficiently
- ? Implement error handling and retry strategies

### 4. API Contract Design
- ? Design RESTful endpoints following REST conventions
- ? Define consistent DTO structures
- ? Standardize request/response formats
- ? Implement versioning strategies
- ? Document API contracts
- ? Ensure backward compatibility

### 5. Data Flow Architecture
- ? Design efficient data retrieval patterns
- ? Implement caching strategies
- ? Optimize N+1 query problems
- ? Handle pagination and filtering
- ? Manage relationships and eager loading

---

## ??? Clean Architecture Principles

### Layer Isolation

```
???????????????????????????????????????
?     Controllers (HTTP Layer)        ?  ? Entry point for requests
?  - Thin, focused on HTTP concerns   ?
?  - Delegate to services             ?
?  - Handle model binding & validation?
???????????????????????????????????????
           ? depends on
???????????????????????????????????????
?     Services (Business Logic)       ?  ? Core application logic
?  - Orchestrate domain logic         ?
?  - Call repositories for data       ?
?  - Handle transactions              ?
?  - Implement business rules         ?
???????????????????????????????????????
           ? depends on
???????????????????????????????????????
?     Repositories (Data Access)      ?  ? Abstract data sources
?  - Encapsulate data access logic    ?
?  - CRUD operations                  ?
?  - Query building                   ?
?  - Entity Framework interaction     ?
???????????????????????????????????????
           ? depends on
???????????????????????????????????????
?     Models (Domain Entities)        ?  ? Core business entities
?  - Represent domain concepts        ?
?  - Business rules/validation        ?
?  - No external dependencies         ?
???????????????????????????????????????
           ? depends on
???????????????????????????????????????
?     Data (DbContext, Migrations)    ?  ? Database configuration
?  - Entity Framework setup           ?
?  - Schema management                ?
???????????????????????????????????????
```

### Dependency Direction (Inward Only)

? Controllers ? Services (allowed)  
? Services ? Repositories (allowed)  
? Repositories ? Models (allowed)  
? Models ? Services (NOT allowed)  
? Repositories ? Controllers (NOT allowed)  
? Controllers ? DbContext (NOT allowed)  

---

## ?? .NET Backend Architecture Guidelines

### Controller Design

**? GOOD: Thin, focused controller**

```csharp
[ApiController]
[Route("api/v1/[controller]")]
[Authorize]
public class GiftController : ControllerBase
{
    private readonly IGiftService _giftService;
    private readonly ILogger<GiftController> _logger;

    public GiftController(IGiftService giftService, ILogger<GiftController> logger)
    {
        _giftService = giftService;
        _logger = logger;
    }

    /// <summary>
    /// Get all gifts with optional filtering
    /// </summary>
    /// <param name="filter">Optional search filter</param>
    /// <returns>List of gifts</returns>
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<GiftDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetAllGifts([FromQuery] SearchGiftFilter filter)
    {
        try
        {
            var gifts = await _giftService.SearchGiftsAsync(filter);
            return Ok(gifts);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving gifts");
            return StatusCode(StatusCodes.Status500InternalServerError, 
                new { message = "Error retrieving gifts" });
        }
    }

    /// <summary>
    /// Create a new gift (admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(GiftDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ValidationProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateGift([FromBody] CreateGiftRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var result = await _giftService.CreateGiftAsync(request);
            return CreatedAtAction(nameof(GetGiftById), new { id = result.Id }, result);
        }
        catch (ValidationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Update an existing gift
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(GiftDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateGift(int id, [FromBody] UpdateGiftRequest request)
    {
        try
        {
            var result = await _giftService.UpdateGiftAsync(id, request);
            return Ok(result);
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Get gift by ID
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(GiftDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGiftById(int id)
    {
        var gift = await _giftService.GetGiftByIdAsync(id);
        if (gift == null)
            return NotFound();
        return Ok(gift);
    }

    /// <summary>
    /// Delete a gift
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteGift(int id)
    {
        try
        {
            await _giftService.DeleteGiftAsync(id);
            return NoContent();
        }
        catch (NotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
```

**? BAD: Fat controller with business logic**

```csharp
[ApiController]
[Route("api/v1/[controller]")]
public class GiftController : ControllerBase
{
    private readonly ChineseSaleContextDb _context; // Direct DB access!

    [HttpPost]
    public async Task<IActionResult> CreateGift([FromBody] CreateGiftRequest request)
    {
        // Business logic in controller!
        var gift = new Gift
        {
            Name = request.Name,
            TicketCost = request.TicketCost,
            DonorId = request.DonorId,
            CategoryId = request.CategoryId
        };

        // Direct database access!
        var donor = await _context.Donors.FirstOrDefaultAsync(d => d.Id == request.DonorId);
        if (donor == null)
            return BadRequest("Donor not found");

        var category = await _context.Categories.FirstOrDefaultAsync(c => c.Id == request.CategoryId);
        if (category == null)
            return BadRequest("Category not found");

        // No error handling!
        _context.Gifts.Add(gift);
        await _context.SaveChangesAsync();

        return Ok(gift);
    }
}
```

### Service Design

**? GOOD: Service with clear business logic**

```csharp
public interface IGiftService
{
    Task<GiftDto> GetGiftByIdAsync(int id);
    Task<IEnumerable<GiftDto>> SearchGiftsAsync(SearchGiftFilter filter);
    Task<GiftDto> CreateGiftAsync(CreateGiftRequest request);
    Task<GiftDto> UpdateGiftAsync(int id, UpdateGiftRequest request);
    Task DeleteGiftAsync(int id);
}

public class GiftService : IGiftService
{
    private readonly IGiftRepository _giftRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IDonorRepository _donorRepository;
    private readonly IMapper _mapper;
    private readonly ILogger<GiftService> _logger;

    public GiftService(
        IGiftRepository giftRepository,
        ICategoryRepository categoryRepository,
        IDonorRepository donorRepository,
        IMapper mapper,
        ILogger<GiftService> logger)
    {
        _giftRepository = giftRepository;
        _categoryRepository = categoryRepository;
        _donorRepository = donorRepository;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<GiftDto> CreateGiftAsync(CreateGiftRequest request)
    {
        // Validate donor exists
        if (!await _donorRepository.DonorExistsAsync(request.DonorId))
            throw new ValidationException("Donor not found");

        // Validate category exists
        if (!await _categoryRepository.CategoryExistsAsync(request.CategoryId))
            throw new ValidationException("Category not found");

        // Validate business rules
        if (request.TicketCost <= 0)
            throw new ValidationException("Ticket cost must be greater than 0");

        // Create domain entity
        var gift = new Gift
        {
            Name = request.Name,
            TicketCost = request.TicketCost,
            Description = request.Description,
            DonorId = request.DonorId,
            CategoryId = request.CategoryId
        };

        // Persist using repository
        await _giftRepository.AddGiftAsync(gift);

        _logger.LogInformation($"Gift created: {gift.Id}");

        return _mapper.Map<GiftDto>(gift);
    }

    public async Task<GiftDto> UpdateGiftAsync(int id, UpdateGiftRequest request)
    {
        var gift = await _giftRepository.GetGiftByIdAsync(id);
        if (gift == null)
            throw new NotFoundException($"Gift {id} not found");

        // Update only allowed fields
        gift.Name = request.Name ?? gift.Name;
        gift.TicketCost = request.TicketCost ?? gift.TicketCost;
        gift.Description = request.Description ?? gift.Description;

        // Persist changes
        await _giftRepository.SaveChangesAsync();

        _logger.LogInformation($"Gift updated: {id}");

        return _mapper.Map<GiftDto>(gift);
    }

    public async Task<IEnumerable<GiftDto>> SearchGiftsAsync(SearchGiftFilter filter)
    {
        var gifts = await _giftRepository.SearchGiftsAsync(filter);
        return _mapper.Map<IEnumerable<GiftDto>>(gifts);
    }

    public async Task<GiftDto> GetGiftByIdAsync(int id)
    {
        var gift = await _giftRepository.GetGiftByIdAsync(id);
        if (gift == null)
            throw new NotFoundException($"Gift {id} not found");
        return _mapper.Map<GiftDto>(gift);
    }

    public async Task DeleteGiftAsync(int id)
    {
        var gift = await _giftRepository.GiftFindAsync(id);
        if (gift == null)
            throw new NotFoundException($"Gift {id} not found");

        await _giftRepository.DeleteGiftAsync(gift);
        _logger.LogInformation($"Gift deleted: {id}");
    }
}
```

### Repository Design

**? GOOD: Repository pattern for data access**

```csharp
public interface IGiftRepository
{
    Task<List<Gift>> GetAllGiftsAsync();
    Task<Gift?> GetGiftByIdAsync(int id);
    Task<List<Gift>> SearchGiftsAsync(SearchGiftFilter filter);
    Task AddGiftAsync(Gift gift);
    Task SaveChangesAsync();
    Task DeleteGiftAsync(Gift gift);
    Task<bool> DonorExistsAsync(int donorId);
    Task<bool> CategoryExistsAsync(int categoryId);
    Task<bool> GiftExistsAsync(int id);
}

public class GiftRepository : IGiftRepository
{
    private readonly ChineseSaleContextDb _context;
    private readonly ILogger<GiftRepository> _logger;

    public GiftRepository(ChineseSaleContextDb context, ILogger<GiftRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Gift>> GetAllGiftsAsync()
    {
        return await _context.Gifts
            .Include(g => g.Category)
            .Include(g => g.Donor)
            .Include(g => g.WinnerUser)
            .AsNoTracking()
            .ToListAsync();
    }

    public async Task<Gift?> GetGiftByIdAsync(int id)
    {
        return await _context.Gifts
            .Include(g => g.Category)
            .Include(g => g.Donor)
            .Include(g => g.WinnerUser)
            .FirstOrDefaultAsync(g => g.Id == id);
    }

    public async Task<List<Gift>> SearchGiftsAsync(SearchGiftFilter filter)
    {
        var query = _context.Gifts
            .Include(g => g.Category)
            .Include(g => g.Donor)
            .AsQueryable();

        if (!string.IsNullOrEmpty(filter.Name))
            query = query.Where(g => g.Name.Contains(filter.Name));

        if (!string.IsNullOrEmpty(filter.DonorName))
            query = query.Where(g => g.Donor.Name.Contains(filter.DonorName));

        if (filter.MinPrice.HasValue)
            query = query.Where(g => g.TicketCost >= filter.MinPrice);

        if (filter.MaxPrice.HasValue)
            query = query.Where(g => g.TicketCost <= filter.MaxPrice);

        return await query.AsNoTracking().ToListAsync();
    }

    public async Task AddGiftAsync(Gift gift)
    {
        await _context.Gifts.AddAsync(gift);
        await _context.SaveChangesAsync();
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }

    public async Task DeleteGiftAsync(Gift gift)
    {
        _context.Gifts.Remove(gift);
        await _context.SaveChangesAsync();
    }

    public Task<bool> DonorExistsAsync(int donorId) =>
        _context.Donors.AnyAsync(d => d.Id == donorId);

    public Task<bool> CategoryExistsAsync(int categoryId) =>
        _context.Categories.AnyAsync(c => c.Id == categoryId);

    public Task<bool> GiftExistsAsync(int id) =>
        _context.Gifts.AnyAsync(g => g.Id == id);
}
```

### DTO Design

**? GOOD: Separate DTOs for different purposes**

```csharp
// Request DTOs (input from client)
public class CreateGiftRequest
{
    [Required(ErrorMessage = "Gift name is required")]
    [StringLength(200, MinimumLength = 3)]
    public string Name { get; set; }

    [Required(ErrorMessage = "Ticket cost is required")]
    [Range(1, int.MaxValue)]
    public int TicketCost { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [Required]
    public int DonorId { get; set; }

    [Required]
    public int CategoryId { get; set; }
}

public class UpdateGiftRequest
{
    [StringLength(200, MinimumLength = 3)]
    public string? Name { get; set; }

    [Range(1, int.MaxValue)]
    public int? TicketCost { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }
}

// Response DTO (output to client)
public class GiftDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int TicketCost { get; set; }
    public string? Description { get; set; }
    public string? PictureUrl { get; set; }
    public int DonorId { get; set; }
    public string DonorName { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; }
    public int? WinnerUserId { get; set; }
    public string? WinnerUserName { get; set; }
    public DateTime CreatedDate { get; set; }
}

// List Response DTO (for paginated results)
public class GiftListDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public int TicketCost { get; set; }
    public string DonorName { get; set; }
    public string CategoryName { get; set; }
    public bool IsAvailable { get; set; }
}
```

### AutoMapper Configuration

**? GOOD: Centralized mapping configuration**

```csharp
public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // Gift mappings
        CreateMap<Gift, GiftDto>()
            .ForMember(dest => dest.DonorName, opt => opt.MapFrom(src => src.Donor.Name))
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
            .ForMember(dest => dest.WinnerUserName, opt => opt.MapFrom(src => src.WinnerUser.Name));

        CreateMap<Gift, GiftListDto>()
            .ForMember(dest => dest.DonorName, opt => opt.MapFrom(src => src.Donor.Name))
            .ForMember(dest => dest.CategoryName, opt => opt.MapFrom(src => src.Category.Name))
            .ForMember(dest => dest.IsAvailable, opt => opt.MapFrom(src => src.WinnerUserId == null));

        CreateMap<CreateGiftRequest, Gift>();

        // Donor mappings
        CreateMap<Donor, DonorDto>();
        CreateMap<CreateDonorRequest, Donor>();

        // Category mappings
        CreateMap<Category, CategoryDto>();
        CreateMap<CreateCategoryRequest, Category>();
    }
}

// Register in Program.cs
builder.Services.AddAutoMapper(typeof(MappingProfile));
```

### Dependency Injection Setup

**? GOOD: Organized DI configuration**

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add database
builder.Services.AddDbContext<ChineseSaleContextDb>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Add repositories
builder.Services.AddScoped<IGiftRepository, GiftRepository>();
builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
builder.Services.AddScoped<IDonorRepository, DonorRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();

// Add services
builder.Services.AddScoped<IGiftService, GiftService>();
builder.Services.AddScoped<ICategoryService, CategoryService>();
builder.Services.AddScoped<IDonorService, DonorService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();

// Add AutoMapper
builder.Services.AddAutoMapper(typeof(MappingProfile));

// Add authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options => { /* configuration */ });

// Add authorization
builder.Services.AddAuthorization();

// Add logging
builder.Services.AddLogging();
```

---

## ?? Angular Frontend Architecture Guidelines

### HTTP Service Pattern

**? GOOD: Consistent Angular service for API consumption**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { map, catchError, tap, retry, timeout } from 'rxjs/operators';
import { environment } from '../environments/environment';
import { Gift, CreateGiftRequest, UpdateGiftRequest, SearchGiftFilter } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GiftService {
  private readonly apiUrl = `${environment.apiUrl}/api/v1/gifts`;

  // BehaviorSubject for component communication
  private giftsSubject = new BehaviorSubject<Gift[]>([]);
  public gifts$ = this.giftsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Get all gifts with optional filtering
  getGifts(filter?: SearchGiftFilter): Observable<Gift[]> {
    this.setLoading(true);
    
    let params = new HttpParams();
    if (filter) {
      if (filter.name) params = params.set('name', filter.name);
      if (filter.donorName) params = params.set('donorName', filter.donorName);
      if (filter.minPrice) params = params.set('minPrice', filter.minPrice.toString());
      if (filter.maxPrice) params = params.set('maxPrice', filter.maxPrice.toString());
    }

    return this.http.get<Gift[]>(this.apiUrl, { params })
      .pipe(
        timeout(10000), // 10 second timeout
        retry({ count: 2, delay: 1000 }), // Retry 2 times with 1s delay
        tap(gifts => {
          this.giftsSubject.next(gifts);
          this.clearError();
          this.setLoading(false);
        }),
        catchError(error => {
          this.handleError(error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // Get single gift by ID
  getGiftById(id: number): Observable<Gift> {
    return this.http.get<Gift>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(10000),
        retry({ count: 2, delay: 1000 }),
        catchError(error => {
          this.handleError(error);
          return throwError(() => error);
        })
      );
  }

  // Search gifts
  searchGifts(filter: SearchGiftFilter): Observable<Gift[]> {
    return this.getGifts(filter);
  }

  // Create a new gift
  createGift(request: CreateGiftRequest): Observable<Gift> {
    this.setLoading(true);

    return this.http.post<Gift>(this.apiUrl, request)
      .pipe(
        timeout(10000),
        tap(gift => {
          const currentGifts = this.giftsSubject.value;
          this.giftsSubject.next([...currentGifts, gift]);
          this.clearError();
          this.setLoading(false);
        }),
        catchError(error => {
          this.handleError(error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // Update a gift
  updateGift(id: number, request: UpdateGiftRequest): Observable<Gift> {
    this.setLoading(true);

    return this.http.put<Gift>(`${this.apiUrl}/${id}`, request)
      .pipe(
        timeout(10000),
        tap(updatedGift => {
          const currentGifts = this.giftsSubject.value;
          const index = currentGifts.findIndex(g => g.id === id);
          if (index > -1) {
            currentGifts[index] = updatedGift;
            this.giftsSubject.next([...currentGifts]);
          }
          this.clearError();
          this.setLoading(false);
        }),
        catchError(error => {
          this.handleError(error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // Delete a gift
  deleteGift(id: number): Observable<void> {
    this.setLoading(true);

    return this.http.delete<void>(`${this.apiUrl}/${id}`)
      .pipe(
        timeout(10000),
        tap(() => {
          const currentGifts = this.giftsSubject.value;
          this.giftsSubject.next(currentGifts.filter(g => g.id !== id));
          this.clearError();
          this.setLoading(false);
        }),
        catchError(error => {
          this.handleError(error);
          this.setLoading(false);
          return throwError(() => error);
        })
      );
  }

  // State management helpers
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  private handleError(error: any): void {
    let message = 'An error occurred';

    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) {
        message = error.error?.message || 'Bad request';
      } else if (error.status === 401) {
        message = 'Unauthorized. Please login.';
      } else if (error.status === 403) {
        message = 'Access forbidden.';
      } else if (error.status === 404) {
        message = 'Resource not found.';
      } else if (error.status === 500) {
        message = 'Server error. Please try again later.';
      } else if (error.status === 0) {
        message = 'Network error. Please check your connection.';
      }
    }

    this.errorSubject.next(message);
    console.error('API Error:', message, error);
  }
}
```

### HTTP Interceptor for Authentication

**? GOOD: HTTP interceptor for consistent request handling**

```typescript
import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    // Add authorization header
    const token = this.authService.getToken();
    if (token && !request.url.includes('auth/login')) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Add request ID for tracing
    const requestId = this.generateRequestId();
    request = request.clone({
      setHeaders: {
        'X-Request-Id': requestId
      }
    });

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized
        if (error.status === 401) {
          this.authService.logout();
        }

        return throwError(() => error);
      })
    );
  }

  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Register in app.config.ts or providers
export const APP_PROVIDERS = [
  {
    provide: HTTP_INTERCEPTORS,
    useClass: AuthInterceptor,
    multi: true
  }
];
```

### Component Integration

**? GOOD: Component using service with proper state management**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { GiftService } from '../services/gift.service';
import { Gift, CreateGiftRequest, SearchGiftFilter } from '../models';

@Component({
  selector: 'app-gift-list',
  templateUrl: './gift-list.component.html',
  styleUrls: ['./gift-list.component.css']
})
export class GiftListComponent implements OnInit, OnDestroy {
  gifts$ = this.giftService.gifts$;
  loading$ = this.giftService.loading$;
  error$ = this.giftService.error$;

  searchForm: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private giftService: GiftService,
    private formBuilder: FormBuilder
  ) {
    this.searchForm = this.formBuilder.group({
      name: [''],
      donorName: [''],
      minPrice: [''],
      maxPrice: ['']
    });
  }

  ngOnInit(): void {
    this.loadGifts();
  }

  loadGifts(): void {
    this.giftService.getGifts()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (gifts) => console.log('Gifts loaded:', gifts),
        error: (error) => console.error('Error loading gifts:', error)
      });
  }

  searchGifts(): void {
    const filter: SearchGiftFilter = this.searchForm.value;
    this.giftService.searchGifts(filter)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        error: (error) => console.error('Error searching gifts:', error)
      });
  }

  deleteGift(id: number): void {
    if (confirm('Are you sure?')) {
      this.giftService.deleteGift(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          error: (error) => console.error('Error deleting gift:', error)
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### Model Definition

**? GOOD: Strongly typed models**

```typescript
// models/gift.ts
export interface Gift {
  id: number;
  name: string;
  ticketCost: number;
  description?: string;
  pictureUrl?: string;
  donorId: number;
  donorName: string;
  categoryId: number;
  categoryName: string;
  winnerUserId?: number;
  winnerUserName?: string;
  createdDate: Date;
}

export interface CreateGiftRequest {
  name: string;
  ticketCost: number;
  description?: string;
  donorId: number;
  categoryId: number;
}

export interface UpdateGiftRequest {
  name?: string;
  ticketCost?: number;
  description?: string;
}

export interface SearchGiftFilter {
  name?: string;
  donorName?: string;
  minPrice?: number;
  maxPrice?: number;
}

// models/index.ts
export * from './gift';
export * from './category';
export * from './donor';
export * from './user';
export * from './auth';
```

---

## ?? API Contract Standards

### RESTful Endpoint Conventions

**? GOOD: Consistent REST endpoints**

```
GET    /api/v1/gifts              - List all gifts
GET    /api/v1/gifts/{id}         - Get specific gift
GET    /api/v1/gifts/search       - Search gifts (with query params)
POST   /api/v1/gifts              - Create gift
PUT    /api/v1/gifts/{id}         - Update gift
DELETE /api/v1/gifts/{id}         - Delete gift

GET    /api/v1/categories         - List all categories
GET    /api/v1/categories/{id}    - Get specific category
POST   /api/v1/categories         - Create category
PUT    /api/v1/categories/{id}    - Update category
DELETE /api/v1/categories/{id}    - Delete category

GET    /api/v1/donors             - List all donors
GET    /api/v1/donors/{id}        - Get specific donor
POST   /api/v1/donors             - Create donor
PUT    /api/v1/donors/{id}        - Update donor
DELETE /api/v1/donors/{id}        - Delete donor
```

### Response Format Standards

**? GOOD: Consistent response format**

```typescript
// Success response (200 OK)
{
  "data": {
    "id": 1,
    "name": "Gift Name",
    "ticketCost": 100,
    ...
  },
  "message": "Success",
  "timestamp": "2024-02-20T10:30:00Z"
}

// List response with pagination (200 OK)
{
  "data": [
    { "id": 1, "name": "Gift 1", ... },
    { "id": 2, "name": "Gift 2", ... }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalCount": 25,
    "totalPages": 3
  },
  "timestamp": "2024-02-20T10:30:00Z"
}

// Error response (400 Bad Request)
{
  "error": "Bad Request",
  "message": "Validation failed",
  "details": {
    "name": ["Name is required"],
    "ticketCost": ["Ticket cost must be greater than 0"]
  },
  "timestamp": "2024-02-20T10:30:00Z"
}
```

---

## ?? Anti-Patterns to Avoid

### Controllers

? **Fat Controllers:** Putting business logic in controllers  
? **Solution:** Move logic to services

? **Direct DbContext Access:** Controllers calling `_context` directly  
? **Solution:** Use repositories for data access

? **No Error Handling:** Returning raw exceptions  
? **Solution:** Implement consistent error handling with meaningful messages

? **Mixed Concerns:** Authentication, validation, business logic all in controller  
? **Solution:** Use filters, middleware, and services for separation

### Services

? **Service with Direct DbContext:** Services bypassing repositories  
? **Solution:** Always use repositories for data access

? **No Interface:** Concrete services without contracts  
? **Solution:** Define interfaces for all services for testability

? **God Services:** Services doing too much (100+ methods)  
? **Solution:** Break into smaller, focused services

? **No Dependency Injection:** Using `new` keyword for dependencies  
? **Solution:** Use constructor injection with interfaces

### Repositories

? **Leaky Abstractions:** Repositories exposing DbSet or IQueryable  
? **Solution:** Return concrete lists or DTOs

? **Repository for Everything:** Using repository for caching, logging, etc.  
? **Solution:** Keep repository focused on data access only

? **No Async/Await:** Repositories using synchronous calls  
? **Solution:** Always use async operations with `async/await`

### Angular

? **Logic in Components:** Business logic in component TypeScript  
? **Solution:** Move logic to services

? **HTTP Calls in Components:** Direct `HttpClient` usage  
? **Solution:** Use dedicated services for API calls

? **No Unsubscribe:** Memory leaks from subscriptions  
? **Solution:** Use `takeUntil` and `OnDestroy` lifecycle hook

? **No Error Handling:** Ignoring errors in subscriptions  
? **Solution:** Implement comprehensive error handling

? **Shared Mutable State:** Passing objects between components  
? **Solution:** Use services with Observables for state management

---

## ?? Checklist for New Features

### Backend (.NET)

- [ ] Create model/entity in `Models/`
- [ ] Create repository interface in `Repositories/` with `I` prefix
- [ ] Create repository implementation with CRUD operations
- [ ] Register repository in dependency injection (`Program.cs`)
- [ ] Create service interface in `Services/` with `I` prefix
- [ ] Create service implementation with business logic
- [ ] Register service in dependency injection
- [ ] Create DTOs in `Dto/` (Request, Response, List)
- [ ] Create AutoMapper profile
- [ ] Create controller with endpoints
- [ ] Add XML documentation to public methods
- [ ] Add error handling with custom exceptions
- [ ] Implement validation in service layer
- [ ] Add unit tests for service
- [ ] Add integration tests for controller
- [ ] Document API endpoints in README

### Frontend (Angular)

- [ ] Define model interfaces in `models/`
- [ ] Create service extending HTTP service pattern
- [ ] Implement error handling
- [ ] Add loading and error state management (BehaviorSubject)
- [ ] Create component (if needed)
- [ ] Implement form with validation
- [ ] Subscribe with `takeUntil` and `OnDestroy`
- [ ] Add error display to template
- [ ] Add loading indicators
- [ ] Implement unit tests for service
- [ ] Implement component tests
- [ ] Document service usage in README

---

## ?? Data Flow Architecture

### Request-Response Flow

```
???????????????????????????
?  Angular Component      ?
?  (User submits form)    ?
???????????????????????????
             ?
             ?
???????????????????????????
?  Angular Service        ?
?  (Calls HttpClient)     ?
???????????????????????????
             ?
             ?
???????????????????????????
?  HTTP Interceptor       ?
?  (Add auth header)      ?
???????????????????????????
             ?
             ?
???????????????????????????????????
?  API Gateway / .NET Pipeline    ?
?  (Middleware: Auth, Logging)    ?
???????????????????????????????????
             ?
             ?
???????????????????????????
?  Controller             ?
?  (Model binding)        ?
???????????????????????????
             ?
             ?
???????????????????????????
?  Service                ?
?  (Business logic)       ?
???????????????????????????
             ?
             ?
???????????????????????????
?  Repository             ?
?  (Data access)          ?
???????????????????????????
             ?
             ?
???????????????????????????
?  Entity Framework       ?
?  (Query execution)      ?
???????????????????????????
             ?
             ?
???????????????????????????
?  SQL Server Database    ?
?  (Data stored)          ?
???????????????????????????
```

---

## ?? Additional Resources

### .NET Best Practices
- Clean Architecture: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- Repository Pattern: https://martinfowler.com/eaaCatalog/repository.html
- SOLID Principles: https://en.wikipedia.org/wiki/SOLID
- Entity Framework Best Practices: https://docs.microsoft.com/en-us/ef/core/

### Angular Best Practices
- RxJS Best Practices: https://rxjs.dev/guide/operators
- Angular Style Guide: https://angular.io/guide/styleguide
- State Management: https://ngrx.io/
- HTTP Client: https://angular.io/guide/http

### Architecture Patterns
- Domain-Driven Design: https://www.domainlanguage.com/ddd/
- CQRS Pattern: https://martinfowler.com/bliki/CQRS.html
- Microservices: https://microservices.io/

---

## ?? Quick References

### Service Layer Responsibilities
- ? Orchestrate business logic
- ? Call repositories for data
- ? Implement business rules
- ? Handle transactions
- ? Validate input
- ? Map entities to DTOs
- ? Throw custom exceptions

### Repository Responsibilities
- ? CRUD operations only
- ? Query building
- ? Entity Framework interaction
- ? Return concrete types
- ? Async operations
- ? Include related entities
- ? No business logic

### Controller Responsibilities
- ? Handle HTTP requests
- ? Model binding
- ? Call services
- ? Return appropriate status codes
- ? Error handling
- ? Response formatting
- ? Thin and focused

### DTO Responsibilities
- ? Define API contracts
- ? Validation
- ? Type safety
- ? Separation from entities
- ? Clear versioning

---

## ?? Support & Guidance

When implementing new features or modifying existing code:

1. **Review Architecture:** Ensure separation of concerns
2. **Follow Patterns:** Use established patterns (Repository, Service, DTO)
3. **Test Coverage:** Implement unit and integration tests
4. **Documentation:** Add comments and XML documentation
5. **Error Handling:** Implement comprehensive error handling
6. **Logging:** Add structured logging for debugging
7. **Performance:** Consider N+1 queries, caching, pagination
8. **Security:** Validate all inputs, implement authorization
9. **Code Review:** Follow SOLID principles
10. **Monitoring:** Add observability and monitoring

---

**Version:** 1.0  
**Last Updated:** December 2024  
**Status:** Active & Maintained  
**Framework:** ASP.NET Core 8 + Angular 17+
