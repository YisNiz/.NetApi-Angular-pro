using Confluent.Kafka;
using Serilog;
using System.Text.Json;

namespace KafkaConsumer
{
    public class TransactionEventDto
    {
        public string EventType { get; set; }
        public int GiftId { get; set; }
        public string GiftName { get; set; }
        public int? WinnerId { get; set; }
        public string WinnerName { get; set; }
        public string WinnerUserName { get; set; }
        public string WinnerPhone { get; set; }
        public DateTime EventDateTime { get; set; }
        public decimal? GiftPrice { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
    }

    class Program
    {
        static async Task Main(string[] args)
        {
            // Configure Serilog for logging
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Information()
                .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
                .WriteTo.File("Logs/consumer-log-.txt", rollingInterval: RollingInterval.Day,
                    outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj}{NewLine}{Exception}",
                    retainedFileCountLimit: 30)
                .CreateLogger();

            try
            {
                Log.Information("=== Kafka Transaction Event Consumer Started ===");

                var consumerConfig = new ConsumerConfig
                {
                    BootstrapServers = "localhost:9092",
                    GroupId = "transaction-consumer-group",
                    AutoOffsetReset = AutoOffsetReset.Earliest,
                    EnableAutoCommit = true,
                    SessionTimeoutMs = 6000,
                    ClientId = "TransactionEventConsumer"
                };

                using (var consumer = new ConsumerBuilder<string, string>(consumerConfig)
                    .SetLogHandler((_, log) =>
                    {
                        Log.Debug($"[KafkaConsumer] {log.Level}: {log.Message}");
                    })
                    .SetErrorHandler((_, error) =>
                    {
                        Log.Error($"[KafkaConsumer] Error: {error.Reason}");
                    })
                    .Build())
                {
                    consumer.Subscribe(new[] { "transaction-events" });

                    Log.Information("Consumer subscribed to 'transaction-events' topic");

                    var cts = new CancellationTokenSource();
                    Console.CancelKeyPress += (_, e) =>
                    {
                        e.Cancel = true;
                        cts.Cancel();
                    };

                    try
                    {
                        while (!cts.Token.IsCancellationRequested)
                        {
                            try
                            {
                                var consumeResult = consumer.Consume(cts.Token);

                                if (consumeResult != null)
                                {
                                    Log.Information($"Received message at offset {consumeResult.Offset}");

                                    try
                                    {
                                        var transactionEvent = JsonSerializer.Deserialize<TransactionEventDto>(consumeResult.Value);

                                        if (transactionEvent != null)
                                        {
                                            LogTransactionEvent(transactionEvent);
                                        }
                                        else
                                        {
                                            Log.Warning("Failed to deserialize transaction event");
                                        }
                                    }
                                    catch (JsonException jsonEx)
                                    {
                                        Log.Error($"JSON Deserialization error: {jsonEx.Message}");
                                        Log.Debug($"Raw message: {consumeResult.Value}");
                                    }
                                }
                            }
                            catch (ConsumeException ex)
                            {
                                Log.Error($"Consume error: {ex.Error.Reason}");
                            }
                        }
                    }
                    catch (OperationCanceledException)
                    {
                        Log.Information("Consumer stopping...");
                    }
                }

                Log.Information("=== Kafka Transaction Event Consumer Stopped ===");
            }
            catch (Exception ex)
            {
                Log.Fatal(ex, "Unhandled exception in consumer");
            }
            finally
            {
                Log.CloseAndFlush();
            }
        }

        private static void LogTransactionEvent(TransactionEventDto transactionEvent)
        {
            Log.Information("========== TRANSACTION EVENT ==========");
            Log.Information($"Event Type: {transactionEvent.EventType}");
            Log.Information($"Gift ID: {transactionEvent.GiftId}");
            Log.Information($"Gift Name: {transactionEvent.GiftName}");
            Log.Information($"Gift Price: {transactionEvent.GiftPrice}");
            Log.Information($"Winner ID: {transactionEvent.WinnerId}");
            Log.Information($"Winner Name: {transactionEvent.WinnerName}");
            Log.Information($"Winner Username: {transactionEvent.WinnerUserName}");
            Log.Information($"Winner Phone: {transactionEvent.WinnerPhone}");
            Log.Information($"Event DateTime: {transactionEvent.EventDateTime:O}");
            Log.Information($"Status: {transactionEvent.Status}");
            Log.Information($"Notes: {transactionEvent.Notes}");
            Log.Information("=========================================");
        }
    }
}
