import mongoose from 'mongoose'

const connectDB = async () => {
  try {
    const connectionOptions = {
      // Use the new MongoDB driver's stable API
      useNewUrlParser: true,
      useUnifiedTopology: true,
      
      // Connection pool settings
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferMaxEntries: 0, // Disable mongoose buffering
      bufferCommands: false, // Disable mongoose buffering
      
      // Additional options for production
      retryWrites: true,
      w: 'majority',
    }

    // MongoDB connection string from environment variables
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopify-dashboard'

    // Connect to MongoDB
    const conn = await mongoose.connect(mongoURI, connectionOptions)

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`)
    
    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('📡 Mongoose connected to MongoDB')
    })

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

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close()
    console.log('📡 Database connection closed gracefully')
  } catch (error) {
    console.error('❌ Error during database shutdown:', error)
  }
}

export {
  connectDB,
  checkDBHealth,
  gracefulShutdown
}
