#!/usr/bin/env python3
"""Synthetic checks. Does not read private statements."""

import runpy
from pathlib import Path
from unittest.mock import patch
from types import SimpleNamespace


functions = runpy.run_path(str(Path(__file__).with_name("normalize-seed.py")))


def rejects(fn, *args):
    try:
        fn(*args)
    except ValueError:
        return
    raise AssertionError("Invalid input was accepted")


def main():
    money = functions["money"]
    assert money("-1,234.56 PLN", "PLN") == "-1234.56"
    assert money("-€12.99", "EUR") == "-12.99"
    assert money("-1 234,56", polish=True) == "-1234.56"
    rejects(money, "0.001")
    assert functions["en_date"]("Oct 8, 2026") == "2026-10-08"

    header = ["2026-10-08", "01-01-2026", "'" + "1" * 26, "Owner", "PLN", "100,00", "56,78", "1", ""]
    row = ["03-01-2026", "01-01-2026", "VISA PŁATNOŚĆ KARTĄ 10.00 EUR Merchant", "", "", "-43,22", "56,78", "1", ""]
    source = {"id": "test", "rawRows": [header, row]}
    accounts, entries = functions["erste"](source)
    assert entries[0]["effectiveDate"] == "2026-01-03"
    assert entries[0]["operationDate"] == "2026-01-01"
    assert entries[0]["originalAmount"] == "-10.00" and entries[0]["originalCurrency"] == "EUR"
    assert functions["reconcile"](accounts, entries)[0][0]["status"] == "passed"
    accounts[0]["closingBalance"] = "60.00"
    checks, issues = functions["reconcile"](accounts, entries)
    assert checks[0]["status"] == "mismatch" and issues[0]["difference"] == "-3.22"
    rejects(functions["erste"], {"id": "test", "rawRows": [header]})

    def csv_row(*cells):
        return list(cells) + [""] * (13 - len(cells))

    rows = []
    for opening, closing in [("100.00 PLN", "90.00 PLN"), ("200.00 PLN", "190.00 PLN")]:
        rows.extend([csv_row("Kids & Teen (PLN)"), csv_row("Opening balance", opening),
                     csv_row("Closing balance", closing)])
    rows.append(csv_row("Current Accounts Transaction Statements"))
    for balance in ["90.00 PLN", "190.00 PLN"]:
        rows.extend([csv_row("Kids & Teen (PLN)"),
                     csv_row("Date", "Description", "Category", "Money in/out", "Balance", "Tax withheld", "Other taxes", "Fees"),
                     csv_row("Jan 3, 2026", "Plan fee", "Merchant", "-10.00 PLN", balance, "0.00 PLN", "0.00 PLN", "10.00 PLN"),
                     csv_row("Total", "", "", "-10.00 PLN")])
    aa, ee = functions["revolut"]({"id": "r", "path": "statement_2026-01-01_2026-10-08_x.csv", "rawRows": rows})
    assert len(aa) == 2 and aa[0]["id"] != aa[1]["id"]
    assert len(ee) == 2 and ee[0]["fee"] == "10.00"
    assert all(c["status"] == "passed" for c in functions["reconcile"](aa, ee)[0])

    fx_accounts = [{"id": "pln", "accountNumbers": ["1"]}, {"id": "eur", "accountNumbers": ["2"]}]
    fx_entries = [{"id": "a", "accountId": "pln", "amount": "-43.00", "effectiveDate": "2026-01-01",
                   "reference": "123", "sourceExchangeRate": "4.3", "counterpartyAccount": "2"},
                  {"id": "b", "accountId": "eur", "amount": "10.00", "effectiveDate": "2026-01-01",
                   "reference": "123", "sourceExchangeRate": "4.3", "counterpartyAccount": "1"}]
    assert len(functions["link_fx"](fx_entries, fx_accounts)) == 1
    assert fx_entries[0]["transferId"] == fx_entries[1]["transferId"]
    rejects(functions["link_fx"], fx_entries[:1], fx_accounts)

    text = "Номер лицевого счета: 123\nза период с 01.01.2025 по 08.10.2026\n"
    text += " " * 89 + "Описание\n"
    text += "04.10.2026  05.10.2026  +10 000.00 ₽  +10 000.00 ₽  Пополнение.  0479\n"
    text += "22:01  04:22".ljust(89) + "Система\n" + " " * 89 + "быстрых платежей\n"
    text += "Пополнения: 10 000,00 ₽\nРасходы: 0,00 ₽\f"
    with patch("subprocess.run", return_value=SimpleNamespace(stdout=text)):
        aa, ee = functions["tbank"]({"id": "pdf"}, Path("unused.pdf"))
    assert ee[0]["description"] == "Пополнение. Система быстрых платежей"
    assert ee[0]["occurredLocal"] == "2026-10-04T22:01" and ee[0]["effectiveDate"] == "2026-10-05"
    assert ee[0]["timeZone"] is None and "occurredAt" not in ee[0]
    assert functions["reconcile"](aa, ee)[0][0]["status"] == "totals_only"
    print("Normalization checks passed (synthetic data).")


if __name__ == "__main__":
    main()
