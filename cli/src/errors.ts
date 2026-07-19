export interface ValidationIssue {
  readonly path: string;
  readonly message: string;
  readonly allowedValues?: readonly unknown[];
}

export class CallerInputError extends Error {
  readonly actionName: string;
  readonly issues: readonly ValidationIssue[];

  constructor(actionName: string, issues: readonly ValidationIssue[]) {
    const detail = issues.map((issue) => {
      const allowed = issue.allowedValues
        ? ` (allowed: ${issue.allowedValues.map((value) => JSON.stringify(value)).join(', ')})`
        : '';
      return `${issue.path || '<input>'} ${issue.message}${allowed}`;
    }).join('; ');
    super(`Invalid input for ${actionName}: ${detail}`);
    this.name = 'CallerInputError';
    this.actionName = actionName;
    this.issues = issues;
  }
}

export class CallerContractError extends Error {
  readonly actionName: string;
  readonly issues: readonly ValidationIssue[];

  constructor(actionName: string, issues: readonly ValidationIssue[]) {
    const detail = issues.map((issue) => `${issue.path || '<output>'} ${issue.message}`).join('; ');
    super(`Threads API response violated the ${actionName} contract: ${detail}`);
    this.name = 'CallerContractError';
    this.actionName = actionName;
    this.issues = issues;
  }
}

export class ThreadsApiError extends Error {
  readonly status: number;
  readonly details: unknown;

  constructor(status: number, message: string, details: unknown) {
    super(message);
    this.name = 'ThreadsApiError';
    this.status = status;
    this.details = details;
  }
}
