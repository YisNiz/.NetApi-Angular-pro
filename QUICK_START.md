# Quick Start Guide - Kafka Integration

## Prerequisites
- Docker and Docker Compose installed
- .NET 8 SDK installed
- Visual Studio Code or Visual Studio

## One-Command Start (From Project Root)

```bash
# Start Kafka Infrastructure
docker-compose up -d

# Wait 10 seconds for Kafka to be fully ready
sleep 10

# In Terminal 1: Start API Server
cd server/ChineseSaleApi
dotnet restore
dotnet run

# In Terminal 2: Start Consumer
cd server/KafkaConsumer
dotnet restore
dotnet run
```

## Verify Everything is Running

### 1. Check Containers (Terminal 3)
```bash
docker ps
```
Expected output: 3 running containers
- zookeeper
- kafka
- kafka-ui

### 2. Access Kafka UI
```
http://localhost:8080
```
Should show: "local" cluster with healthy broker

### 3. Check Consumer Output
Terminal 2 should show:
```
[HH:mm:ss INF] === Kafka Transaction Event Consumer Started ===
[HH:mm:ss INF] Consumer subscribed to 'transaction-events' topic
```

### 4. Test API
```bash
# Get Swagger UI
http://localhost:5062/swagger

# Or call directly (with valid JWT token):
curl -X POST "https://localhost:5062/api/Purchase/MakeLottery/1" \
  -H "Authorization: Bearer <TOKEN>"
```

## Monitor Messages

### Using Kafka UI
1. Go to `http://localhost:8080`
2. Click "Topics" → "transaction-events"
3. Click "Messages" tab
4. Refresh to see new events after lottery execution

### Using Consumer Console
Terminal 2 will display formatted output:
```
========== TRANSACTION EVENT ==========
Event Type: Lottery
Gift ID: 1
Gift Name: PlayStation 5
Winner Name: John Doe
...
=========================================
```

## Check Message Offset Lag

In Kafka UI:
1. Click "Consumer Groups" → "transaction-consumer-group"
2. View offset lag (should be 0 if consumer is caught up)
3. Check each partition consumption status

## Stop Everything

```bash
# Stop containers
docker-compose down

# Optional: Remove data volumes
docker-compose down -v

# Stop applications (Ctrl+C in each terminal)
```

## Troubleshooting Quick Fixes

| Issue | Solution |
|-------|----------|
| Containers won't start | Run `docker-compose up -d` again |
| API can't connect to Kafka | Wait 15 seconds after docker-compose up |
| Consumer not receiving messages | Restart consumer after API is running |
| Kafka UI shows no topics | Execute a lottery to create topic |
| Consumer errors about JSON | Check API logs for serialization issues |

## Key Files to Monitor

- **API Logs**: `server/ChineseSaleApi/Logs/log-*.txt`
- **Consumer Logs**: `server/KafkaConsumer/Logs/consumer-log-*.txt`
- **Kafka Logs**: `docker logs kafka` (terminal)

## Next Lottery Event

After setup, run this to trigger a test event:

```bash
# 1. Get API Token (use existing user credentials)
# 2. Execute lottery
curl -X POST "http://localhost:5062/api/Purchase/MakeLottery/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"

# 3. Check consumer terminal for formatted output
# 4. View in Kafka UI for raw message
```

---
**Ready to test!** 🚀
