# Usage walkthrough: what the Free amount slice still needs

Date: 2026-10-22

Status: P0 items 1–4 and item 14 are fixed in `feat(mobile): read more commands and answer
questions`, except "двадцать семь пятьдесят" (numbers in words) and note normalization.

## Question

What does the app need next, so that a person can use it every day? The walkthrough uses
the app as a user would, on the iOS simulator, with a realistic but synthetic Book.

## Setup

- Device: iPhone 18 Pro simulator, iOS 27.0, debug build with Metro.
- Book (synthetic, written to SQLite): Accounts mBank (PLN), Revolut PLN, Revolut EUR, Cash,
  Savings (not in Available money). Opening Reported balances on 2026-10-01. Three weeks of
  Expenses, one Income (salary), four Transfers (top-up, PLN→EUR exchange, ATM, savings).
  Reserves: Rent 3 200 PLN, ZUS and tax 1 850 PLN, Yerevan trip 300 EUR (55 EUR used),
  Car insurance 1 400 PLN. A second mBank Reported balance on 2026-10-21 gives an
  Unrecorded difference of 750.00 PLN.
- Commands: 36 sentences in English, Russian and Polish. Each sentence ran through rules,
  Apple Foundation Models and Needle 3, with this Book as context.
- End-to-end: command bar → prefilled form → Save; Transfer between currencies; Account and
  bank balance screens.

Tools added for this walkthrough (also useful later):

- `budget://?command=…` puts a command in the command bar. An iOS Shortcut or the Action
  button can use it.
- `budget://ai?text=a | b | c` runs several commands through every engine on the AI page
  and writes a `[compare]` block per command to the Metro log.

## Command results

Rules decide the kind, the amount, the currency and the date. A model only fills fields that
the rules left empty. So most wrong kinds come from the rules, not from the models.

| Engine | Latency | What it adds | What goes wrong |
|---|---|---|---|
| Rules | < 1 ms | Kind, amount, currency, date, named Accounts | See the rules list below |
| Apple Foundation Models | 2.4–3.1 s, 5.3 s worst | Account when the name is partial ("Revolut" → Revolut PLN), Transfer destination, a short note | Picks a Reserve that the sentence does not name (3 of 36 sentences); notes such as "Hotel · Hotel", "taxi · transportation" |
| Needle 3 (native) | 0.08–0.43 s | Account when the name is partial | Sets a Transfer destination on an Expense (3 sentences); misses Transfer destinations in Russian and Polish |

On the device, Needle is 10–30 times faster than Apple and has fewer harmful guesses. Apple
gives better notes and destinations.

### Rules errors

| Sentence | Result | Expected |
|---|---|---|
| `27.50 at Żabka from Revolut` | No Account | Revolut PLN (the only PLN Revolut) |
| `moved 500 from mBank to Revolut PLN` | No destination | Revolut PLN |
| `spent 27.50 from Revolut PLN at Żabka` | No Account | Revolut PLN |
| `exchanged 430 zł to 98.50 euro on Revolut` | Expense 430 PLN | Transfer Revolut PLN → Revolut EUR, 430 PLN sent, 98.50 EUR received |
| `took 200 cash from the ATM`, `снял 200 наличными в банкомате` | Expense from Cash | Transfer bank → Cash |
| `перевёл 500 злотых с мбанка на револют` | Expense | Transfer mBank → Revolut PLN |
| `на мбанке сейчас 13098,55` | Expense | Bank balance of mBank |
| `отложить 3200 на аренду до 10 ноября` | Due date **2025**-11-10, name "аренду до" | Due date 2026-11-10, name "аренда" |
| `new reserve for vacation 2000 zł by December` | No due date | Due date in December |
| `потратил двадцать семь пятьдесят на продукты` | No amount | 27.50 |
| `27,50 в жабке с революта` | Note "жабке", no Account | Note "Żabka", Revolut PLN |

Two causes repeat:

1. An Account name that contains a currency code ("Revolut PLN") never matches. The rules read
   "PLN" as the currency first, so the name loses a word. A partial name ("Revolut") also does
   not match.
2. Rules have no shape for "cash from an ATM" and "exchange", and the Russian forms of
   "transfer" and "balance" are missing.

## Findings

### P0. Wrong data that the user does not see

1. **A model attaches a Reserve that the sentence does not name.** `27.50 at Żabka from
   Revolut` opened the form with "Pay from a Reserve: ZUS and tax · check this". After Save the
   Free amount stayed at 8 513.01 PLN, because the purchase came out of the tax Reserve. The
   user has no signal that something went wrong. Fix: accept a model's Reserve or Account only
   when its name, or a known alias, occurs in the sentence; otherwise leave the field empty.
2. **Due dates go to the past.** "до 10 ноября" became 2025-11-10. For a Reserve due date, a
   date without a year means the next such date.
3. **Rules read Transfers, ATM withdrawals, exchanges and balances as Expenses** (see the table).
   A saved Expense instead of a Transfer lowers the Free amount by money that did not leave.
4. **Merge keeps fields that the kind does not use** (a destination on an Expense). The draft
   must drop them.

### P1. Gaps in daily use

5. **No way to resolve an Unrecorded difference.** mBank shows "Unrecorded difference
   750.00 PLN". A tap opens only the bank balance form. The screen must show the two Reported
   balances, the records between them, the difference, and actions such as "Add the missing
   income" with the amount and the date range filled in.
6. **No history.** The main screen shows the last 10 records. The October salary is not
   visible after three weeks. Each Account needs its own list of records, and the Book needs
   search.
7. **Old bank balances get no attention.** Revolut and Cash show "Bank balance of 2026-10-01"
   three weeks later. Show the age and ask for a new balance after a set time (for example
   7 days).
8. **No feedback after Save.** The form closes and nothing says what changed. Show "Saved:
   −27.50 PLN, Żabka, Revolut PLN · Free amount −27.50 · Undo".
9. **Apple adds 3 seconds to every command.** The command bar shows "…" for 3 seconds before the
   form opens. Open the form with the rules result at once, and let a model fill the empty
   fields when it is done, or call a model only when the rules leave a field empty.
10. **A broken Book is a dead end.** A damaged snapshot shows "Cannot open the Book" with no
    action (and the text overlaps the status bar). Offer "Export the damaged data" and
    "Restore from a file". Principle 3 (recoverability) requires this.
11. **Dates are text fields** (`YYYY-MM-DD`). Use a date picker with "Today" and "Yesterday".
12. **Cash shows "Bank balance".** Use "Counted balance" or "Balance" for Accounts that are not
    banks.
13. **Notes are not normalized.** "жабке", "Żabce" and "Żabka" are one merchant. Remember the
    merchant and its usual Account: after a few Żabka records, "27.50 Żabka" can fill
    Revolut PLN without a model.
14. **"Add account mBank with 8240.55" lost the amount** between the Account step and the bank
    balance step. Fixed in this walkthrough.

### P2. Product questions

15. **A Reserve counts in full at once.** Car insurance (1 400 PLN, due 2027-01-15) lowers the
    Free amount today by 1 400 PLN. A monthly share (about 470 PLN per month) can be a better
    picture. Decide whether a Reserve can be funded over time.
16. **Repeated payments.** Rent, ZUS, phone and Netflix repeat each month. A Reserve that
    renews itself after its payment would remove most manual work.
17. **"Where did the money go?"** The slice has no categories or totals. Decide whether
    merchant totals per month belong in the slice or wait for statement import.
18. **Quick entry outside the app.** `budget://?command=` already works. An iOS Shortcut (and
    later an App Intent) on the Action button or the Lock Screen can make capture take a few
    seconds.

## Suggested order

1. P0 items 1–4: rules fixes (currency in Account names, partial names, ATM, exchange,
   Russian Transfer and balance, future due dates) and a grounding check for model fields.
   Each fix gets a sentence in `tests/rules.test.ts`.
2. Account screen: history, Reported balances, Unrecorded difference with actions, balance
   age (items 5–7).
3. Save feedback with Undo, rules-first command bar, date picker (items 8, 9, 11).
4. Recovery screen for a damaged Book (item 10).
5. Decide items 15–17 before the 3–4 week viability check in issue 10.
