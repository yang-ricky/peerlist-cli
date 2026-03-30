export enum ExitCode {
  Success = 0,
  GeneralError = 1,
  AuthError = 2,
  ParseError = 3,
  RateLimited = 4,
  NetworkError = 5,
  ConfigError = 6,
  ArgumentError = 7,
}

export class CLIError extends Error {
  constructor(
    message: string,
    public readonly exitCode: ExitCode,
    public readonly code: string,
  ) {
    super(message);
    this.name = "CLIError";
  }
}

export class ParseError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.ParseError, "parse_failed");
    this.name = "ParseError";
  }
}

export class NetworkError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.NetworkError, "network_error");
    this.name = "NetworkError";
  }
}

export class RateLimitError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.RateLimited, "rate_limited");
    this.name = "RateLimitError";
  }
}

export class ConfigError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.ConfigError, "config_error");
    this.name = "ConfigError";
  }
}

export class ArgumentError extends CLIError {
  constructor(message: string) {
    super(message, ExitCode.ArgumentError, "argument_error");
    this.name = "ArgumentError";
  }
}
