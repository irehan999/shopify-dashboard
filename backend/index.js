require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const cookieParser = require('cookie-parser')
const { shopifyApi } = require('@shopify/shopify-api')
const { MongoDBSessionStorage } = require('@shopify/shopify-app-session-storage-mongodb')

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_dashboard', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'MongoDB connection error:'))
db.once('open', () => {
  console.log('Connected to MongoDB')
})

// Initialize Shopify API
const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: ['read_products', 'write_products', 'read_orders', 'write_orders'],
  hostName: process.env.SHOPIFY_APP_URL,
  hostScheme: 'https',
  apiVersion: '2025-01',
  isEmbeddedApp: false,
  sessionStorage: new MongoDBSessionStorage(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify_dashboard',
    'shopify_sessions'
  ),
})

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Shopify OAuth routes
app.get('/api/auth/shopify', async (req, res) => {
  try {
    const { shop } = req.query
    
    if (!shop) {
      return res.status(400).json({ error: 'Shop parameter is required' })
    }

    // Clean shop domain
    const shopDomain = shop.replace(/^https?:\/\//, '').replace(/\/$/, '')
    
    const authRoute = await shopify.auth.begin({
      shop: shopDomain,
      callbackPath: '/api/auth/shopify/callback',
      isOnline: false,
      rawRequest: req,
      rawResponse: res,
    })

    res.redirect(authRoute)
  } catch (error) {
    console.error('Auth error:', error)
    res.status(500).json({ error: 'Authentication failed' })
  }
})

app.get('/api/auth/shopify/callback', async (req, res) => {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: res,
    })

    // Store session info in database (you might want to create a Store model)
    console.log('Session created:', callback.session)

    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/stores?connected=true`)
  } catch (error) {
    console.error('Callback error:', error)
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/stores?error=auth_failed`)
  }
})

// API Routes
app.use('/api/stores', require('./routes/stores'))
app.use('/api/products', require('./routes/products'))
app.use('/api/webhooks', require('./routes/webhooks'))

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
})

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📱 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
  console.log(`🛍️  Shopify App URL: ${process.env.SHOPIFY_APP_URL}`)
})
