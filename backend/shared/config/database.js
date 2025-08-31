const mongoose = require('mongoose');
const { Pool } = require('pg');
const Redis = require('ioredis');
const config = require('./index');

class DatabaseManager {
  constructor() {
    this.mongoConnection = null;
    this.pgPool = null;
    this.redisClient = null;
  }

  async connectMongoDB() {
    try {
      await mongoose.connect(config.database.mongodb.uri, config.database.mongodb.options);
      this.mongoConnection = mongoose.connection;
      console.log('✅ MongoDB connected successfully');
      return this.mongoConnection;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  createPostgreSQLPool() {
    try {
      this.pgPool = new Pool({
        connectionString: config.database.postgresql.uri,
        ...config.database.postgresql.options
      });
      console.log('✅ PostgreSQL pool created successfully');
      return this.pgPool;
    } catch (error) {
      console.error('❌ PostgreSQL pool creation failed:', error.message);
      throw error;
    }
  }

  createRedisClient() {
    try {
      this.redisClient = new Redis(config.database.redis.uri, config.database.redis.options);
      console.log('✅ Redis client created successfully');
      return this.redisClient;
    } catch (error) {
      console.error('❌ Redis client creation failed:', error.message);
      throw error;
    }
  }

  async connectAll() {
    try {
      await this.connectMongoDB();
      this.createPostgreSQLPool();
      this.createRedisClient();
      console.log('🎉 All databases connected successfully');
    } catch (error) {
      console.error('💥 Database connection failed:', error.message);
      throw error;
    }
  }
}

module.exports = new DatabaseManager();
