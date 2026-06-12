using ChineseSaleApi.Dto;
using ChineseSaleApi.Models;
using ChineseSaleApi.Repositories;
using System.Collections.Generic;
using System.Net.WebSockets;
using Serilog;

namespace ChineseSaleApi.Services
{
    public class PurchaseService : IPurchaseService
    {
        private readonly IPurchaseRepository _repo;
        private readonly IKafkaProducerService _kafkaProducer;

        public PurchaseService(IPurchaseRepository repo, IKafkaProducerService kafkaProducer)
        {
            _repo = repo;
            _kafkaProducer = kafkaProducer;
        }

        // get all purchases
        public async Task<List<PurchaseDto>> GetAllPurchasesAsync()
        {
            var purchases = await _repo.GetAllPurchasesAsync();
            return purchases.Select(p => new PurchaseDto
            {
                Id = p.Id,
                GiftName = p.Name,
                Quantity = p.Tickets.Count(),
                WinnerName = p?.WinnerUser?.Name ?? "No winner yet"
            }).ToList();

        }

        //get buyers details by gift id
        public async Task<List<PurchaseDetailDto>> GetBuyersDetailsByGiftIdAsync(int giftId)
        {
            var isExist = await _repo.GiftExistsAsync(giftId);
            if (!isExist)
                throw new KeyNotFoundException("gift not found");

            var tickets = await _repo.GetBuyersDetailsByGiftIdAsync(giftId);

            if (tickets == null || !tickets.Any())
                return new List<PurchaseDetailDto>();

            return tickets.Select(t => new PurchaseDetailDto
            {
                PurchaseDate = t.PurchaseDate,
                User = new BuyerDetailDto
                {
                    Name = t.User.Name,
                    UserName = t.User.UserName,
                    Phone = t.User.Phone
                }
            }).ToList();
        }

        //the lottery
        public async Task<string> MakeLottery(int giftId)
        {
            var isExist = await _repo.GiftExistsAsync(giftId);
            if (!isExist)
                throw new KeyNotFoundException("gift not found");

            var tickets = await _repo.GetBuyersDetailsByGiftIdAsync(giftId);
            if (tickets == null || !tickets.Any())
                throw new KeyNotFoundException("there are no buyers yet");

            var index = Random.Shared.Next(tickets.Count);
            var winner = tickets[index];

            await _repo.UpdateGiftAsync(winner.GiftId, winner.UserId);

            // Send transaction event to Kafka
            try
            {
                var transactionEvent = new TransactionEventDto
                {
                    EventType = "Lottery",
                    GiftId = winner.GiftId,
                    GiftName = winner.Gift?.Name ?? "Unknown Gift",
                    WinnerId = winner.UserId,
                    WinnerName = winner.User.Name,
                    WinnerUserName = winner.User.UserName,
                    WinnerPhone = winner.User.Phone,
                    EventDateTime = DateTime.UtcNow,
                    GiftPrice = winner.Gift?.Price,
                    Status = "LotteryCompleted",
                    Notes = $"Lottery winner selected from {tickets.Count} participants"
                };

                await _kafkaProducer.SendTransactionEventAsync(transactionEvent);
                Log.Information($"Lottery event sent to Kafka for gift {giftId}");
            }
            catch (Exception ex)
            {
                Log.Error($"Failed to send lottery event to Kafka: {ex.Message}");
                // Don't throw - the lottery was completed successfully, only logging is failing
            }

            return $"Lottery made successfully! the winner is {winner.User.Name}";
        }

        //Create a gifts and winners report
        public async Task<List<WinnersGiftsReportDto>> WinnersGiftsReportsAsync()
        {
            var gifts = await _repo.MakeGiftsAndWinnersReportAsync();
            if (gifts == null || !gifts.Any())
                throw new KeyNotFoundException("you didnt make any lottery yet");

            return gifts.Select(g => new WinnersGiftsReportDto
            {
                GiftName = g.Name,
                GiftDescription = g.Description,
                PurchaseDate = g.WinnerUser != null ? g.Tickets
                    .FirstOrDefault(t => t.UserId == g.WinnerUserId)?.PurchaseDate : null,
                User = g.WinnerUser != null ? new BuyerDetailDto
                {
                    Name = g.WinnerUser.Name,
                    UserName = g.WinnerUser.UserName,
                    Phone = g.WinnerUser.Phone
                } : null
            }).ToList();
        }


        //Creating a Total Sales Revenue Report
        public async Task<int> TotalSalesRevenueReportAsync()
        {
            var totalRevenue = await _repo.MakeTotalSalesRevenueReportAsync();
            if (totalRevenue == 0)
                throw new KeyNotFoundException("no sales revenue yet");
            return totalRevenue;
        }

        //sorting gifts
        public async Task<List<PurchaseDto>> SortingGiftsAsync(string? sortParam)
        {
            var gifts = await _repo.SortingGiftsAsync(sortParam);
            if (gifts == null || !gifts.Any())
                throw new KeyNotFoundException("no gifts found");

            return gifts.Select(g => new PurchaseDto
            {
                Id = g.Id,
                GiftName = g.Name,
                Quantity = g.Tickets.Count(),
                WinnerName = g?.WinnerUser?.Name ?? "No winner yet"
            }).ToList();
        }
    }
}
