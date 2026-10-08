# Finance Portfolio

A responsive React portfolio with an Express API and MongoDB persistence.

## Connect MongoDB

The backend reads `MONGODB_URI` from the project root `.env` file. MongoDB is required for changes to survive a server restart; without a working connection, the API clearly reports that it is using temporary in-memory data.

### MongoDB Atlas

1. Create a cluster in MongoDB Atlas and create a database user with read and write access.
2. In Atlas Network Access, allow the IP address where this app will run. For deployment, configure the deployment provider's outbound IP policy.
3. Copy the cluster connection string. Replace `<db_password>` with the database user's password (URL-encode special characters) and use `finance_portfolio` as the database name.
4. Copy `.env.example` to `.env`, then set `MONGODB_URI`, `ADMIN_PASSWORD`, and `JWT_SECRET` to your own values. Never commit `.env` or share it publicly.
5. Restart the backend. Check `http://localhost:5000/api/status`; `{"database":"connected"}` confirms MongoDB is active. If it says `fallback`, check the URI, database user, network access, and server log, then restart.

### Local MongoDB

Install and start MongoDB locally, then set `MONGODB_URI=mongodb://localhost:27017/finance_portfolio` in `.env`.

## Run the app

Install dependencies with `npm install` in the project root. Start the API with `npm run dev` and the frontend in another terminal with `npm run dev:frontend`. The development site runs at `http://localhost:3000` and proxies API requests to port 5000. For a production build, run `npm run build`, then start the backend with `npm start`.
