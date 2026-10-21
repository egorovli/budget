# PROTOTYPE — complete iPhone screen walkthrough

Throwaway low-fidelity UI answering one question: **Does the POC have the right screens, controls, and journeys before visual design or implementation begins?**

The prototype is deliberately as unstyled as practical: system sans-serif text, ordinary controls, simple separators, and no simulated device chrome. It contains no visual-design alternatives and no persistence.

Run from the repository root:

```sh
python3 -m http.server 4173 --directory prototypes/iphone-core-ui
```

Then open [http://localhost:4173/?screen=welcome](http://localhost:4173/?screen=welcome).

Use the bottom prototype navigator, the **All screens** map, or the controls inside each screen. Every screen has a stable `?screen=` URL.

## Screen inventory

1. Welcome / iCloud start
2. Create Book
3. Home
4. Activity
5. Record transaction
6. Transaction detail
7. Accounts
8. Account detail
9. Create/edit Account
10. Balance adjustment
11. Valuation update
12. Transfer / currency exchange
13. Reserves
14. Reserve detail
15. Create/edit Reserve
16. Reserve adjustment
17. Categories
18. Create/edit Category
19. Counterparties
20. Create/edit Counterparty
21. Reports
22. Books
23. Book settings
24. Sync, export, and backup

Budgets, refunds, family sharing, provider configuration, and final account-eligibility mechanics remain outside this walkthrough because they were explicitly deferred.
