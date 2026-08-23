# Migrations

`../schema.sql` is the canonical schema for a fresh install — run it once against an empty database.

Future schema changes go here as sequential, hand-written files: `001_description.sql`, `002_description.sql`, etc. Each file should be additive/backward-compatible where possible and safe to run once against a database that already has `schema.sql` applied.
