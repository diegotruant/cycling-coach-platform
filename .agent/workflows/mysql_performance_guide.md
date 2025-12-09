---
description: Guide to creating a performant MySQL database for the Cycling Coach Platform
---

# Creating a Performant MySQL Database

To transition from JSON files to a high-performance MySQL database for the Cycling Coach Platform, follow these best practices.

## 1. Schema Design & Data Types

*   **Use `INT UNSIGNED` or `BIGINT UNSIGNED` for IDs**: If you don't need UUIDs, integers are faster for joining. If you use UUIDs (as we do now), store them as `BINARY(16)` for performance, or `CHAR(36)` for simplicity (slower).
*   **Appropriate Enums**: Use `ENUM` for fixed status fields (e.g., `status: 'PENDING' | 'COMPLETED'`) instead of `VARCHAR`.
*   **Time Series Optimization**: For workout telemetry (power, heart rate every second), don't store one row per second in a standard table.
    *   **Strategy A**: Store the raw file path (JSON/FIT) and only extract aggregate metrics (Avg Power, NP, TSS) into columns.
    *   **Strategy B**: Use a JSON column for the "stream" data if it's not queried deeply.
    *   **Strategy C**: Use a separate specialized Time Series DB (InfluxDB) or table partitioning.

## 2. Indexing Strategy

*   **Primary Keys**: Always ensure every table has a Primary Key.
*   **Foreign Keys**: Index all foreign keys (`athlete_id`, `coach_id`).
*   **Composite Indexes**: For queries like "Get all workouts for Athlete X in Date Range Y", create an index on `(athlete_id, date)`.
    *   `CREATE INDEX idx_athlete_date ON assignments (athlete_id, date);`

## 3. Configuration (my.cnf) Tuning

*   **innodb_buffer_pool_size**: Set this to 70-80% of available RAM. This is the most critical setting.
*   **innodb_log_file_size**: Larger logs improve write performance (but generic recovery takes longer). 512MB to 2GB is typical.
*   **max_connections**: Ensure it's high enough for your web server (Next.js connection pooling).

## 4. Connection Pooling (Next.js Context)

In Next.js, serverless functions can exhaust DB connections.
*   Use libraries like `mysql2` with a connection pool.
*   Or use an ORM like **Prisma** (which handles pooling) or **Drizzle ORM** (very lightweight and fast).
*   Use a proxy like **ProxySQL** or generic cloud proxies (AWS RDS Proxy) if scaling horizontally.

## 5. Example Schema for Cycling Platform

```sql
CREATE TABLE athletes (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) INDEX,
    ftp INT UNSIGNED,
    email VARCHAR(255) UNIQUE
) ENGINE=InnoDB;

CREATE TABLE assignments (
    id VARCHAR(36) PRIMARY KEY,
    athlete_id VARCHAR(36),
    date DATE,
    status ENUM('PENDING', 'COMPLETED', 'SKIPPED') DEFAULT 'PENDING',
    workout_data JSON, -- Stores structure
    CONSTRAINT fk_athlete FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE,
    INDEX idx_schedule (athlete_id, date) -- Critical for calendar views
) ENGINE=InnoDB;
```

## 6. Maintenance
*   **Analyze Tables**: Run `ANALYZE TABLE` periodically to update optimizer stats.
*   **Slow Query Log**: Enable `slow_query_log` to catch queries taking > 1s.
