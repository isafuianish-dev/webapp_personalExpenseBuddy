# Personal Expense Buddy

Track spending across as many budgets as you like — household, personal, trips, or anything else — with categories, spending limits, and simple reports.

Personal Expense Buddy is a lightweight expense tracker built around the idea of **budgets**: separate spending "buckets" (say, "Family," "Home," and "Personal") that each have their own members, expenses, and category limits. Log what you spend, tag it by category and who paid, set monthly limits to keep an eye on overspending, and export clean reports whenever you need them.

## Features

### Multiple budgets
- Create any number of budgets, each with its own name and optional description (e.g., "Family" for household spending, "Personal" for day-to-day treats).
- Budgets are listed in the left-hand sidebar along with a live member count and running total, so you can see the state of each one at a glance.
- Use the search box at the top of the sidebar to quickly filter the budget list by name.
- Editing a budget lets you rename it, update its description, or delete it entirely (deleting removes all of its members and expenses too, so you're asked to confirm first).

### Members
- Add one or more people ("members") to a budget, each with an optional relation/role label (e.g., Self, Spouse, Child, Roommate) — handy for shared or family budgets, or just to track who's responsible for what.
- You can add several members at once using the "Add another member" option in the Add Members form.
- Each member gets a card showing how much they've spent and what share of the budget's total that represents, with a small progress bar.
- Members can be edited (name/relation) or removed at any time — a member can only be removed once none of the recorded expenses are still assigned to them, so you won't accidentally lose track of who paid for what.

### Logging expenses
- Add an expense with a category, description, amount, date, who paid, and how (payment method).
- Twelve built-in categories are available: Housing, Utilities, Groceries, Dining, Transport, Health, Education, Shopping, Entertainment, Family, Subscriptions, and Misc — each with its own icon and color used throughout the charts and tables.
- Five payment methods are offered as quick-select pills: Cash, Debit Card, Credit Card, Bank Transfer, and Other.
- You need at least one member in a budget before you can log an expense — if there are none yet, the app will prompt you to add one first.
- Expenses can be edited or deleted at any time from the Expenses table.

### Overview stats
- The top of each budget shows quick stat cards: Total Spent, number of Members, number of Expenses, Average Spend per Day (calculated from the first to last expense date), and your Top Category (the one with the highest total spend).

### Spending by Category (limits & alerts)
- A composition strip visualizes how your total spend is split across categories — hover any segment to see the exact amount and percentage.
- Each category with either spending or a limit gets its own card showing the amount spent, its share of total spend, and (if a limit is set) how much of that limit has been used, with a progress bar that turns red once you go over.
- Use "Manage Limits" to set an optional monthly spending limit for any category — leave a field blank for no limit on that category.
- Categories that go over their limit are flagged in a dedicated alerts list showing exactly how much over budget each one is, so problem areas are easy to spot.

### Filtering and sorting expenses
- Filter the expense table by category or by member (who paid) using the dropdown controls above the table.
- Sort by date (newest or oldest first) or by amount (highest or lowest first).
- Filters and sorting apply live as you change them — no need to press a button.

### Reports and exporting
Every budget has an Export section with several one-click outputs:
- **Budget Summary (CSV)** — budget name, description, creation date, total spent, and a per-member breakdown of totals.
- **Expense List (CSV)** — every expense with its category, description, amount, payer, payment method, and date.
- **Budget vs Actual (CSV)** — a per-category comparison of spend against limit, including how much is left or how far over you are.
- **Print / Export PDF** — opens your browser's print dialog with a formatted, printable report covering the budget overview, category breakdown, full expense list, and any over-budget alerts. Use "Save as PDF" in the print dialog to get a PDF file.

### Backup, export, and import all your data
- The download icon in the top-left of the sidebar opens an **Export Data** dialog where you can pick exactly which budgets to include (or use "Select / Deselect All"), then saves them all as a single JSON backup file.
- The upload icon next to it lets you **import** a previously exported JSON backup. If you don't have any budgets yet, the imported ones load right in. If you already have budgets, you'll be asked whether to **Replace All** (swap everything for the imported file) or **Append** (add the imported budgets alongside what you already have).
- Imported budgets are always given fresh internal IDs, so importing the same file twice — or importing into a browser that already has data — never causes conflicts or overwrites existing budgets by accident.

### Sample data
- If you're starting from a completely empty app, the main panel offers a "load a sample budget from here" link that adds three ready-made example budgets (Family, Home, and Personal) complete with members, weeks of realistic expenses, and category limits — a fast way to explore every feature before entering your own data.
- (This sample loader needs the app to be served from a server rather than opened as a bare local file. If you've simply double-clicked `index.html`, download the sample file from the project instead and load it with the Import button described above.)

## How to Use

1. **Create a budget.** Click "Add Budget" (in the sidebar or the empty-state screen), give it a name and optional description, and save.
2. **Add members.** Open your new budget and click "Add Members" to add the people involved — even for a solo budget, add yourself so expenses have someone to be "paid by."
3. **Log expenses.** Click "Add Expense," pick a category, enter an amount and description, choose who paid and how, and set the date.
4. **Set limits (optional).** In the "Spending by Category" section, click "Manage Limits" to cap how much you intend to spend per category each month.
5. **Review your spending.** Scroll through the Overview stats, the category composition strip, and the limit cards to see where your money is going and whether you're over any limits.
6. **Filter and sort** the expense table if you want to look at just one category or one member's spending, or reorder it by date or amount.
7. **Export a report or back up your data** whenever you like, using the buttons in the Export section or the export/import icons in the sidebar.

## Tips & Shortcuts

- **Quick section jumping:** hover the thin tab on the right edge of the screen to expand a navigation rail that lets you jump straight to Overview, Spending by Category, Members, Expenses, or Export within a long budget.
- **Hover for detail:** progress bars, category cards, and composition strip segments all show extra detail (exact amounts, percentages, or how much you're over/under) in a tooltip when you hover over them.
- **No limit is not a problem:** categories don't need a limit to show up in the breakdown — any category you've spent in appears automatically. Limits are purely optional guardrails.
- **Can't remove a member?** That's intentional — reassign or delete their expenses first so your totals stay accurate.
- **Everything lives in your browser.** All of your budgets, members, and expenses are saved automatically to your browser's local storage as you work — there's no sign-in and nothing is uploaded anywhere. This also means your data is tied to this browser and device; use the Export Data backup regularly (or before clearing browser data/switching devices) and Import it wherever you want your budgets to follow you.

## Customization

- Click the settings (gear) icon in the top-right corner to open Settings.
- **Theme:** switch between Light and Dark mode.
- **Accent color:** choose from six accent colors (Indigo, Blue, Green, Rose, Amber, Purple) to personalize the highlight color used for buttons, active states, and charts.
- Your theme and accent choices are remembered automatically the next time you open the app.
