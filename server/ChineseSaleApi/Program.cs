using ChineseSaleApi.Data;
using ChineseSaleApi.Middleware;
using ChineseSaleApi.Repositories;
using ChineseSaleApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Security.Claims;
using System.Text;
using StackExchange.Redis;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.RateLimiting;
using Swashbuckle.AspNetCore.SwaggerGen;
// Configure Serilog

Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production"}.json", optional: true)
        .Build())
    .Enrich.FromLogContext()
    //.WriteTo.Console()
    //.WriteTo.File("Logs/log-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting Store API application");

    var builder = WebApplication.CreateBuilder(args);

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();


    builder.Services.AddSwaggerGen(options =>
    {
        options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = Microsoft.OpenApi.Models.ParameterLocation.Header,
            Description = "נא להזין את הטוקן בלבד (ללא המילה Bearer)"

        });

        options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference = new Microsoft.OpenApi.Models.OpenApiReference
                    {
                        Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] {}
            }
        });
        options.OperationFilter<SwaggerCookieIdempotency>();
    });
    //הקודם. עובד פצצה
    // builder.Services.AddSwaggerGen(c =>
    // {
    //     c.SwaggerDoc("v1", new OpenApiInfo
    //     {
    //         Title = "ChineseSaleApi",
    //         Version = "v1"
    //     });

    //     c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    //     {
    //         Name = "Authorization",
    //         Type = SecuritySchemeType.Http,
    //         Scheme = "bearer",
    //         BearerFormat = "JWT",
    //         In = ParameterLocation.Header,
    //         Description = " Bearer {token}"
    //     });

    //     c.AddSecurityRequirement(new OpenApiSecurityRequirement
    //     {
    //         {
    //             new OpenApiSecurityScheme
    //             {
    //                 Reference = new OpenApiReference
    //                 {
    //                     Type = ReferenceType.SecurityScheme,
    //                     Id = "Bearer"
    //                 }
    //             },
    //             Array.Empty<string>()
    //         }
    //     });
    // });

    builder.Services.AddDbContext<ChineseSaleContextDb>(options =>
        options.UseSqlServer(builder.Configuration.GetConnectionString("AnotherConnection")));

    builder.Services.AddScoped<IDonorRepository, DonorRepository>();
    builder.Services.AddScoped<IDonorService, DonorService>();
    builder.Services.AddScoped<IGiftRepository, GiftRepository>();
    builder.Services.AddScoped<IGiftService, GiftService>();
    builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();
    builder.Services.AddScoped<IPurchaseService, PurchaseService>();
    builder.Services.AddScoped<ICategoryRepository, CategoryRepository>();
    builder.Services.AddScoped<ICategoryService, CategoryService>();
    builder.Services.AddScoped<IUserRepository, UserRepository>();
    builder.Services.AddScoped<IUserService, UserService>();
    builder.Services.AddScoped<ITokenService, TokenService>();
    builder.Services.AddSingleton<IConnectionMultiplexer>(sp => 
    ConnectionMultiplexer.Connect(builder.Configuration.GetConnectionString("Redis")));


    // Configure JWT Authentication
    var jwtSettings = builder.Configuration.GetSection("JwtSettings");
    var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JWT SecretKey is not configured");

    builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings["Issuer"],
            ValidAudience = jwtSettings["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ClockSkew = TimeSpan.Zero,

            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };

        //    options.Events = new JwtBearerEvents
        //    {
        //        OnChallenge = context =>
        //        {
        //            context.HandleResponse();
        //            context.Response.StatusCode = StatusCodes.Status401Unauthorized;

        //            return context.Response.WriteAsJsonAsync(new
        //            {
        //                message = "you dont have token or your token is expired" +
        //                "please login again"
        //            });
        //        },

        //        OnForbidden = context =>
        //        {
        //            context.Response.StatusCode = StatusCodes.Status403Forbidden;

        //            return context.Response.WriteAsJsonAsync(new
        //            {
        //                message = "forbbiden! you dont have an accses to do this action"
        //            });
        //        },

        //        OnAuthenticationFailed = context =>
        //        {
        //            return Task.CompletedTask;
        //        },

        //        OnTokenValidated = context =>
        //        {
        //            var userId = context.Principal?
        //                .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

        //            return Task.CompletedTask;
        //        }
        //    };
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["jwt_token"];
                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }
                return Task.CompletedTask;
            },

            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;

                return context.Response.WriteAsJsonAsync(new
                {
                    message = "you dont have token or your token is expired" +
                    " please login again"
                });
            },

            OnForbidden = context =>
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;

                return context.Response.WriteAsJsonAsync(new
                {
                    message = "forbbiden! you dont have an accses to do this action"
                });
            },

            OnAuthenticationFailed = context =>
            {
                return Task.CompletedTask;
            },

            OnTokenValidated = context =>
            {
                var userId = context.Principal?
                    .FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

                return Task.CompletedTask;
            }
        };
    });

    builder.Services.AddAuthorization();

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        });


    var allowedOrigins = new[] { "http://localhost:4200" };

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("CorsPolicy", policy =>
        {
            policy.WithOrigins("http://localhost:5062") // ודאי שזה http
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials(); // חובה לעוגיות
        });
    });


    builder.Services.AddRateLimiter(options =>
{
    // הגדרת מדיניות מסוג Sliding Window
    options.AddSlidingWindowLimiter(policyName: "sliding", slidingOptions =>
    {
        slidingOptions.PermitLimit = 10; // מקסימום 10 בקשות
        slidingOptions.Window = TimeSpan.FromMinutes(1); // בתוך חלון של דקה
        slidingOptions.SegmentsPerWindow = 3; // חלוקת הדקה ל-3 מקטעים (20 שניות כל אחד)
        slidingOptions.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        slidingOptions.QueueLimit = 2; // מקסימום 2 בקשות שיחכו בתור אם חרגנו
    });

    // מה קורה כשמישהו חורג? נחזיר שגיאה 429 (Too Many Requests)
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
});
    var app = builder.Build();
    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }


    app.UseCors("CorsPolicy");

    if (!app.Environment.IsDevelopment())
    {
        app.UseHttpsRedirection();
    }

    app.UseRequestLogging();
    app.UseRateLimiting();

    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    //app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseAuthentication();
    app.UseRateLimiter();
    app.UseAuthorization();

    app.MapControllers();

    Log.Information("Store API is now running");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application start-up failed");
}
finally
{
    Log.CloseAndFlush();
}

public class SwaggerCookieIdempotency : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        operation.Parameters ??= new List<OpenApiParameter>();
        operation.Parameters.Add(new OpenApiParameter
        {
            Name = "jwt_token",
            In = ParameterLocation.Cookie,
            Required = false
        });
    }
}