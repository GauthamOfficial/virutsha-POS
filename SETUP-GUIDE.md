# VISA Tamil Kitchen POS — Setup & Daily Use

This guide has two parts:

- **Part A — Installing it on the laptop.** Done once, by whoever sets the laptop up.
- **Part B — Using it day to day.** Written for the person running the restaurant.

---

# Part A — Installing on the laptop

You only do this once. Budget about 20 minutes, mostly waiting for downloads.

## Step 1 — Install Node.js

1. Go to <https://nodejs.org>
2. Download the big green **LTS** button.
3. Run the installer and click Next until it finishes. No settings need changing.

## Step 2 — Install MongoDB (where the sales data is kept)

1. Go to <https://www.mongodb.com/try/download/community>
2. Choose **Windows**, package **msi**, then Download.
3. Run the installer. Two things matter on the way through:
   - Choose **Complete** setup.
   - Leave **"Install MongoDB as a Service"** ticked. This makes the database start
     by itself every time the laptop is switched on, which is what you want.
4. You can skip "MongoDB Compass" if it offers it — it isn't needed.

> **Why a database on the laptop instead of online?** The restaurant keeps working
> when the internet is down. Nothing about taking an order or printing a bill needs
> a connection.

## Step 3 — Run the setup file

In the `virutsha-pos` folder, double-click:

```
Setup (run once).bat
```

A black window opens and prints its progress. It installs the system, creates the
login and fills in a starter Sri Lankan menu you can edit later.

When it finishes it prints the first login:

```
Login:     admin@visatamilkitchen.lk
Password:  admin123
```

## Step 4 — Start it

Double-click:

```
Start POS.bat
```

A black window opens and the browser opens the POS at `http://localhost:8000`.
Log in with the details above.

**Leave the black window open** while the restaurant is using the system. Closing
it switches the POS off. At the end of the day, just close it.

## Step 5 — Make it easy to open

Right-click `Start POS.bat` → **Show more options** → **Send to** → **Desktop
(create shortcut)**. Rename the shortcut to "POS". Now it is one double-click from
the desktop.

To have it start automatically when the laptop switches on: press `Windows + R`,
type `shell:startup`, press Enter, and drag a copy of that shortcut into the folder
that opens.

## Step 6 — Change the password and the shop details

1. Log in, go to **Manage → Staff**, and create a proper account for your sister
   (make it an **Admin**). Log in as that account and delete or disable the default
   `admin@visatamilkitchen.lk` one.
2. Go to **Manage → Settings** and fill in the restaurant name, address and phone.
   This is what prints at the top of every bill.

---

## Using it from a phone or a tablet as well

The laptop can serve the POS to other devices on the same Wi-Fi — handy for taking
orders at the table.

1. On the laptop, open a Command Prompt and type `ipconfig`. Find the
   **IPv4 Address** — something like `192.168.1.8`.
2. On the phone, open a browser and go to `http://192.168.1.8:8000`.
3. The first time, Windows may ask to allow Node.js through the firewall — say yes
   for **Private networks**.

The laptop must be on and the black window open for this to work.

---

## Backing up the sales data

Everything lives in the MongoDB database on the laptop. To take a copy:

```
"C:\Program Files\MongoDB\Server\8.0\bin\mongodump.exe" --db=visa-pos --out="D:\pos-backup"
```

(Adjust `8.0` to whatever version folder exists.) Copy that `pos-backup` folder to
a USB stick or Google Drive. Doing this once a week is plenty for a small shop.

To restore onto a new laptop:

```
"C:\Program Files\MongoDB\Server\8.0\bin\mongorestore.exe" "D:\pos-backup"
```

You can also export figures at any time from **Reports → Export CSV**, which opens
in Excel.

---

# Part B — Using the POS

## Taking an order

1. Click **New Order**.
2. **Choose Local or Foreigner at the top.** This is the price switch — the whole
   menu and the whole bill change with it.
3. Tap dishes to add them. Tap the same dish again to add another one.
4. Adjust quantities with − and + in the bill on the right.
5. Choose **Cash** or **Card**.
   - For cash, typing what the customer handed over shows the change to give back.
6. Click **Save Bill**.
7. The bill appears on screen. Click **Print Bill**, or **Done** if they don't want
   a printed one.

### About the Local / Foreigner switch

You can flip it at any point, even after ringing up the whole order. Nothing is
lost — every price on the screen and on the bill simply changes to the other price
list. If a tourist turns out to be a resident, one tap fixes the bill.

The system also remembers which one you used last, so a shop that serves mostly
tourists doesn't have to keep switching.

### Optional extras on a bill

Click **+ Add customer name / discount** in the bill panel if you want to:
- record the customer's name or phone on the bill
- take money off the bill (a discount in rupees)

Neither is required. A bill with no name is recorded as "Walk-in".

## Reprinting a bill

**Bills** → find it by bill number, name, phone or date → click the printer icon.

## Fixing a mistake

A saved bill can't be edited, so the numbering and the paper trail stay honest.
Instead an Admin can **void** it (the ⊘ button on the Bills page). A voided bill
stays on record but stops counting towards sales. Then just ring the order up again
correctly.

## Changing the menu

**Manage → Dishes → Add Dish.** Each dish takes:
- a name,
- a category,
- a **Local price** and a **Foreigner price** (both required),
- optionally a photo — pick any picture from the laptop or phone; it is shrunk
  automatically, so a big photo is fine.

If something is sold out today, edit the dish and untick **Available**. It
disappears from the order screen but stays in the menu for tomorrow. Use **Delete**
only when a dish is gone for good.

**Manage → Categories** sets up the groups (Rice & Curry, Short Eats, Beverages…)
with an icon and a colour.

## Sales and income

**Reports** (Admins only) shows, for **Daily / Weekly / Monthly / Yearly** or any
custom date range:

- total income and number of bills
- average bill value
- a bar chart of income over the period
- **how much came from Local vs Foreigner customers**
- how much came in as cash vs card
- the best selling dishes
- **Export CSV** to open the whole thing in Excel

The Home screen also shows today, this week and this month at a glance.

## Staff logins

**Manage → Staff.** Two kinds of account:

| | Cashier | Admin |
|---|---|---|
| Take orders, print bills | Yes | Yes |
| See and reprint past bills | Yes | Yes |
| Void a bill | No | Yes |
| Add or edit dishes and prices | No | Yes |
| See sales reports | No | Yes |
| Manage staff and settings | No | Yes |

Give the staff Cashier accounts; keep Admin for the owner. That way prices and
takings can't be changed by whoever is on the till.

---

## If something goes wrong

**"Cannot reach the server. Is it running?"**
The black window was closed. Double-click `Start POS.bat` again.

**The black window shows "Database connection failed"**
MongoDB isn't running. Press `Windows + R`, type `services.msc`, find **MongoDB
Server**, right-click → Start. If it isn't in the list, MongoDB was never installed
— go back to Step 2.

**The browser says the page can't be reached**
Give it a few more seconds and refresh. The server takes a moment to start.

**Nothing prints**
The Print button opens the normal Windows print dialog. Check the right printer is
selected. The bill is laid out for an 80mm thermal receipt printer but prints fine
on an ordinary A4 printer too.

**Forgotten the password**
Another Admin can set a new one from Manage → Staff. If every Admin password is
lost, delete the `visa-pos` database and run `Setup (run once).bat` again —
but that erases the sales history, so back it up first.
