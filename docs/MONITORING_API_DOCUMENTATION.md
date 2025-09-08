# Monitoring API Documentation

## Overview

The Monitoring API provides comprehensive system monitoring capabilities for the GeoDomain application. It includes endpoints for alerts, trends, insights, system health, and data export functionality.

## Base URL

All monitoring endpoints are prefixed with `/api/monitoring`

## Authentication

Currently, monitoring endpoints do not require authentication. In production, these should be protected with admin-level authentication.

## Endpoints

### 1. Consolidated Monitoring Data

**GET** `/api/monitoring`

Returns all monitoring data in a single request for optimal performance.

#### Response

```json
{
  "success": true,
  "timestamp": "2025-01-08T12:00:00.000Z",
  "data": {
    "alerts": [...],
    "trends": [...],
    "insights": [...],
    "systemHealth": {...}
  }
}
```

### 2. Alerts

#### Get All Alerts

**GET** `/api/monitoring/alerts`

Returns all system alerts.

#### Response

```json
{
  "success": true,
  "timestamp": "2025-01-08T12:00:00.000Z",
  "alerts": [
    {
      "id": "no-domains",
      "ruleName": "No Domains Found",
      "severity": "critical",
      "message": "No domains found in the system. This will prevent the marketplace from functioning.",
      "timestamp": "2025-01-08T12:00:00.000Z",
      "acknowledged": false,
      "resolved": false
    }
  ]
}
```

#### Acknowledge Alert

**POST** `/api/monitoring/alerts/{alertId}/acknowledge`

Acknowledges a specific alert.

#### Request Body

```json
{
  "acknowledgedBy": "admin"
}
```

#### Response

```json
{
  "success": true,
  "message": "Alert no-domains acknowledged by admin",
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

#### Resolve Alert

**POST** `/api/monitoring/alerts/{alertId}/resolve`

Resolves a specific alert.

#### Response

```json
{
  "success": true,
  "message": "Alert no-domains resolved",
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

### 3. Trends

**GET** `/api/monitoring/trends`

Returns performance trend analysis.

#### Response

```json
{
  "success": true,
  "timestamp": "2025-01-08T12:00:00.000Z",
  "trends": [
    {
      "metric": "domains.created",
      "trend": "increasing",
      "changePercent": 15.5,
      "averageValue": 2.1,
      "forecast": {
        "nextValue": 2.3,
        "confidence": 0.85,
        "trend": "up"
      }
    }
  ]
}
```

### 4. Insights

**GET** `/api/monitoring/insights`

Returns performance insights and recommendations.

#### Response

```json
{
  "success": true,
  "timestamp": "2025-01-08T12:00:00.000Z",
  "insights": [
    {
      "type": "warning",
      "title": "Low Domain Verification Rate",
      "description": "Only 45.2% of domains are verified. This may impact user trust.",
      "severity": "medium",
      "recommendation": "Implement automated domain verification or manual review process",
      "impact": "User trust and marketplace credibility",
      "effort": "Medium - requires verification system implementation"
    }
  ]
}
```

### 5. System Health

**GET** `/api/monitoring/health`

Returns system health status and metrics.

#### Response

```json
{
  "success": true,
  "timestamp": "2025-01-08T12:00:00.000Z",
  "status": "healthy",
  "score": 95,
  "uptime": "2d 14h 32m",
  "memoryUsage": 0.45,
  "cpuUsage": 0.23,
  "activeConnections": 12,
  "metrics": {
    "users": 150,
    "domains": 250,
    "inquiries": 45,
    "verificationRate": 0.85
  }
}
```

### 6. Data Export

**GET** `/api/monitoring/export?format={json|csv}`

Exports monitoring data in the specified format.

#### Query Parameters

- `format` (required): Either `json` or `csv`

#### Response

Returns a file download with the monitoring data in the requested format.

### 7. Monitoring Control

#### Start Monitoring

**POST** `/api/monitoring/start`

Starts the monitoring system.

#### Response

```json
{
  "success": true,
  "message": "Monitoring started",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "status": "active"
}
```

#### Stop Monitoring

**POST** `/api/monitoring/stop`

Stops the monitoring system.

#### Response

```json
{
  "success": true,
  "message": "Monitoring stopped",
  "timestamp": "2025-01-08T12:00:00.000Z",
  "status": "inactive"
}
```

## Data Types

### Alert

```typescript
interface Alert {
  id: string;
  ruleName: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  acknowledged: boolean;
  resolved: boolean;
}
```

### Trend Analysis

```typescript
interface TrendAnalysis {
  metric: string;
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changePercent: number;
  averageValue: number;
  forecast?: {
    nextValue: number;
    confidence: number;
    trend: 'up' | 'down' | 'stable';
  };
}
```

### Performance Insight

```typescript
interface PerformanceInsight {
  type: 'trend' | 'anomaly' | 'optimization' | 'warning';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  impact: string;
  effort: string;
}
```

### System Health

```typescript
interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  score: number;
  uptime: string;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  metrics: {
    users: number;
    domains: number;
    inquiries: number;
    verificationRate: number;
  };
}
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2025-01-08T12:00:00.000Z"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad Request (invalid parameters)
- `500` - Internal Server Error

## Rate Limiting

Currently, no rate limiting is implemented. In production, consider implementing rate limiting to prevent abuse.

## Caching

The monitoring endpoints do not implement caching. Consider adding caching for frequently accessed data like system health metrics.

## Security Considerations

1. **Authentication**: Implement admin-level authentication for all monitoring endpoints
2. **Authorization**: Ensure only authorized users can access monitoring data
3. **Data Sensitivity**: Be cautious about exposing sensitive system information
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Input Validation**: Validate all input parameters and request bodies

## Performance Considerations

1. **Consolidated Endpoint**: Use `/api/monitoring` for optimal performance when fetching all data
2. **Database Queries**: Monitor database query performance for trend calculations
3. **Memory Usage**: Be aware of memory usage when generating large datasets
4. **Response Size**: Consider pagination for large datasets

## Future Enhancements

1. **Real-time Updates**: Implement WebSocket connections for real-time monitoring updates
2. **Historical Data**: Add endpoints for historical trend data
3. **Custom Alerts**: Allow users to configure custom alert rules
4. **Dashboard Customization**: Support for customizable monitoring dashboards
5. **Integration**: Add integrations with external monitoring services (e.g., Sentry, DataDog)
6. **Machine Learning**: Implement ML-based anomaly detection for insights
7. **Notification System**: Add email/SMS notifications for critical alerts
