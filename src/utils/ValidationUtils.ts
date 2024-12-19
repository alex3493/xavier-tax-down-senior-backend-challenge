import { CustomerRepositoryInterface } from "../domain/repositories/CustomerRepositoryInterface";
import { InvalidEmailFormatException } from "../exceptions/InvalidEmailFormatException";
import { EmailAlreadyInUseException } from "../exceptions/EmailAlreadyInUseException";
import { CustomerNotFoundException } from "../exceptions/CustomerNotFoundException";
import { NegativeCreditAmountException } from "../exceptions/NegativeCreditAmountException";
import { EmptyNameException } from "../exceptions/EmptyNameException";
import { NameTooShortException } from "../exceptions/NameTooShortException";
import { InvalidTypeException } from "../exceptions/InvalidTypeException";
import { InvalidSortOrderException } from "../exceptions/InvalidSortOrderException";

export class ValidationUtils {
  /**
   * Validates the provided name to ensure it is not empty and meets the minimum length requirement.
   * Throws EmptyNameException if the name is empty.
   * Throws NameTooShortException if the name is shorter than 3 characters.
   */
  static validateName(name: string): void {
    if (typeof name !== "string") {
      throw new InvalidTypeException("name", "string", name);
    }
    if (!name || name.trim().length === 0) {
      throw new EmptyNameException();
    }
    if (name.length < 3) {
      throw new NameTooShortException();
    }
  }

  /**
   * Validates the format of the provided email.
   * Throws InvalidEmailFormatException if the email is not in the correct format.
   * @param {string} email - The email to validate format
   */
  static validateEmailFormat(email: string): void {
    if (typeof email !== "string") {
      throw new InvalidTypeException("email", "string", email);
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new InvalidEmailFormatException();
    }
  }

  /**
   * Checks if the provided email is already in use in the repository.
   * Throws EmailAlreadyInUseException if the email is already in use.
   * @param {string} email - The email to check
   * @param {CustomerRepositoryInterface} customerRepository - The repository to check for existing customers
   */
  static async validateEmailNotInUse(
    email: string,
    customerRepository: CustomerRepositoryInterface
  ): Promise<void> {
    const existingCustomer = await customerRepository.findByEmail(email);
    if (existingCustomer) {
      throw new EmailAlreadyInUseException();
    }
  }


  /**
   * Validates that the provided customer id exists in the repository.
   * Throws InvalidTypeException if the id is not a string containing exactly 9 alphanumeric characters.
   * Throws CustomerNotFoundException if the customer does not exist.
   * @param {string} id - The id of the customer to check
   * @param {CustomerRepositoryInterface} customerRepository - The repository to check for existing customers
   */
  static async validateCustomerExists(
    id: string,
    customerRepository: CustomerRepositoryInterface
  ): Promise<void> {
    if (typeof id !== "string") {
      throw new InvalidTypeException("id", "string", id);
    }
    // TODO: This check fails when we are using "database" storage for customers.
    // MongoDB insertedId has different format (more than 9 chars).
    if (!/^[a-z0-9]{9}$/.test(id)) {
      throw new InvalidTypeException(
        "id",
        "string containing exactly 9 alphanumeric characters",
        id
      );
    }
    const existingCustomer = await customerRepository.findById(id);
    if (!existingCustomer) {
      throw new CustomerNotFoundException();
    }
  }

  /**
   * Validates that the given amount is of type number.
   * Throws InvalidTypeException if the amount is not a number.
   * @param {number} amount - The amount to validate
   */
  static validateAmount(amount: number): void {
    if (typeof amount !== "number" || isNaN(amount)) {
      throw new InvalidTypeException("amount", "number", amount);
    }
  }

  /**
   * Validates that the given amount is a positive number.
   * Throws NegativeCreditAmountException if the amount is negative.
   * @param {number} amount - The amount of credit to validate
   */
  static validateAvailableCredit(amount: number): void {
    this.validateAmount(amount); // Ensure it's a number first
    if (amount < 0) {
      throw new NegativeCreditAmountException();
    }
  }

  /**
   * Validates the given sort order to ensure it is either "asc" or "desc".
   * Returns "desc" if the order is undefined.
   * Throws InvalidSortOrderException if the order is not valid.
   * @param {string | undefined} order - The order to validate
   * @returns {"asc" | "desc"} - The validated order
   */
  static validateSortOrder(order: string | undefined): "asc" | "desc" {
    if (order === undefined) {
      return "desc";
    }
    if (order === "asc" || order === "desc") {
      return order as "asc" | "desc";
    }
    throw new InvalidSortOrderException();
  }
}
