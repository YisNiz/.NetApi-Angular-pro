using Confluent.Kafka;
using Serilog;
using System.Text.Json;

namespace ChineseSaleApi.Services
{
    public class KafkaProducerService : IKafkaProducerService, IDisposable
    {
        private readonly IProducer<string, string> _producer;
        private readonly string _topic;
        private readonly string _bootstrapServers;

        public KafkaProducerService(IConfiguration configuration)
        {
            var kafkaSettings = configuration.GetSection("Kafka");
            _bootstrapServers = kafkaSettings["BootstrapServers"] ?? "localhost:9092";
            _topic = kafkaSettings["Topic"] ?? "transaction-events";

            var producerConfig = new ProducerConfig
            {
                BootstrapServers = _bootstrapServers,
                ClientId = "ChineseSaleApi-Producer",
                Acks = Acks.All,
                MessageTimeoutMs = 30000,
                RequestTimeoutMs = 30000
                // 'Retries' was removed from the strongly-typed ProducerConfig API.
                // If you need to set retry behavior, set the underlying config key:
                // producerConfig["message.send.max.retries"] = "3";
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

                var deliveryReport = await _producer.ProduceAsync(_topic, message).ConfigureAwait(false);

                Log.Information($"Message sent to Kafka: Topic={deliveryReport.Topic}, " +
                    $"Partition={deliveryReport.Partition}, Offset={deliveryReport.Offset}");
            }
            catch (Exception ex)
            {
                Log.Error($"Error sending message to Kafka: {ex.Message}");
                throw;
            }
        }

        public Task<bool> IsConnectedAsync()
        {
            try
            {
                using var admin = new AdminClientBuilder(new AdminClientConfig { BootstrapServers = _bootstrapServers }).Build();
                var metadata = admin.GetMetadata(TimeSpan.FromSeconds(5));
                return Task.FromResult(metadata?.Brokers?.Count > 0);
            }
            catch
            {
                return Task.FromResult(false);
            }
        }

        public void Dispose()
        {
            try
            {
                _producer?.Flush(TimeSpan.FromSeconds(5));
            }
            catch { /* swallow */ }

            _producer?.Dispose();
        }
    }
}
