using Xunit;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using System.Linq;
using ChineseSaleApi.Data;
using ChineseSaleApi.Models;
using ChineseSaleApi.Repositories;

namespace ChineseSaleApi.Tests
{
    public class CheckoutTests
    {
        private ChineseSaleDbContext GetDbContext()
        {
            var options = new DbContextOptionsBuilder<ChineseSaleDbContext>()
                .UseInMemoryDatabase(databaseName: "TestDb")
                .Options;

            return new ChineseSaleDbContext(options);
        }

        [Fact]
        public async Task Checkout_Should_Create_Tickets_When_Gifts_Available()
        {
            // Arrange
            var context = GetDbContext();

            var gift = new Gift
            {
                Id = 1,
                Name = "Test Gift",
                WinnerUserId = null
            };

            var order = new Order
            {
                Id = 1,
                UserId = 1,
                Items = new System.Collections.Generic.List<OrderItem>()
            };

            var orderItem = new OrderItem
            {
                Id = 1,
                GiftId = 1,
                Gift = gift,
                OrderId = 1
            };

            order.Items.Add(orderItem);

            context.Gifts.Add(gift);
            context.Orders.Add(order);
            context.OrderItems.Add(orderItem);

            await context.SaveChangesAsync();

            var repo = new OrderRepository(context);

            // Act
            var result = await repo.CheckoutAsync(1);

            // Assert
            var tickets = context.Tickets.ToList();

            Assert.Single(tickets); // רק כרטיס אחד נוצר
            Assert.Equal(1, tickets.First().GiftId);
            Assert.Empty(result); // אין מתנות לא זמינות
        }

        [Fact]
        public async Task Checkout_Should_Return_UnavailableGifts_When_Gifts_Already_Won()
        {
            // Arrange
            var context = GetDbContext();

            var gift = new Gift
            {
                Id = 2,
                Name = "Taken Gift",
                WinnerUserId = 99
            };

            var order = new Order
            {
                Id = 2,
                UserId = 2,
                Items = new System.Collections.Generic.List<OrderItem>()
            };

            var orderItem = new OrderItem
            {
                Id = 2,
                GiftId = 2,
                Gift = gift,
                OrderId = 2
            };

            order.Items.Add(orderItem);

            context.Gifts.Add(gift);
            context.Orders.Add(order);
            context.OrderItems.Add(orderItem);

            await context.SaveChangesAsync();

            var repo = new OrderRepository(context);

            // Act
            var result = await repo.CheckoutAsync(2);

            // Assert
            Assert.Single(result); // המתנה לא זמינה
            Assert.Equal("Taken Gift", result.First());
            Assert.Empty(context.Tickets.ToList()); // לא נוצרו כרטיסים
        }
    }
}
