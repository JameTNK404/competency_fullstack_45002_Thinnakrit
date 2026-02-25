# หลักฐานการทดสอบ Backend API
*(ลำดับตาม Rubric readme-plan.md | Viewport: curl + HTTP status | สร้างอัตโนมัติ)*

| TC | รายการทดสอบ | HTTP Status |
|---|---|:---:|
| TC-BE-01 | OpenAPI spec (`GET /openapi.json`) | 200 |
| TC-BE-02a | Search found (`?q=ครูไอ`) | 200 |
| TC-BE-02b | Search not found (`?q=ZZZNOMATCH`) | 200 (items=[]) |
| TC-BE-03 | Sort asc / desc (`?sort=email:asc/desc`) | 200 |
| TC-BE-04 | Pagination (`?page=1&pageSize=2`) meta ✓ | 200 |
| TC-BE-05 | Idempotent q+sort+page (diff=0) | 200 |
| TC-BE-06a | Login → 200 + accessToken | 200 |
| TC-BE-06b | No token → 401 | **401** |
| TC-BE-07 | Admin sees all results | 200 |
| TC-BE-08a | Evaluator own assignment → 200 | 200 |
| TC-BE-08b | Evaluator other assignment → 403 | **403** |
| TC-BE-09a | Evaluatee self → 200 | 200 |
| TC-BE-09b | Evaluatee other → 403 | **403** |
| TC-BE-10a | score=0 → 400 | **400** |
| TC-BE-10b | score=5 → 400 | **400** |
| TC-BE-10c | score=3 → 200 | 200 |
| TC-BE-11 | yes_no=1 + no file → 400 EVIDENCE_REQUIRED | **400** |
| TC-BE-12 | >10MB upload → 413 | **413** |
| TC-BE-13 | .exe upload → 415 | **415** |
| TC-BE-14 | Create assignment (new) → 201 | **201** |
| TC-BE-15 | Duplicate assignment → 409 DUPLICATE_ASSIGNMENT | **409** |
| TC-BE-16 | Normalized /60 (`/task3/reports/normalized`) | 200 |
| TC-BE-17 | Progress per dept (`/task5/reports/progress`) | 200 |
| TC-BE-18 | Filter idempotency (diff=0) | 200 |
| TC-BE-19 | E2E Flow (Login→assign→submit→report) | 200 |
| TC-BE-20 | Security refs (IDOR 403 + 413 + 415) | ✓ |

## `TC-BE-01_openapi.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "openapi": "3.0.3",
    "info": {
      "title": "Teaching API (Minimal)",
      "version": "1.0.0",
      "description": "API สำหรับการสอน: Health, Auth, Users CRUD, Upload"
    },
    "servers": [
      {
        "url": "http://localhost:7000"
      }
    ],
    "paths": {
      "/health": {
        "get": {
          "summary": "Health check",
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      },
      "/api/auth/login": {
        "post": {
          "summary": "Login (JWT)",
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "email": {
                      "type": "string"
                    },
                    "password": {
                      "type": "string"
                    }
                  },
                  "required": [
                    "email",
                    "password"
                  ]
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "success"
            }
          }
        }
      },
      "/api/users": {
        "get": {
          "summary": "List users",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        },
        "post": {
          "summary": "Create user (admin)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    },
                    "password": {
                      "type": "string"
                    },
                    "role": {
                      "type": "string",
                      "enum": [
                        "admin",
                        "evaluator",
                        "user"
                      ]
                    }
                  },
                  "required": [
                    "name",
                    "email",
                    "password"
                  ]
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created"
            }
          }
        }
      },
      "/api/users/{id}": {
        "get": {
          "summary": "Get user by id",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            },
            "404": {
              "description": "Not Found"
            }
          }
        },
        "put": {
          "summary": "Update user (admin)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "name": {
                      "type": "string"
                    },
                    "email": {
                      "type": "string"
                    },
                    "role": {
                      "type": "string",
                      "enum": [
                        "admin",
                        "evaluator",
                        "user"
                      ]
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "Updated"
            }
          }
        },
        "delete": {
          "summary": "Delete user (admin)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "Deleted"
            }
          }
        }
      },
      "/api/upload": {
        "post": {
          "summary": "Upload single file",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "multipart/form-data": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "file": {
                      "type": "string",
                      "format": "binary"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Uploaded"
            }
          }
        }
      },
      "/api/users/server": {
        "get": {
          "summary": "List users (server-side pagination)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "page",
              "in": "query",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "name": "itemsPerPage",
              "in": "query",
              "schema": {
                "type": "integer",
                "default": 10
              }
            },
            {
              "name": "sortBy",
              "in": "query",
              "schema": {
                "type": "string",
                "default": "id",
                "enum": [
                  "id",
                  "name",
                  "email",
                  "role",
                  "created_at"
                ]
              }
            },
            {
              "name": "sortDesc",
              "in": "query",
              "schema": {
                "type": "boolean",
                "default": true
              }
            },
            {
              "name": "search",
              "in": "query",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      },
      "/api/results": {
        "get": {
          "summary": "List evaluation results (IDOR-guarded)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "period_id",
              "in": "query",
              "schema": {
                "type": "integer"
              }
            },
            {
              "name": "user_id",
              "in": "query",
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      },
      "/api/results/{id}/submit": {
        "patch": {
          "summary": "Submit result (evidence required, only draft)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "id",
              "in": "path",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "submitted"
            },
            "400": {
              "description": "bad request"
            },
            "403": {
              "description": "forbidden"
            }
          }
        }
      },
      "/api/reports/normalized": {
        "get": {
          "summary": "Normalized score to base (default 60) for submitted results",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "period_id",
              "in": "query",
              "required": true,
              "schema": {
                "type": "integer"
              }
            },
            {
              "name": "base",
              "in": "query",
              "schema": {
                "type": "integer",
                "default": 60
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      },
      "/api/reports/progress": {
        "get": {
          "summary": "Progress by department (submitted / total evaluatees)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "parameters": [
            {
              "name": "period_id",
              "in": "query",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "OK"
            }
          }
        }
      },
      "/api/assignments": {
        "post": {
          "summary": "Create assignment (unique per period/evaluator/evaluatee)",
          "security": [
            {
              "bearerAuth": []
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "period_id": {
                      "type": "integer"
                    },
                    "evaluator_id": {
                      "type": "integer"
                    },
                    "evaluatee_id": {
                      "type": "integer"
                    }
                  },
                  "required": [
                    "period_id",
                    "evaluator_id",
                    "evaluatee_id"
                  ]
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "Created"
            },
            "409": {
              "description": "Duplicate"
            }
          }
        }
      }
    },
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      }
    }
  }
}

```

## `TC-BE-02a_search_found.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "items": [
      {
        "id": 4,
        "name_th": "ครูไอที 01",
        "email": "t.it01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "pageSize": 10
    }
  }
}

```

## `TC-BE-02b_search_notfound.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "items": [],
    "meta": {
      "total": 0,
      "page": 1,
      "pageSize": 10
    }
  }
}

```

## `TC-BE-03a_sort_asc.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "items": [
      {
        "id": 1,
        "name_th": "ผู้ดูแลระบบ",
        "email": "admin@ccollege.ac.th",
        "role": "admin",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 3,
        "name_th": "กรรมการประเมินไอที",
        "email": "eva.it@ccollege.ac.th",
        "role": "evaluator",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 2,
        "name_th": "กรรมการประเมินเครื่องกล",
        "email": "eva.me@ccollege.ac.th",
        "role": "evaluator",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 7,
        "name_th": "New User",
        "email": "new@test.com",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:57:42.000Z"
      },
      {
        "id": 6,
        "name_th": "ครูบัญชี 01",
        "email": "t.acc01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 4,
        "name_th": "ครูไอที 01",
        "email": "t.it01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 5,
        "name_th": "ครูเครื่องกล 01",
        "email": "t.me01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 8,
        "name_th": "Test User 1",
        "email": "test1@user.com",
        "role": "evaluatee",
        "created_at": "2026-02-25T07:33:51.000Z"
      }
    ],
    "meta": {
      "total": 8,
      "page": 1,
      "pageSize": 10
    }
  }
}

```

## `TC-BE-03b_sort_desc.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "items": [
      {
        "id": 8,
        "name_th": "Test User 1",
        "email": "test1@user.com",
        "role": "evaluatee",
        "created_at": "2026-02-25T07:33:51.000Z"
      },
      {
        "id": 5,
        "name_th": "ครูเครื่องกล 01",
        "email": "t.me01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 4,
        "name_th": "ครูไอที 01",
        "email": "t.it01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 6,
        "name_th": "ครูบัญชี 01",
        "email": "t.acc01@ccollege.ac.th",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 7,
        "name_th": "New User",
        "email": "new@test.com",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:57:42.000Z"
      },
      {
        "id": 2,
        "name_th": "กรรมการประเมินเครื่องกล",
        "email": "eva.me@ccollege.ac.th",
        "role": "evaluator",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 3,
        "name_th": "กรรมการประเมินไอที",
        "email": "eva.it@ccollege.ac.th",
        "role": "evaluator",
        "created_at": "2026-02-25T03:36:21.000Z"
      },
      {
        "id": 1,
        "name_th": "ผู้ดูแลระบบ",
        "email": "admin@ccollege.ac.th",
        "role": "admin",
        "created_at": "2026-02-25T03:36:21.000Z"
      }
    ],
    "meta": {
      "total": 8,
      "page": 1,
      "pageSize": 10
    }
  }
}

```

## `TC-BE-04_pagination.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "items": [
      {
        "id": 8,
        "name_th": "Test User 1",
        "email": "test1@user.com",
        "role": "evaluatee",
        "created_at": "2026-02-25T07:33:51.000Z"
      },
      {
        "id": 7,
        "name_th": "New User",
        "email": "new@test.com",
        "role": "evaluatee",
        "created_at": "2026-02-25T03:57:42.000Z"
      }
    ],
    "meta": {
      "total": 8,
      "page": 1,
      "pageSize": 2
    }
  }
}

```

## `TC-BE-05a.json`
> **HTTP Status: ?**
```json
{"success":true,"items":[{"id":1,"topic_id":1,"code":"T1-PLAN","name_th":"แผนการจัดการเรียนรู้","description":"แผนการสอนสอดคล้องมาตรฐานและตัวชี้วัด","type":"score_1_4","weight":"1.00","min_score":1,"max_score":4,"active":1,"created_at":"2026-02-25T03:36:21.000Z","topic_name":"การจัดการเรียนการสอน"},{"id":6,"topic_id":2,"code":"T2-CHART","name_th":"แผนภูมิ/ตาราง","description":"แผนผังที่นั่ง กฎห้องเรียน ตารางเวร","type":"yes_no","weight":"1.00","min_score":1,"max_score":4,"active":1,"created_at":"2026-02-25T03:36:21.000Z","topic_name":"การบริหารจัดการชั้นเรียน"},{"id":12,"topic_id":3,"code":"T3-IDP","name_th":"แผนพัฒนาตนเอง","description":"เป้าหมาย/แนวทางพัฒนาตามสายงาน","type":"yes_no","weight":"1.00","min_score":1,"max_score":4,"active":1,"created_at":"2026-02-25T03:36:22.000Z","topic_name":"การพัฒนาตนเองและพัฒนาวิชาชีพ"}],"meta":{"total":3,"page":1,"pageSize":5}}
```

## `TC-BE-05b.json`
> **HTTP Status: ?**
```json
{"success":true,"items":[{"id":1,"topic_id":1,"code":"T1-PLAN","name_th":"แผนการจัดการเรียนรู้","description":"แผนการสอนสอดคล้องมาตรฐานและตัวชี้วัด","type":"score_1_4","weight":"1.00","min_score":1,"max_score":4,"active":1,"created_at":"2026-02-25T03:36:21.000Z","topic_name":"การจัดการเรียนการสอน"},{"id":6,"topic_id":2,"code":"T2-CHART","name_th":"แผนภูมิ/ตาราง","description":"แผนผังที่นั่ง กฎห้องเรียน ตารางเวร","type":"yes_no","weight":"1.00","min_score":1,"max_score":4,"active":1,"created_at":"2026-02-25T03:36:21.000Z","topic_name":"การบริหารจัดการชั้นเรียน"},{"id":12,"topic_id":3,"code":"T3-IDP","name_th":"แผนพัฒนาตนเอง","description":"เป้าหมาย/แนวทางพัฒนาตามสายงาน","type":"yes_no","weight":"1.00","min_score":1,"max_score":4,"active":1,"created_at":"2026-02-25T03:36:22.000Z","topic_name":"การพัฒนาตนเองและพัฒนาวิชาชีพ"}],"meta":{"total":3,"page":1,"pageSize":5}}
```

## `TC-BE-06a_login_200.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6ImFkbWluIiwibmFtZSI6IuC4nOC4ueC5ieC4lOC4ueC5geC4peC4o-C4sOC4muC4miIsImlhdCI6MTc3MjAyMTA4MywiZXhwIjoxNzcyMDI0NjgzfQ.thg5PfIiXXw0p4XNU6F8GgONPIW8KUaBPNGKQLmjlZA",
    "user": {
      "id": 1,
      "name": "ผู้ดูแลระบบ",
      "email": "admin@ccollege.ac.th",
      "role": "admin"
    }
  }
}

```

## `TC-BE-06b_notoken_401.json`
> **HTTP Status: 401**
```json
{
  "http_status": 401,
  "response": {
    "success": false,
    "message": "Missing token"
  }
}

```

## `TC-BE-07_admin_results.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": [
      {
        "id": 1,
        "period_id": 1,
        "evaluatee_id": 4,
        "evaluator_id": 3,
        "topic_id": 1,
        "indicator_id": 2,
        "score": "3.00",
        "value_yes_no": null,
        "notes": "สื่อการสอนครบถ้วน เหมาะกับผู้เรียน",
        "status": "submitted",
        "created_at": "2026-02-25T03:36:22.000Z",
        "updated_at": "2026-02-25T08:38:27.000Z",
        "submitted_at": "2026-02-25T08:38:27.000Z"
      }
    ]
  }
}

```

## `TC-BE-08a_evalr_own_200.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": [
      {
        "id": 1,
        "period_id": 1,
        "evaluatee_id": 4,
        "evaluator_id": 3,
        "topic_id": 1,
        "indicator_id": 2,
        "score": "3.00",
        "value_yes_no": null,
        "notes": "สื่อการสอนครบถ้วน เหมาะกับผู้เรียน",
        "status": "submitted",
        "created_at": "2026-02-25T03:36:22.000Z",
        "updated_at": "2026-02-25T08:38:27.000Z",
        "submitted_at": "2026-02-25T08:38:27.000Z"
      }
    ]
  }
}

```

## `TC-BE-08b_evalr_other_403.json`
> **HTTP Status: 403**
```json
{
  "http_status": 403,
  "response": {
    "error": "Forbidden"
  }
}

```

## `TC-BE-09a_evale_self_200.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": [
      {
        "id": 1,
        "period_id": 1,
        "evaluatee_id": 4,
        "evaluator_id": 3,
        "topic_id": 1,
        "indicator_id": 2,
        "score": "3.00",
        "value_yes_no": null,
        "notes": "สื่อการสอนครบถ้วน เหมาะกับผู้เรียน",
        "status": "submitted",
        "created_at": "2026-02-25T03:36:22.000Z",
        "updated_at": "2026-02-25T08:38:27.000Z",
        "submitted_at": "2026-02-25T08:38:27.000Z"
      }
    ]
  }
}

```

## `TC-BE-09b_evale_other_403.json`
> **HTTP Status: 403**
```json
{
  "http_status": 403,
  "response": {
    "error": "Forbidden"
  }
}

```

## `TC-BE-10_create.json`
> **HTTP Status: ?**
```json
{"success":true,"data":{"id":26,"period_id":1,"evaluatee_id":4,"evaluator_id":3,"topic_id":1,"indicator_id":1,"score":"3.00","value_yes_no":null,"notes":"TC-10","status":"draft","created_at":"2026-02-25T12:04:43.000Z","updated_at":"2026-02-25T12:04:43.000Z","submitted_at":null}}

```

## `TC-BE-10a_score0_400.json`
> **HTTP Status: 400**
```json
{
  "http_status": 400,
  "response": {
    "error": "Score must be between 1 and 4"
  }
}

```

## `TC-BE-10b_score5_400.json`
> **HTTP Status: 400**
```json
{
  "http_status": 400,
  "response": {
    "error": "Score must be between 1 and 4"
  }
}

```

## `TC-BE-10c_score3_200.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": {
      "id": 26,
      "period_id": 1,
      "evaluatee_id": 4,
      "evaluator_id": 3,
      "topic_id": 1,
      "indicator_id": 1,
      "score": "3.00",
      "value_yes_no": null,
      "notes": "TC-10",
      "status": "draft",
      "created_at": "2026-02-25T12:04:43.000Z",
      "updated_at": "2026-02-25T12:04:43.000Z",
      "submitted_at": null
    }
  }
}

```

## `TC-BE-11_create.json`
> **HTTP Status: ?**
```json
{"success":true,"data":{"id":27,"period_id":1,"evaluatee_id":4,"evaluator_id":3,"topic_id":1,"indicator_id":4,"score":null,"value_yes_no":1,"notes":"TC-11","status":"draft","created_at":"2026-02-25T12:04:44.000Z","updated_at":"2026-02-25T12:04:44.000Z","submitted_at":null}}

```

## `TC-BE-11_no_attach_400.json`
> **HTTP Status: 400**
```json
{
  "http_status": 400,
  "response": {
    "error": "EVIDENCE_REQUIRED"
  }
}

```

## `TC-BE-12_413.json`
> **HTTP Status: 413**
```json
{
  "http_status": 413,
  "response": {
    "success": false,
    "message": "Payload Too Large"
  }
}

```

## `TC-BE-13_415.json`
> **HTTP Status: 415**
```json
{
  "http_status": 415,
  "response": {
    "success": false,
    "message": "Unsupported file type"
  }
}

```

## `TC-BE-14_create_201.json`
> **HTTP Status: 201**
```json
{
  "http_status": 201,
  "response": {
    "success": true,
    "data": {
      "id": 16,
      "period_id": 1,
      "evaluator_id": 2,
      "evaluatee_id": 7,
      "dept_id": null,
      "created_at": "2026-02-25T12:04:44.000Z"
    }
  }
}

```

## `TC-BE-15_dup_409.json`
> **HTTP Status: 409**
```json
{
  "http_status": 409,
  "response": {
    "error": "DUPLICATE_ASSIGNMENT"
  }
}

```

## `TC-BE-16_normalized.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "period_id": 1,
    "evaluatee_id": null,
    "scoreData": {
      "totalObtained": 2.333333333333333,
      "totalMax": 3,
      "percentage": 77.7778,
      "scoreOutOf60": 46.6667,
      "byTopic": [
        {
          "topic_id": 1,
          "code": "TOP1",
          "weight": "0.30",
          "obtained": 2.3333,
          "max": 3,
          "percentage": 77.78
        },
        {
          "topic_id": 2,
          "code": "TOP2",
          "weight": "0.20",
          "obtained": 0,
          "max": 0,
          "percentage": 0
        },
        {
          "topic_id": 3,
          "code": "TOP3",
          "weight": "0.30",
          "obtained": 0,
          "max": 0,
          "percentage": 0
        },
        {
          "topic_id": 4,
          "code": "TOP4",
          "weight": "0.20",
          "obtained": 0,
          "max": 0,
          "percentage": 0
        }
      ]
    }
  }
}

```

## `TC-BE-17_progress.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": [
      {
        "department": "1",
        "submitted": 1,
        "total": 1,
        "percent": 100
      },
      {
        "department": "2",
        "submitted": 0,
        "total": 1,
        "percent": 0
      },
      {
        "department": "4",
        "submitted": 0,
        "total": 1,
        "percent": 0
      },
      {
        "department": "Unknown",
        "submitted": 0,
        "total": 1,
        "percent": 0
      }
    ]
  }
}

```

## `TC-BE-18a.json`
> **HTTP Status: ?**
```json
{"success":true,"items":[{"id":1,"period_id":1,"evaluator_id":3,"evaluatee_id":4,"dept_id":1,"created_at":"2026-02-25T03:36:22.000Z","department":1,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินไอที","evaluatee_name":"ครูไอที 01"},{"id":2,"period_id":1,"evaluator_id":2,"evaluatee_id":5,"dept_id":2,"created_at":"2026-02-25T03:36:22.000Z","department":2,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินเครื่องกล","evaluatee_name":"ครูเครื่องกล 01"},{"id":3,"period_id":1,"evaluator_id":3,"evaluatee_id":6,"dept_id":4,"created_at":"2026-02-25T03:36:22.000Z","department":4,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินไอที","evaluatee_name":"ครูบัญชี 01"},{"id":16,"period_id":1,"evaluator_id":2,"evaluatee_id":7,"dept_id":null,"created_at":"2026-02-25T12:04:44.000Z","department":null,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินเครื่องกล","evaluatee_name":"New User"}],"meta":{"total":4,"page":1,"pageSize":10}}
```

## `TC-BE-18b.json`
> **HTTP Status: ?**
```json
{"success":true,"items":[{"id":1,"period_id":1,"evaluator_id":3,"evaluatee_id":4,"dept_id":1,"created_at":"2026-02-25T03:36:22.000Z","department":1,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินไอที","evaluatee_name":"ครูไอที 01"},{"id":2,"period_id":1,"evaluator_id":2,"evaluatee_id":5,"dept_id":2,"created_at":"2026-02-25T03:36:22.000Z","department":2,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินเครื่องกล","evaluatee_name":"ครูเครื่องกล 01"},{"id":3,"period_id":1,"evaluator_id":3,"evaluatee_id":6,"dept_id":4,"created_at":"2026-02-25T03:36:22.000Z","department":4,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินไอที","evaluatee_name":"ครูบัญชี 01"},{"id":16,"period_id":1,"evaluator_id":2,"evaluatee_id":7,"dept_id":null,"created_at":"2026-02-25T12:04:44.000Z","department":null,"period_name":"การประเมินครูประจำปี 2568","evaluator_name":"กรรมการประเมินเครื่องกล","evaluatee_name":"New User"}],"meta":{"total":4,"page":1,"pageSize":10}}
```

## `TC-BE-19a_login.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Mywicm9sZSI6ImV2YWx1YXRvciIsIm5hbWUiOiLguIHguKPguKPguKHguIHguLLguKPguJvguKPguLDguYDguKHguLTguJnguYTguK3guJfguLUiLCJpYXQiOjE3NzIwMjEwODUsImV4cCI6MTc3MjAyNDY4NX0.9wldXH3Nwvu_vDSOro4Iib3G10EzsN1D0UAPM2y-cPw",
    "user": {
      "id": 3,
      "name": "กรรมการประเมินไอที",
      "email": "eva.it@ccollege.ac.th",
      "role": "evaluator"
    }
  }
}

```

## `TC-BE-19b_assignments.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "items": [
      {
        "id": 3,
        "period_id": 1,
        "evaluator_id": 3,
        "evaluatee_id": 6,
        "dept_id": 4,
        "created_at": "2026-02-25T03:36:22.000Z",
        "department": 4,
        "period_name": "การประเมินครูประจำปี 2568",
        "evaluator_name": "กรรมการประเมินไอที",
        "evaluatee_name": "ครูบัญชี 01"
      },
      {
        "id": 1,
        "period_id": 1,
        "evaluator_id": 3,
        "evaluatee_id": 4,
        "dept_id": 1,
        "created_at": "2026-02-25T03:36:22.000Z",
        "department": 1,
        "period_name": "การประเมินครูประจำปี 2568",
        "evaluator_name": "กรรมการประเมินไอที",
        "evaluatee_name": "ครูไอที 01"
      }
    ],
    "meta": {
      "total": 2,
      "page": 1,
      "pageSize": 10
    }
  }
}

```

## `TC-BE-19c_submit.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": {
      "id": 26,
      "period_id": 1,
      "evaluatee_id": 4,
      "evaluator_id": 3,
      "topic_id": 1,
      "indicator_id": 1,
      "score": "3.00",
      "value_yes_no": null,
      "notes": "TC-10",
      "status": "submitted",
      "created_at": "2026-02-25T12:04:43.000Z",
      "updated_at": "2026-02-25T12:04:45.000Z",
      "submitted_at": "2026-02-25T12:04:45.000Z"
    }
  }
}

```

## `TC-BE-19d_report.json`
> **HTTP Status: 200**
```json
{
  "http_status": 200,
  "response": {
    "success": true,
    "data": [
      {
        "department": "1",
        "submitted": 1,
        "total": 1,
        "percent": 100
      },
      {
        "department": "2",
        "submitted": 0,
        "total": 1,
        "percent": 0
      },
      {
        "department": "4",
        "submitted": 0,
        "total": 1,
        "percent": 0
      },
      {
        "department": "Unknown",
        "submitted": 0,
        "total": 1,
        "percent": 0
      }
    ]
  }
}

```

