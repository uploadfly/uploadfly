# Local Setup

To contribute you will first need to fork the repo and make some adjustments to
get it up and running on your local machine. Below are the steps to follow for you to get UploadFly to run on your local machine.

### 1. Create a `.env` file

Provide your values as needed.

### 2 Configure your database

You can either use a local database or a Docker container to run your database.
Use either 2.a or 2.b for the next step.

### 2.a Local Database

Create a new database with your mysql client and add the configuration url to your env

### 2.b Local Database (using Docker)

Starting the docker container

```bash
docker compose up -d
```

### 3 Setup AWS

TODO

### 3. Install dependencies

Use `npm` to install dependencies.

```bash
npm install
```

### 4. Running the dev server

Finally, you can run the dev server:

```
npm run dev
```
