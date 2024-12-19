import { CustomerService } from "../../../application/CustomerService";
import { CustomerRepositoryInterface } from "../../../domain/repositories/CustomerRepositoryInterface";
import { ValidationUtils } from "../../../utils/ValidationUtils";
import { Customer } from "../../../domain/Customer";
import { CustomerNotFoundException } from "../../../exceptions/CustomerNotFoundException";
import { EmailAlreadyInUseException } from "../../../exceptions/EmailAlreadyInUseException";
import { NegativeCreditAmountException } from "../../../exceptions/NegativeCreditAmountException";
import { InvalidTypeException } from "../../../exceptions/InvalidTypeException";
import { InvalidEmailFormatException } from "../../../exceptions/InvalidEmailFormatException";
import { NameTooShortException } from "../../../exceptions/NameTooShortException";
import { EmptyNameException } from "../../../exceptions/EmptyNameException";
import { InvalidSortOrderException } from "../../../exceptions/InvalidSortOrderException";

jest.mock("../../../utils/ValidationUtils");

describe("CustomerService", () => {
  let customerRepository: CustomerRepositoryInterface;
  let customerService: CustomerService;

  beforeEach(() => {
    jest.clearAllMocks(); // clears call state and return values.
    jest.restoreAllMocks(); // resets mocks to their original behavior.
    jest.resetAllMocks(); // resets the state of all mocks, removing any special configuration you've made.
    customerRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByAvailableCredit: jest.fn(),
      clear: jest.fn(),
    };
    customerService = new CustomerService(customerRepository);
  });

  describe("create", () => {
    it("should create a customer successfully", async () => {
      const name = "Xavier Palacín Ayuso";
      const email = "cubiczx@hotmail.com";
      const availableCredit = 1000;

      (ValidationUtils.validateEmailFormat as jest.Mock).mockResolvedValue(
        true
      );
      (ValidationUtils.validateEmailNotInUse as jest.Mock).mockResolvedValue(
        true
      );
      (ValidationUtils.validateAmount as jest.Mock).mockReturnValue(
        true
      );
      (ValidationUtils.validateName as jest.Mock).mockReturnValue(true);

      const newCustomer = new Customer("123", name, email, availableCredit);
      (customerRepository.create as jest.Mock).mockResolvedValue(newCustomer);

      const result = await customerService.create(name, email, availableCredit);

      expect(result).toMatchObject({
        name,
        email,
        availableCredit,
      });

      expect(customerRepository.create).toHaveBeenCalledWith(
        expect.any(Customer)
      );
    });

    it("should throw InvalidTypeException if name is not a string", async () => {
      const name = 12345;
      const email = "cubiczx@hotmail.com";
      const availableCredit = 1000;

      (ValidationUtils.validateName as jest.Mock).mockImplementation(() => {
        throw new InvalidTypeException("name", "string", name);
      });

      await expect(
        customerService.create(name as any, email, availableCredit)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw EmptyNameException if name is empty", async () => {
      const name = "";
      const email = "cubiczx@hotmail.com";
      const availableCredit = 1000;

      (ValidationUtils.validateName as jest.Mock).mockImplementation(() => {
        throw new EmptyNameException();
      });

      await expect(
        customerService.create(name, email, availableCredit)
      ).rejects.toThrow(EmptyNameException);
    });

    it("should throw NameTooShortException if name is too short", async () => {
      const name = "Al";
      const email = "cubiczx@hotmail.com";
      const availableCredit = 1000;

      (ValidationUtils.validateName as jest.Mock).mockImplementation(() => {
        throw new NameTooShortException();
      });

      await expect(
        customerService.create(name, email, availableCredit)
      ).rejects.toThrow(NameTooShortException);
    });

    it("should throw InvalidTypeException if email is not a string", async () => {
      const name = "Xavier Palacín Ayuso";
      const email = 12345;
      const availableCredit = 1000;

      (ValidationUtils.validateEmailFormat as jest.Mock).mockImplementation(
        () => {
          throw new InvalidTypeException("email", "string", email);
        }
      );

      await expect(
        customerService.create(name, email as any, availableCredit)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw InvalidEmailFormatException if email format is invalid", async () => {
      const name = "Xavier Palacín Ayuso";
      const email = "invalid-email";
      const availableCredit = 1000;

      (ValidationUtils.validateEmailFormat as jest.Mock).mockImplementation(
        () => {
          throw new InvalidEmailFormatException();
        }
      );

      await expect(
        customerService.create(name, email, availableCredit)
      ).rejects.toThrow(InvalidEmailFormatException);
    });

    it("should throw EmailAlreadyInUseException if email is already used", async () => {
      const name = "Xavier Palacín Ayuso";
      const email = "cubiczx@hotmail.com";
      const availableCredit = 1500;

      (ValidationUtils.validateEmailNotInUse as jest.Mock).mockImplementation(
        () => {
          throw new EmailAlreadyInUseException();
        }
      );

      await expect(
        customerService.create(name, email, availableCredit)
      ).rejects.toThrow(EmailAlreadyInUseException);
    });

    it("should throw InvalidTypeException if availableCredit is not a number", async () => {
      const name = "Xavier Palacín Ayuso";
      const email = "cubiczx@hotmail.com";
      const availableCredit = "1000";

      (ValidationUtils.validateAmount as jest.Mock).mockImplementation(
        () => {
          throw new InvalidTypeException(
            "amount",
            "number",
            availableCredit
          );
        }
      );

      await expect(
        customerService.create(name, email, availableCredit as any)
      ).rejects.toThrow(InvalidTypeException);
    });
  });

  describe("update", () => {
    const id = "1234567890abcdefghijklmn";
    const name = "Xavier Palacín Ayuso";
    const email = "cubiczx@hotmail.com";
    const availableCredit = 2000;

    // Create an existing client before each test
    const existingCustomer = new Customer(
      id,
      "Xavier Palacín Ayuso",
      "cubiczx@hotmail.com",
      1000
    );

    beforeEach(() => {
      (customerRepository.findById as jest.Mock).mockResolvedValue(
        existingCustomer
      );
    });

    it("should update a customer successfully", async () => {
      const updatedCustomer = await customerService.update(
        id,
        name,
        email,
        availableCredit
      );

      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer.getName()).toBe(name);
      expect(updatedCustomer.getEmail()).toBe(email);
      expect(updatedCustomer.getAvailableCredit()).toBe(availableCredit);
    });

    it("should update only the name of an existing customer", async () => {
      const updatedName = "Updated Name";

      const updatedCustomer = await customerService.update(
        id,
        updatedName,
        undefined,
        undefined
      );

      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer.getName()).toBe(updatedName);
      expect(updatedCustomer.getEmail()).toBe(existingCustomer.getEmail());
      expect(updatedCustomer.getAvailableCredit()).toBe(
        existingCustomer.getAvailableCredit()
      );
    });

    it("should throw CustomerNotFoundException if customer does not exist", async () => {
      (customerRepository.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        customerService.update("1234567890abcdefghijklmn", name, email, availableCredit)
      ).rejects.toThrow(CustomerNotFoundException);
    });

    it("should throw InvalidTypeException if email is not a string", async () => {
      const invalidEmail = 12345;

      (ValidationUtils.validateEmailFormat as jest.Mock).mockImplementation(
        () => {
          throw new InvalidTypeException("email", "string", invalidEmail);
        }
      );

      await expect(
        customerService.update(id, name, invalidEmail as any, availableCredit)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw InvalidEmailFormatException if email format is invalid", async () => {
      const invalidEmail = "invalid-email";

      (ValidationUtils.validateEmailFormat as jest.Mock).mockImplementation(
        () => {
          throw new InvalidEmailFormatException();
        }
      );

      await expect(
        customerService.update(id, name, invalidEmail, availableCredit)
      ).rejects.toThrow(InvalidEmailFormatException);
    });

    it("should throw EmailAlreadyInUseException if email is already used", async () => {
      const id = "123";
      const name = "Xavier Palacín Ayuso";
      const availableCredit = 2000;

      const existingCustomer = new Customer(
        id,
        name,
        "oldemail@hotmail.com",
        availableCredit
      );
      (customerRepository.findById as jest.Mock).mockResolvedValue(
        existingCustomer
      );

      // Simulates that findByEmail returns another client with the same email
      const anotherCustomer = new Customer(
        "456",
        "Another User",
        "anotheremail@hotmail.com",
        1500
      );
      (customerRepository.findByEmail as jest.Mock).mockResolvedValue(
        anotherCustomer
      );

      (ValidationUtils.validateEmailNotInUse as jest.Mock).mockImplementation(
        () => {
          throw new EmailAlreadyInUseException();
        }
      );

      await expect(
        customerService.update(
          id,
          name,
          "anotheremail@hotmail.com",
          availableCredit
        )
      ).rejects.toThrow(EmailAlreadyInUseException);
    });

    it("should throw InvalidTypeException if name is not a string", async () => {
      const invalidName = 12345;

      (ValidationUtils.validateName as jest.Mock).mockImplementation(() => {
        throw new InvalidTypeException("name", "string", invalidName);
      });

      await expect(
        customerService.update(id, invalidName as any, email, availableCredit)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw EmptyNameException if name is empty", async () => {
      const emptyName = "";

      (ValidationUtils.validateName as jest.Mock).mockImplementation(() => {
        throw new EmptyNameException();
      });

      await expect(
        customerService.update(id, emptyName, email, availableCredit)
      ).rejects.toThrow(EmptyNameException);
    });

    it("should throw NameTooShortException if name is too short", async () => {
      const shortName = "Al";

      (ValidationUtils.validateName as jest.Mock).mockImplementation(() => {
        throw new NameTooShortException();
      });

      await expect(
        customerService.update(id, shortName, email, availableCredit)
      ).rejects.toThrow(NameTooShortException);
    });

    it("should throw InvalidTypeException if availableCredit is not a number", async () => {
      const invalidAvailableCredit = "1000";

      (ValidationUtils.validateAmount as jest.Mock).mockImplementation(() => {
        throw new InvalidTypeException(
          "availableCredit",
          "number",
          invalidAvailableCredit
        );
      });

      await expect(
        customerService.update(id, name, email, invalidAvailableCredit as any)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw NegativeCreditAmountException if availableCredit is negative number", async () => {
      const invalidAvailableCredit = -1000;

      (ValidationUtils.validateAmount as jest.Mock).mockImplementation(() => {
        throw new NegativeCreditAmountException();
      });

      await expect(
        customerService.update(id, name, email, invalidAvailableCredit)
      ).rejects.toThrow(NegativeCreditAmountException);
    });

    it("should throw InvalidTypeException if customer id is invalid", async () => {
      // Arrange
      const invalidId = "invalid-id";
      
      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        async () => {
          throw new InvalidTypeException(
            "id",
            "string containing exactly 9 alphanumeric characters",
            id
          );
        }
      );

      // Act & Assert
      await expect(customerService.update(invalidId, name, email, availableCredit)).rejects.toThrow(
        InvalidTypeException
      );
    });
  });

  describe("list", () => {
    it("should return a list of customers", async () => {
      // Arrange
      const customers = [
        new Customer("1", "Customer One", "one@example.com", 100),
        new Customer("2", "Customer Two", "two@example.com", 200),
      ];
      (customerRepository.findAll as jest.Mock).mockResolvedValue(customers);

      // Act
      const result = await customerService.list();

      // Assert
      expect(result).toEqual(customers);
      expect(customerRepository.findAll).toHaveBeenCalled();
    });

    it("should return an empty array if no customers exist", async () => {
      // Arrange
      (customerRepository.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await customerService.list();

      // Assert
      expect(result).toEqual([]);
      expect(customerRepository.findAll).toHaveBeenCalled();
    });
  });

  describe("findById", () => {
    it("should return a customer if found", async () => {
      const id = "1234567890abcdefghijklmn";
      const mockCustomer: Customer = new Customer(
        id,
        "John Doe",
        "john@example.com",
        100
      );
      (customerRepository.findById as jest.Mock).mockResolvedValue(
        mockCustomer
      );

      const result = await customerService.findById(id);

      expect(result).toEqual(mockCustomer);
      expect(customerRepository.findById).toHaveBeenCalledWith(id);
      expect(customerRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("should return undefined if customer not found", async () => {
      const id = "1234567890abcdefghijklmn";
      (customerRepository.findById as jest.Mock).mockResolvedValue(undefined);

      const result = await customerService.findById(id);

      expect(result).toBeUndefined();
      expect(customerRepository.findById).toHaveBeenCalledWith(id);
      expect(customerRepository.findById).toHaveBeenCalledTimes(1);
    });

    it("should throw InvalidTypeException if customer id is invalid", async () => {
      // Arrange
      const id = "invalid-id";

      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        async () => {
          throw new InvalidTypeException(
            "id",
            "string containing exactly 9 alphanumeric characters",
            id
          );
        }
      );

      // Act & Assert
      await expect(customerService.findById(id)).rejects.toThrow(
        InvalidTypeException
      );
    });
  });

  describe("delete", () => {
    it("should delete a customer successfully", async () => {
      // Arrange
      const id = "123";
      const existingCustomer = new Customer(
        id,
        "Xavier Palacín Ayuso",
        "cubiczx@hotmail.com",
        1000
      );
      (customerRepository.findById as jest.Mock).mockResolvedValue(
        existingCustomer
      );

      // Act
      await customerService.delete(id);

      // Assert
      expect(customerRepository.delete).toHaveBeenCalledWith(id);
    });

    it("should throw CustomerNotFoundException if customer does not exist", async () => {
      // Arrange
      const id = "1234567890abcdefghijklmn";
      (customerRepository.findById as jest.Mock).mockResolvedValue(null); // Pretend it doesn't exist

      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        async () => {
          throw new CustomerNotFoundException();
        }
      );

      // Act & Assert
      await expect(customerService.delete(id)).rejects.toThrow(
        CustomerNotFoundException
      );
    });

    it("should throw InvalidTypeException if id is not a string", async () => {
      // Arrange
      const id = 123;

      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        () => {
          throw new InvalidTypeException("id", "string", id);
        }
      );

      // Act & Assert
      await expect(customerService.delete(id as any)).rejects.toThrow(
        InvalidTypeException
      );
    });

    it("should throw InvalidTypeException if customer id is invalid", async () => {
      // Arrange
      const id = "invalid-id";

      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        async () => {
          throw new InvalidTypeException(
            "id",
            "string containing exactly 9 alphanumeric characters",
            id
          );
        }
      );

      // Act & Assert
      await expect(customerService.delete(id)).rejects.toThrow(
        InvalidTypeException
      );
    });
  });

  describe("sortCustomersByCredit", () => {
    it("should return customers sorted by available credit in descending order by default", async () => {
      // Arrange
      const customers = [
        new Customer("1", "Customer One", "one@example.com", 300),
        new Customer("2", "Customer Two", "two@example.com", 200),
        new Customer("3", "Customer Three", "three@example.com", 100),
      ];
      (customerRepository.findAll as jest.Mock).mockResolvedValue(customers);

      (ValidationUtils.validateSortOrder as jest.Mock).mockResolvedValue(
        "desc"
      );

      // Act
      const result = await customerService.sortCustomersByCredit();

      // Assert
      expect(result).toEqual([customers[0], customers[1], customers[2]]);
    });

    it("should return customers sorted by available credit in ascending order when specified", async () => {
      // Arrange
      const customers = [
        new Customer("1", "Customer One", "one@example.com", 300),
        new Customer("2", "Customer Two", "two@example.com", 200),
        new Customer("3", "Customer Three", "three@example.com", 100),
      ];
      (customerRepository.findAll as jest.Mock).mockResolvedValue(customers);
      (ValidationUtils.validateSortOrder as jest.Mock).mockReturnValue("asc");

      // Act
      const result = await customerService.sortCustomersByCredit("asc");

      // Assert
      expect(result).toMatchObject([
        {
          id: "3",
          name: "Customer Three",
          email: "three@example.com",
          availableCredit: 100,
        },
        {
          id: "2",
          name: "Customer Two",
          email: "two@example.com",
          availableCredit: 200,
        },
        {
          id: "1",
          name: "Customer One",
          email: "one@example.com",
          availableCredit: 300,
        },
      ]);
    });

    it("should return an empty list when no customers exist", async () => {
      // Arrange
      (customerRepository.findAll as jest.Mock).mockResolvedValue([]);

      // Act
      const result = await customerService.sortCustomersByCredit();

      // Assert
      expect(result).toEqual([]);
    });

    it("should throw InvalidSortOrderException if send invalid sort order", async () => {
      (ValidationUtils.validateSortOrder as jest.Mock).mockImplementation(
        () => {
          throw new InvalidSortOrderException();
        }
      );
      // Arrange
      const invalidSortOrder = "invalidOrder";

      // Act & Assert
      await expect(
        customerService.sortCustomersByCredit(invalidSortOrder)
      ).rejects.toThrow(InvalidSortOrderException);
    });
  });

  describe("addCredit", () => {
    it("should add credit to an existing customer", async () => {
      const customerId = "12345";
      const creditToAdd = 50;

      const existingCustomer = new Customer(
        customerId,
        "John Doe",
        "john@example.com",
        100
      );
      (customerRepository.findById as jest.Mock).mockResolvedValue(
        existingCustomer
      );

      (ValidationUtils.validateCustomerExists as jest.Mock).mockResolvedValue(
        undefined
      );

      // Act
      const updatedCustomer = await customerService.addCredit(
        customerId,
        creditToAdd
      );

      // Assert
      expect(updatedCustomer).not.toBeNull();
      expect(updatedCustomer!.getAvailableCredit()).toBe(150);
    });

    it("should throw CustomerNotFoundException if customer does not exist", async () => {
      // Arrange
      const id = "1234567890abcdefghijklmn";
      const amount = 500;

      (customerRepository.findById as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(customerService.addCredit(id, amount)).rejects.toThrow(
        CustomerNotFoundException
      );
    });

    it("should throw InvalidTypeException for id", async () => {
      // Arrange
      const invalidId = 12345;
      const creditToAdd = 50;

      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        async () => {
          throw new InvalidTypeException("id", "string", invalidId);
        }
      );

      // Act & Assert
      await expect(
        customerService.addCredit(invalidId as any, creditToAdd)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw InvalidTypeException for amount", async () => {
      // Arrange
      const customerId = "12345";
      const invalidAmount = "not-a-number";

      // Create a customer with a valid credit
      const existingCustomer = new Customer(
        customerId,
        "John Doe",
        "john@example.com",
        100
      );

      (customerRepository.findById as jest.Mock).mockResolvedValue(
        existingCustomer
      );

      (ValidationUtils.validateAvailableCredit as jest.Mock).mockImplementation(
        () => {
          throw new InvalidTypeException("amount", "number", invalidAmount);
        }
      );

      // Act & Assert
      await expect(
        customerService.addCredit(customerId, invalidAmount as any)
      ).rejects.toThrow(InvalidTypeException);
    });

    it("should throw NegativeCreditAmountException if amount is negative", async () => {
      // Arrange
      const customerId = "12345";
      const negativeAmount = -50;

      const existingCustomer = new Customer(
        customerId,
        "John Doe",
        "john@example.com",
        100
      );
      (customerRepository.findById as jest.Mock).mockResolvedValue(
        existingCustomer
      );

      (ValidationUtils.validateAvailableCredit as jest.Mock).mockImplementation(
        () => {
          throw new NegativeCreditAmountException();
        }
      );

      // Act & Assert
      await expect(
        customerService.addCredit(customerId, negativeAmount)
      ).rejects.toThrow(NegativeCreditAmountException);
    });

    it("should throw InvalidTypeException if customer id is invalid", async () => {
      // Arrange
      const id = "invalid-id";
      const amount = 500;

      (ValidationUtils.validateCustomerExists as jest.Mock).mockImplementation(
        async () => {
          throw new InvalidTypeException(
            "id",
            "string containing exactly 9 alphanumeric characters",
            id
          );
        }
      );

      // Act & Assert
      await expect(customerService.addCredit(id, amount)).rejects.toThrow(
        InvalidTypeException
      );
    });
  });
});
