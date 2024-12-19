import { ValidationUtils } from "../../../utils/ValidationUtils";
import { InMemoryCustomerRepository } from "../../../infrastructure/persistence/repositories/InMemoryCustomerRepository";
import { InvalidEmailFormatException } from "../../../exceptions/InvalidEmailFormatException";
import { EmailAlreadyInUseException } from "../../../exceptions/EmailAlreadyInUseException";
import { CustomerNotFoundException } from "../../../exceptions/CustomerNotFoundException";
import { NegativeCreditAmountException } from "../../../exceptions/NegativeCreditAmountException";
import { EmptyNameException } from "../../../exceptions/EmptyNameException";
import { NameTooShortException } from "../../../exceptions/NameTooShortException";
import { InvalidTypeException } from "../../../exceptions/InvalidTypeException";
import { InvalidSortOrderException } from "../../../exceptions/InvalidSortOrderException";
import { Customer } from "../../../domain/Customer";

describe("ValidationUtils", () => {
  let customerRepository: InMemoryCustomerRepository;

  beforeEach(() => {
    customerRepository = new InMemoryCustomerRepository();
  });

  describe("validateName", () => {
    it("should throw EmptyNameException if name is empty", () => {
      expect(() => ValidationUtils.validateName("")).toThrow(
        EmptyNameException
      );
    });

    it("should throw NameTooShortException if name is less than 3 characters", () => {
      expect(() => ValidationUtils.validateName("Jo")).toThrow(
        NameTooShortException
      );
    });

    it("should throw InvalidTypeException if name is not a string", () => {
      expect(() => ValidationUtils.validateName(123 as any)).toThrow(
        InvalidTypeException
      );
    });

    it("should pass if name is valid", () => {
      expect(() => ValidationUtils.validateName("John")).not.toThrow();
    });
  });

  describe("validateEmailFormat", () => {
    it("should throw InvalidEmailFormatException if email is not valid", () => {
      expect(() =>
        ValidationUtils.validateEmailFormat("invalid-email")
      ).toThrow(InvalidEmailFormatException);
    });

    it("should throw InvalidTypeException if email is not a string", () => {
      expect(() => ValidationUtils.validateEmailFormat(123 as any)).toThrow(
        InvalidTypeException
      );
    });

    it("should pass if email format is valid", () => {
      expect(() =>
        ValidationUtils.validateEmailFormat("john.doe@example.com")
      ).not.toThrow();
    });
  });

  describe("validateEmailNotInUse", () => {
    it("should throw EmailAlreadyInUseException if email already exists in repository", async () => {
      const customer1 = new Customer(
        "1",
        "John Doe",
        "john.doe@example.com",
        500
      );
      await customerRepository.create(customer1);
      await expect(
        ValidationUtils.validateEmailNotInUse(
          "john.doe@example.com",
          customerRepository
        )
      ).rejects.toThrow(EmailAlreadyInUseException);
    });

    it("should pass if email does not exist in repository", async () => {
      await expect(
        ValidationUtils.validateEmailNotInUse(
          "new.email@example.com",
          customerRepository
        )
      ).resolves.not.toThrow();
    });
  });

  describe("validateCustomerExists", () => {
    it("should throw CustomerNotFoundException if customer ID does not exist in repository", async () => {
      await expect(
        ValidationUtils.validateCustomerExists(
          "1234567890abcdefghijklmn",
          customerRepository
        )
      ).rejects.toThrow(CustomerNotFoundException);
    });

    it("should pass if customer exists in repository", async () => {
      const customer1 = new Customer(
        "1234567890abcdefghijklmn",
        "John Doe",
        "john.doe@example.com",
        500
      );
      await customerRepository.create(customer1);
      await expect(
        ValidationUtils.validateCustomerExists("1234567890abcdefghijklmn", customerRepository)
      ).resolves.not.toThrow();
    });
  });

  it("should throw CustomerNotFoundException if customer ID is invalid", async () => {
    await expect(
      ValidationUtils.validateCustomerExists(
        "invalid-id",
        customerRepository
      )
    ).rejects.toThrow(InvalidTypeException);
  });

  it("should throw CustomerNotFoundException if customer ID is invalid", async () => {
    await expect(
      ValidationUtils.validateCustomerExists(
        12345678 as any,
        customerRepository
      )
    ).rejects.toThrow(InvalidTypeException);
  });

  describe("validateAmount", () => {
    it("should throw InvalidTypeException if amount is not a number", () => {
      expect(() =>
        ValidationUtils.validateAmount("not-a-number" as any)
      ).toThrow(InvalidTypeException);
    });

    it("should pass if amount is a valid number", () => {
      expect(() => ValidationUtils.validateAmount(100)).not.toThrow();
    });
  });

  describe("validateAvailableCredit", () => {
    it("should throw NegativeCreditAmountException if credit amount is negative", () => {
      expect(() => ValidationUtils.validateAvailableCredit(-100)).toThrow(
        NegativeCreditAmountException
      );
    });

    it("should pass if credit amount is positive", () => {
      expect(() => ValidationUtils.validateAvailableCredit(100)).not.toThrow();
    });
  });

  describe("validateSortOrder", () => {
    it("should throw InvalidSortOrderException if sort order is invalid", () => {
      expect(() => ValidationUtils.validateSortOrder("invalid-order")).toThrow(
        InvalidSortOrderException
      );
    });

    it("should return 'desc' if order is undefined", () => {
      expect(ValidationUtils.validateSortOrder(undefined)).toBe("desc");
    });

    it("should pass if sort order is 'asc' or 'desc'", () => {
      expect(ValidationUtils.validateSortOrder("asc")).toBe("asc");
      expect(ValidationUtils.validateSortOrder("desc")).toBe("desc");
    });
  });
});
