# Kafka Integration Implementation Guide

## Overview
This project has been integrated with Apache Kafka to enable real-time event messaging when lottery draws are executed. The system sends transaction events to Kafka, which can be consumed by external services for further processing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  API Server (ChineseSaleApi)                                   │
│  ┌────────────────────────────────────────┐                    │
│  │ PurchaseService                        │                    │
│  │ - MakeLottery() → Sends event to Kafka │                    │
│  └─────────────────┬──────────────────────┘                    │
│                    │                                            │
│                    ▼                                            │
│  ┌────────────────────────────────────────┐                    │
│  │ KafkaProducerService                   │                    │
│  │ - Uses ProducerBuilder                 │                    │
│  │ - Serializes events to JSON            │                    │
│  └─────────────────┬──────────────────────┘                    │
│                    │                                            │
└────────────────────┼────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Kafka Broker (Docker)                                         │
│  ┌────────────────────────────────────────┐                    │
│  │ Topic: transaction-events              │                    │
│  │ - Partition: 1                         │                    │
│  │ - Replication Factor: 1                │                    │
│  └────────────────────────────────────────┘                    │
│                                                                 │
└─────────┬──────────────────────────────────────────────────────┘
          │
          ├─────────────────────────────┬──────────────────────────┐
          ▼                             ▼                          ▼
    ┌──────────────┐            ┌──────────────┐        ┌──────────────────┐
    │ Consumer App │            │ Kafka UI     │        │ Other Services   │
    │ (Logs events)│            │ (Monitor)    │        │ (Future)         │
    └──────────────┘            └──────────────┘        └──────────────────┘
```

## Components

### 1. Docker Compose Configuration
**File**: `docker-compose.yml`

Added three new services:
- **Zookeeper**: Required by Kafka for coordination
- **Kafka Broker**: The message broker itself
  - Bootstrap Server: `localhost:9092` (for client connections)
  - Advertised Listeners: `kafka:29092` (internal network)
- **Kafka UI**: Web interface for monitoring topics and messages
  - Access at: `http://localhost:8080`

### 2. Application Configuration
**File**: `appsettings.json`

```json
"Kafka": {
  "BootstrapServers": "localhost:9092",
  "Topic": "transaction-events"
}
```

### 3. Kafka Producer Service
**Files**: 
- `Services/IKafkaProducerService.cs` - Interface
- `Services/KafkaProducerService.cs` - Implementation

**Features**:
- Uses Confluent.Kafka's ProducerBuilder pattern
- Automatically serializes events to JSON
- Includes error handling and logging
- Supports connection verification

**Key Methods**:
```csharp
Task SendTransactionEventAsync(object transactionEvent)  // Send event
Task<bool> IsConnectedAsync()                            // Test connection
```

### 4. Transaction Event DTO
**File**: `Dto/TransactionEventDto.cs`

Contains all relevant business transaction information:
- Event type (Lottery, Purchase, etc.)
- Gift details (ID, name, price)
- Winner information (ID, name, username, phone)
- Event timestamp
- Transaction status
- Additional notes

### 5. Purchase Service Integration
**File**: `Services/PurchaseService.cs`

Modified `MakeLottery()` method to:
1. Execute the lottery logic (unchanged)
2. Create a `TransactionEventDto` with all relevant details
3. Send the event to Kafka asynchronously
4. Log the operation (without blocking the lottery execution)

**Error Handling**:
- Kafka failures don't block the lottery operation
- Errors are logged but not thrown
- Transaction is already completed when Kafka event fails

### 6. Kafka Consumer Application
**Location**: `server/KafkaConsumer/`

A standalone .NET console application that:
- Connects to Kafka broker on `localhost:9092`
- Subscribes to `transaction-events` topic
- Consumes messages in real-time
- Logs complete transaction details with formatting
- Maintains consumer group: `transaction-consumer-group`
- Logs are saved to `KafkaConsumer/Logs/consumer-log-*.txt`

**Consumer Group Strategy**:
- Group ID: `transaction-consumer-group`
- Auto-commit enabled for offset management
- Processes messages from earliest offset on first run

## Getting Started

### Step 1: Start Kafka Infrastructure
```bash
cd f:\ProjectAngularApi
docker-compose up -d
```

This starts:
- Zookeeper on port 2181
- Kafka broker on port 9092
- Kafka UI on port 8080

**Verify Kafka is running**:
```bash
# Check Docker containers
docker ps

# Should show: zookeeper, kafka, kafka-ui running
```

### Step 2: Access Kafka UI
Open browser and navigate to: `http://localhost:8080`

You should see:
- Cluster name: "local"
- Broker status
- Topics (initially empty, will show `transaction-events` after first event)

### Step 3: Run the API Server
```bash
cd f:\ProjectAngularApi\server\ChineseSaleApi

# Restore dependencies
dotnet restore

# Run the application
dotnet run
```

### Step 4: Run the Consumer Application
In a separate terminal:
```bash
cd f:\ProjectAngularApi\server\KafkaConsumer

# Restore dependencies
dotnet restore

# Run the consumer
dotnet run
```

You should see:
```
[09:15:23 INF] === Kafka Transaction Event Consumer Started ===
[09:15:23 INF] Consumer subscribed to 'transaction-events' topic
```

### Step 5: Trigger a Lottery Event
Use the API to execute a lottery:

```bash
curl -X POST "https://localhost:5061/api/Purchase/MakeLottery/1" \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>"
```

Or use Swagger UI at: `http://localhost:5062/swagger`

### Step 6: Monitor Events

**In Consumer Console**:
```
========== TRANSACTION EVENT ==========
Event Type: Lottery
Gift ID: 1
Gift Name: PlayStation 5
Gift Price: 499.99
Winner ID: 3
Winner Name: John Doe
Winner Username: johndoe
Winner Phone: 555-1234
Event DateTime: 2026-06-12T14:30:45.1234567Z
Status: LotteryCompleted
Notes: Lottery winner selected from 15 participants
=========================================
```

**In Kafka UI** (`http://localhost:8080`):
1. Navigate to Topics
2. Select `transaction-events` topic
3. Click "Messages" tab
4. View all messages with:
   - Key: GUID (unique message ID)
   - Value: Complete JSON event data
   - Partition: 0 (single partition)
   - Offset: Sequential message counter

## Monitoring with Kafka UI

### Key Metrics to Check

1. **Topic Health**:
   - Messages: Total event count
   - Partitions: Number of partitions
   - Replication Factor: Data redundancy

2. **Consumer Groups**:
   - Consumer Group: `transaction-consumer-group`
   - Lag: Distance between latest message offset and consumer's committed offset
   - Members: Active consumer instances

3. **Offset Management**:
   - Shows where each consumer is in the message stream
   - Lag of 0 means consumer is caught up
   - Increasing lag indicates consumer is falling behind

4. **Message Content**:
   - Preview raw JSON messages
   - View all event details sent by the API

## Data Flow Example

1. **Lottery Execution**:
   ```
   POST /api/Purchase/MakeLottery/1
   ```

2. **API Server**:
   - Selects random winner from ticket holders
   - Updates database with winner
   - Creates TransactionEventDto

3. **Kafka Producer**:
   - Receives event object
   - Serializes to JSON
   - Sends to broker on `transaction-events` topic

4. **Kafka Broker**:
   - Stores message with offset
   - Maintains partition commit logs

5. **Consumer Application**:
   - Polls for new messages
   - Deserializes JSON
   - Logs formatted transaction details

6. **Monitoring**:
   - Kafka UI shows message in topic
   - Consumer group offset is updated
   - Both UI and consumer logs available

## Configuration Reference

### Important Properties

| Property | Value | Purpose |
|----------|-------|---------|
| `BootstrapServers` | `localhost:9092` | Kafka broker connection |
| `Topic` | `transaction-events` | Event channel |
| `ProducerAcks` | `All` | Require all replicas acknowledge |
| `ConsumerGroupId` | `transaction-consumer-group` | Consumer identity |
| `AutoOffsetReset` | `Earliest` | Start from first message on reset |

### Ports

| Service | Port | Purpose |
|---------|------|---------|
| Kafka Broker | 9092 | Client connections |
| Kafka Broker Internal | 29092 | Container-to-container |
| Zookeeper | 2181 | Kafka coordination |
| Kafka UI | 8080 | Web monitoring dashboard |

## Scaling & Future Enhancements

### Adding More Partitions
For higher throughput, increase partitions in Kafka:
```bash
docker exec kafka kafka-topics --bootstrap-server localhost:9092 \
  --alter --topic transaction-events --partitions 3
```

### Multiple Consumers
Deploy multiple consumer instances with same consumer group for load distribution:
- Auto-rebalances message consumption
- Each consumer gets subset of partitions
- Enables parallel processing

### Additional Event Types
Can extend for:
- Purchase creation events
- User registration events
- Payment processing events

Just add new event types to `TransactionEventDto` and create subscribers as needed.

### Persistence
Configure Kafka retention policies in docker-compose:
```yaml
environment:
  KAFKA_LOG_RETENTION_HOURS: 24  # Keep messages for 24 hours
  KAFKA_LOG_RETENTION_BYTES: 1073741824  # 1GB max size
```

## Troubleshooting

### Kafka Connection Issues
1. Verify containers are running: `docker ps`
2. Check logs: `docker logs kafka` or `docker logs zookeeper`
3. Test connection: Use Kafka UI to verify broker status

### Consumer Not Receiving Messages
1. Verify consumer is subscribed to correct topic: `transaction-events`
2. Check consumer group offset in Kafka UI
3. Verify no exceptions in consumer logs

### High Offset Lag
1. Check consumer application is running
2. Monitor consumer logs for deserialization errors
3. Increase consumer throughput or add more consumer instances

### Messages Not Appearing in Kafka UI
1. Refresh the UI page
2. Verify topic `transaction-events` exists in Topics tab
3. Check broker status in Clusters section

## Cleanup

To stop Kafka infrastructure:
```bash
docker-compose down

# Remove volumes (optional - clears data):
docker-compose down -v
```

To stop applications:
- API: Press Ctrl+C in API terminal
- Consumer: Press Ctrl+C in consumer terminal

## Next Steps

1. ✅ Implement Kafka integration
2. ✅ Create producer and consumer services
3. ✅ Set up Kafka UI monitoring
4. **Next**: Add database persistence of events
5. **Next**: Implement email/SMS notifications based on events
6. **Next**: Add event aggregation and analytics service
7. **Next**: Implement event replay capability

---

**Implementation Date**: June 12, 2026  
**Status**: Complete and ready for production testing
