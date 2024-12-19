# Installation

## 1. Clone the repository

```bash
git clone https://github.com/alex3493/xavier-tax-down-senior-backend-challenge.git
cd xavier-tax-down-senior-backend-challenge
```

## 2. Install Dependencies

Install the necessary dependencies:

```bash
npm install -g typescript
npm install
```

### Serverless Framework

If you are using the Serverless Framework, install it globally:

```bash
npm install -g serverless
```

#### MongoDB Setup

You will need to set up MongoDB for your project. Follow the installation guide for your operating system:

##### MongoDB Installation Guide for Windows 10

1. Download MongoDB
    - Visit the [MongoDB download page](https://www.mongodb.com/try/download/community) and select the MongoDB Community
      Server version for Windows.

2. Install MongoDB
    - Run the installer you downloaded. During the installation, make sure to select the following options:
        - Complete Setup: Choose the "Complete" option to install all components of MongoDB.
        - Install MongoDB as a Service: Select this option to have MongoDB automatically start as a Windows service.

3. Configure the Data Directory
    - By default, MongoDB stores data in C:\data\db. If this folder does not exist, you need to create it.
    - Open File Explorer and create the directory:
        - Navigate to C:\ and create a folder called data.
        - Inside data, create another folder called db.

4. Start the MongoDB Server
    - Open a Command Prompt or Windows PowerShell window.
    - Run the following command to start the MongoDB server:

        ```bash
        mongod
        ```

    - This will start the MongoDB server and should show messages in the console indicating that it is running.

5. Verify the Connection
    - In another Command Prompt window, run the MongoDB client using:

    ```bash
    mongo
    ```

    - If you see the MongoDB shell, it means you are connected to the server successfully.

6. Create a Connection in MongoDB Compass

After installing MongoDB and starting the server, you can create a connection in MongoDB Compass by following these
steps:

1. **Open MongoDB Compass**:
    - Launch the MongoDB Compass application from your desktop or start menu.

2. **Create a New Connection**:
    - On the initial screen, click on the **New Connection** button.

3. **Enter Connection Details**:
    - In the **New Connection** window, enter the following connection string in the "Connection String" field: mongodb:
      //localhost:27017
    - You can leave the other settings as default.

4. **Name Your Connection**:
    - In the **Connection Name** field, enter `motorbike-shop-api` to name your connection.

5. **Connect to the Database**:
    - Click the **Connect** button to establish the connection to the MongoDB server.

6. **Verify the Connection**:
    - Once connected, you should see the `motorbike-shop-api` database in the left sidebar. If the database does not
      exist yet, it will be created automatically when you create a collection or insert data.

7. **Explore the Database**:
    - You can now click on the database to explore its collections and manage your data.

8. **To change MongoDB connection**:
    - You can edit the .env file.

###### Additional Note

- If you have installed MongoDB as a service, you can also stop and start the service using the Windows Services Panel:
    - Press Win + R, type services.msc, and press Enter.
    - Look for "MongoDB" in the list, right-click on it, and select "Start" or "Stop".

##### MongoDB Installation Guide for Linux

1. Import the MongoDB public key

```bash
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
```

2. Create a MongoDB repository file
   Run the following command to create the repository file:

```bash
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 mu
```

3. Update the package database
   Update the package database using:

```bash
sudo apt-get update
```

4. Install MongoDB
   Run the following command to install MongoDB:

```bash
sudo apt-get install -y mongodb-org
```

5. Configure the Data Directory
   By default, MongoDB stores data in the /data/db directory. Make sure to create this folder in your system:

```bash
sudo mkdir -p /data/db
```

6. Start MongoDB
   To start MongoDB, use the following command:

```bash
sudo systemctl start mongod
```

7. Verify the Installation
   To verify that MongoDB has started successfully, use:

```bash
sudo systemctl status mongod
```

You should see a message indicating that the service is active.

8. Enable MongoDB to Start on Boot
   To ensure that MongoDB starts automatically on system boot, use:

```bash
sudo systemctl enable mongod
```

9. Create a Connection in MongoDB Compass

After installing MongoDB and starting the server, you can create a connection in MongoDB Compass by following these
steps:

1. **Open MongoDB Compass**:
    - Launch the MongoDB Compass application from your desktop or start menu.

2. **Create a New Connection**:
    - On the initial screen, click on the **New Connection** button.

3. **Enter Connection Details**:
    - In the **New Connection** window, enter the following connection string in the "Connection String" field: mongodb:
      //localhost:27017
    - You can leave the other settings as default.

4. **Name Your Connection**:
    - In the **Connection Name** field, enter `motorbike-shop-api` to name your connection.

5. **Connect to the Database**:
    - Click the **Connect** button to establish the connection to the MongoDB server.

6. **Verify the Connection**:
    - Once connected, you should see the `motorbike-shop-api` database in the left sidebar. If the database does not
      exist yet, it will be created automatically when you create a collection or insert data.

7. **Explore the Database**:
    - You can now click on the database to explore its collections and manage your data.

8. **To change MongoDB connection**:
    - You can edit the .env file.

###### Additional Note linux

You can use the MongoDB shell by typing mongo in your terminal.

## 3. Create a .env File in the Root Directory

To set up your environment variables, create a .env file:

```bash
cp .env.example .env
```
