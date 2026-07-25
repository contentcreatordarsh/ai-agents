#!/usr/bin/env python3
"""
Parse bank/expense CSV exports and emit monthly aggregates as JSON on stdout.
Supports common column aliases; extend NORMALIZED_ALIASES for your bank format.
"""
from __future__ import annotations

import csv
import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path

DATE_ALIASES = ("date", "transaction date", "posted date", "posting date", "time")
AMOUNT_ALIASES = ("amount", "debit", "credit", "transaction amount", "value")
DESC_ALIASES = ("description", "memo", "details", "narrative", "payee", "name")
CATEGORY_ALIASES = ("category", "type", "classification")


def norm_header(h: str) -> str:
    return re.sub(r"\s+", " ", h.strip().lower())


def pick_column(fieldnames: list[str], aliases: tuple[str, ...]) -> str | None:
    normalized = {norm_header(f): f for f in fieldnames}
    for alias in aliases:
        if alias in normalized:
            return normalized[alias]
    return None


def parse_amount(raw: str) -> float | None:
    if raw is None:
        return None
    s = str(raw).strip()
    if not s:
        return None
    s = s.replace(",", "").replace("$", "").replace("(", "-").replace(")", "")
    try:
        return float(s)
    except ValueError:
        return None


def parse_date(raw: str) -> datetime | None:
    if not raw or not str(raw).strip():
        return None
    raw = str(raw).strip()
    for fmt in (
        "%Y-%m-%d",
        "%m/%d/%Y",
        "%m/%d/%y",
        "%d/%m/%Y",
        "%Y/%m/%d",
        "%b %d, %Y",
        "%B %d, %Y",
    ):
        try:
            return datetime.strptime(raw, fmt)
        except ValueError:
            continue
    return None


def load_transactions(data_dir: Path) -> list[dict]:
    rows: list[dict] = []
    for path in sorted(data_dir.glob("**/*")):
        if not path.is_file():
            continue
        if path.suffix.lower() not in (".csv", ".tsv"):
            continue
        delimiter = "\t" if path.suffix.lower() == ".tsv" else ","
        with path.open(newline="", encoding="utf-8-sig") as f:
            reader = csv.DictReader(f, delimiter=delimiter)
            if not reader.fieldnames:
                continue
            date_col = pick_column(reader.fieldnames, DATE_ALIASES)
            amount_col = pick_column(reader.fieldnames, AMOUNT_ALIASES)
            desc_col = pick_column(reader.fieldnames, DESC_ALIASES)
            cat_col = pick_column(reader.fieldnames, CATEGORY_ALIASES)
            if not date_col or not amount_col:
                print(
                    f"Skipping {path.name}: missing date/amount columns",
                    file=sys.stderr,
                )
                continue
            for row in reader:
                dt = parse_date(row.get(date_col, ""))
                amount = parse_amount(row.get(amount_col, ""))
                if dt is None or amount is None:
                    continue
                rows.append(
                    {
                        "date": dt.strftime("%Y-%m-%d"),
                        "amount": amount,
                        "description": (row.get(desc_col) or "").strip()
                        if desc_col
                        else "",
                        "category": (row.get(cat_col) or "Uncategorized").strip()
                        if cat_col
                        else "Uncategorized",
                        "source_file": path.name,
                    }
                )
    return rows


def summarize(month: str, transactions: list[dict]) -> dict:
    year_s, month_s = month.split("-")
    year, mon = int(year_s), int(month_s)

    in_month = [
        t
        for t in transactions
        if datetime.strptime(t["date"], "%Y-%m-%d").year == year
        and datetime.strptime(t["date"], "%Y-%m-%d").month == mon
    ]

    total_spend = sum(abs(t["amount"]) for t in in_month if t["amount"] < 0)
    total_income = sum(t["amount"] for t in in_month if t["amount"] > 0)
    net = sum(t["amount"] for t in in_month)

    by_category: dict[str, float] = defaultdict(float)
    for t in in_month:
        if t["amount"] < 0:
            by_category[t["category"]] += abs(t["amount"])

    top_merchants: dict[str, float] = defaultdict(float)
    for t in in_month:
        if t["amount"] < 0:
            key = (t["description"] or "Unknown")[:80]
            top_merchants[key] += abs(t["amount"])

    sorted_categories = sorted(
        by_category.items(), key=lambda x: x[1], reverse=True
    )
    sorted_merchants = sorted(top_merchants.items(), key=lambda x: x[1], reverse=True)[
        :15
    ]

    return {
        "month": month,
        "transaction_count": len(in_month),
        "total_spend": round(total_spend, 2),
        "total_income": round(total_income, 2),
        "net": round(net, 2),
        "by_category": [
            {"category": c, "amount": round(a, 2)} for c, a in sorted_categories
        ],
        "top_merchants": [
            {"description": d, "amount": round(a, 2)} for d, a in sorted_merchants
        ],
        "sample_transactions": in_month[:25],
    }


def main() -> None:
    if len(sys.argv) != 3:
        print("Usage: analyze_expenses.py <data_dir> <YYYY-MM>", file=sys.stderr)
        sys.exit(2)

    data_dir = Path(sys.argv[1])
    month = sys.argv[2]

    if not data_dir.is_dir():
        print(f"Data directory not found: {data_dir}", file=sys.stderr)
        sys.exit(1)

    transactions = load_transactions(data_dir)
    result = summarize(month, transactions)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
