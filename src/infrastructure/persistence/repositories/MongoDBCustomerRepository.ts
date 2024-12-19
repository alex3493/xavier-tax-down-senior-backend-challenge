import { MongoClient, WithId, Document, ObjectId } from "mongodb";
import { Customer } from "../../../domain/Customer";
import { CustomerRepositoryInterface } from "../../../domain/repositories/CustomerRepositoryInterface";
import { CustomerNotFoundException } from "../../../exceptions/CustomerNotFoundException";

export class MongoDBCustomerRepository implements CustomerRepositoryInterface {
  private client: MongoClient;
  private readonly dbName: string;
  private collectionName: string;

  /**
   * Creates a new instance of the MongoDBCustomerRepository class.
   * @param uri The MongoDB connection URI.
   * @param dbName The name of the database to connect to.
   * @param collectionName The name of the collection to use for customers.
   */
  constructor(uri: string, dbName: string, collectionName: string) {
    this.client = new MongoClient(uri);
    this.dbName = dbName;
    this.collectionName = collectionName;
  }

  /**
   * Connects to the MongoDB database.
   * @returns A promise for establishing the connection.
   */
  connect(): Promise<MongoClient> {
    return this.client.connect();
  }

  /**
   * Disconnects from the MongoDB database.
   * @returns A promise that resolves when the connection is closed.
   */
  async disconnect(): Promise<void> {
    await this.client.close();
  }

  /**
   * Creates a new customer in the MongoDB database.
   * @param customer The Customer object to create.
   * @returns The created Customer object with its new ID.
   */
  async create(customer: Customer): Promise<Customer> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        const result = await db.collection(this.collectionName).insertOne({
            name: customer.getName(),
            email: customer.getEmail(),
            availableCredit: customer.getAvailableCredit(),
        });

        return new Customer(
            result.insertedId.toString(),
            customer.getName(),
            customer.getEmail(),
            customer.getAvailableCredit()
        );
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Retrieves all customers from the MongoDB database.
   * @returns An array of Customer objects.
   */
  async findAll(): Promise<Customer[]> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        const customers = await db.collection(this.collectionName).find().toArray();

        return customers.map(
            (customer: WithId<Document>) =>
                new Customer(
                    customer._id.toString(),
                    customer.name,
                    customer.email,
                    customer.availableCredit
                )
        );
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Finds a customer by their ID.
   * @param id The ID of the customer to find.
   * @returns The Customer object if found.
   * @throws CustomerNotFoundException if the customer is not found.
   */
  async findById(id: string): Promise<Customer> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        const customer = await db
            .collection(this.collectionName)
            .findOne({_id: new ObjectId(id)});

        if (!customer) {
            throw new CustomerNotFoundException();
        }

        return new Customer(
            customer._id.toString(),
            customer.name,
            customer.email,
            customer.availableCredit
        );
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Finds a customer by their email.
   * @param email The email of the customer to find.
   * @returns The Customer object if found, or undefined if not.
   */
  async findByEmail(email: string): Promise<Customer | undefined> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        const customer = await db
            .collection(this.collectionName)
            .findOne({email});

        return customer
            ? new Customer(
                customer._id.toString(),
                customer.name,
                customer.email,
                customer.availableCredit
            )
            : undefined;
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Updates an existing customer in the MongoDB database.
   * @param customer The Customer object with updated information.
   * @returns The updated Customer object.
   * @throws CustomerNotFoundException if the customer is not found.
   */
  async update(customer: Customer): Promise<Customer> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);
        const objectId = new ObjectId(customer.getId());

        const result = await db.collection(this.collectionName).findOneAndUpdate(
            {_id: objectId},
            {
                $set: {
                    name: customer.getName(),
                    email: customer.getEmail(),
                    availableCredit: customer.getAvailableCredit(),
                },
            },
            {returnDocument: "after"}
        );

        if (!result) {
            throw new CustomerNotFoundException();
        }

        return new Customer(
            result._id.toString(),
            result.name,
            result.email,
            result.availableCredit
        );
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Deletes a customer from the MongoDB database.
   * @param id The ID of the customer to delete.
   * @throws CustomerNotFoundException if the customer is not found.
   */
  async delete(id: string): Promise<void> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        const result = await db
            .collection(this.collectionName)
            .deleteOne({_id: new ObjectId(id)});

        if (result.deletedCount === 0) {
            throw new CustomerNotFoundException();
        }
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Finds customers with available credit greater than or equal to the specified amount.
   * @param minCredit The minimum available credit to search for.
   * @returns An array of Customer objects that meet the criteria.
   */
  async findByAvailableCredit(minCredit: number): Promise<Customer[]> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        const customers = await db
            .collection(this.collectionName)
            .find({availableCredit: {$gte: minCredit}})
            .toArray();

        return customers.map(
            (customer: WithId<Document>) =>
                new Customer(
                    customer._id.toString(),
                    customer.name,
                    customer.email,
                    customer.availableCredit
                )
        );
    } finally {
        await this.disconnect()
    }
  }

  /**
   * Clears all customers from the MongoDB database.
   */
  public async clear(): Promise<void> {
    try {
        await this.connect();
        const db = this.client.db(this.dbName);

        await db.collection(this.collectionName).deleteMany({});
    } finally {
        await this.disconnect()
    }
  }
}
