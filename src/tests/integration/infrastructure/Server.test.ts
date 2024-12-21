import request from "supertest";
import { app } from "../../../infrastructure/Server";
import { InMemoryCustomerRepository } from "../../../infrastructure/persistence/repositories/InMemoryCustomerRepository";
import { Customer } from "../../../domain/Customer";
import { CustomerNotFoundException } from "../../../exceptions/CustomerNotFoundException";
import { CustomerService } from "../../../application/CustomerService";
import { ValidationUtils } from "../../../utils/ValidationUtils";

//jest.mock("../../../application/CustomerService");
//jest.mock("../../../utils/ValidationUtils");

describe("CustomerController Integration Tests", () => {
  let customerRepository: InMemoryCustomerRepository;

  beforeAll(async () => {
    customerRepository = app.locals.customerRepository; // Real repository from the context of the app
  });

  beforeEach(async () => {
    await customerRepository.clear(); // Clean repository before each test
    //jest.clearAllMocks();
  });

  describe("POST /customers", () => {
    it("should create a new customer", async () => {
      const newCustomer = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 500,
      };
      const response = await request(app).post("/customers").send(newCustomer);
      expect(response.status).toBe(201);
    });

    it("should create a Customer with default available credit", async () => {
      const newCustomer = {
        name: "John Doe",
        email: "john.doe@example.com",
      };
      const response = await request(app).post("/customers").send(newCustomer);
      expect(response.status).toBe(201);
      expect(response.body.availableCredit).toBe(0);
    });

    it("should return 409 if email is already in use", async () => {
      const customer = {
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      };
      await request(app).post("/customers").send(customer);
      const response = await request(app).post("/customers").send(customer);
      expect(response.status).toBe(409);
    });

    it("should return 400 if email is invalid format", async () => {
      const invalidCustomer = {
        name: "Invalid Email",
        email: "invalid-email",
        availableCredit: 200,
      };
      const response = await request(app)
        .post("/customers")
        .send(invalidCustomer);
      expect(response.status).toBe(400);
    });

    it("should return 400 if name is empty", async () => {
      const invalidCustomer = {
        name: "",
        email: "empty.name@example.com",
        availableCredit: 300,
      };
      const response = await request(app)
        .post("/customers")
        .send(invalidCustomer);
      expect(response.status).toBe(400);
    });

    it("should return 400 if name is too short", async () => {
      const invalidCustomer = {
        name: "Jo",
        email: "short.name@example.com",
        availableCredit: 300,
      };
      const response = await request(app)
        .post("/customers")
        .send(invalidCustomer);
      expect(response.status).toBe(400);
    });

    it("should return 400 if name is not a string", async () => {
      const invalidCustomer = {
        name: 12345,
        email: "non.string@example.com",
        availableCredit: 300,
      };
      const response = await request(app)
        .post("/customers")
        .send(invalidCustomer);
      expect(response.status).toBe(400);
    });

    it("should return 400 if email is not a string", async () => {
      const invalidCustomer = {
        name: "Valid Name",
        email: 12345,
        availableCredit: 300,
      };
      const response = await request(app)
        .post("/customers")
        .send(invalidCustomer);
      expect(response.status).toBe(400);
    });

    it("should return 400 if availableCredit is not a number", async () => {
      const invalidCustomer = {
        name: "Valid Name",
        email: "valid@example.com",
        availableCredit: "not-a-number",
      };
      const response = await request(app)
        .post("/customers")
        .send(invalidCustomer);
      expect(response.status).toBe(400);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "create")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const newCustomer = {
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 500,
      };
      const response = await request(app).post("/customers").send(newCustomer);
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred when creating customer:"
      );

      mockCustomerService.mockRestore();
    });
  });

  describe("GET /customers", () => {
    it("should retrieve a list of customers", async () => {
      const response = await request(app).get("/customers");
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("should return an empty array if no customers exist", async () => {
      await customerRepository.clear();
      const response = await request(app).get("/customers");
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "list")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const response = await request(app).get("/customers");
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred when retrieving customers:"
      );

      mockCustomerService.mockRestore();
    });

    it("should return a 404 error when customer not found", async () => {
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "list")
        .mockImplementationOnce(() => {
          throw new CustomerNotFoundException();
        });

      const response = await request(app).get("/customers");
      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Customer not found.");

      mockCustomerService.mockRestore();
    });
  });

  describe("GET /customers/:id", () => {
    it("should return a customer if found", async () => {
      const newCustomer = await request(app).post("/customers").send({
        name: "Customer To get",
        email: "get.me@example.com",
        availableCredit: 200,
      });

      const response = await request(app).get(
        `/customers/${newCustomer.body.id}`
      );

      expect(response.status).toBe(200);
    });

    it("should return 404 if customer not found", async () => {
      const response = await request(app).get("/customers/1234567890abcdefghijklmn");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Customer not found.");
    });

    it("should return 400 if id is not a valid id", async () => {
      const response = await request(app).get("/customers/a");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should return a 404 if findById return empty", async () => {
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "findById")
        .mockResolvedValue(undefined);

      const response = await request(app).get("/customers/1234567890abcdefghijklmn");
      expect(response.status).toBe(404);
      expect(response.body.error).toContain("Customer not found.");

      mockCustomerService.mockRestore();
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "findById")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const response = await request(app).get("/customers/1234567890abcdefghijklmn");
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred while retrieving the customer:"
      );

      mockCustomerService.mockRestore();
    });
  });

  describe("PUT /customers/:id", () => {
    it.skip("should throw CustomerNotFoundException if customer does not exist in repository during update", async () => {
      // Crear un cliente para que el repositorio no esté vacío
      const customerData = {
        name: "Test Customer",
        email: "test.customer@example.com",
        availableCredit: 500,
      };

      await request(app).post("/customers").send(customerData).expect(201);

      // Ahora intenta actualizar un cliente con un ID que no existe
      const updateData = { name: "Updated Name", availableCredit: 1000 };

      // Mockear el método findById para que devuelva undefined
      jest.spyOn(CustomerService.prototype, "findById").mockResolvedValueOnce(undefined);

      const response = await request(app)
        .put("/customers/123456789") // ID que no existe
        .send(updateData);

      expect(response.status).toBe(404); // Espera un 404
      expect(response.body).toEqual({
        error: new CustomerNotFoundException().message,
      });

      // Restaurar el mock
      jest.restoreAllMocks();
    });

    it("should update an existing customer", async () => {
      const newCustomer = await request(app).post("/customers").send({
        name: "John Smith",
        email: "john.smith@example.com",
        availableCredit: 1000,
      });

      const updateData = {
        name: "John Smith Updated",
        email: "john.smithUPDATED@example.com",
        availableCredit: 1500,
      };
      const response = await request(app)
        .put(`/customers/${newCustomer.body.id}`)
        .send(updateData);
      expect(response.status).toBe(200);
      expect(response.body.name).toBe("John Smith Updated");
    });

    it("should return 400 if id is not a valid id", async () => {
      const response = await request(app).put("/customers/invalid-id").send({
        // Content doesn't matter. We should get 400 response right away if customer is not found.
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should update one field of an existing customer", async () => {
      // 1. Create a test client
      const customerData = {
        name: "Original Name",
        email: "original@example.com",
        availableCredit: 100,
      };

      const createdCustomer = await request(app)
        .post("/customers")
        .send(customerData)
        .expect(201);

      // 2. Update only the customer name
      const updatedCustomerData = {
        name: "Updated Name",
      };

      const response = await request(app)
        .put(`/customers/${createdCustomer.body.id}`)
        .send(updatedCustomerData)
        .expect(200);

      // 3. Verify that the response contains the updated client
      expect(response.body).toMatchObject({
        id: createdCustomer.body.id,
        name: "Updated Name",
        email: "original@example.com",
        availableCredit: 100,
      });

      // 4. Check the database (optional, if you have access to the DB)
      const updatedCustomerInDb = await customerRepository.findById(
        createdCustomer.body.id
      );
      expect(updatedCustomerInDb).toMatchObject({
        name: "Updated Name",
        email: "original@example.com",
        availableCredit: 100,
      });
    });

    it("should return 404 if customer does not exist in service", async () => {
      // Mock validateCustomerExists so it doesn't block execution
      const mockValidateCustomerExists = jest
        .spyOn(ValidationUtils, "validateCustomerExists")
        .mockResolvedValueOnce();

      // Mock findById to return undefined and enter the if (!customer)
      const mockFindById = jest
        .spyOn(CustomerService.prototype, "findById")
        .mockResolvedValueOnce(undefined);

      const updateData = { name: "John Smith Updated", availableCredit: 1500 };

      const response = await request(app)
        .put("/customers/1234567890abcdefghijklmn")
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: new CustomerNotFoundException().message,
      });

      // Restaurar los mocks para que no afecten a otros tests
      mockValidateCustomerExists.mockRestore();
      mockFindById.mockRestore();
    });

    it("should throw InvalidTypeException for email", async () => {
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ email: 123 });
      expect(response.status).toBe(400);
    });

    it("should throw InvalidEmailFormatException for invalid email format", async () => {
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ email: "invalid-email" });
      expect(response.status).toBe(400);
    });

    it("should throw EmailAlreadyInUseException if email is already used", async () => {
      await request(app).post("/customers").send({
        name: "John Doe",
        email: "john.doe@example.com",
        availableCredit: 500,
      });
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ email: "john.doe@example.com" });
      expect(response.status).toBe(409);
    });

    it("should throw InvalidTypeException for name", async () => {
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ name: 123 });
      expect(response.status).toBe(400);
    });

    it("should throw EmptyNameException if name is empty", async () => {
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ name: "" });
      expect(response.status).toBe(400);
    });

    it("should throw NameTooShortException if name is too short", async () => {
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ name: "Jo" });
      expect(response.status).toBe(400);
    });

    it("should throw InvalidTypeException for availableCredit", async () => {
      const customer = await request(app).post("/customers").send({
        name: "Jane Doe",
        email: "jane.doe@example.com",
        availableCredit: 300,
      });

      const response = await request(app)
        .put(`/customers/${customer.body.id}`)
        .send({ availableCredit: "not-a-number" });
      expect(response.status).toBe(400);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "update")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const updateData = { name: "John Smith Updated", availableCredit: 1500 };
      const response = await request(app)
        .put("/customers/1234567890abcdefghijklmn")
        .send(updateData);
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred when updating customer:"
      );

      mockCustomerService.mockRestore();
    });
  });

  describe("DELETE /customers/:id", () => {
    it("should delete a customer by id", async () => {
      const newCustomer = await request(app).post("/customers").send({
        name: "Customer To Delete",
        email: "delete.me@example.com",
        availableCredit: 200,
      });

      const response = await request(app).delete(
        `/customers/${newCustomer.body.id}`
      );
      expect(response.status).toBe(204);
    });

    it("should return 400 if id is not a valid id", async () => {
      const response = await request(app).delete("/customers/invalid-id");

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "error",
        "Invalid type for property id: expected string containing exactly 24 alphanumeric characters, but received string."
      );
    });

    it("should return 404 if customer does not exist", async () => {
      const response = await request(app).delete(`/customers/1234567890abcdefghijklmn`);
      expect(response.status).toBe(404);
    });

    it("should return 400 if trying to delete a non-existent customer", async () => {
      const response = await request(app).delete("/customers/1234567890abcdefghijklmn");
      expect(response.status).toBe(404);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "delete")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const response = await request(app).delete("/customers/1234567890abcdefghijklmn");
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred when deleting customer:"
      );

      mockCustomerService.mockRestore();
    });
  });

  describe("POST /customers/credit", () => {
    it("should throw InvalidTypeException for id", async () => {
      const response = await request(app)
        .post("/customers/credit")
        .send({ id: 123, amount: 100 });
      expect(response.status).toBe(400);
    });

    it("should throw InvalidTypeException for string id", async () => {
      const response = await request(app)
        .post("/customers/credit")
        .send({ id: "invalid-id", amount: 100 });
      expect(response.status).toBe(400);
    });

    it("should throw CustomerNotFoundException if customer does not exist", async () => {
      const response = await request(app)
        .post("/customers/credit")
        .send({ id: "1234567890abcdefghijklmn", amount: 100 });
      expect(response.status).toBe(404);
    });

    it("should throw InvalidTypeException for amount", async () => {
      const newCustomer = await request(app).post("/customers").send({
        name: "Credit Test",
        email: "credit.test@example.com",
        availableCredit: 200,
      });

      const response = await request(app)
        .post("/customers/credit")
        .send({ id: newCustomer.body.id, amount: "not-a-number" });
      expect(response.status).toBe(400);
    });

    it("should throw NegativeCreditAmountException if amount is negative", async () => {
      const newCustomer = await request(app).post("/customers").send({
        name: "Credit Test",
        email: "credit.test@example.com",
        availableCredit: 200,
      });

      const response = await request(app)
        .post("/customers/credit")
        .send({ id: newCustomer.body.id, amount: -50 });
      expect(response.status).toBe(452);
    });

    it("should add credit to an existing customer", async () => {
      // Arrange
      const newCustomer = await request(app).post("/customers").send({
        name: "Credit Test",
        email: "credit.test@example.com",
        availableCredit: 200,
      });

      const creditAmount = 150;

      // Act
      const response = await request(app)
        .post("/customers/credit")
        .send({ id: newCustomer.body.id, amount: creditAmount });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        id: newCustomer.body.id,
        name: "Credit Test",
        email: "credit.test@example.com",
        availableCredit: 350,
      });
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "addCredit")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const response = await request(app)
        .post("/customers/credit")
        .send({ id: 123, amount: 100 });
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred when adding credit:"
      );

      mockCustomerService.mockRestore();
    });

    it("should throw CustomerNotFoundException if customer does not exist", async () => {
      // Mock validateCustomerExists so it doesn't block execution
      const mockValidateCustomerExists = jest
        .spyOn(ValidationUtils, "validateCustomerExists")
        .mockResolvedValueOnce();

      // Mock findById to return undefined and enter the if (!customer)
      const mockFindById = jest
        .spyOn(CustomerService.prototype, "findById")
        .mockResolvedValueOnce(undefined);

      const response = await request(app)
        .post("/customers/credit")
        .send({ id: "1234567890abcdefghijklmn", amount: 100 });

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: new CustomerNotFoundException().message,
      });

      // Restore mocks so they don't affect other tests
      mockValidateCustomerExists.mockRestore();
      mockFindById.mockRestore();
    });
  });

  describe("GET /customers/sortByCredit", () => {
    it("should return customers sorted by available credit", async () => {
      const customers = [
        new Customer("1", "Alice", "alice@example.com", 100),
        new Customer("2", "Bob", "bob@example.com", 200),
        new Customer("3", "Charlie", "charlie@example.com", 50),
      ];

      // Add clients to the repository
      for (const customer of customers) {
        await customerRepository.create(customer);
      }

      // Make the GET request with the default order (descending)
      const responseDesc = await request(app).get("/customers/sortByCredit");

      expect(responseDesc.status).toBe(200);
      // Verify that customers are sorted correctly by available credit (descending)
      expect(responseDesc.body).toEqual([
        {
          id: "2",
          name: "Bob",
          email: "bob@example.com",
          availableCredit: 200,
        },
        {
          id: "1",
          name: "Alice",
          email: "alice@example.com",
          availableCredit: 100,
        },
        {
          id: "3",
          name: "Charlie",
          email: "charlie@example.com",
          availableCredit: 50,
        },
      ]);

      // Make the GET request with the ascending order parameter
      const responseAsc = await request(app).get(
        "/customers/sortByCredit?order=asc"
      );

      expect(responseAsc.status).toBe(200);
      // Check that customers are sorted correctly by available credit (ascending)
      expect(responseAsc.body).toEqual([
        {
          id: "3",
          name: "Charlie",
          email: "charlie@example.com",
          availableCredit: 50,
        },
        {
          id: "1",
          name: "Alice",
          email: "alice@example.com",
          availableCredit: 100,
        },
        {
          id: "2",
          name: "Bob",
          email: "bob@example.com",
          availableCredit: 200,
        },
      ]);
    });

    it("should return 400 for invalid sort order", async () => {
      const response = await request(app).get(
        "/customers/sortByCredit?order=invalid"
      );

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid sort order. Use 'asc' or 'desc'.",
      });
    });

    it.skip("should return 400 for invalid sort order Mocked", async () => {
      // Mock the sortCustomersByCredit method so that it passes undefined to validateSortOrder
      (
        CustomerService.prototype.sortCustomersByCredit as jest.Mock
      ).mockImplementation(async (order: string = undefined as any) => {
        // Here validateSortOrder is called with undefined
        return ValidationUtils.validateSortOrder(order);
      });

      const response = await request(app).get(
        "/customers/sortByCredit?order=invalid"
      );

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Invalid sort order");
    });

    it("should return customers sorted by available credit in ascending order when specified", async () => {
      const customer1 = new Customer("1", "Alice", "alice@example.com", 150);
      const customer2 = new Customer("2", "Bob", "bob@example.com", 100);
      await customerRepository.create(customer1);
      await customerRepository.create(customer2);

      const response = await request(app).get(
        "/customers/sortByCredit?order=asc"
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual([
        {
          id: "2",
          name: "Bob",
          email: "bob@example.com",
          availableCredit: 100,
        },
        {
          id: "1",
          name: "Alice",
          email: "alice@example.com",
          availableCredit: 150,
        },
      ]);
    });

    it("should return an empty list when no customers exist", async () => {
      await customerRepository.clear();

      const response = await request(app).get("/customers/sortByCredit");

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it("should return a 500 error when an unexpected error occurs", async () => {
      const errorMessage = "Unexpected error";
      const mockCustomerService = jest
        .spyOn(CustomerService.prototype, "sortCustomersByCredit")
        .mockImplementationOnce(() => {
          throw new Error(errorMessage);
        });

      const response = await request(app).get("/customers/sortByCredit");
      expect(response.status).toBe(500);
      expect(response.body.error).toContain(
        "An unknown error occurred while sorting customers by credit:"
      );

      mockCustomerService.mockRestore();
    });
  });

  describe("Error Handling", () => {
    it.skip("should handle unexpected errors and return a 500 status", async () => {
      // Establece el entorno en "test"
      app.set("env", "test");

      // Ruta de prueba que lanza un error
      app.get("/error-test", (req, res, next) => {
        try {
          throw new Error("Test error");
        } catch (err) {
          next(err); // Pasa el error al middleware de manejo
        }
      });

      const response = await request(app).get("/error-test");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Something broke! Test error");
    });
  });
});
