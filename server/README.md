# Travel Bucket List Server

A Node.js/Express.js REST API for managing travel bucket list destinations with user authentication.

## Features

- User registration and authentication with JWT
- CRUD operations for travel destinations
- User-specific data (each user can only see their own destinations)
- Password hashing with bcryptjs
- MongoDB integration with Mongoose

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - MongoDB ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variables

## Installation

1. Make sure you have Node.js and MongoDB installed
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/travel_bucket_list
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   ```

4. Start MongoDB service
5. Run the server:
   ```bash
   # Development mode (with nodemon)
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user info (requires auth)

### Destinations
- `GET /api/destinations` - Get all destinations for authenticated user
- `GET /api/destinations/:id` - Get specific destination
- `POST /api/destinations` - Create new destination
- `PUT /api/destinations/:id` - Update destination
- `DELETE /api/destinations/:id` - Delete destination
- `PATCH /api/destinations/:id/visited` - Toggle visited status

## Data Models

### User
```javascript
{
  email: String (required, unique)
  fullName: String (required)
  password: String (required, hashed)
  timestamps: true
}
```

### Destination
```javascript
{
  title: String (required)
  description: String (required)
  country: String (required)
  city: String (required)
  visited: Boolean (default: false)
  priority: String (enum: 'low', 'medium', 'high')
  estimatedCost: Number
  bestTimeToVisit: String
  notes: String
  imageUrl: String
  user: ObjectId (reference to User)
  timestamps: true
}
```

## Development

To run in development mode with automatic restart:
```bash
npm run dev
```

The server will start on `http://localhost:5000` by default.
