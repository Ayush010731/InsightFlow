# AI-Powered Data Analyst Agent (MERN)

A starter full-stack project built with React + Tailwind CSS, Node.js + Express, and MongoDB.
This version focuses on the MERN foundation first. The n8n agent is intentionally **not connected yet**;
we will integrate your existing n8n workflow through a protected server-side webhook in a later step.

## Features in this starter
- Register/login with JWT authentication
- Dashboard overview with sample KPIs and charts
- CSV upload and basic dataset profiling (rows, columns, missing values, numeric summaries)
- Chat UI with demo responses (not connected to OpenAI/n8n yet)
- Responsive sidebar and navigation
- Server-side validation and security middleware

## Requirements
- Node.js 20+ recommended
- MongoDB Community Server running locally OR a MongoDB Atlas connection string
- npm

## 1. Set up the backend
```bash
cd server
npm install
```
Copy `.env.example` to `.env`, then update `MONGODB_URI` and `JWT_SECRET`.
```bash
npm run dev
```
Backend defaults to `http://localhost:5000`.

## 2. Set up the frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```
Frontend defaults to `http://localhost:5173`.

## 3. First use
1. Open `http://localhost:5173`.
2. Create an account using the Register page.
3. Upload a CSV file from the Datasets page.
4. Explore the dashboard and try the chat demo.

## Important notes
- CSV files are processed in memory and only dataset metadata/profile summaries are saved in MongoDB. Raw uploaded files are not persisted.
- This is a development starter, not production-hardened. Before deployment, add stronger validation, tests, monitoring, and a production secrets strategy.
- Chat replies are demo responses in this phase. In the next phase, we will add an n8n Webhook node to a duplicate of your existing workflow and connect the Express backend to it. Your existing OpenAI, Simple Memory, Google Sheets, and Gmail nodes will be preserved.
