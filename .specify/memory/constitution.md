<!--
Sync Impact Report
- Version change: unratified scaffold → 1.0.0
- Modified principles: all scaffold placeholders replaced with backend-specific principles
- Added sections: Technology and Architectural Constraints; Development Workflow and Quality Gates
- Removed sections: none
- Follow-up TODOs: confirm the original ratification date
-->

# Standys Backend Constitution

## Core Principles

### I. Modular Feature Ownership

The backend MUST be organized by business module. Each module MUST own its controllers,
services, repositories, DTOs, module configuration, and module-specific tests where those
artifacts apply. Modules MUST expose only the providers and contracts required by other
modules, and cross-module dependencies MUST be explicit through NestJS module imports and
exports. This structure keeps responsibilities discoverable and prevents unrelated features
from becoming tightly coupled.

### II. Controller-Service-Repository Flow

HTTP requests MUST enter through controllers, which handle transport concerns such as routing,
authentication guards, request parsing, and response delegation. Controllers MUST pass validated
input to services. Services MUST own business rules, orchestration, authorization decisions,
and transaction boundaries. Repositories MUST own persistence queries and create/update/delete
operations. Controllers MUST NOT contain business logic or direct Prisma queries, and services
MUST NOT duplicate persistence details that belong in repositories. This flow provides a clear,
testable separation of concerns:

`request → controller → service → repository → database`

### III. Prisma as the Persistence Boundary

All relational database access MUST use Prisma through the shared infrastructure service and
the repository layer. The Prisma schema MUST remain the source of truth for models, relations,
constraints, and generated client types. Schema changes MUST be represented by committed Prisma
migrations, and repository queries MUST enforce ownership and relational boundaries in the query
itself. Transactional workflows MUST use Prisma transactions and pass the transaction client to
participating repositories when an operation spans multiple writes.

### IV. Explicit Contracts and Defensive Boundaries

External input MUST be represented by DTOs and validated at the application boundary with
class-validator and NestJS validation pipes. DTOs MUST reject unexpected fields and MUST express
required, optional, and formatted values explicitly. Authentication and authorization MUST be
enforced at the boundary and user-scoped queries MUST derive identity from the authenticated
request rather than caller-supplied identifiers. Sensitive data, including passwords and
secrets, MUST NOT be returned in public responses or committed to source control.

### V. Simple, Testable, Observable Design

Implementations MUST prefer the simplest design that satisfies the current requirement. New
business behavior MUST be covered by focused unit tests for services and repositories, while
request contracts and important cross-module behavior MUST be covered by integration or
end-to-end tests. Tests MUST verify meaningful behavior such as validation, ownership,
transactional behavior, and response contracts rather than only provider construction. Logging
MUST be intentional and MUST NOT expose credentials, tokens, or other sensitive values. Extra
abstractions, frameworks, or indirection MUST include a documented benefit before adoption.

## Technology and Architectural Constraints

- The backend MUST use NestJS and TypeScript as its application framework and implementation language.
- The backend MUST use Prisma ORM with PostgreSQL for relational persistence.
- The application MUST retain a simple MVC-oriented structure: controllers for transport,
  services for business logic, and repositories for data access.
- Feature code MUST live under `src/modules/<feature>`; shared infrastructure such as Prisma
  MUST live under `src/infrastructure`.
- Configuration MUST come from environment-backed configuration, and required runtime settings
  MUST fail clearly when absent.
- API input and output shapes MUST remain intentionally explicit; changes to established
  contracts MUST include corresponding tests and migration notes when consumers are affected.

## Development Workflow and Quality Gates

Every change MUST identify the affected module and preserve the module boundaries defined above.
Before review, contributors MUST run the relevant formatter/linter and automated tests, and MUST
run the build for changes affecting TypeScript, module wiring, DTOs, Prisma usage, or generated
types. Prisma schema changes MUST include a migration and a review of ownership, indexes,
relations, nullability, and rollback implications. A change is not complete until its tests pass,
its public behavior is documented where necessary, and no unrelated source files are modified.

Code review MUST check request flow, validation, authorization, repository ownership filters,
transaction boundaries, sensitive-data handling, test coverage, and migration safety. Exceptions
to this constitution MUST be recorded in the change description with the reason, scope, and
follow-up plan.

## Governance

This constitution governs backend design and delivery practices and supersedes conflicting local
conventions. Amendments MUST be proposed in writing, explain the motivation and impact, update
the version and last-amended date, and be reviewed alongside the affected implementation or
planning artifacts. An amendment MUST preserve the simple modular architecture unless it
explicitly records why a different boundary is required.

Versioning follows semantic rules: MAJOR indicates a backward-incompatible removal or
redefinition of a principle; MINOR indicates a new principle or materially expanded governance;
PATCH indicates clarifications, corrections, or non-semantic wording changes. Every feature or
refactor review MUST check compliance with the principles, and any exception MUST be visible to
reviewers. The constitution MUST be rechecked when the framework, persistence technology, module
boundaries, or API contract conventions materially change.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-09-13
