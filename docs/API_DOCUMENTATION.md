# Hotel Management Software – REST API Documentation

Base URL: `http://localhost:4000/api/v1`  
Swagger UI: `http://localhost:4000/api/docs`  
Authentication: JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 1. Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/auth/login` | Admin login with username/email & password | No |
| `GET` | `/auth/status` | Current authentication mode & status | No |

---

## 2. Admin Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/dashboard/stats` | Real-time live room, stay, guest & revenue figures | Yes |
| `GET` | `/dashboard/recent-bookings` | List recent reservations (query: `limit`) | Yes |
| `GET` | `/dashboard/recent-activities` | List recent system audit logs (query: `limit`) | Yes |
| `GET` | `/dashboard/occupancy-stats` | Room type breakdown of occupancy | Yes |

---

## 3. Guests (`/api/v1/guests`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/guests` | Paginated guest directory (query: `search`, `page`, `limit`) | Yes |
| `GET` | `/guests/:id` | Single guest profile with stay history & documents | Yes |
| `POST` | `/guests` | Register new guest profile | Yes |
| `PATCH` | `/guests/:id` | Update guest details | Yes |
| `POST` | `/guests/:id/documents` | Add identity document reference | Yes |
| `DELETE` | `/guests/:id/documents/:docId` | Delete identity document reference | Yes |

---

## 4. Room Types & Rooms (`/api/v1/room-types`, `/api/v1/rooms`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/room-types` | List all room categories with room counts | Yes |
| `POST` | `/room-types` | Create room category | Yes |
| `PATCH` | `/room-types/:id` | Update room category | Yes |
| `DELETE` | `/room-types/:id` | Delete empty room category | Yes |
| `GET` | `/rooms` | List room inventory (filters: `status`, `roomTypeId`, `floor`) | Yes |
| `GET` | `/rooms/available` | Date-range availability query (`checkIn`, `checkOut`, `roomTypeId`) | Yes |
| `GET` | `/rooms/:id` | Room details with current stay | Yes |
| `POST` | `/rooms` | Add room to inventory | Yes |
| `PATCH` | `/rooms/:id` | Update room details | Yes |
| `PATCH` | `/rooms/:id/status` | Change room status (`AVAILABLE`, `OCCUPIED`, `MAINTENANCE`) | Yes |
| `DELETE` | `/rooms/:id` | Deactivate room | Yes |

---

## 5. Bookings (`/api/v1/bookings`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/bookings` | List bookings with search and status filters | Yes |
| `GET` | `/bookings/:id` | Single booking with primary guest, room & invoices | Yes |
| `POST` | `/bookings` | Create reservation (with GiST collision protection & advance payment) | Yes |
| `PATCH` | `/bookings/:id` | Update booking details | Yes |
| `PATCH` | `/bookings/:id/cancel` | Cancel reservation (releases allocated room) | Yes |

---

## 6. Stays Operations (`/api/v1/stays`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/stays/today-check-ins` | Today's expected arrival list | Yes |
| `GET` | `/stays/today-check-outs` | Today's expected departure list | Yes |
| `GET` | `/stays/active` | All currently in-house checked-in guests | Yes |
| `POST` | `/stays/:id/check-in` | Check in guest (booking -> CHECKED_IN, room -> OCCUPIED) | Yes |
| `POST` | `/stays/:id/check-out` | Check out guest (booking -> CHECKED_OUT, room -> AVAILABLE) | Yes |
| `POST` | `/stays/:id/relocate` | Relocate guest to another room transactionally | Yes |

---

## 7. Items & Services (`/api/v1/items`, `/api/v1/item-categories`, `/api/v1/booking-items`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/item-categories` | List catalog categories | Yes |
| `POST` | `/item-categories` | Create catalog category | Yes |
| `GET` | `/items` | List catalog items with category & search filter | Yes |
| `POST` | `/items` | Create catalog item | Yes |
| `PATCH` | `/items/:id` | Update catalog item | Yes |
| `DELETE` | `/items/:id` | Deactivate catalog item | Yes |
| `GET` | `/booking-items/booking/:id` | List items and room service ordered for a booking | Yes |
| `POST` | `/booking-items` | Charge item or room service to a booking | Yes |
| `DELETE` | `/booking-items/:id` | Remove an item charge | Yes |

---

## 8. Billing & Invoices (`/api/v1/invoices`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/invoices` | List invoices with status & search filters | Yes |
| `GET` | `/invoices/:id` | Detailed bill breakdown with line items and payments | Yes |
| `GET` | `/invoices/booking/:id` | Invoices for a specific booking | Yes |
| `POST` | `/invoices/generate` | Generate & finalize bill with discount & tax | Yes |
| `PATCH` | `/invoices/:id/cancel` | Cancel an unpaid invoice | Yes |

---

## 9. Payments (`/api/v1/payments`)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `GET` | `/payments` | List payment ledger entries (filters: `method`, `status`) | Yes |
| `GET` | `/payments/:id` | Payment details | Yes |
| `GET` | `/payments/booking/:id` | Payments for a booking | Yes |
| `POST` | `/payments` | Record payment & update invoice balance | Yes |
