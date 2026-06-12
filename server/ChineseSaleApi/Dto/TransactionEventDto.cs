namespace ChineseSaleApi.Dto
{
    public class TransactionEventDto
    {
        public string EventType { get; set; } // "Lottery" or "Purchase"
        public int GiftId { get; set; }
        public string GiftName { get; set; }
        public int? WinnerId { get; set; }
        public string WinnerName { get; set; }
        public string WinnerUserName { get; set; }
        public string WinnerPhone { get; set; }
        public DateTime EventDateTime { get; set; }
        public decimal? GiftPrice { get; set; }
        public string Status { get; set; } // "Success", "Completed", etc.
        public string Notes { get; set; }

        public TransactionEventDto()
        {
            EventDateTime = DateTime.UtcNow;
        }
    }
}
