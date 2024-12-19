import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { CustomerControllerLambda } from "../../../../interfaces/controllers/CustomerControllerLambda";
import { CustomerService } from "../../../../application/CustomerService";
import { InMemoryCustomerRepository } from "../../../../infrastructure/persistence/repositories/InMemoryCustomerRepository";
import { Customer } from "../../../../domain/Customer";
import { ValidationUtils } from "../../../../utils/ValidationUtils";

describe("CustomerControllerLambda", () => {
  let customerController: CustomerControllerLambda;
  let customerService: CustomerService;
  let customerRepository: InMemoryCustomerRepository;

  beforeEach(() => {
    customerRepository = new InMemoryCustomerRepository();
    customerService = new CustomerService(customerRepository);
    customerController = new CustomerControllerLambda(customerService);
  });

  describe("CustomerController - Create Customer Lambda", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should create a new customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(201);
      const customer = JSON.parse(result.body);
      expect(customer).toHaveProperty("id");
      expect(customer.name).toBe("John Doe");
      expect(customer.email).toBe("john.doe@example.com");
      expect(customer.availableCredit).toBe(1000);
    });

    it("should return 201 and the created customer without availableCredit", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "Customer Four",
          email: "four@example.com",
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      // Check the statusCode and creation response
      expect(result.statusCode).toBe(201);
      const customer = JSON.parse(result.body);
      expect(customer).toEqual(
        expect.objectContaining({
          name: "Customer Four",
          email: "four@example.com",
          availableCredit: 0, // Confirming that availableCredit defaults to 0
        })
      );

      // Verify that the client was saved to the in-memory repository
      const customerInRepo = await customerRepository.findByEmail(
        "four@example.com"
      );
      expect(customerInRepo).toBeDefined();
      expect(customerInRepo?.getName()).toBe("Customer Four");
      expect(customerInRepo?.getAvailableCredit()).toBe(0);
    });

    it("should return 400 if email format is invalid when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "invalid-email",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Invalid email format.");
    });

    it("should return 400 if email input type is invalid when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: 1000,
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property email: expected string, but received number."
      );
    });

    it("should return 409 if email is already in use when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      await customerController.createCustomerLambda(event);

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(409);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Email is already in use.");
    });

    it("should return 400 if name is invalid type when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: 1,
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property name: expected string, but received number."
      );
    });

    it("should return 400 if name is empty when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Name cannot be empty.");
    });

    it("should return 400 if name is to short when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "Jo",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Name must be at least 3 characters long.");
    });

    it("should return 400 if availableCredit is invalid type when creating a customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: "invalid-available-credit",
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property amount: expected number, but received string."
      );
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "create")
        .mockRejectedValue(new Error("Unexpected error"));

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.createCustomerLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred when creating customer: Unexpected error"
      );

      // Restore the `create` method to its original behavior after testing
      jest.restoreAllMocks();
    });
  });

  describe("CustomerController - List Customers Lambda", () => {
    it("should list all customers", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.listCustomersLambda(event);

      expect(result.statusCode).toBe(200);
      const customers = JSON.parse(result.body);
      expect(Array.isArray(customers)).toBe(true);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "list")
        .mockRejectedValue(new Error("Unexpected error"));

      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.listCustomersLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred when retrieving customers: Unexpected error"
      );

      // Restore the `list` method to its original behavior after testing
      jest.restoreAllMocks();
    });
  });

  describe("CustomerController - Get Customer Lambda", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should retrieve a customer by ID", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.getCustomerByIdLambda(event);

      expect(result.statusCode).toBe(200);
      const customer = JSON.parse(result.body);
      expect(customer).toHaveProperty("id", customerCreate.id);
    });

    it("should return 404 when customer not found", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "1234567890abcdefghijklmn",
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.getCustomerByIdLambda(event);

      expect(result.statusCode).toBe(404);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Customer not found.");
    });

    it("should return 400 when customer id is not valid", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "invalid-id",
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.getCustomerByIdLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "findById")
        .mockRejectedValue(new Error("Unexpected error"));

      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.getCustomerByIdLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred while retrieving the customer: Unexpected error"
      );

      // Restore the `findById` method to its original behavior after testing
      jest.restoreAllMocks();
    });

    it("should return a 404 error when a customer is not found by findby", async () => {
      // Mock `findById` to return a `Promise` that resolves to `undefined`
      jest.spyOn(customerService, "findById").mockResolvedValue(undefined);

      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.getCustomerByIdLambda(event);

      expect(result.statusCode).toBe(404);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Customer not found.");

      // Restore the original behavior of `findById` after the test
      jest.restoreAllMocks();
    });
  });

  describe("CustomerController - Update Customer Lambda", () => {
    beforeEach(async () => {
      // Clean the in-memory repository before each test
      await customerRepository.clear();
    });

    it("should update an existing customer", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane.doe@example.com",
          availableCredit: 1500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(200);
      const updatedCustomer = JSON.parse(result.body);
      expect(updatedCustomer.name).toBe("Jane Doe");
    });

    it("should return 404 when updating a non-existing customer", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "1234567890abcdefghijklmn",
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane.doe@example.com",
          availableCredit: 1500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(404);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Customer not found.");
    });

    it("should return 404 when updating a customer with invalid id", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "invalid-id",
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane.doe@example.com",
          availableCredit: 1500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should return 404 throw CustomerNotFoundException when updating a customer that does not exist in the repository", async () => {
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

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "1234567890abcdefghijklmn",
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane.doe@example.com",
          availableCredit: 1500,
        }),
        queryStringParameters: {},
      } as unknown as APIGatewayProxyEvent;

      const response = await customerController.updateCustomerLambda(event);

      expect(response.statusCode).toBe(404);
      expect(JSON.parse(response.body)).toEqual({
        error: "Customer not found.",
      });

      // Restore original methods after testing
      ValidationUtils.validateCustomerExists = originalValidateCustomerExists;
      customerRepository.findById = originalFindByIdMethod;
      ValidationUtils.validateEmailNotInUse = originalValidateEmailNotInUse;
    });

    it("should return 400 when updating with no valid credit", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const invalidAmount = "1500";
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane.doe@example.com",
          availableCredit: invalidAmount,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        `Invalid type for property amount: expected number, but received string.`
      );
    });

    it("should return 400 if name is not a string", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "existingemail@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);
      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: { id: customerCreate.id },
        body: JSON.stringify({
          name: 123,
          email: "validemail@example.com",
          availableCredit: 500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property name: expected string, but received number."
      );
    });

    it("should return 400 if name is empty", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "existingemail@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);
      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);
      const event: APIGatewayProxyEvent = {
        pathParameters: { id: customerCreate.id },
        body: JSON.stringify({
          name: "",
          email: "validemail@example.com",
          availableCredit: 500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Name cannot be empty.");
    });

    it("should return 400 if name is shorter than 3 characters", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "existingemail@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);
      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);
      const event: APIGatewayProxyEvent = {
        pathParameters: { id: customerCreate.id },
        body: JSON.stringify({
          name: "Jo",
          email: "validemail@example.com",
          availableCredit: 500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Name must be at least 3 characters long.");
    });

    it("should return 400 if email is not in a valid format", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "existingemail@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);
      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);
      const event: APIGatewayProxyEvent = {
        pathParameters: { id: customerCreate.id },
        body: JSON.stringify({
          name: "John Doe",
          email: "invalidemail",
          availableCredit: 500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Invalid email format.");
    });

    it("should return 409 if email is already in use", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "customer1@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);
      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const eventCreate2: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe 2",
          email: "existingemail@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate2: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate2);
      expect(resultCreate2.statusCode).toBe(201);
      const customerCreate2 = JSON.parse(resultCreate2.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: { id: customerCreate.id },
        body: JSON.stringify({
          name: "John Doe",
          email: "existingemail@example.com",
          availableCredit: 1000,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(409);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Email is already in use.");
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "update")
        .mockRejectedValue(new Error("Unexpected error"));

      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        body: JSON.stringify({
          name: "Jane Doe",
          email: "jane.doe@example.com",
          availableCredit: 1500,
        }),
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.updateCustomerLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred when updating customer: Unexpected error"
      );

      // Restore the `update` method to its original behavior after testing
      jest.restoreAllMocks();
    });
  });

  describe("CustomerController - Delete Customer Lambda", () => {
    it("should delete a customer", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.deleteCustomerLambda(event);

      expect(result.statusCode).toBe(204);
    });

    it("should return 400 if id is not a string", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: 123,
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.deleteCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property id: expected string, but received number."
      );
    });

    it("should return 400 if id is invalid", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "invalid-id",
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.deleteCustomerLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should return 404 when deleting a non-existing customer", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: "1234567890abcdefghijklmn",
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.deleteCustomerLambda(event);

      expect(result.statusCode).toBe(404);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Customer not found.");
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "delete")
        .mockRejectedValue(new Error("Unexpected error"));

      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        pathParameters: {
          id: customerCreate.id,
        },
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.deleteCustomerLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred when deleting customer: Unexpected error"
      );

      // Restore the `delete` method to its original behavior after testing
      jest.restoreAllMocks();
    });
  });

  describe("CustomerController - Add credit Lambda", () => {
    it("should add credit to a customer", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: customerCreate.id,
          amount: 100,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(200);
      const customer = JSON.parse(result.body);
      expect(customer.availableCredit).toBeGreaterThan(1000);
    });

    it("should return 404 when adding credit to a non-existing customer", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: "1234567890abcdefghijklmn",
          amount: 100,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(404);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Customer not found.");
    });

    it("should return 404 throw CustomerNotFoundException when updating a customer that does not exist in the repository", async () => {
      // Mock validateCustomerExists to simulate that the customer exists
      const originalValidateCustomerExists =
        ValidationUtils.validateCustomerExists;
      ValidationUtils.validateCustomerExists = jest
        .fn()
        .mockResolvedValue(undefined); // Simulate no error for validation

      // Mock findById to return a valid customer
      const originalFindByIdMethod =
        customerRepository.findById.bind(customerRepository);
      customerRepository.findById = jest.fn().mockResolvedValue(undefined); // Return the mocked valid customer

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: "1234567890abcdefghijklmn",
          amount: 100,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body)).toEqual({
        error: "Customer not found.",
      });

      // Restore original methods after testing
      ValidationUtils.validateCustomerExists = originalValidateCustomerExists;
      customerRepository.findById = originalFindByIdMethod;
    });

    it("should return 400 when adding credit to a customer with invalid id", async () => {
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: "invalid-id",
          amount: 100,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should return 452 when adding negative credit", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: customerCreate.id,
          amount: -50,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(452);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Credit amount cannot be negative.");
    });

    it("should return 400 when adding invalid credit", async () => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const invalidAmount = "invalid-amount";
      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: customerCreate.id,
          amount: invalidAmount,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        `Invalid type for property amount: expected number, but received string.`
      );
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "addCredit")
        .mockRejectedValue(new Error("Unexpected error"));

      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name: "John Doe",
          email: "john.doe@example.com",
          availableCredit: 1000,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);

      expect(resultCreate.statusCode).toBe(201);
      const customerCreate = JSON.parse(resultCreate.body);

      const event: APIGatewayProxyEvent = {
        body: JSON.stringify({
          id: customerCreate.id,
          amount: 100,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.addCreditLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred when adding credit: Unexpected error"
      );

      // Restore the `addCredit` method to its original behavior after testing
      jest.restoreAllMocks();
    });
  });

  describe("CustomerControllerLambda - sortCustomersByCreditLambda", () => {
    let createdCustomers: Customer[] = [];

    afterEach(() => {
      jest.restoreAllMocks();
      createdCustomers = [];
    });

    /**
     * Creates a new customer with the given name, email, and available credit.
     * Asserts that the createCustomerLambda method returns 201 and saves the
     * created customer to the createdCustomers array.
     * @param {string} name - The customer's name
     * @param {string} email - The customer's email
     * @param {number} availableCredit - The customer's available credit
     * @returns {Promise<Customer>} - The newly created customer
     */
    const createCustomer = async (
      name: string,
      email: string,
      availableCredit: number
    ) => {
      const eventCreate: APIGatewayProxyEvent = {
        body: JSON.stringify({
          name,
          email,
          availableCredit,
        }),
        pathParameters: {},
        queryStringParameters: {},
      } as any;

      const resultCreate: APIGatewayProxyResult =
        await customerController.createCustomerLambda(eventCreate);
      expect(resultCreate.statusCode).toBe(201);

      const createdCustomer = JSON.parse(resultCreate.body);
      createdCustomers.push(createdCustomer);// Save the created client
      return createdCustomer;
    };

    // Create the clients needed for testing
    beforeEach(async () => {
      await createCustomer("Customer One", "one@example.com", 300);
      await createCustomer("Customer Two", "two@example.com", 200);
      await createCustomer("Customer Three", "three@example.com", 100);
    });

    it("should return 200 and a sorted list of customers when order is 'asc'", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: { order: "asc" },
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.sortCustomersByCreditLambda(event);

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response).toEqual(createdCustomers.reverse());
    });

    it("should return 200 and a sorted list of customers with default order 'desc' when no order is provided", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: {},
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.sortCustomersByCreditLambda(event);

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response).toEqual(createdCustomers); // Compara con la lista ordenada esperada en orden descendente
    });

    it("should return 200 and a sorted list of customers when order is 'desc'", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: { order: "desc" },
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.sortCustomersByCreditLambda(event);

      expect(result.statusCode).toBe(200);
      const response = JSON.parse(result.body);
      expect(response).toEqual(createdCustomers); // Compara con la lista ordenada esperada en orden descendente
    });

    it("should return 400 if order is invalid", async () => {
      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: { order: "invalid-order" },
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.sortCustomersByCreditLambda(event);

      expect(result.statusCode).toBe(400);
      const response = JSON.parse(result.body);
      expect(response.error).toBe("Invalid sort order. Use 'asc' or 'desc'.");
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      jest
        .spyOn(customerService, "sortCustomersByCredit")
        .mockRejectedValue(new Error("Unexpected error"));

      const event: APIGatewayProxyEvent = {
        pathParameters: {},
        queryStringParameters: {
          order: "asc",
        },
        body: null,
      } as any;

      const result: APIGatewayProxyResult =
        await customerController.sortCustomersByCreditLambda(event);

      expect(result.statusCode).toBe(500);
      const response = JSON.parse(result.body);
      expect(response.error).toBe(
        "An unknown error occurred while sorting customers by credit: Unexpected error"
      );
    });

    it.skip("should use default order 'desc' when order is undefined by mocking validateSortOrder", async () => {
      jest.spyOn(ValidationUtils, "validateSortOrder").mockReturnValue("desc");
      // Agregar lógica de prueba según sea necesario
    });
  });
});
