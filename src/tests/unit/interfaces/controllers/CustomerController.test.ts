import { Request, Response } from "express";
import { CustomerController } from "../../../../interfaces/controllers/CustomerController";
import { CustomerService } from "../../../../application/CustomerService";
import { InMemoryCustomerRepository } from "../../../../infrastructure/persistence/repositories/InMemoryCustomerRepository";
import { Customer } from "../../../../domain/Customer";
import { InvalidEmailFormatException } from "../../../../exceptions/InvalidEmailFormatException";
import { InvalidTypeException } from "../../../../exceptions/InvalidTypeException";
import { EmailAlreadyInUseException } from "../../../../exceptions/EmailAlreadyInUseException";
import { EmptyNameException } from "../../../../exceptions/EmptyNameException";
import { NameTooShortException } from "../../../../exceptions/NameTooShortException";
import { CustomerNotFoundException } from "../../../../exceptions/CustomerNotFoundException";
import { NegativeCreditAmountException } from "../../../../exceptions/NegativeCreditAmountException";
import { InvalidSortOrderException } from "../../../../exceptions/InvalidSortOrderException";

describe("CustomerController", () => {
  let customerService: CustomerService;
  let customerController: CustomerController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    const customerRepository = new InMemoryCustomerRepository();
    customerService = new CustomerService(customerRepository);
    customerController = new CustomerController(customerService);

    // Mocking express response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    };

    // Mocking express request object
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("CustomerController - Create Customer", () => {
    it("should create a new customer", async () => {
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      const mockCustomer = new Customer(
        "1234567890abcdefghijklmn",
        "John Doe",
        "john.doe@example.com",
        1000
      );

      jest.spyOn(customerService, "create").mockResolvedValue(mockCustomer);

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCustomer);
    });

    it("should return 400 if email format is invalid when creating a customer", async () => {
      mockRequest.body = {
        name: "John Doe",
        email: "invalid-email-format",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(new InvalidEmailFormatException());

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid email format.",
      });
    });

    it("should return 400 if email input type is invalid when creating a customer", async () => {
      const invalidEmail = 12345;
      mockRequest.body = {
        name: "John Doe",
        email: invalidEmail,
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(
          new InvalidTypeException("email", "string", invalidEmail)
        );

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property email: expected string, but received number.",
      });
    });

    it("should return 409 if email is already in use when creating a customer", async () => {
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(new EmailAlreadyInUseException());

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Email is already in use.",
      });
    });

    it("should return 400 if name is invalid type when creating a customer", async () => {
      const invalidName = 123;
      mockRequest.body = {
        name: invalidName,
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(
          new InvalidTypeException("name", "string", invalidName)
        );

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property name: expected string, but received number.",
      });
    });

    it("should return 400 if name is empty when creating a customer", async () => {
      mockRequest.body = {
        name: "",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(new EmptyNameException());

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Name cannot be empty.",
      });
    });

    it("should return 400 if name is too short when creating a customer", async () => {
      mockRequest.body = {
        name: "Jo",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(new NameTooShortException());

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Name must be at least 3 characters long.",
      });
    });

    it("should return 400 if availableCredit is invalid type when creating a customer", async () => {
      const invalidAvailableCredit = "one thousand";
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: invalidAvailableCredit,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(
          new InvalidTypeException(
            "availableCredit",
            "number",
            invalidAvailableCredit
          )
        );

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property availableCredit: expected number, but received string.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when creating customer: Unexpected error",
      });
    });
  });

  describe("CustomerController - List Customers", () => {
    it("should list all customers", async () => {
      const mockCustomers = [
        new Customer("1234567890abcdefghijklmn", "John Doe", "john.doe@example.com", 1000),
        new Customer("23456789a", "Jane Doe", "jane.doe@example.com", 2000),
      ];

      // Mocking the list method of customerService
      jest.spyOn(customerService, "list").mockResolvedValue(mockCustomers);

      await customerController.listCustomers(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCustomers);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "list")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.listCustomers(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when retrieving customers: Unexpected error",
      });
    });

    it("should return the custom error message and status when a custom exception is thrown", async () => {
      // Forces the throwing of a custom exception
      jest
        .spyOn(customerService, "list")
        .mockRejectedValue(new CustomerNotFoundException());

      await customerController.listCustomers(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });
  });

  describe("CustomerController - Get Customer", () => {
    it("should get a customer by ID", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };

      const mockCustomer = new Customer(
        "1234567890abcdefghijklmn",
        "John Doe",
        "john.doe@example.com",
        1000
      );

      // Mocking the findById method of customerService
      jest.spyOn(customerService, "findById").mockResolvedValue(mockCustomer);

      await customerController.getCustomerById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCustomer);
    });

    it("should return 404 when customer not found", async () => {
      mockRequest.params = { id: "1234567890abcdefghijklmn" };

      jest
        .spyOn(customerService, "findById")
        .mockRejectedValue(new CustomerNotFoundException());

      await customerController.getCustomerById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return a 404 error when a customer is not found by findby", async () => {
      mockRequest.params = { id: "1234567890abcdefghijklmn" };

      jest.spyOn(customerService, "findById").mockResolvedValue(undefined);

      await customerController.getCustomerById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return 400 when customer id is not valid", async () => {
      mockRequest.params = { id: "invalid-id" };

      jest
        .spyOn(customerService, "findById")
        .mockRejectedValue(
          new InvalidTypeException("id", "string", mockRequest.params.id)
        );

      await customerController.getCustomerById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received string.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      mockRequest.params = { id: "1234567890abcdefghijklmn" };

      jest
        .spyOn(customerService, "findById")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.getCustomerById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred while retrieving the customer: Unexpected error",
      });
    });
  });

  describe("CustomerController - Update Customer", () => {
    it("should update a customer", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "John Updated",
        email: "john.updated@example.com",
        availableCredit: 1500,
      };

      const updatedCustomer = new Customer(
        "1234567890abcdefghijklmn",
        "John Updated",
        "john.updated@example.com",
        1500
      );

      // Mocking the update method of customerService
      jest.spyOn(customerService, "update").mockResolvedValue(updatedCustomer);

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedCustomer);
    });

    it("should return 404 when updating a non-existing customer", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new CustomerNotFoundException());

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return 404 when updating a customer with invalid id", async () => {
      const invalidId = "invalid-id";
      mockRequest.params = { id: invalidId };
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new InvalidTypeException("id", "string", invalidId));

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received string.",
      });
    });

    it("should return 400 when updating with no valid credit", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: "not-a-number",
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(
          new InvalidTypeException(
            "availableCredit",
            "number",
            mockRequest.body.availableCredit
          )
        );

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property availableCredit: expected number, but received string.",
      });
    });

    it("should return 400 if name is not a string", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: 123,
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(
          new InvalidTypeException("name", "string", mockRequest.body.name)
        );

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property name: expected string, but received number.",
      });
    });

    it("should return 400 if name is empty", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new EmptyNameException());

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Name cannot be empty.",
      });
    });

    it("should return 400 if name is shorter than 3 characters", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "Jo",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new NameTooShortException());

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Name must be at least 3 characters long.",
      });
    });

    it("should return 400 if email is not in a valid format", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "John Doe",
        email: "invalid-email-format",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new InvalidEmailFormatException());

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid email format.",
      });
    });

    it("should return 409 if email is already in use", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new EmailAlreadyInUseException());

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(409);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Email is already in use.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.updateCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when updating customer: Unexpected error",
      });
    });
  });

  describe("CustomerController - Delete Customer", () => {
    it("should delete a customer", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };

      // Mocking the delete method of customerService
      jest.spyOn(customerService, "delete").mockResolvedValue(undefined);

      await customerController.deleteCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(204);
      expect(mockResponse.send).toHaveBeenCalled();
    });

    it("should return 400 if id is not a string", async () => {
      mockRequest.params = { id: "123" }; // Use a valid ID but as a string to start

      // Changes the value of id to an invalid type
      const invalidId = 123; // ID as a number to simulate an incorrect type
      jest
        .spyOn(customerService, "delete")
        .mockRejectedValue(new InvalidTypeException("id", "string", invalidId));

      await customerController.deleteCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received number.",
      });
    });

    it("should return 400 if id is invalid", async () => {
      const invalidId = "invalid-id";
      mockRequest.params = { id: invalidId };

      jest
        .spyOn(customerService, "delete")
        .mockRejectedValue(new InvalidTypeException("id", "string", invalidId));

      await customerController.deleteCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received string.",
      });
    });

    it("should return 404 when deleting a non-existing customer", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };

      jest
        .spyOn(customerService, "delete")
        .mockRejectedValue(new CustomerNotFoundException());

      await customerController.deleteCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const customerId = "1234567890abcdefghijklmn";
      mockRequest.params = { id: customerId };

      jest
        .spyOn(customerService, "delete")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.deleteCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when deleting customer: Unexpected error",
      });
    });
  });

  describe("CustomerController - Add credit", () => {
    it("should add credit to a customer", async () => {
      // Create the client initially
      mockRequest.body = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 1000,
      };

      const mockCustomer = new Customer(
        "1234567890abcdefghijklmn",
        "John Doe",
        "john.doe@example.com",
        1000
      );

      // Simulate the creation of the client
      jest.spyOn(customerService, "create").mockResolvedValue(mockCustomer);

      await customerController.createCustomer(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockCustomer);

      // Now we are going to add credit to the customer
      const customerId = "1234567890abcdefghijklmn";
      const creditToAdd = 100;
      mockRequest.body = { id: customerId, amount: creditToAdd };

      // Simulate that the client is in the repository
      jest
        .spyOn(customerService["customerRepository"], "findById")
        .mockResolvedValue(mockCustomer);

      // Simulate updating the customer after adding credit
      const updatedCustomer = new Customer(
        customerId,
        "John Doe",
        "john.doe@example.com",
        mockCustomer.getAvailableCredit() + creditToAdd
      );

      // Mock the update method to return the updated client
      jest
        .spyOn(customerService["customerRepository"], "update")
        .mockResolvedValue(updatedCustomer);

      // Mock the addCredit method of the customerservice
      jest
        .spyOn(customerService, "addCredit")
        .mockImplementation(async (id, amount) => {
          mockCustomer.addCredit(amount);
          return updatedCustomer;
        });

      // Run the handler to add credit
      await customerController.addCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(updatedCustomer);
    });

    it("should return 404 when adding credit to a non-existing customer", async () => {
      const customerId = "1234567890abcdefghijklmn";
      const creditToAdd = 100;
      mockRequest.params = { id: customerId };
      mockRequest.body = { credit: creditToAdd };

      jest
        .spyOn(customerService, "addCredit")
        .mockRejectedValue(new CustomerNotFoundException());

      await customerController.addCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return 400 when adding credit to a customer with invalid id", async () => {
      const invalidId = "invalid-id";
      const creditToAdd = 100;
      mockRequest.params = { id: invalidId };
      mockRequest.body = { credit: creditToAdd };

      jest
        .spyOn(customerService, "addCredit")
        .mockRejectedValue(new InvalidTypeException("id", "string", invalidId));

      await customerController.addCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received string.",
      });
    });

    it("should return 452 when adding negative credit", async () => {
      const customerId = "1234567890abcdefghijklmn";
      const negativeCredit = -50;
      mockRequest.params = { id: customerId };
      mockRequest.body = { credit: negativeCredit };

      jest
        .spyOn(customerService, "addCredit")
        .mockRejectedValue(new NegativeCreditAmountException());

      await customerController.addCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(452);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Credit amount cannot be negative.",
      });
    });

    it("should return 400 when adding invalid credit", async () => {
      const customerId = "1234567890abcdefghijklmn";
      const invalidCredit = "invalid";
      mockRequest.params = { id: customerId };
      mockRequest.body = { credit: invalidCredit };

      jest
        .spyOn(customerService, "addCredit")
        .mockRejectedValue(
          new InvalidTypeException("credit", "number", invalidCredit)
        );

      await customerController.addCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property credit: expected number, but received string.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const customerId = "1234567890abcdefghijklmn";
      const creditToAdd = 100;
      mockRequest.params = { id: customerId };
      mockRequest.body = { credit: creditToAdd };

      jest
        .spyOn(customerService, "addCredit")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.addCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "An unknown error occurred when adding credit: Unexpected error",
      });
    });
  });

  describe("CustomerController - sortCustomersByCredit", () => {
    const mockRequest = {
      query: {},
    } as Request;

    const mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    const sortedCustomersMock = [
      new Customer("1234567890abcdefghijklmn", "Customer One", "one@example.com", 300),
      new Customer("23456789a", "Customer Two", "two@example.com", 200),
      new Customer("34567890a", "Customer Three", "three@example.com", 100),
    ];

    beforeEach(() => {
      jest
        .spyOn(customerService, "sortCustomersByCredit")
        .mockResolvedValue(sortedCustomersMock);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it("should return 200 and a sorted list of customers when order is 'asc'", async () => {
      mockRequest.query = { order: "asc" };

      await customerController.sortCustomersByCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(sortedCustomersMock);
    });

    it("should return 200 and a sorted list of customers with default order 'desc' when no order is provided", async () => {
      await customerController.sortCustomersByCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(sortedCustomersMock);
    });

    it("should return 200 and a sorted list of customers when order is 'desc'", async () => {
      mockRequest.query = { order: "desc" };

      await customerController.sortCustomersByCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(sortedCustomersMock);
    });

    it("should return 400 if order is invalid in should list all customers", async () => {
      mockRequest.query = { order: "invalid" };

      jest
        .spyOn(customerService, "sortCustomersByCredit")
        .mockRejectedValue(new InvalidSortOrderException());

      await customerController.sortCustomersByCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid sort order. Use 'asc' or 'desc'.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "sortCustomersByCredit")
        .mockRejectedValue(new Error("Unexpected error"));

      await customerController.sortCustomersByCredit(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred while sorting customers by credit: Unexpected error",
      });
    });
  });
});
