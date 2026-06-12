using Confluent.Kafka;
using Serilog;
using System.Text.Json;

namespace ChineseSaleApi.Services
{
    public class KafkaProducerService : IKafkaProducerService
    {
        private readonly IProducer<string, string> _producer;
        private readonly string _topic;

        public KafkaProducerService(IConfiguration configuration)
        {
            var kafkaSettings = configuration.GetSection("Kafka");
            var bootstrapServers = kafkaSettings["BootstrapServers"];
            _topic = kafkaSettings["Topic"] ?? "transaction-events";

            var producerConfig = new ProducerConfig
            {
                BootstrapServers = bootstrapServers,
                ClientId = "ChineseSaleApi-Producer",
                Acks = Acks.All,
                Retries = 3,
                MessageTimeoutMs = 30000,
                RequestTimeoutMs = 30000
            };

            try
            {
                _producer = new ProducerBuilder<string, string>(producerConfig)
                    .SetLogHandler((_, log) =>
                    {
                        Log.Debug($"[KafkaProducer] {log.Level}: {log.Message}");
                    })
                    .SetErrorHandler((_, error) =>
                    {
                        Log.Error($"[KafkaProducer] Error: {error.Reason}");
                    })
                    .Build();

                Log.Information("KafkaProducerService initialized successfully");
            }
            catch (Exception ex)
            {
                Log.Error($"Failed to initialize KafkaProducerService: {ex.Message}");
                throw;
            }
        }

        public async Task SendTransactionEventAsync(object transactionEvent)
        {
            try
            {
                var eventJson = JsonSerializer.Serialize(transactionEvent);
                var key = Guid.NewGuid().ToString();

                var message = new Message<string, string>
                {
                    Key = key,
                    Value = eventJson
                };

                var deliveryReport = await _producer.ProduceAsync(_topic, message);

                Log.Information($"Message sent to Kafka: Topic={deliveryReport.Topic}, " +
                    $"Partition={deliveryReport.Partition}, Offset={deliveryReport.Offset}");
            }
            catch (Exception ex)
            {
                Log.Error($"Error sending message to Kafka: {ex.Message}");
                throw;
            }
        }

        public async Task<bool> IsConnectedAsync()
        {
            try
            {
                var metadata = _producer.GetMetadata(TimeSpan.FromSeconds(5));
                return metadata.Brokers.Count > 0;
            }
            catch
            {
                return false;
            }
        }

        public void Dispose()
        {
            _producer?.Dispose();
        }
    }
}
