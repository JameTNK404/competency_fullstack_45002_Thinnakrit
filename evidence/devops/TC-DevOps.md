# หลักฐานการทดสอบ DevOps & Performance
*(สร้างอัตโนมัติจากสคริปต์)*
## 3.1 Docker Compose Network (docker-compose ps)
```bash
time="2026-02-25T17:10:09+07:00" level=warning msg="/Users/thinnakrit/Study_PVS/exit_exam/competency2568/docker-compose.lb.yml: the attribute `version` is obsolete, it will be ignored, please remove it to avoid potential confusion"
NAME                          IMAGE               COMMAND                  SERVICE      CREATED       STATUS                 PORTS
competency2568-db-1           mysql:8.0           "docker-entrypoint.s…"   db           7 hours ago   Up 7 hours (healthy)   0.0.0.0:3306->3306/tcp, [::]:3306->3306/tcp, 33060/tcp
competency2568-phpmyadmin-1   phpmyadmin:latest   "/docker-entrypoint.…"   phpmyadmin   7 hours ago   Up 7 hours             0.0.0.0:8080->80/tcp, [::]:8080->80/tcp
```
### [docker-compose.lb.yml]
```yaml
version: '3.8'

services:
  db:
      image: mysql:8.0
      command: >
        --character-set-server=utf8mb4
        --collation-server=utf8mb4_unicode_ci
      environment:
        MYSQL_ROOT_PASSWORD: rootpassword
        MYSQL_DATABASE: skills_db
        MYSQL_USER: user1
        MYSQL_PASSWORD: user1_1234
        TZ: Asia/Bangkok
      volumes:
        - db_data:/var/lib/mysql
        - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql:ro
      healthcheck:
        test: ["CMD","mysqladmin","ping","-proot_password"]
        interval: 10s
        timeout: 5s
        retries: 10
      networks: [fsnet]

  phpmyadmin:
    image: phpmyadmin:latest
    environment:
      PMA_HOST: db
      PMA_USER: root
      PMA_PASSWORD: rootpassword
    ports:
      - "8080:80"
    depends_on:
      - db
    networks: [fsnet]

  api:
    build: ./backend
    env_file:
      - ./backend/.env
    # Note: Cannot bind host port if replicas > 1. Use lb via nginx.
    expose:
      - "7001"
    depends_on:
      db:
        condition: service_healthy
    networks: [fsnet]
    volumes:
      - ./backend/uploads:/app/uploads
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

  frontend:
    build: ./frontend
    environment:
      NITRO_PORT: 3000
      NUXT_PUBLIC_API_BASE: http://localhost/api
    expose:
      - "3000"
    depends_on:
      - api
    networks: [fsnet]
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.lb.conf:/etc/nginx/nginx.conf:ro
    ports:
      - "80:80"
    depends_on:
      - api
      - frontend
    networks: [fsnet]

volumes:
  db_data:

networks:
  fsnet:
    driver: bridge
```
## 3.2 Security Headers (Helmet & CORS)
**Command:** `curl -I http://localhost:7001/health`
```http
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
  0     0    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0  0    53    0     0    0     0      0      0 --:--:-- --:--:-- --:--:--     0
HTTP/1.1 200 OK
Content-Security-Policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
Origin-Agent-Cluster: ?1
Referrer-Policy: no-referrer
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-DNS-Prefetch-Control: off
X-Download-Options: noopen
X-Frame-Options: SAMEORIGIN
X-Permitted-Cross-Domain-Policies: none
X-XSS-Protection: 0
Access-Control-Allow-Origin: *
Content-Type: application/json; charset=utf-8
Content-Length: 53
ETag: W/"35-UxVTaVkLx8nkIssOUmPt4eb1w6U"
Date: Wed, 25 Feb 2026 10:10:09 GMT
Connection: keep-alive
Keep-Alive: timeout=5

```
## 3.3 Load Testing (Autocannon - 100 concurrent for 10s)
**Command:** `npx autocannon -c 100 -d 10 http://localhost:7001/health`
```bash
Need to install the following packages:
autocannon@8.0.0
Ok to proceed? (y) 
Running 10s test @ http://localhost:7001/health
100 connections


┌─────────┬──────┬───────┬───────┬───────┬──────────┬──────────┬────────┐
│ Stat    │ 2.5% │ 50%   │ 97.5% │ 99%   │ Avg      │ Stdev    │ Max    │
├─────────┼──────┼───────┼───────┼───────┼──────────┼──────────┼────────┤
│ Latency │ 8 ms │ 10 ms │ 14 ms │ 19 ms │ 10.49 ms │ 10.48 ms │ 699 ms │
└─────────┴──────┴───────┴───────┴───────┴──────────┴──────────┴────────┘
┌───────────┬─────────┬─────────┬─────────┬─────────┬──────────┬────────┬─────────┐
│ Stat      │ 1%      │ 2.5%    │ 50%     │ 97.5%   │ Avg      │ Stdev  │ Min     │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┤
│ Req/Sec   │ 7,467   │ 7,467   │ 9,343   │ 9,823   │ 9,098.37 │ 647.6  │ 7,466   │
├───────────┼─────────┼─────────┼─────────┼─────────┼──────────┼────────┼─────────┤
│ Bytes/Sec │ 7.17 MB │ 7.17 MB │ 8.97 MB │ 9.43 MB │ 8.74 MB  │ 622 kB │ 7.17 MB │
└───────────┴─────────┴─────────┴─────────┴─────────┴──────────┴────────┴─────────┘

Req/Bytes counts sampled once per second.
# of samples: 11

100k requests in 11.02s, 96.1 MB read
```
