# A9 Observability

A small todo app based on the class starter files. It uses OpenTelemetry to send
traces to Jaeger. Metrics and request logs print to the console.

## Run

Install Docker with Docker Compose. Then run this command.

```sh
docker compose -p cis4930-a9 up -d --build
```

Open http://localhost:16686. Choose `todo-service` then click **Find Traces**.

Send a few requests.

```sh
curl http://localhost:3001/todo
curl http://localhost:3001/todo/1
curl http://localhost:3001/todo/999
```

The first request returns the three starter todos. The second returns one todo.
The last returns HTTP 404 because that ID does not exist.

Read the metrics and logs.

```sh
docker compose -p cis4930-a9 logs app
```

Metrics print every five seconds after requests arrive. `todo.requests` counts
requests by route and status. `todo.request.duration` records times in
milliseconds. Each request log has a trace ID that matches a request in Jaeger.
Jaeger shows traces. The console shows metrics and logs.

Stop the containers when finished.

```sh
docker compose -p cis4930-a9 down
```

This removes the sample database and traces. Starting again creates three
starter todos. Restarting just the app does not add copies of those todos.

The app uses port 3001. MongoDB stays inside the Docker network. Docker supplies
Node so a local Node install is not needed.

## References

Starter `index.js` and `tracing.js` supplied with CIS4930 A9 in Canvas.

https://opentelemetry.io/docs/languages/js/exporters/

https://opentelemetry.io/docs/concepts/signals/
