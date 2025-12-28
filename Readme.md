🛒 E-Commerce Backend API (Node.js + MongoDB)

This project is a backend-only E-Commerce application built to deeply understand real-world backend problems such as authentication, authorization, stock handling, payments, concurrency, email notifications, and API testing.

The goal of this project was learning-by-building, focusing not just on “working code” but on correct design decisions used in production systems.

🚀 Tech Stack

Node.js

Express.js

MongoDB (Mongoose)

JWT Authentication

Razorpay (Test Mode)

SendGrid (Emails)

Postman (Collections + Runner)

Cloudinary (Image Uploads)

✨ Features Implemented
👤 Authentication & Authorization

User registration & login

Admin registration & login

JWT-based authentication

Role-based access (Admin vs User)

📦 Product Management (Admin)

Upload product with image

Cloudinary image storage

Prevent duplicate product creation

Soft delete (isDeleted) support

Proper HTTP status codes

🛍️ Order Management (User)

Place order with:

Cash On Delivery

Razorpay (Card / UPI – Test Mode)

Stock availability validation

Prevent ordering deleted products

Automatic stock deduction

Out-of-stock detection

💳 Payment Handling (Razorpay – Test Mode)

Razorpay order creation

Manual payment simulation (no frontend)

Signature generation & verification

Payment success / failure handling

Payment status stored with order

Note: Frontend Razorpay Checkout UI is replaced with a backend simulation to understand how signature verification actually works.

📧 Email Notifications (SendGrid)

Order confirmation mail to user

Order details mail to admin

Out-of-stock alert to admin

HTML-based email templates

⭐ Reviews & Ratings

User can submit:

Rating (0–5)

Text review

Reviews stored with username

Rating calculated dynamically

🧪 API Testing & Simulation (Postman)

Created Postman Collection

Used Environment Variables for:

JWT tokens

Product IDs

User/Admin credentials

Executed Collection Runner

Multiple iterations

Simulated multiple users

Tested:

Success cases

Validation failures

Authorization failures

Stock conflicts

🧠 Key Learnings (Important)
✅ HTTP Status Codes (Correct Usage)

400 → Bad Request (validation errors)

401 → Unauthorized

403 → Forbidden

404 → Resource not found

409 → Conflict (stock issues)

410 → Gone (soft-deleted product)

402 → Payment Required (payment failure)

201 → Resource created

500 → Internal server error

⚠️ Concurrency & Overselling Problem

Identified a real-world issue:

Multiple users ordering the same product at the same time can oversell stock.

Explored Solutions:

$inc atomic updates for counters/stock

MongoDB transactions using replica sets

Replica set + transactions were explored and understood, but intentionally not implemented in this version to keep the project simple. The concept is clearly understood and will be used in future projects.

📌 Rule of Thumb Learned

Single document update → Use $inc

Multiple documents / payment + stock → Use transactions

🔧 Improvements Planned (Future Scope)

MongoDB transactions with replica sets

Payment webhooks (Razorpay)

Pagination & search

Rate limiting

Centralized error handling

TypeScript migration

Frontend integration

Better rating aggregation

Admin dashboard

📎 Postman Resources

Postman Collection (attached in LinkedIn post)

Collection Runner used with 2+ iterations

Covers valid & invalid API scenarios

📌 Project Status

✅ Functional
✅ Tested
✅ Real-world backend concepts explored
🚧 Advanced features planned for future projects

👨‍💻 Author

Madhu Appala Narasimha
Backend Developer | Node.js | MongoDB
