#!/usr/bin/env python3
"""Normalize local bank statements. Requires Python 3 and Poppler pdftotext."""

import argparse
import csv
import hashlib
import json
import os
import re
import subprocess
from collections import Counter, defaultdict
from datetime import datetime
from decimal import Decimal
from pathlib import Path


# Private statements live outside the repository.
ROOT = Path(
    os.environ.get("BUDGETLY_SEED_DIR", Path(__file__).resolve().parents[2] / "budgetly-seed/seed")
)
DATE_EN = re.compile(r"^[A-Z][a-z]{2} \d{1,2}, \d{4}$")
ACCOUNT = re.compile(r"^(Personal Account|Kids & Teen|Aion)\s+\(([A-Z]{3})\)$")
PDF_ROW = re.compile(
    r"^(\d{2}\.\d{2}\.\d{4})\s+(\d{2}\.\d{2}\.\d{4})\s+"
    r"([+-][\d ]+\.\d{2}) ₽\s+([+-][\d ]+\.\d{2}) ₽\s+"
    r"(.+?)\s+(\d{4}|—)\s*$"
)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def money(value, currency=None, polish=False):
    value = value.replace("\xa0", " ").replace(" ", "").replace("₽", "")
    if currency:
        value = value.replace(currency, "")
    value = value.replace("€", "").replace("$", "")
    value = value.replace(",", "." if polish else "")
    number = Decimal(value)
    require(number.is_finite() and number == number.quantize(Decimal("0.01")),
            f"Invalid money: {value}")
    return format(number, ".2f")


def date(value, pattern):
    return datetime.strptime(value, pattern).date().isoformat()


def en_date(value):
    # The export uses English month names regardless of the host locale.
    months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
    month, day, year = value.replace(",", "").split()
    return date(f"{year}-{months.index(month) + 1:02}-{int(day):02}", "%Y-%m-%d")


def entry(source, account, row, effective_date, amount, description, **fields):
    return {
        "id": f"{source['id']}:{row}", "accountId": account["id"],
        "effectiveDate": effective_date, "amount": amount,
        "currency": account["currency"], "description": description,
        "classification": "unclassified", "transferId": None,
        "sourceId": source["id"], "sourceRow": row, **fields,
    }


def erste(source):
    rows = source["rawRows"]
    require(all(len(r) == 9 for r in rows), "Unexpected Erste row width")
    header = rows[0]
    currency = header[4]
    require(currency in {"EUR", "USD", "PLN"}, "Unexpected Erste currency")
    number = re.sub(r"\D", "", header[2])
    require(len(number) == 26, "Invalid Erste account number")
    account = {
        "id": f"erste-{currency.lower()}", "institution": "Erste",
        "name": f"Erste {currency}", "currency": currency,
        "accountNumbers": [number], "kind": "current",
        "periodStart": date(header[1], "%d-%m-%Y"), "periodEnd": header[0],
        "openingBalance": money(header[5], polish=True),
        "closingBalance": money(header[6], polish=True),
        "coverage": "statement movements", "sourceId": source["id"],
        "summaryRows": [1],
    }
    require(len(rows) - 1 == int(header[7]), "Erste record count mismatch")
    require([int(r[7]) for r in rows[1:]] == list(range(1, len(rows))),
            "Erste sequence mismatch")
    entries = []
    for n, r in enumerate(rows[1:], 2):
        e = entry(source, account, n, date(r[0], "%d-%m-%Y"),
                  money(r[5], polish=True), r[2],
                  operationDate=date(r[1], "%d-%m-%Y"),
                  postingDate=date(r[0], "%d-%m-%Y"),
                  balanceAfter=money(r[6], polish=True),
                  counterparty=r[3] or None, counterpartyAccount=r[4] or None,
                  sourceSequence=int(r[7]))
        original = re.search(r"KARTĄ (\d+\.\d{2}) ([A-Z]{3})", r[2])
        if original:
            sign = "-" if Decimal(e["amount"]) < 0 else ""
            e.update(originalAmount=sign + money(original[1]), originalCurrency=original[2])
        fx = re.fullmatch(r"(\d+) - Transakcja eFX kurs: (\d+\.\d+)", r[2])
        if fx:
            e.update(reference=fx[1], sourceExchangeRate=fx[2])
        entries.append(e)
    return [account], entries


def revolut(source):
    match = re.search(r"_(\d{4}-\d{2}-\d{2})_(\d{4}-\d{2}-\d{2})_", source["path"])
    require(match is not None, "Missing Revolut statement period")
    accounts, entries = [], []
    counts = Counter()
    by_title = defaultdict(list)
    section = "summary"
    account = None
    columns = None
    statement_counts = Counter()
    for n, r in enumerate(source["rawRows"], 1):
        title = r[0]
        if "Transaction Statements" in title:
            section = "entries"
            account = None
            columns = None
            continue
        heading = ACCOUNT.fullmatch(title)
        if heading:
            columns = None
            if section == "summary":
                counts[title] += 1
                label = re.sub(r"[^a-z]+", "-", heading[1].lower()).strip("-")
                account = {
                    "id": f"revolut-{label}-{heading[2].lower()}-{counts[title]}",
                    "institution": "Revolut", "name": title,
                    "currency": heading[2], "accountNumbers": [],
                    "kind": "savings" if heading[1] == "Aion" else "current",
                    "periodStart": match[1], "periodEnd": match[2],
                    "openingBalance": None, "closingBalance": None,
                    "coverage": "interest only" if heading[1] == "Aion" else "statement movements",
                    "sourceId": source["id"], "summaryRows": [n],
                }
                if heading[1] == "Kids & Teen":
                    account["name"] += f" #{counts[title]}"
                    account["identityNote"] = "Separate unnamed section; ordinal follows source order."
                accounts.append(account)
                by_title[title].append(account)
            else:
                index = statement_counts[title]
                require(index < len(by_title[title]), "Revolut statement without summary")
                account = by_title[title][index]
                statement_counts[title] += 1
            continue
        if section == "summary" and account and any(r):
            account["summaryRows"].append(n)
            if title.lower().startswith("account number") and r[1] != "N/A":
                account["accountNumbers"].append(r[1])
            if title == "Financial institution name":
                account["legalInstitution"] = r[1]
            for i, cell in enumerate(r[:-1]):
                if cell in {"Opening balance", "Closing balance"}:
                    key = "openingBalance" if cell == "Opening balance" else "closingBalance"
                    account[key] = money(r[i + 1], account["currency"])
            continue
        if section != "entries":
            continue
        if title == "Date":
            columns = r
        elif DATE_EN.fullmatch(title):
            require(account is not None and columns is not None, "Orphan Revolut entry")
            require(account["kind"] == "current", "New savings format needs an explicit mapping")
            currency = account["currency"]
            values = defaultdict(list)
            for col, value in zip(columns, r):
                if col and value:
                    values[col].append(value)
            e = entry(source, account, n, en_date(title),
                      money(values["Money in/out"][0], currency), r[1],
                      sourceCategory=r[2],
                      balanceAfter=money(values["Balance"][0], currency),
                      fee=money(values["Fees"][0], currency),
                      taxWithheld=money(values["Tax withheld"][0], currency),
                      otherTaxes=money(values["Other taxes"][0], currency))
            if len(values["Money in/out"]) == 2:
                e.update(reportedEquivalentAmount=money(values["Money in/out"][1], "PLN"),
                         reportedEquivalentCurrency="PLN")
            if len(values["Balance"]) == 2:
                e.update(reportedEquivalentBalance=money(values["Balance"][1], "PLN"))
            entries.append(e)
        elif title == "Total":
            require(account is not None and columns is not None, "Orphan Revolut total")
            account["totalsRow"] = n
            account["reportedNetMovement"] = money(r[columns.index("Money in/out")], account["currency"])
        elif title and title not in {"---------", "Transaction statement", "Transaction statement (only interest receipt)"}:
            require("Transaction Statements" in title, f"Unmapped Revolut row {n}: {title}")
    require(all(a["openingBalance"] is not None and a["closingBalance"] is not None for a in accounts),
            "Missing Revolut balance")
    require(sum(bool(DATE_EN.fullmatch(r[0])) for r in source["rawRows"]) == len(entries),
            "Revolut entry count mismatch")
    return accounts, entries


def tbank(source, path):
    text = subprocess.run(["pdftotext", "-layout", str(path), "-"],
                          check=True, capture_output=True, text=True).stdout
    pages = text.split("\f")
    if not pages[-1].strip():
        pages.pop()
    source["rawPages"] = pages
    period = re.search(r"за период с (\d{2}\.\d{2}\.\d{4}) по (\d{2}\.\d{2}\.\d{4})", text)
    number = re.search(r"Номер лицевого счета: (\d+)", text)
    require(period is not None and number is not None, "Missing TBank statement metadata")
    account = {
        "id": "tbank-rub", "institution": "TBank", "name": "TBank RUB",
        "currency": "RUB", "accountNumbers": [number[1]], "kind": "current",
        "periodStart": date(period[1], "%d.%m.%Y"),
        "periodEnd": date(period[2], "%d.%m.%Y"),
        "openingBalance": None, "closingBalance": None,
        "coverage": "statement movements; balances absent", "sourceId": source["id"],
    }
    entries = []
    for page_number, page in enumerate(pages, 1):
        current = None
        description_column = next(line.index("Описание") for line in page.splitlines() if "Описание" in line)
        for line_number, line in enumerate(page.splitlines(), 1):
            if re.match(r"^\d{2}\.\d{2}\.\d{4}", line):
                m = PDF_ROW.fullmatch(line)
                require(m is not None, f"Unparsed TBank row {page_number}:{line_number}")
                current = entry(source, account, f"{page_number}:{line_number}",
                                date(m[2], "%d.%m.%Y"), money(m[4]), m[5],
                                operationDate=date(m[1], "%d.%m.%Y"),
                                postingDate=date(m[2], "%d.%m.%Y"),
                                originalAmount=money(m[3]), originalCurrency="RUB",
                                cardLast4=None if m[6] == "—" else m[6],
                                sourcePage=page_number, sourceLine=line_number,
                                sourceText=line, timeZone=None)
                entries.append(current)
            elif current and re.match(r"^\d{2}:\d{2}\s+\d{2}:\d{2}", line):
                times = re.findall(r"\d{2}:\d{2}", line[:description_column])
                require(len(times) == 2, "Missing TBank times")
                current["occurredLocal"] = current["operationDate"] + "T" + times[0]
                current["postedLocal"] = current["postingDate"] + "T" + times[1]
                current["sourceText"] += "\n" + line
                continuation = line[description_column:].strip()
                if continuation:
                    current["description"] += " " + continuation
            elif "Пополнения:" in line or "Расходы:" in line or "АО «ТБанк»" in line:
                current = None
            elif current and line.strip():
                require(not line[:description_column].strip(), "Unexpected TBank continuation")
                continuation = line[description_column:].strip()
                if continuation:
                    current["description"] += " " + continuation
                    current["sourceText"] += "\n" + line
    require(all("occurredLocal" in e for e in entries), "Missing TBank time line")
    require(len(re.findall(r"^\d{2}\.\d{2}\.\d{4}", text, re.M)) == len(entries),
            "TBank row count mismatch")
    for label, key in [("Пополнения", "reportedCredits"), ("Расходы", "reportedDebits")]:
        total = re.search(label + r":\s+([\d ]+,\d{2}) ₽", text)
        require(total is not None, "Missing TBank totals")
        account[key] = money(total[1], polish=True)
    return [account], entries


def reconcile(accounts, entries):
    checks, issues = [], []
    by_account = defaultdict(list)
    for e in entries:
        by_account[e["accountId"]].append(e)
    for a in accounts:
        movements = by_account[a["id"]]
        amounts = [Decimal(e["amount"]) for e in movements]
        net = sum(amounts, Decimal(0))
        check = {
            "accountId": a["id"], "entryCount": len(movements),
            "credits": format(sum((x for x in amounts if x > 0), Decimal(0)), ".2f"),
            "debits": format(-sum((x for x in amounts if x < 0), Decimal(0)), ".2f"),
            "netMovement": format(net, ".2f"), "status": "passed",
        }
        if a["coverage"] == "interest only":
            check["status"] = "partial"
            check["note"] = "Only interest receipts supplied; deposit/withdrawal history is absent."
        elif a["openingBalance"] is not None:
            calculated = Decimal(a["openingBalance"]) + net
            delta = calculated - Decimal(a["closingBalance"])
            check.update(calculatedClosingBalance=format(calculated, ".2f"),
                         reportedClosingBalance=a["closingBalance"], difference=format(delta, ".2f"))
            if delta:
                check["status"] = "mismatch"
                issues.append({"code": "closing_balance_mismatch", **check})
        else:
            check["status"] = "totals_only"
            check["note"] = "Opening and closing balances are absent; net movement is not a balance."
        if "reportedNetMovement" in a:
            require(net == Decimal(a["reportedNetMovement"]), f"Net total mismatch: {a['id']}")
        if "reportedCredits" in a:
            require(check["credits"] == a["reportedCredits"] and check["debits"] == a["reportedDebits"],
                    f"Credit/debit totals mismatch: {a['id']}")
        if a["institution"] == "Revolut" and a["kind"] == "current":
            balance = Decimal(a["openingBalance"])
            for e in movements:
                balance += Decimal(e["amount"])
                require(balance == Decimal(e["balanceAfter"]), f"Running balance mismatch: {e['id']}")
        checks.append(check)
    return checks, issues


def link_fx(entries, accounts):
    groups = defaultdict(list)
    by_id = {a["id"]: a for a in accounts}
    for e in entries:
        if "sourceExchangeRate" in e:
            groups[e["reference"]].append(e)
    transfers = []
    for reference, legs in sorted(groups.items()):
        require(len(legs) == 2 and legs[0]["accountId"] != legs[1]["accountId"],
                f"Unpaired eFX reference: {reference}")
        outgoing = [e for e in legs if Decimal(e["amount"]) < 0]
        incoming = [e for e in legs if Decimal(e["amount"]) > 0]
        require(len(outgoing) == len(incoming) == 1, "Invalid eFX directions")
        require(len({e["effectiveDate"] for e in legs}) == 1, "eFX date mismatch")
        require(len({e["sourceExchangeRate"] for e in legs}) == 1, "eFX rate mismatch")
        for e, other in [(legs[0], legs[1]), (legs[1], legs[0])]:
            number = re.sub(r"\D", "", e.get("counterpartyAccount") or "")
            require(number in by_id[other["accountId"]]["accountNumbers"], "eFX account mismatch")
            e.update(classification="internal-transfer", transferId=f"erste-fx-{reference}")
        transfers.append({"id": f"erste-fx-{reference}", "reference": reference,
                          "entryIds": [e["id"] for e in legs], "evidence": "matching eFX reference and reciprocal account numbers",
                          "sourceExchangeRate": legs[0]["sourceExchangeRate"]})
    return transfers


def build(root):
    sources, accounts, entries = [], [], []
    paths = sorted(p for bank in ("erste", "revolut", "tbank") for p in (root / bank).rglob("*") if p.is_file())
    require(paths, "No input statements found")
    for path in paths:
        relative = path.relative_to(root).as_posix()
        source = {"id": hashlib.sha256(relative.encode()).hexdigest()[:16],
                  "path": relative, "sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        bank = path.parent.name
        if path.suffix.lower() == ".csv" and bank in {"erste", "revolut"}:
            source["rawRows"] = list(csv.reader(path.open(encoding="utf-8-sig", newline=""),
                                               delimiter=";" if bank == "erste" else ","))
            aa, ee = erste(source) if bank == "erste" else revolut(source)
        elif path.suffix.lower() == ".pdf" and bank == "tbank":
            aa, ee = tbank(source, path)
        else:
            raise ValueError(f"Unsupported source: {relative}")
        sources.append(source)
        accounts.extend(aa)
        entries.extend(ee)
    require(len({a["id"] for a in accounts}) == len(accounts), "Duplicate account IDs")
    require(len({e["id"] for e in entries}) == len(entries), "Duplicate entry IDs")
    by_id = {a["id"]: a for a in accounts}
    for e in entries:
        a = by_id[e["accountId"]]
        require(a["periodStart"] <= e["effectiveDate"] <= a["periodEnd"],
                f"Entry outside statement period: {e['id']}")
    checks, issues = reconcile(accounts, entries)
    for e in entries:
        if "?" in (e.get("counterparty") or ""):
            issues.append({"code": "unreadable_counterparty", "entryId": e["id"],
                           "note": "Question marks are present in the original CSV; name cannot be recovered."})
    transfers = link_fx(entries, accounts)
    entries.sort(key=lambda e: (e["effectiveDate"], e["accountId"],
                               e.get("sourcePage", 0), e.get("sourceLine", e["sourceRow"])))
    return {"schemaVersion": 1, "accounts": accounts, "entries": entries,
            "transfers": transfers, "checks": checks, "issues": issues, "sources": sources}


def write_outputs(data, output):
    output.mkdir(parents=True, exist_ok=True)
    (output / "seed.json").write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    fields = ["id", "accountId", "effectiveDate", "operationDate", "postingDate", "occurredLocal", "postedLocal",
              "currency", "amount", "balanceAfter", "description", "counterparty", "counterpartyAccount",
              "originalCurrency", "originalAmount", "fee", "taxWithheld", "otherTaxes",
              "reportedEquivalentCurrency", "reportedEquivalentAmount", "sourceCategory", "classification",
              "transferId", "reference", "sourceExchangeRate", "cardLast4", "sourceId", "sourceRow", "sourcePage", "sourceLine"]
    with (output / "entries.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(data["entries"])
    account_fields = ["id", "institution", "legalInstitution", "name", "currency", "kind", "periodStart", "periodEnd",
                      "openingBalance", "closingBalance", "coverage", "sourceId"]
    with (output / "accounts.csv").open("w", encoding="utf-8-sig", newline="") as file:
        writer = csv.DictWriter(file, account_fields, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(data["accounts"])
    table = ["| Счёт | Валюта | Операций | Начальный остаток | Остаток в сводке | Сверка |",
             "|---|---|---:|---:|---:|---|"]
    labels = {"passed": "сошлось", "mismatch": "расхождение", "partial": "только проценты",
              "totals_only": "сверены обороты"}
    for a, c in zip(data["accounts"], data["checks"]):
        table.append(f"| {a['name']} | {a['currency']} | {c['entryCount']} | "
                     f"{a['openingBalance'] or 'нет'} | {a['closingBalance'] or 'нет'} | {labels[c['status']]} |")
    limitations = []
    sources = {s["id"]: s for s in data["sources"]}
    for a, c in zip(data["accounts"], data["checks"]):
        if c["status"] == "mismatch":
            limitations.append(f"- {a['name']}: сводка сообщает {a['closingBalance']} {a['currency']}. "
                               f"Начальные {a['openingBalance']} и сумма операций {c['netMovement']} "
                               f"дают {c['calculatedClosingBalance']}. Разница — {c['difference']}. "
                               "Обе суммы сохранены; исходная сводка не исправлена.")
        if a["kind"] == "savings":
            limitations.append(f"- {a['name']}: предоставлена только история процентов "
                               f"({c['entryCount']} записей). История пополнений и снятий отсутствует.")
        if a["institution"] == "TBank":
            page_count = len(sources[a["sourceId"]]["rawPages"])
            first_date = min(e["effectiveDate"] for e in data["entries"] if e["accountId"] == a["id"])
            limitations.append(f"- {a['name']}: {page_count} страниц, {c['entryCount']} операций; "
                               f"поступления {c['credits']} и списания {c['debits']} {a['currency']} "
                               f"совпали с итогами PDF. Чистое движение {c['netMovement']} не является остатком. "
                               f"Начало периода — {a['periodStart']}; первая дата проведения — {first_date}.")
    unreadable = sum(i["code"] == "unreadable_counterparty" for i in data["issues"])
    if unreadable:
        limitations.append(f"- В {unreadable} строках Erste имя контрагента содержит вопросительные знаки "
                           "уже в источнике. Эти значения сохранены и перечислены в `issues`.")
    readme = f"""# Начальные данные

Обработано {len(data['sources'])} исходных файлов, {len(data['accounts'])} разделов счетов,
{len(data['entries'])} операций. Исходники сохранены. Все файлы в `$BUDGETLY_SEED_DIR`
содержат личные данные и исключены из Git. Обработка выполняется локально.

- `entries.csv` — единая таблица операций: UTF-8 с BOM, разделитель — запятая.
- `accounts.csv` — счета, периоды и остатки из сводок.
- `seed.json` — основной файл для обработки: счета, операции, связи обменов,
  результаты проверок, проблемы и исходные строки/текст всех выписок.

{chr(10).join(table)}

## Правила данных

- `amount` — проведённая сумма в валюте счёта. Минус — списание, плюс — поступление.
  Суммы и курсы в JSON записаны строками. Для расчётов используйте Decimal или целые копейки.
- `effectiveDate` — дата проведения Erste/Т-Банка. Для Revolut это единственная
  дата из колонки Date; выписка не уточняет её роль.
- `operationDate` — отдельная дата операции, если банк её даёт.
  `occurredLocal` и `postedLocal` — местное время Т-Банка без известного часового пояса.
  Точный момент `occurredAt` не придуман. Пустое поле CSV или отсутствующее поле JSON
  означает отсутствие данных; ноль означает известное нулевое значение.
- `originalAmount`/`originalCurrency` — исходная сумма карточной покупки до конвертации.
  В Erste сохранены также покупки в AMD, EUR и USD с проведением в PLN.
- `reportedEquivalentAmount` — оценка в PLN из Revolut, а не сумма списания
  и не исходная сумма покупки. Она не заменяет `amount`.
- `fee`, `taxWithheld`, `otherTaxes` — сведения банка. Комиссии Revolut уже включены
  в `amount`: все промежуточные остатки проверены без повторного вычитания комиссий.
- Операции отсортированы по `effectiveDate`, счёту и позиции в источнике.
  Порядок строк внутри дня не доказывает хронологический порядок Erste.
- `sourceId` указывает на `sources`; `sourceRow` — номер CSV-записи с 1
  (это `sources.rawRows[sourceRow - 1]`, а не физическая строка при переносах текста).
  Для PDF используются `sourcePage` и `sourceLine`, с 1; `sourceText` хранит блок операции.
  `sources` содержит имена файлов, SHA-256 и полный исходный текст/CSV, включая сводки.
- `entries` — банковские движения, а не готовые доменные транзакции.
  {len(data['transfers'])} обменов Erste связаны по одинаковому eFX reference и встречным номерам счетов.
  Обе стороны сохранены с `classification=internal-transfer` и `transferId`.
  Остальные движения имеют `classification=unclassified`. Доходы, расходы, категории
  и прочие внутренние переводы требуют дальнейшей обработки. Записи не удалялись как дубли.

## Ограничения и проблемы

{chr(10).join(limitations)}
- Два Kids & Teen не имеют номера счёта или имени владельца в экспорте.
  Они разделены как #1 и #2 по порядку разделов. Их принадлежность к книге ещё не задана.
- Разные периоды и неполные истории не позволяют вычислить общий баланс или net worth.
  Личные данные не обезличены; это локальный экспериментальный seed.

## Повторная выгрузка

Из корня проекта: `python3 scripts/normalize-seed.py`.
Нужны Python 3 и установленный `pdftotext` (Poppler). Новые зависимости не добавлены.
Проверка конвертера: `python3 scripts/check-normalize-seed.py`.
"""
    (output / "README.md").write_text(readme, encoding="utf-8")
    print(f"Wrote {len(data['sources'])} sources, {len(data['accounts'])} accounts, "
          f"{len(data['entries'])} entries, {len(data['transfers'])} transfers.")
    for check in data["checks"]:
        print(check["accountId"], check["entryCount"], check["status"], check.get("difference", ""))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, default=ROOT)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    data = build(args.input)
    write_outputs(data, args.output or args.input / "normalized")


if __name__ == "__main__":
    main()
