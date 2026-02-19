using ChineseSaleApi.Data;
using ChineseSaleApi.Dto;
using ChineseSaleApi.Models;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics.Eventing.Reader;
using System.Reflection;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace ChineseSaleApi.Repositories
{
    public class PurchaseRepository : IPurchaseRepository
    {
        private readonly ChineseSaleContextDb _context;
        public PurchaseRepository(ChineseSaleContextDb context)
        {
            _context = context;
        }

        //get all purchases
        public async Task<List<Gift>> GetAllPurchasesAsync()
        {

            return await _context.Gifts
            .Include(g => g.Tickets)
            .Include(g => g.WinnerUser)
            .ToListAsync();

        }


        //get buyers details by gift id
        public async Task<List<Ticket>> GetBuyersDetailsByGiftIdAsync(int giftId)
        {
            return await _context.Tickets
                .Where(t => t.GiftId == giftId)
                .Include(t => t.User)
                .ToListAsync();
        }
        public async Task<bool> GiftExistsAsync(int giftId)
        {
            return await _context.Gifts.AnyAsync(g => g.Id == giftId);
        }

        //update gift with winner user id
        public async Task UpdateGiftAsync(int giftId, int winnerUserId)
        {
            var gift = await _context.Gifts.FirstOrDefaultAsync(g => g.Id == giftId);
            if (gift == null) throw new Exception("Gift not found");

            gift.WinnerUserId = winnerUserId;
            await _context.SaveChangesAsync();
        }

        //Create a gifts and winners report
        public async Task<List<Gift>> MakeGiftsAndWinnersReportAsync()
        {
            return await _context.Gifts
                .Include(g => g.WinnerUser)
                .Include(g => g.Tickets)
                .ToListAsync();
        }


        //Creating a Total Sales Revenue Report
        public async Task<int> MakeTotalSalesRevenueReportAsync()
        {
            return await _context.Tickets
                .SumAsync(t => t.Gift.TicketCost);
        }

        //sorting gifts
        public async Task<List<Gift>> SortingGiftsAsync(string? sortParam)
        {
            var query = _context.Gifts
                .Include(g => g.Tickets)
                .Include(g => g.WinnerUser)
                .AsQueryable();

            switch (sortParam)
            {
                case "price":
                    query = query.OrderByDescending(g => g.TicketCost);
                    break;

                case "purchases":
                    query = query.OrderByDescending(g => g.Tickets.Count());
                    break;

                default:
                    query = query.OrderBy(g => g.Id);
                    break;
            }

            return await query.ToListAsync();
        }

    }
}


