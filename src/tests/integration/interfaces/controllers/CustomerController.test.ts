import { Request, Response } from "express";
import { CustomerController } from "../../../../interfaces/controllers/CustomerController";
import { CustomerService } from "../../../../application/CustomerService";
import { InMemoryCustomerRepository } from "../../../../infrastructure/persistence/repositories/InMemoryCustomerRepository";
import { Customer } from "../../../../domain/Customer";
import { CustomerNotFoundException } from "../../../../exceptions/CustomerNotFoundException";
import { ValidationUtils } from "../../../../utils/ValidationUtils";

describe("CustomerController Integration Tests with InMemoryCustomerRepository", () => {
  let customerController: CustomerController;
  let customerService: CustomerService;
  let customerRepository: InMemoryCustomerRepository;

  beforeEach(() => {
    customerRepository = new InMemoryCustomerRepository();
    customerService = new CustomerService(customerRepository);
    customerController = new CustomerController(customerService);
  });

  describe("CustomerController - Create Customer", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should return 201 and the created customer", async () => {
      const req = {
        body: {
          name: "Customer Four",
          email: "four@example.com",
          availableCredit: 400,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Customer Four",
          email: "four@example.com",
          availableCredit: 400,
        })
      );

      // Verify that the client was saved to the in-memory repository
      const customerInRepo = await customerRepository.findByEmail(
        "four@example.com"
      );
      expect(customerInRepo).toBeDefined();
      expect(customerInRepo?.getName()).toBe("Customer Four");
    });

    it("should return 201 and the created customer without availableCredit", async () => {
      const req = {
        body: {
          name: "Customer Four",
          email: "four@example.com",
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Customer Four",
          email: "four@example.com",
          availableCredit: 0,
        })
      );

      // Verify that the client was saved to the in-memory repository
      const customerInRepo = await customerRepository.findByEmail(
        "four@example.com"
      );
      expect(customerInRepo).toBeDefined();
      expect(customerInRepo?.getName()).toBe("Customer Four");
    });

    it("should return 400 if email format is invalid when creating a customer", async () => {
      const req = {
        body: {
          name: "Invalid Email Customer",
          email: "invalid-email-format",
          availableCredit: 500,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email format.",
      });
    });

    it("should return 400 if email input type is invalid when creating a customer", async () => {
      const req = {
        body: {
          name: "Invalid Type Customer",
          email: 12345,
          availableCredit: 600,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property email: expected string, but received number.",
      });
    });

    it("should return 409 if email is already in use when creating a customer", async () => {
      await customerRepository.create(
        new Customer(
          "1234567890abcdefghijklmn",
          "Existing Customer",
          "existing@example.com",
          700
        )
      );

      const req = {
        body: {
          name: "New Customer",
          email: "existing@example.com", // Already used email
          availableCredit: 800,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email is already in use.",
      });
    });

    it("should return 400 if name is invalid type when creating a customer", async () => {
      const req = {
        body: {
          name: 12345,
          email: "valid@example.com",
          availableCredit: 900,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property name: expected string, but received number.",
      });
    });

    it("should return 400 if name is empty when creating a customer", async () => {
      const req = {
        body: {
          name: "",
          email: "emptyname@example.com",
          availableCredit: 1000,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name cannot be empty.",
      });
    });

    it("should return 400 if name is too short when creating a customer", async () => {
      const req = {
        body: {
          name: "ab",
          email: "shortname@example.com",
          availableCredit: 1100,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name must be at least 3 characters long.",
      });
    });

    it("should return 400 if availableCredit is invalid type when creating a customer", async () => {
      const req = {
        body: {
          name: "Customer Credit",
          email: "credit@example.com",
          availableCredit: "notANumber",
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property amount: expected number, but received string.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const req = {
        body: {
          name: "Customer Error",
          email: "error@example.com",
          availableCredit: 1200,
        },
      } as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulates an unexpected error in the repository
      const originalCreateMethod =
        customerRepository.create.bind(customerRepository);
      customerRepository.create = jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      await customerController.createCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when creating customer: Unexpected error",
      });

      // Restore the original method after testing
      customerRepository.create = originalCreateMethod;
    });
  });

  describe("CustomerController - List Customers", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should return 200 and a list of customers", async () => {
      // Create test clients in the in-memory repository
      await customerRepository.create(
        new Customer("1234567890abcdefghijklmn", "Customer One", "one@example.com", 100)
      );
      await customerRepository.create(
        new Customer("23456789a", "Customer Two", "two@example.com", 200)
      );

      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.listCustomers(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: "Customer One",
            email: "one@example.com",
            availableCredit: 100,
          }),
          expect.objectContaining({
            name: "Customer Two",
            email: "two@example.com",
            availableCredit: 200,
          }),
        ])
      );
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulates an unexpected error in the repository
      const originalFindAllMethod =
        customerRepository.findAll.bind(customerRepository);
      customerRepository.findAll = jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      await customerController.listCustomers(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when retrieving customers: Unexpected error",
      });

      // Restore the original method after testing
      customerRepository.findAll = originalFindAllMethod;
    });

    it("should return the custom error message and status when a custom exception is thrown", async () => {
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulate a custom exception
      const originalFindAllMethod =
        customerRepository.findAll.bind(customerRepository);
      customerRepository.findAll = jest.fn().mockImplementationOnce(() => {
        throw new CustomerNotFoundException();
      });

      await customerController.listCustomers(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });

      // Restore the original method after testing
      customerRepository.findAll = originalFindAllMethod;
    });
  });

  describe("CustomerController - Get Customer", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should get a customer by ID", async () => {
      // Clean the in-memory repository before each test
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = { params: { id: "1234567890abcdefghijklmn" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Customer One",
          email: "one@example.com",
          availableCredit: 100,
        })
      );
    });

    it("should return 404 when customer not found", async () => {
      const req = { params: { id: "1234567890abcdefghijklmn" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return a 404 error when a customer is not found", async () => {
      // Simulate that the customerService findById method returns undefined
      const originalFindByIdMethod =
        customerService.findById.bind(customerService);
      customerService.findById = jest.fn().mockReturnValue(undefined);

      const req = { params: { id: "1234567890abcdefghijklmn" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });

      // Restaurar el método original después de la prueba
      customerService.findById = originalFindByIdMethod;
    });

    it("should return 400 when customer id is not valid", async () => {
      const req = { params: { id: "invalid-id" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const req = { params: { id: "1234567890abcdefghijklmn" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulates an unexpected error in the repository
      const originalFindByIdMethod =
        customerRepository.findById.bind(customerRepository);
      customerRepository.findById = jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      await customerController.getCustomerById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred while retrieving the customer: Unexpected error",
      });

      // Restore the original method after testing
      customerRepository.findById = originalFindByIdMethod;
    });
  });

  describe("CustomerController - Update Customer", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should update a customer", async () => {
      // Create an initial client in the database
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: {
          name: "Updated Customer",
          email: "oneUpdated@example.com",
          availableCredit: 150,
        },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "1234567890abcdefghijklmn",
          name: "Updated Customer",
          email: "oneUpdated@example.com",
          availableCredit: 150,
        })
      );

      const updatedCustomer = await customerRepository.findById("1234567890abcdefghijklmn");
      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer!.getAvailableCredit()).toBe(150);
      expect(updatedCustomer!.getName()).toBe("Updated Customer");
    });

    it("should return 404 when updating a non-existing customer", async () => {
      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: { name: "Updated Customer", availableCredit: 150 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return 404 when updating a non-existing customer in findBy", async () => {
      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: { name: "Updated Customer", availableCredit: 150 },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulates that findById returns undefined
      const originalFindByIdMethod =
        customerRepository.findById.bind(customerRepository);
      customerRepository.findById = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve(undefined));

      // Mock validateCustomerExists so that it doesn't throw an exception
      const originalValidateCustomerExists =
        ValidationUtils.validateCustomerExists;
      ValidationUtils.validateCustomerExists = jest
        .fn()
        .mockResolvedValue(undefined);

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });

      // Restore the original method after testing
      customerRepository.findById = originalFindByIdMethod;
      ValidationUtils.validateCustomerExists = originalValidateCustomerExists;
    });

    it("should throw CustomerNotFoundException when updating a customer that does not exist in the repository", async () => {
      // Create a valid customer to mock the update call
      const customer = new Customer(
        "1234567890abcdefghijklmn", // This ID will not exist in the in-memory repository
        "Valid Customer",
        "valid@example.com",
        100
      );

      // Mock validateCustomerExists to simulate that the customer exists
      const originalValidateCustomerExists =
        ValidationUtils.validateCustomerExists;
      ValidationUtils.validateCustomerExists = jest
        .fn()
        .mockResolvedValue(undefined); // Simulate no error for validation

      // Mock findById to return a valid customer
      const originalFindByIdMethod =
        customerRepository.findById.bind(customerRepository);
      customerRepository.findById = jest.fn().mockResolvedValue(customer); // Return the mocked valid customer

      // Mock validateEmailNotInUse to simulate a valid email
      const originalValidateEmailNotInUse =
        ValidationUtils.validateEmailNotInUse;
      ValidationUtils.validateEmailNotInUse = jest
        .fn()
        .mockResolvedValue(undefined);

      const req = {
        params: { id: "1234567890abcdefghijklmn" }, // ID that will lead to CustomerNotFoundException
        body: {
          name: "Updated Customer",
          email: "new@example.com",
          availableCredit: 200,
        },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });

      // Restore original methods after testing
      ValidationUtils.validateCustomerExists = originalValidateCustomerExists;
      customerRepository.findById = originalFindByIdMethod;
      ValidationUtils.validateEmailNotInUse = originalValidateEmailNotInUse;
    });

    it("should return 404 when updating a customer with invalid id", async () => {
      const req = {
        params: { id: "invalid-id" },
        body: { name: "Updated Customer", availableCredit: 150 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string.",
      });
    });

    it("should return 400 if name is not a string", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: { name: 123, availableCredit: 150 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property name: expected string, but received number.",
      });
    });

    it("should return 400 if name is empty", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: { name: "", availableCredit: 150 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name cannot be empty.",
      });
    });

    it("should return 400 if name is shorter than 3 characters", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: { name: "A", availableCredit: 150 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Name must be at least 3 characters long.",
      });
    });

    it("should return 400 if email is not in a valid format", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: {
          name: "Updated Customer",
          email: "invalid-email",
          availableCredit: 150,
        },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid email format.",
      });
    });

    it("should return 409 if email is already in use", async () => {
      const customerOne = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      const customerTwo = new Customer(
        "23456789a",
        "Customer Two",
        "two@example.com",
        200
      );
      await customerRepository.create(customerOne);
      await customerRepository.create(customerTwo);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: {
          name: "Updated Customer",
          email: "two@example.com",
          availableCredit: 150,
        },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: "Email is already in use.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
        body: { name: "Updated Customer", availableCredit: 150 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulate an unexpected error in the repository
      const originalUpdateMethod =
        customerRepository.update.bind(customerRepository);
      customerRepository.update = jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      await customerController.updateCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when updating customer: Unexpected error",
      });

      // Restore the original method after testing
      customerRepository.update = originalUpdateMethod;
    });
  });

  describe("CustomerController - Delete Customer", () => {
    it("should return 204 when customer is successfully deleted", async () => {
      const customer = await customerRepository.create(
        new Customer(
          "1234567890abcdefghijklmn",
          "Customer to Delete",
          "delete@example.com",
          150
        )
      );

      const req = { params: { id: customer.getId() } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      } as unknown as Response;

      await customerController.deleteCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();

      // Verify that the client was removed from the in-memory repository
      const customerInRepo = await customerRepository.findById(
        customer.getId()
      );
      expect(customerInRepo).toBeUndefined();
    });

    it("should return 400 if id is not a string", async () => {
      const req = { params: { id: 12345 } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.deleteCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received number.",
      });
    });

    it("should return 400 if id is invalid", async () => {
      const req = { params: { id: "invalid-id" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.deleteCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string.",
      });
    });

    it("should return 404 when deleting a non-existing customer", async () => {
      const req = { params: { id: "1234567890abcdefghijklmn" } } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.deleteCustomer(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        params: { id: "1234567890abcdefghijklmn" },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simula un error inesperado en el método delete del repositorio
      const originalDeleteMethod =
        customerRepository.delete.bind(customerRepository);
      customerRepository.delete = jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      await customerController.deleteCustomer(req, res);

      // Asegura que el controlador respondió con un 500 y el mensaje de error adecuado
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred when deleting customer: Unexpected error",
      });

      // Restaura el método original después de la prueba
      customerRepository.delete = originalDeleteMethod;
    });
  });

  describe("CustomerController - Add credit", () => {
    it("should add credit to a customer", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        body: { id: "1234567890abcdefghijklmn", amount: 50 },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "1234567890abcdefghijklmn",
          name: "Customer One",
          email: "one@example.com",
          availableCredit: 150,
        })
      );
    });

    it("should return 404 when adding credit to a non-existing customer", async () => {
      const req = {
        body: { id: "1234567890abcdefghijklmn", amount: 50 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });
    });

    it("should return 404 when updating a non-existing customer in findBy", async () => {
      const req = {
        body: { id: "1234567890abcdefghijklmn", amount: 50 },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulates that findById returns undefined
      const originalFindByIdMethod =
        customerRepository.findById.bind(customerRepository);
      customerRepository.findById = jest
        .fn()
        .mockReturnValueOnce(Promise.resolve(undefined));

      // Mock validateCustomerExists so that it doesn't throw an exception
      const originalValidateCustomerExists =
        ValidationUtils.validateCustomerExists;
      ValidationUtils.validateCustomerExists = jest
        .fn()
        .mockResolvedValue(undefined);

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: "Customer not found.",
      });

      // Restore the original method after testing
      customerRepository.findById = originalFindByIdMethod;
      ValidationUtils.validateCustomerExists = originalValidateCustomerExists;
    });

    it("should return 400 when adding credit to a customer with invalid id", async () => {
      const req = {
        body: { id: 123, amount: 50 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property id: expected string, but received number.",
      });
    });

    it("should return 452 when adding negative credit", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        body: { id: "1234567890abcdefghijklmn", amount: -50 },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(452);
      expect(res.json).toHaveBeenCalledWith({
        error: "Credit amount cannot be negative.",
      });
    });

    it("should return 400 when adding invalid credit", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        body: { id: "1234567890abcdefghijklmn", amount: "fifty" }, // Here you are passing a string instead of a number
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "Invalid type for property amount: expected number, but received string.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const customer = new Customer(
        "1234567890abcdefghijklmn",
        "Customer One",
        "one@example.com",
        100
      );
      await customerRepository.create(customer);

      const req = {
        body: { id: "1234567890abcdefghijklmn", amount: 50 },
      } as unknown as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulate an unexpected error in the service
      const originalAddCreditMethod =
        customerService.addCredit.bind(customerService);
      customerService.addCredit = jest.fn().mockImplementationOnce(() => {
        throw new Error("Unexpected error");
      });

      await customerController.addCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "An unknown error occurred when adding credit: Unexpected error",
      });

      // Restore the original method after testing
      customerService.addCredit = originalAddCreditMethod;
    });
  });

  describe("CustomerController - sortCustomersByCredit", () => {
    it("should return 200 and a sorted list of customers by credit in descending order", async () => {
      const customer1 = new Customer("1", "Alice", "alice@example.com", 200);
      const customer2 = new Customer("2", "Bob", "bob@example.com", 150);
      const customer3 = new Customer(
        "3",
        "Charlie",
        "charlie@example.com",
        300
      );

      await customerRepository.create(customer1);
      await customerRepository.create(customer2);
      await customerRepository.create(customer3);

      const req = {
        query: { order: "desc" }, // Aquí se especifica el orden
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.sortCustomersByCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: "3", availableCredit: 300 }),
        expect.objectContaining({ id: "1", availableCredit: 200 }),
        expect.objectContaining({ id: "2", availableCredit: 150 }),
      ]);
    });

    it("should return 200 and a sorted list of customers with default order 'desc' when no order is provided", async () => {
      const customer1 = new Customer("1", "Alice", "alice@example.com", 200);
      const customer2 = new Customer("2", "Bob", "bob@example.com", 150);
      const customer3 = new Customer(
        "3",
        "Charlie",
        "charlie@example.com",
        300
      );

      await customerRepository.create(customer1);
      await customerRepository.create(customer2);
      await customerRepository.create(customer3);

      const req = {
        query: {}, // Sin especificar el orden
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.sortCustomersByCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: "3", availableCredit: 300 }),
        expect.objectContaining({ id: "1", availableCredit: 200 }),
        expect.objectContaining({ id: "2", availableCredit: 150 }),
      ]);
    });

    it("should return 200 and a sorted list of customers when order is 'desc'", async () => {
      const customer1 = new Customer("1", "Alice", "alice@example.com", 200);
      const customer2 = new Customer("2", "Bob", "bob@example.com", 150);
      const customer3 = new Customer(
        "3",
        "Charlie",
        "charlie@example.com",
        300
      );

      await customerRepository.create(customer1);
      await customerRepository.create(customer2);
      await customerRepository.create(customer3);

      const req = {
        query: { order: "desc" },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.sortCustomersByCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: "3", availableCredit: 300 }),
        expect.objectContaining({ id: "1", availableCredit: 200 }),
        expect.objectContaining({ id: "2", availableCredit: 150 }),
      ]);
    });

    it("should return 200 and a sorted list of customers when order is 'asc'", async () => {
      const customer1 = new Customer("1", "Alice", "alice@example.com", 200);
      const customer2 = new Customer("2", "Bob", "bob@example.com", 150);
      const customer3 = new Customer(
        "3",
        "Charlie",
        "charlie@example.com",
        300
      );

      await customerRepository.create(customer1);
      await customerRepository.create(customer2);
      await customerRepository.create(customer3);

      const req = {
        query: { order: "asc" },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.sortCustomersByCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: "2", availableCredit: 150 }),
        expect.objectContaining({ id: "1", availableCredit: 200 }),
        expect.objectContaining({ id: "3", availableCredit: 300 }),
      ]);
    });

    it.skip("should use default order 'desc' when order is undefined by mocking validateSortOrder", async () => {
      const customer1 = new Customer("1", "Alice", "alice@example.com", 200);
      const customer2 = new Customer("2", "Bob", "bob@example.com", 150);
      const customer3 = new Customer(
        "3",
        "Charlie",
        "charlie@example.com",
        300
      );

      await customerRepository.create(customer1);
      await customerRepository.create(customer2);
      await customerRepository.create(customer3);

      const req = {
        query: {}, // We leave `order` undefined
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Mock validateSortOrder to verify that `order` is undefined
      const originalValidateSortOrder = ValidationUtils.validateSortOrder;
      ValidationUtils.validateSortOrder = jest
        .fn()
        .mockImplementation((order) => {
          expect(order).toBeUndefined(); // Confirm that it is undefined
          return "desc";
        });

      // We call `sortCustomersByCredit` with `undefined` directly
      await customerService.sortCustomersByCredit(undefined);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({ id: "3", availableCredit: 300 }),
        expect.objectContaining({ id: "1", availableCredit: 200 }),
        expect.objectContaining({ id: "2", availableCredit: 150 }),
      ]);

      // Restore original validateSortOrder method
      ValidationUtils.validateSortOrder = originalValidateSortOrder;
    });

    it("should return 400 if an invalid order is provided", async () => {
      const req = {
        query: { order: "invalid" },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      await customerController.sortCustomersByCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: "Invalid sort order. Use 'asc' or 'desc'.",
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const req = {
        query: { order: "desc" },
      } as unknown as Request;

      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      // Simulate an unexpected error in the service
      const originalSortCustomersByCreditMethod =
        customerService.sortCustomersByCredit.bind(customerService);
      customerService.sortCustomersByCredit = jest
        .fn()
        .mockImplementationOnce(() => {
          throw new Error("Unexpected error");
        });

      await customerController.sortCustomersByCredit(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error:
          "An unknown error occurred while sorting customers by credit: Unexpected error",
      });

      // Restore the original method after testing
      customerService.sortCustomersByCredit =
        originalSortCustomersByCreditMethod;
    });
  });
});
