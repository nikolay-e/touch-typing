# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app

# Install any necessary packages (for example, git, if you use it for dependencies)
RUN apk update && apk add --no-cache git

# Copy and download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy the entire app source
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Final stage: minimal runtime image
FROM alpine:latest

# Set environment variables for predictable behavior
ENV GIN_MODE=release
WORKDIR /app

# Copy the compiled server binary and static files from the build stage
COPY --from=builder /app/server .
COPY --from=builder /app/cmd/server/templates ./templates
COPY --from=builder /app/cmd/server/static ./static

# Expose the correct port (adjust based on your server's port config)
EXPOSE 80

# Run the compiled server binary
CMD ["./server"]
