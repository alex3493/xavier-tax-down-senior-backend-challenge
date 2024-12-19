import { CustomerRepositoryInterface } from "../domain/repositories/CustomerRepositoryInterface";
import { Customer } from "../domain/Customer";
import { ValidationUtils } from "../utils/ValidationUtils";
import { CustomerNotFoundException } from "../exceptions/CustomerNotFoundException";

export class CustomerService {
  constructor(private customerRepository: CustomerRepositoryInterface) {}

  /**
   * Generates a random ID for new customer.
   * We use joined basic random strings (10-chars log) to get 24-char long ID.
   * @private
   */
  private generateUniqueId(): string {
    const parts = [
      Math.random().toString(36).substring(2),
      Math.random().toString(36).substring(2),
      Math.random().toString(36).substring(2)
    ]
    return parts.join("").substring(0, 24);
  }

  /**
   * Creates a new customer with the given name, email, and available credit.
   * Only checks that the email is not already in use.
   * @param {string} name - The customer's name
   * @param {string} email - The customer's email
   * @param {number} availableCredit - The customer's available credit
   * @returns {Promise<Customer>} - The newly created customer
   */
  async create(
    name: string,
    email: string,
    availableCredit: number
  ): Promise<Customer> {
    // Check if the email is already in use
    await ValidationUtils.validateEmailNotInUse(email, this.customerRepository);

    // Create a new Customer object (validation occurs in the Customer constructor)
    const customer = new Customer(
      // Generated ID will be replaced with "insertedId" when storing in MongoDB.
      this.generateUniqueId(),
      name,
      email,
      availableCredit
    );

    // Save the new customer to the repository and return it
    return await this.customerRepository.create(customer);
  }

  /**
   * Retrieves a list of all customers from the repository.
   * @returns {Promise<Customer[]>} - A list of all customers
   */
  async list(): Promise<Customer[]> {
    return this.customerRepository.findAll();
  }

  /**
   * Retrieves a customer by their ID.
   * @param {string} id - The ID of the customer to find
   * @returns {Promise<Customer | undefined>} - The found customer if successful, or undefined if not
   */
  async findById(id: string): Promise<Customer | undefined> {
    await ValidationUtils.validateCustomerExists(id, this.customerRepository);
    return this.customerRepository.findById(id);
  }

  /**
   * Updates a customer by ID with the given name, email, and/or available credit.
   * Performs input validation and checks that the email is not already in use.
   * @param {string} id - ID of the customer to update
   * @param {string} [name] - The customer's new name
   * @param {string} [email] - The customer's new email
   * @param {number} [availableCredit] - The customer's new available credit
   * @returns {Promise<Customer>} - The updated customer
   */
  async update(
    id: string,
    name?: string,
    email?: string,
    availableCredit?: number
  ): Promise<Customer> {
    await ValidationUtils.validateCustomerExists(id, this.customerRepository);

    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new CustomerNotFoundException();
    }

    // Validate and update properties only if provided
    if (name !== undefined && customer.getName() !== name) {
      customer.setName(name);
    }

    if (email !== undefined && customer.getEmail() !== email) {
      await ValidationUtils.validateEmailNotInUse(
        email,
        this.customerRepository
      );
      customer.setEmail(email);
    }

    if (availableCredit !== undefined && customer.getAvailableCredit() !== availableCredit) {
      customer.setAvailableCredit(availableCredit);
    }

    // Save the updated customer
    await this.customerRepository.update(customer);
    return customer;
  }

  /**
   * Deletes a customer by ID.
   * @param {string} id - ID of the customer to delete
   * @returns {Promise<void>} - Resolves when the customer is deleted
   */
  async delete(id: string): Promise<void> {
    await ValidationUtils.validateCustomerExists(id, this.customerRepository);
    await this.customerRepository.delete(id);
  }

  /**
   * Adds the given amount to the customer's available credit.
   * @param {string} id - ID of the customer to add credit to
   * @param {number} amount - Amount of credit to add (must be positive)
   * @returns {Promise<Customer>} - The updated customer if successful
   */
  async addCredit(id: string, amount: number): Promise<Customer> {
    await ValidationUtils.validateCustomerExists(id, this.customerRepository);

    const customer = await this.customerRepository.findById(id);
    if (!customer) {
      throw new CustomerNotFoundException();
    }

    customer.addCredit(amount);
    await this.customerRepository.update(customer);
    return customer;
  }

  /**
   * Retrieves a list of all customers sorted by their available credit.
   * @param {string} [order="desc"] - The order to sort the customers by (either "asc" or "desc")
   * @returns {Promise<Customer[]>} - A promise that resolves to an array of customers sorted by available credit
   */
  async sortCustomersByCredit(order: string = "desc"): Promise<Customer[]> {
    const validOrder = ValidationUtils.validateSortOrder(order);
    const customers = await this.customerRepository.findAll();

    return customers.sort((a, b) => {
      return validOrder === "asc"
        ? a.getAvailableCredit() - b.getAvailableCredit()
        : b.getAvailableCredit() - a.getAvailableCredit();
    });
  }
}
