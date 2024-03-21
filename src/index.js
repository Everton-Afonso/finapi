const express = require("express");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(express.json());

const custumers = [];

function verifyIfExistsAccountCPF(request, response, next) {
  const { cpf } = request.headers;
  const custumer = custumers.find((custumer) => custumer.cpf === cpf);

  if (!custumer) {
    return response.status(400).json({
      error: "Customer not found",
    });
  }

  request.custumer = custumer;

  return next();
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === "credit") {
      return acc + operation.amount;
    } else {
      return acc - operation.amount;
    }
  }, 0);

  return balance;
}

app.post("/account", (request, response) => {
  const { cpf, name } = request.body;
  const custumersAlreadyExists = custumers.some(
    (custumer) => custumer.cpf === cpf
  );

  if (custumersAlreadyExists) {
    return response.status(400).json({
      error: "Customer already exists!",
    });
  }

  custumers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: [],
  });

  return response.status(201).send();
});

// app.use(verifyIfExistsAccountCPF);

app.get("/statement/", verifyIfExistsAccountCPF, (request, response) => {
  const { custumer } = request;

  return response.json(custumer.statement);
});

app.post("/deposit", verifyIfExistsAccountCPF, (request, response) => {
  const { description, amount } = request.body;
  const { custumer } = request;
  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit",
  };

  custumer.statement.push(statementOperation);

  return response.status(201).send();
});

app.post("/withdraw", verifyIfExistsAccountCPF, (request, response) => {
  const { amount } = request.body;
  const { custumer } = request;
  const balance = getBalance(custumer.statement);

  if (balance < amount) {
    return response.status(400).json({
      error: "Insufficient funds!",
    });
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit",
  };

  custumer.statement.push(statementOperation);

  return response.status(201).send();
});

app.listen(3333);
