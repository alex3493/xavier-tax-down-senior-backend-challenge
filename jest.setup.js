process.env.NODE_ENV = 'test'
/*
This is a workaround. Looks like .env.test file is not read when we run tests.
Here we override settings from .env that are specific for testing.
*/

// Default repository storage for all tests is "memory".
// In src/infrastructure/persistence/repositories/MongoDBCustomerRepository.ts we force database storage, so the setting
// below is ignored.
process.env.REPOSITORY_STORAGE = 'memory'
// We include database URI here just for reference, it's the same as in .env file: in Docker we should connect to
// other containers by container name instead of IP.
process.env.MONGODB_URI = 'mongodb://mongo_db:27017'
// Use specific database for testing.
process.env.DB_NAME = 'motorbike-shop-api-test'