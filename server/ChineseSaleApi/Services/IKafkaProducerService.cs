namespace ChineseSaleApi.Services
{
    public interface IKafkaProducerService
    {
        Task SendTransactionEventAsync(object transactionEvent);
        Task<bool> IsConnectedAsync();
    }
}
