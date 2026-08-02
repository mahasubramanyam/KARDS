# Kards — REST API Reference

Base URL: `http://localhost:8000` · API prefix: `/api/v1` · Interactive docs: `/docs` (OpenAPI: `/openapi.json`).

## Auth model

- `POST /auth/register` → create account (role: `volunteer` | `ngo` | `company`). Sends email-verification link.
- `POST /auth/login` → `{ access_token, refresh_token, expires_in }`. Requires verified email.
- `POST /auth/refresh` → rotating refresh tokens; reuse detection revokes the whole family.
- `POST /auth/logout`, `POST /auth/verify-email`, `POST /auth/resend-verification`, `POST /auth/forgot-password`, `POST /auth/reset-password`.

Access tokens: JWT (15 min). Authenticated requests use `Authorization: Bearer <access_token>`.
White-label requests use `X-API-Key: <plain_key>`.

## Error shape

All errors return `{"error": {"code", "message", "detail"}}` with appropriate HTTP status (401/403/404/409/422/429/402/500).

## Endpoints by module

### Auth — `/auth`
| Method | Path | Notes |
|---|---|---|
| POST | /register | 201, returns user |
| POST | /login | returns token pair |
| POST | /refresh | rotates refresh token |
| POST | /logout | revokes refresh token |
| POST | /verify-email | body `{token}` |
| POST | /resend-verification | body `{email}` |
| POST | /forgot-password | body `{email}` |
| POST | /reset-password | body `{token, new_password}` |

### Users / profiles — `/users`
| Method | Path | Notes |
|---|---|---|
| GET | /me | profile (user + role profile) |
| PATCH | /me/volunteer | update volunteer profile |
| PATCH | /me/ngo | update NGO profile |
| PATCH | /me/company | update company profile |
| PATCH | /me/locale | set locale (en/hi/ta) |

### NGO verification — `/verification`
| Method | Path | Notes |
|---|---|---|
| POST | /documents | multipart upload (NGO own docs) |
| GET | /documents | my verification documents |
| POST | /submit | submit for verification (doc_ids) |
| GET | /status | latest verification request |
| GET | /score | CSR-Ready score breakdown |
| GET | /queue | admin: pending queue |
| POST | /queue/{id}/review | admin: approve/reject |
| GET | /scores/{ngo_id} | admin: score detail |

### CSR (company + NGO) — `/csr`
| Method | Path | Notes |
|---|---|---|
| PUT | /budget | upsert annual budget + allocations |
| GET | /budgets | my budgets |
| GET | /budgets/{id}/allocations | allocations |
| POST | /projects | create project |
| GET | /projects | list (page) |
| GET | /projects/{id} | detail |
| PATCH | /projects/{id} | update |
| POST | /projects/{id}/activate | draft → active |
| POST | /projects/{id}/complete | active → completed |
| POST | /projects/{id}/invite | invite NGO partner |
| GET | /projects/{id}/partnerships | partnership list |
| GET | /partnerships | NGO: my partnerships |
| POST | /partnerships/{id}/respond | accept/decline |
| POST | /opportunities | NGO: create |
| GET | /opportunities | NGO: mine (page) |
| GET | /opportunities/{id} | detail |
| PATCH | /opportunities/{id} | update |
| POST | /opportunities/{id}/publish | draft → published |
| POST | /opportunities/{id}/close | close |

### Volunteering — `/volunteering`
| Method | Path | Notes |
|---|---|---|
| POST | /applications | volunteer applies |
| GET | /applications/mine | my applications |
| POST | /applications/{id}/withdraw | withdraw pending |
| GET | /applications/opportunity/{id} | NGO: applicants |
| POST | /applications/{id}/decide | accept/reject |
| POST | /worklogs | volunteer logs hours |
| GET | /worklogs/pending | NGO: pending approval |
| POST | /worklogs/{id}/approve | approve |
| POST | /worklogs/{id}/reject | reject |
| POST | /opportunities/{id}/certificates?volunteer_id=… | issue certificate |
| POST | /opportunities/{id}/complete | complete + auto-issue |
| GET | /certificates/mine | my certificates |

### Reports — `/reports`
| Method | Path | Notes |
|---|---|---|
| POST | /reports | request report (queued, async) — 422 `no_report_data` if empty |
| GET | /reports | list (page) |
| GET | /reports/{id} | status/data |
| POST | /reports/{id}/finalize | mark final |
| GET | /reports/{id}/download | PDF |

### Billing — `/billing`
| Method | Path | Notes |
|---|---|---|
| GET | /plans | plan catalog (seeded) |
| POST | /subscribe | start trial subscription |
| GET | /subscription | my active subscription |
| GET | /invoices | my invoices |
| POST | /webhook/{provider} | idempotent gateway webhook |

### Messaging — `/messaging`
| Method | Path | Notes |
|---|---|---|
| POST | /threads | create/get subject thread |
| GET | /threads | my threads |
| GET | /threads/{id} | thread + messages |
| POST | /threads/{id}/messages | send |
| POST | /threads/{id}/read | mark read |

### Disputes — `/disputes`
| Method | Path | Notes |
|---|---|---|
| POST | /disputes | file dispute |
| GET | /disputes/mine | my disputes |
| GET | /disputes/{id} | detail |
| GET | /disputes/admin/queue | admin queue |
| POST | /disputes/admin/{id}/resolve | admin resolve |

### Admin — `/admin`
| Method | Path | Notes |
|---|---|---|
| GET | /users | list users (role/search) |
| POST | /users/{id}/deactivate | deactivate |
| POST | /users/{id}/activate | activate |
| GET | /audit-logs | audit trail |

### API keys — `/api-keys`
| Method | Path | Notes |
|---|---|---|
| POST | /api-keys | create (returns plain key once) |
| GET | /api-keys | list |
| POST | /api-keys/{id}/revoke | revoke |

### White-label partner API — `/partner` (uses `X-API-Key`)
| Method | Path | Notes |
|---|---|---|
| GET | /me | company profile |
| GET | /projects | company projects |
| GET | /opportunities | linked opportunities |
| GET | /certificates | issued certificates |

### Notifications — `/notifications`
| Method | Path | Notes |
|---|---|---|
| GET | /notifications | list |
| GET | /notifications/unread-count | count |
| POST | /notifications/{id}/read | mark read |
| POST | /notifications/read-all | mark all read |

### Uploads (evidence) — `/uploads`
| Method | Path | Notes |
|---|---|---|
| POST | /uploads | multipart; subject ∈ {project_evidence, expense_receipt, attendance_sheet, message_attachment} |

### Public — `/public`
| Method | Path | Notes |
|---|---|---|
| GET | /opportunities | published opportunities (filters: category, remote, search) |
| GET | /opportunities/{id} | published detail |
| GET | /certificates/verify?code=… | certificate verification |

### System
| Method | Path | Notes |
|---|---|---|
| GET | /health | db + redis + env status |

## Async workers (Celery)

| Task | Trigger |
|---|---|
| `app.workers.reports.generate_report` | on report request → compiles data → renders PDF → stores |
| `app.workers.billing.sweep_overdue_invoices` | hourly (beat) |
| `app.workers.billing.sweep_expired_subscriptions` | every 6h (beat) |
| `app.workers.billing.meter_success_fees` | monthly metering |
| `app.workers.mail.send_mail` | async email send |

## Empty-state contract

No seeded user/business data exists. Listing endpoints return real DB rows only; empty collections return `items: []`, `total: 0`. Report generation rejects periods with no approved hours / evidence (`422 no_report_data`).
