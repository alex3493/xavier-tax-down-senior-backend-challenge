import { MongoDBCustomerRepository } from "../../../../../infrastructure/persistence/repositories/MongoDBCustomerRepository";
import { Customer } from "../../../../../domain/Customer";
import { CustomerNotFoundException } from "../../../../../exceptions/CustomerNotFoundException";
import dotenv from "dotenv";
import { MongoClient, ObjectId, MongoNotConnectedError } from "mongodb";

// Load environment variables from .env.test
dotenv.config({ path: ".env.test" });

describe("MongoDBCustomerRepository", () => {
  let mongoDBCustomerRepository: MongoDBCustomerRepository;
  let client: MongoClient;

  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
  const dbName = process.env.DB_NAME || "motorbike-shop-api-test";
  const collectionName = "customers";

  beforeAll(async () => {
    client = new MongoClient(uri);
    await client.connect();
    mongoDBCustomerRepository = new MongoDBCustomerRepository(
      uri,
      dbName,
      collectionName
    );
    await client.db(dbName).createCollection(collectionName); // Create the collection for testing
  });

  beforeEach(async () => {
    await client.db(dbName).collection(collectionName).deleteMany({}); // Clean the collection before each test
  });

  afterAll(async () => {
    await client.db(dbName).collection(collectionName).drop(); // Delete the test collection
    await client.close(); // Disconnect after testing
  });

  it("should confirm client is connected", async () => {
    const result = await client.db(dbName).command({ ping: 1 });
    expect(result).toHaveProperty("ok", 1);
  });

  // TODO: Check why this test is skipped.
  it.skip("should disconnect from Mongo", async () => {
    await mongoDBCustomerRepository.disconnect();

    await expect(client.db(dbName).collection(collectionName).findOne({}))
      .rejects.toThrow(MongoNotConnectedError);
  });

  it("should create a new customer", async () => {
    const customer = new Customer(
      new ObjectId().toString(),
      "John Doe",
      "john@example.com",
      100
    );
    const createdCustomer = await mongoDBCustomerRepository.create(customer);
    expect(createdCustomer).toEqual(
      expect.objectContaining({
        name: "John Doe",
        email: "john@example.com",
        availableCredit: 100,
      })
    );
  });

  it("should find a customer by ID", async () => {
    const customerId = "1234";
    const customer = new Customer(
      customerId,
      "John Doe",
      "john@example.com",
      100
    );
    const newCustomer = await mongoDBCustomerRepository.create(customer);
    const foundCustomer = await mongoDBCustomerRepository.findById(newCustomer.getId());
    expect(foundCustomer).toEqual(
      expect.objectContaining({
        id: newCustomer.getId(), // Adjust this if you are returning a different ID format
        name: "John Doe",
        email: "john@example.com",
        availableCredit: 100,
      })
    );
  });

  it("should throw CustomerNotFoundException when customer not found by ID", async () => {
    await expect(
      mongoDBCustomerRepository.findById(new ObjectId().toString())
    ).rejects.toThrow(CustomerNotFoundException);
  });

  it("should find a customer by email", async () => {
    const customerId = '1234';
    const customer = new Customer(
      customerId,
      "John Doe",
      "john@example.com",
      100
    );
    const newCustomer = await mongoDBCustomerRepository.create(customer);
    const foundCustomer = await mongoDBCustomerRepository.findByEmail(
      "john@example.com"
    );
    expect(foundCustomer).toEqual(
      expect.objectContaining({
        id: newCustomer.getId(),
        name: "John Doe",
        email: "john@example.com",
        availableCredit: 100,
      })
    );
  });

  it("should return undefined if customer not found by email", async () => {
    const foundCustomer = await mongoDBCustomerRepository.findByEmail(
      "non-existent-email@example.com"
    );
    expect(foundCustomer).toBeUndefined();
  });

  it("should update a customer", async () => {
    const customerId = '1234';
    const customer = new Customer(
      customerId,
      "John Doe",
      "john@example.com",
      100
    );
    const newCustomer = await mongoDBCustomerRepository.create(customer);
    newCustomer.setName("Jane Doe");
    const updatedCustomer = await mongoDBCustomerRepository.update(newCustomer);
    expect(updatedCustomer.getName()).toBe("Jane Doe");
  });

  it("should throw CustomerNotFoundException when updating non-existent customer", async () => {
    const customer = new Customer(
      new ObjectId().toString(),
      "John Doe",
      "john@example.com",
      100
    );
    await expect(mongoDBCustomerRepository.update(customer)).rejects.toThrow(
      CustomerNotFoundException
    );
  });

  it("should delete a customer", async () => {
    const customerId = '1234';
    const customer = new Customer(
      customerId,
      "John Doe",
      "john@example.com",
      100
    );
    const newCustomer = await mongoDBCustomerRepository.create(customer);
    await mongoDBCustomerRepository.delete(newCustomer.getId());
    await expect(
      mongoDBCustomerRepository.findById(newCustomer.getId())
    ).rejects.toThrow(CustomerNotFoundException);
  });

  it("should throw CustomerNotFoundException when deleting a non-existent customer", async () => {
    const nonExistentCustomerId = new ObjectId().toString();
    await expect(mongoDBCustomerRepository.delete(nonExistentCustomerId)).rejects.toThrow(CustomerNotFoundException);
  });

  it("should find customers with available credit greater than or equal to the given amount", async () => {
    const customer1 = new Customer(
      '1234',
      "John Doe",
      "john@example.com",
      100
    );
    const customer2 = new Customer(
      '2345',
      "Jane Doe",
      "jane@example.com",
      50
    );
    const newCustomer1 = await mongoDBCustomerRepository.create(customer1);
    await mongoDBCustomerRepository.create(customer2);
    const customers = await mongoDBCustomerRepository.findByAvailableCredit(60);
    expect(customers).toEqual([
      expect.objectContaining({
        id: newCustomer1.getId(), // Adjust this if necessary
        name: "John Doe",
        email: "john@example.com",
        availableCredit: 100,
      }),
    ]);
  });

  it("should clear all customers", async () => {
    const customerId = new ObjectId().toString();
    const customer = new Customer(
      customerId,
      "John Doe",
      "john@example.com",
      100
    );
    await mongoDBCustomerRepository.create(customer);
    await mongoDBCustomerRepository.clear();
    await expect(
      mongoDBCustomerRepository.findById(customerId)
    ).rejects.toThrow(CustomerNotFoundException);
  });

  it("should retrieve all customers", async () => {
    const customer1 = new Customer(new ObjectId().toString(), "John Doe", "john@example.com", 100);
    const customer2 = new Customer(new ObjectId().toString(), "Jane Doe", "jane@example.com", 150);
    await mongoDBCustomerRepository.create(customer1);
    await mongoDBCustomerRepository.create(customer2);

    const customers = await mongoDBCustomerRepository.findAll();
    expect(customers).toHaveLength(2);
    expect(customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "John Doe" }),
        expect.objectContaining({ name: "Jane Doe" }),
      ])
    );
  });
});
