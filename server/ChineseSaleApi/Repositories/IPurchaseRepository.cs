using ChineseSaleApi.Dto;
using ChineseSaleApi.Models;

namespace ChineseSaleApi.Repositories
{
    public interface IPurchaseRepository
    {
        public Task<List<Gift>> GetAllPurchasesAsync();
        public Task<List<Ticket>> GetBuyersDetailsByGiftIdAsync(int giftId);
        public Task<bool> GiftExistsAsync(int giftId);
        public Task<List<Gift>> MakeGiftsAndWinnersReportAsync();
        public Task<int> MakeTotalSalesRevenueReportAsync();
        public Task<List<Gift>> SortingGiftsAsync(string? sortParam);
        public  Task UpdateGiftAsync(int giftId, int winnerUserId);



    }
}
