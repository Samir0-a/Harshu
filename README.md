# Finance Portfolio & Admin Panel (MERN Stack)

A full-stack **MERN (MongoDB, Express, React, Node.js)** website built for a **Finance Analyst & Trader** with a full-featured **React Admin Dashboard** and seamless deployment configuration for **Vercel**.

---

## 🌟 Key Features

### 1. **Public Portfolio Website (React Frontend)**
- **Hero & Live Market Ticker**: Real-time interactive canvas chart and simulated tick readouts for Forex (EUR/USD), Commodities (XAU/USD Gold), Equities (S&P 500), and US 10Y Yields.
- **Dynamic Sections**:
  - **About**: Profile portrait, bio narrative, and background.
  - **Skills**: Core competencies (Financial Modelling, Technical Analysis, Risk Management, Macroeconomics) with animated progress bars (0-100 scale).
  - **Education & Experience**: Vertical timeline of degrees, institutions, roles, and achievements.
  - **Projects**: Finance research projects, DCF models, Python back-testing scripts, and Power BI dashboards with tag badges and live GitHub links.
  - **Certifications**: Badges for CFA Candidate, FMVA, Bloomberg BMC.
  - **Market Notes**: Published research articles and market perspective notes.
  - **Contact Form**: Interactive message form with honeypot spam protection and live delivery feedback.
- **Dark & Light Mode**: Built-in theme toggle stored in local browser state.

### 2. **Admin Control Panel (`/admin`)**
- **Protected JWT Auth**: Secure login powered by `bcryptjs` password hashing and signed JWT tokens.
- **Tabbed Management**:
  - **Profile**: Edit Name, Title, Tagline, Bio, Social links, and Upload Profile Photos.
  - **Section Visibility**: Enable/Disable sections dynamically.
  - **Skills, Education, Experience, Projects, Certs, Notes**: Add, edit, or delete entries dynamically.
  - **Inbox**: View incoming contact form submissions, mark as read, and delete messages.
  - **Security**: Change admin password with instant validation.

### 3. **MongoDB Backend & Vercel Serverless API**
- **Mongoose ORM**: Connected to MongoDB (MongoDB Atlas in production or local MongoDB for dev).
- **Graceful Hybrid Fallback**: Runs smoothly out of the box even before connecting MongoDB Atlas.
- **Vercel Ready**: `vercel.json` rewrites serverless functions (`api/index.js`) and static React SPA build automatically.

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js**: v18.x or higher
- **MongoDB**: Local MongoDB instance (or MongoDB Atlas connection URI)

### 1. Clone & Install Dependencies

```bash
# Install root backend dependencies
npm install

# Install client React dependencies
npm run build --prefix client
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/finance_portfolio
ADMIN_PASSWORD=ChangeMe123!
JWT_SECRET=your_jwt_secret_key
```

### 3. Run Development Server

To run the backend server and React Vite client in development:

```bash
# Terminal 1: Backend Server (Port 5000)
npm run dev

# Terminal 2: Client Dev Server (Port 3000)
npm run dev:client
```

Open your browser at:
- **Public Site**: [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **Default Admin Password**: `ChangeMe123!`

---

## ☁️ How to Deploy to Vercel

Deploying this MERN app to Vercel takes less than 2 minutes:

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Commit your repository to GitHub.

### Step 2: Import Project in Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Import your `finance-portfolio` repository.

### Step 3: Configure Environment Variables in Vercel
In the Vercel project configuration screen, add the following **Environment Variables**:
- `MONGODB_URI`: Your MongoDB Atlas connection string (e.g. `mongodb+srv://user:pass@cluster.mongodb.net/finance_portfolio?retryWrites=true&w=majority`)
- `ADMIN_PASSWORD`: Your secret admin password (e.g. `MySecurePass2026!`)
- `JWT_SECRET`: A random secret key string.

### Step 4: Click Deploy!
Vercel will automatically run `npm run build --prefix client`, outputting the React SPA to `client/dist`, and host your Express API serverless functions under `/api/index.js`.

---

## 📁 Project Architecture

```
finance-portfolio/
├── api/
│   └── index.js              # Vercel serverless function entrypoint
├── backend/
│   ├── config/
│   │   └── db.js             # Mongoose MongoDB connection & fallback
│   ├── models/
│   │   ├── Portfolio.js      # Mongoose Schema for Portfolio Data
│   │   ├── Admin.js          # Mongoose Schema for Admin Credentials
│   │   └── Message.js        # Mongoose Schema for Contact Messages
│   ├── controllers/          # Business logic controllers
│   ├── routes/               # Express API routes (/api/...)
│   ├── middleware/           # JWT auth middleware & rate limiters
│   ├── seedData.js           # Initial default portfolio dataset
│   └── app.js                # Main Express App instance
├── client/                   # React Frontend (Vite + React 18)
│   ├── src/
│   │   ├── components/       # Hero, TickerChart, Skills, Contact, Navbar, etc.
│   │   ├── pages/            # PortfolioPage, AdminLogin, AdminDashboard
│   │   ├── context/          # ThemeContext & AuthContext
│   │   └── styles/           # CSS design system & admin styles
│   └── vite.config.js        # Vite config with API proxy
├── server.js                 # Standalone local Node entrypoint
├── vercel.json               # Vercel deployment routing & build spec
├── package.json              # Root dependencies & build scripts
└── README.md
```

---

## 🔒 Default Admin Credentials
- **URL**: `/admin`
- **Default Password**: `ChangeMe123!` *(Change immediately in Admin > Security)*
