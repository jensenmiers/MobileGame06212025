# Frontend Testing Scenarios

## Test Tournament Data
Create these tournaments via API to test different states:

### Scenario A: Future Cutoff (Predictions Should Open)
```json
{
  "name": "Future Cutoff Tournament",
  "cutoff_time": "2025-12-31T23:59:59Z",  // Far future
  "start_time": "2026-01-01T00:00:00Z"
}
```

### Scenario B: Past Cutoff, No Results (Predictions Should Close) 
```json
{
  "name": "Past Cutoff Tournament",
  "cutoff_time": "2024-01-01T00:00:00Z",  // Past
  "start_time": "2024-01-01T01:00:00Z"
}
```

### Scenario C: Past Cutoff, Has Results (Predictions Should Close)
```json
{
  "name": "Completed Tournament", 
  "cutoff_time": "2024-01-01T00:00:00Z",  // Past
  "start_time": "2024-01-01T01:00:00Z"
}
```
(Then add results to this tournament)

### Scenario D: Future Cutoff, Has Results (Predictions Should Close)
```json
{
  "name": "Early Results Tournament",
  "cutoff_time": "2025-12-31T23:59:59Z",  // Future  
  "start_time": "2026-01-01T00:00:00Z"
}
```
(Then add results to this tournament) 