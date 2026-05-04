#!/usr/bin/env python3
"""Generate SQL Server script from a CSV export of Payments data.

This script assumes the Payments table corresponds to the EF Core
configuration in the project. It creates the Payments table (dbo) with
the same columns as those commonly found in a Payment entity and then
emits INSERT statements for each row in the CSV.

Usage:
  python generate_payment_sql_from_csv.py payments_export.csv payments.sql

CSV format:
- The first row must be headers. Helpful headers include:
  Id,Amount,Method,Status,PeriodStart,PeriodEnd,Notes,ResidenceId,HouseId,ResidentId,CreatedAt,IsDeleted
- Any header not listed will be ignored for inserts. Id is assumed to be an
  identity column and will not be inserted (unless you include it and choose to).
"""

import csv
import sys
from pathlib import Path

# Basic type mapping inferred from EF Core model in the repository
TYPE_MAP = {
    'Amount': 'DECIMAL(18,2)',
    'Method': 'INT',
    'Status': 'INT',
    'PeriodStart': 'DATETIME2',
    'PeriodEnd': 'DATETIME2',
    'Notes': 'VARCHAR(500)',
    'ResidenceId': 'INT',
    'HouseId': 'INT',
    'ResidentId': 'INT',
    'CreatedAt': 'DATETIME2',
    'IsDeleted': 'BIT',
}

PRIMARY_COLUMN = 'Id'
TABLE_NAME = 'Payments'
SCHEMA = 'dbo'


def quote_sql(v: str) -> str:
    if v is None:
        return 'NULL'
    v = v.strip()
    if v == '':
        return 'NULL'
    # Basic escaping for single quotes
    return "'" + v.replace("'", "''") + "'"


def cast_value(name: str, value: str) -> str:
    if value is None:
        return 'NULL'
    val = value.strip()
    if val == '':
        return 'NULL'

    t = TYPE_MAP.get(name)
    if t is None:
        # Unknown column, treat as string
        return quote_sql(val)

    if t.startswith('INT') or name in ('ResidenceId', 'HouseId', 'ResidentId', 'Method', 'Status'):
        try:
            return str(int(val))
        except ValueError:
            return 'NULL'
    if t.startswith('DECIMAL'):
        return str(val)
    if t.startswith('DATETIME'):
        return quote_sql(val)
    if t.startswith('BIT'):
        v = val.lower()
        if v in ('1', 'true', 't', 'yes', 'y'):
            return '1'
        if v in ('0', 'false', 'f', 'no', 'n'):
            return '0'
        return 'NULL'
    # Fallback to string
    return quote_sql(val)


def build_create_table_sql(columns_present: list[str]) -> str:
    parts = []
    parts.append(f"CREATE TABLE [{SCHEMA}].[{TABLE_NAME}] (")
    parts.append("  [Id] BIGINT IDENTITY(1,1) PRIMARY KEY,")

    for col in columns_present:
        if col == 'Id':
            continue
        sql_type = TYPE_MAP.get(col)
        if not sql_type:
            continue
        # Default NOT NULL constraints for key fields; allow NULL for optional ones
        if col in ('Notes', 'CreatedAt', 'IsDeleted'):
            null_part = 'NULL'
        else:
            null_part = 'NOT NULL'

        line = f"  [{col}] {sql_type} {null_part},"
        parts.append(line)

    # Remove trailing comma from last column
    if parts[-1].endswith(','):
        parts[-1] = parts[-1][:-1]
    parts.append(
        ")"
    )
    return "\n".join(parts) + ";\n"


def main():
    if len(sys.argv) != 3:
        print("Usage: python generate_payment_sql_from_csv.py <input.csv> <output.sql>")
        sys.exit(2)

    input_csv = Path(sys.argv[1])
    output_sql = Path(sys.argv[2])

    if not input_csv.exists():
        print(f"Input file not found: {input_csv}")
        sys.exit(3)

    with input_csv.open(mode='r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        headers = [h for h in (reader.fieldnames or [])]
        rows = list(reader)

    # Determine which columns to include based on headers and known type map
    columns_present = [h for h in headers if h in TYPE_MAP or h == PRIMARY_COLUMN]
    # Build DDL
    ddl = build_create_table_sql(columns_present)

    inserts = []
    # Build INSERT statements for each row (excluding Id since it's identity)
    insert_cols = [h for h in headers if h in TYPE_MAP and h != PRIMARY_COLUMN]
    if insert_cols:
        insert_cols_sql = ", ".join([f"[{c}]" for c in insert_cols])
        for row in rows:
            values = [cast_value(c, row.get(c, '')) for c in insert_cols]
            values_sql = ", ".join(values)
            inserts.append(
                f"INSERT INTO [{SCHEMA}].[{TABLE_NAME}] ({insert_cols_sql}) VALUES ({values_sql});"
            )

    # Write to file
    with output_sql.open(mode='w', encoding='utf-8') as out:
        out.write(ddl)
        if inserts:
            out.write("\n-- Data INSERTS\n")
            out.write("\n".join(inserts))
        out.write("\n")

    print(f"SQL script generated at {output_sql}")


if __name__ == '__main__':
    main()
