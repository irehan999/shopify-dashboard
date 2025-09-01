import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const connectionOptions = {
      // Basic connection options only
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }

    // MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify-dashboard'

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, connectionOptions)

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    
    // Connection event listeners
    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err)
    })

    mongoose.connection.on('disconnected', () => {
      console.log('📡 Mongoose disconnected from MongoDB')
    })

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close()
      console.log('📡 Mongoose connection closed due to application termination')
      process.exit(0)
    })

    return conn

  } catch (error) {
    console.error('❌ Database connection failed:', error.message)
    process.exit(1)
  }
}

// Database connection health check
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    
    return {
      status: states[state],
      state,
      isConnected: state === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    }
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      isConnected: false
    }
  }
}

export {
  connectDB,
  checkDBHealth
}
