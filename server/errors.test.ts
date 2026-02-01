import { describe, it, expect } from "vitest";
import { UnauthorizedError, NotFoundError, ValidationError, ConflictError, ForbiddenError, BadRequestError } from "./errors";

describe("Custom Error Classes", () => {
  describe("UnauthorizedError", () => {
    it("should create error with default message", () => {
      const error = new UnauthorizedError();
      expect(error.message).toBe("Não autorizado");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.isOperational).toBe(true);
    });

    it("should create error with custom message", () => {
      const error = new UnauthorizedError("Token inválido");
      expect(error.message).toBe("Token inválido");
      expect(error.statusCode).toBe(401);
    });
  });

  describe("ForbiddenError", () => {
    it("should create error with correct status code", () => {
      const error = new ForbiddenError();
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
    });
  });

  describe("NotFoundError", () => {
    it("should create error with correct status code", () => {
      const error = new NotFoundError("Usuário não encontrado");
      expect(error.message).toBe("Usuário não encontrado");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });
  });

  describe("ConflictError", () => {
    it("should create error with correct status code", () => {
      const error = new ConflictError("Email já existe");
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
    });
  });

  describe("ValidationError", () => {
    it("should create error with correct status code", () => {
      const error = new ValidationError("Dados inválidos");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("BadRequestError", () => {
    it("should create error with correct status code", () => {
      const error = new BadRequestError();
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
    });
  });

  describe("Error inheritance", () => {
    it("should be instance of Error", () => {
      const error = new UnauthorizedError();
      expect(error instanceof Error).toBe(true);
    });

    it("should have stack trace", () => {
      const error = new NotFoundError();
      expect(error.stack).toBeDefined();
    });
  });
});
