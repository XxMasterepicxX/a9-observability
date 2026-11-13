const express = require('express');
const { MongoClient } = require('mongodb');
const { context, metrics, logs } = require('@opentelemetry/api');

const app = express();
const port = process.env.PORT || 3001;
const client = new MongoClient(process.env.MONGO_URL || 'mongodb://127.0.0.1:27018');
const meter = metrics.getMeter('todo-service');
const requests = meter.createCounter('todo.requests', { description: 'Completed HTTP requests' });
const duration = meter.createHistogram('todo.request.duration', { unit: 'ms' });
const logger = logs.getLogger('todo-service');
let todos;

app.use((req, res, next) => {
  const started = performance.now();
  const requestContext = context.active();
  res.on('finish', () => {
    const elapsed = performance.now() - started;
    const attributes = {
      'http.method': req.method,
      'http.route': req.route?.path || 'unmatched',
      'http.status_code': res.statusCode
    };
    requests.add(1, attributes);
    duration.record(elapsed, attributes);
    logger.emit({
      context: requestContext,
      severityText: res.statusCode >= 500 ? 'ERROR' : 'INFO',
      body: 'Request completed',
      attributes: { ...attributes, 'duration.ms': elapsed }
    });
  });
  next();
});

app.get('/todo', async (req, res) => {
  res.json(await todos.find({}, { projection: { _id: 0 } }).toArray());
});

app.get('/todo/:id', async (req, res) => {
  const todo = await todos.findOne({ id: req.params.id }, { projection: { _id: 0 } });
  if (!todo) return res.status(404).json({ error: 'Todo not found' });
  res.json(todo);
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: 'Request failed' });
});

async function startServer() {
  await client.connect();
  todos = client.db('a9_observability').collection('todos');
  // Upserts keep the three starter records from duplicating after a restart.
  await todos.createIndex({ id: 1 }, { unique: true });
  for (const todo of [
    { id: '1', title: 'Buy groceries' },
    { id: '2', title: 'Install Aspecto' },
    { id: '3', title: 'buy my own name domain' }
  ]) {
    await todos.updateOne({ id: todo.id }, { $set: todo }, { upsert: true });
  }
  app.listen(port, '0.0.0.0', () => console.log(`Todo app listening on port ${port}`));
}

startServer().catch(async error => {
  console.error(error);
  await client.close();
  process.exit(1);
});
