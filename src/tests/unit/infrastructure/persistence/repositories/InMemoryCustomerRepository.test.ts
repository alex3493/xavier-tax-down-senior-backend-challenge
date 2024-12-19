import { InMemoryCustomerRepository } from "../../../../../infrastructure/persistence/repositories/InMemoryCustomerRepository";
import { Customer } from "../../../../../domain/Customer";
import { CustomerNotFoundException } from "../../../../../exceptions/CustomerNotFoundException";

describe("InMemoryCustomerRepository", () => {
  let repository: InMemoryCustomerRepository;

  beforeEach(() => {
    repository = new InMemoryCustomerRepository();
  });

  it("should create a new customer", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    const createdCustomer = await repository.create(customer);
    expect(createdCustomer).toEqual(customer);
  });

  it("should find all customers", async () => {
    const customer1 = new Customer("1", "John Doe", "john@example.com", 100);
    const customer2 = new Customer("2", "Jane Doe", "jane@example.com", 150);
    await repository.create(customer1);
    await repository.create(customer2);
    const customers = await repository.findAll();
    expect(customers).toEqual([customer1, customer2]);
  });

  it("should find a customer by ID", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    await repository.create(customer);
    const foundCustomer = await repository.findById("1");
    expect(foundCustomer).toEqual(customer);
  });

  it("should return undefined if customer not found by ID", async () => {
    const foundCustomer = await repository.findById("1234567890abcdefghijklmn");
    expect(foundCustomer).toBeUndefined();
  });

  it("should find a customer by email", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    await repository.create(customer);
    const foundCustomer = await repository.findByEmail("john@example.com");
    expect(foundCustomer).toEqual(customer);
  });

  it("should return undefined if customer not found by email", async () => {
    const foundCustomer = await repository.findByEmail(
      "nonexistent@example.com"
    );
    expect(foundCustomer).toBeUndefined();
  });

  it("should update a customer", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    await repository.create(customer);
    customer.setName("Jane Doe");
    const updatedCustomer = await repository.update(customer);
    expect(updatedCustomer.getName()).toBe("Jane Doe");
  });

  it("should throw CustomerNotFoundException when updating non-existent customer", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    await expect(repository.update(customer)).rejects.toThrow(
      CustomerNotFoundException
    );
  });

  it("should delete a customer", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    await repository.create(customer);
    await repository.delete("1");
    const foundCustomer = await repository.findById("1");
    expect(foundCustomer).toBeUndefined();
  });

  it("should find customers with available credit greater than or equal to the given amount", async () => {
    const customer1 = new Customer("1", "John Doe", "john@example.com", 100);
    const customer2 = new Customer("2", "Jane Doe", "jane@example.com", 50);
    await repository.create(customer1);
    await repository.create(customer2);
    const customers = await repository.findByAvailableCredit(60);
    expect(customers).toEqual([customer1]);
  });

  it("should clear all customers", async () => {
    const customer = new Customer("1", "John Doe", "john@example.com", 100);
    await repository.create(customer);
    await repository.clear();
    const foundCustomer = await repository.findById("1");
    expect(foundCustomer).toBeUndefined();
  });
});
