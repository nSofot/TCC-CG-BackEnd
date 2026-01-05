import { isAdmin } from "./userController.js";
import LedgerAccounts from "../models/ledgerAccounts.js";

/**
 * POST /ledger/:headerAccountId
 */
export async function createLedgerAccount(req, res) {
    const { headerAccountId } = req.params;

    try {
        // 1️⃣ Admin check
        // if (!(await isAdmin(req))) {
        //     return res.status(403).json({ message: "You are not authorized to add ledger account" });
        // }

        // 2️⃣ Required field check
        if (!req.body.accountName) {
            return res.status(400).json({ message: "Account name is required" });
        }

        if (!req.body.accountType) {
            return res.status(400).json({ message: "Account type is required" });
        }

        // 3️⃣ Optional: Validate headerAccountId exists (if not top-level)
        // const idNum = parseInt(headerAccountId, 10);
        // if (!isNaN(idNum) && idNum > 0 && idNum < 999) {
        //     const headerExists = await LedgerAccounts.exists({ accountId: headerAccountId });
        //     if (!headerExists) {
        //         return res.status(400).json({ message: "Invalid header account ID" });
        //     }
        // }
        

        // 4️⃣ Find last account under this header
        const last = await LedgerAccounts
            .findOne({ accountId: new RegExp(`^${headerAccountId}-\\d{4}$`) })
            .sort({ accountId: -1 }) // highest suffix first
            .lean();

        let nextNumber = 1;
        if (last) {
            const [, suffix] = last.accountId.split("-");
            nextNumber = Number(suffix) + 1;
        }

        const accountId = `${headerAccountId}-${String(nextNumber).padStart(4, "0")}`;

        // 5️⃣ Auto-fill createdBy from user session (if available)
        const createdBy = req.user?.username || "system";

        // 6️⃣ Create account
        const { accountName, accountType } = req.body;
        const newAccount = new LedgerAccounts({
            accountId,
            accountType,
            accountName,
            headerAccountId,
            createdBy,
        });

        await newAccount.save();

        return res.status(201).json({
            message: "Ledger account created successfully",
            account: newAccount
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: "Duplicate account ID. Try again." });
        }

        console.error("Error creating ledger account:", err);
        return res.status(500).json({
            message: "Failed to create ledger account",
            error: err.message
        });
    }
}


export async function getLedgerAccounts(req, res) {
    try {
        const accounts = await LedgerAccounts.find().lean();
        return res.status(200).json(accounts);
    } catch (err) {
        console.error("Error fetching ledger accounts:", err);
        return res.status(500).json({
            message: "Failed to fetch ledger accounts",
            error: err.message
        });
    }
}


export async function getLedgerAccountById(req, res) {
    const { accountId } = req.params;
    try {
        const account = await LedgerAccounts.findOne({ accountId }).lean();
        return res.status(200).json(account);
    } catch (err) {
        console.error("Error fetching ledger account:", err);
        return res.status(500).json({
            message: "Failed to fetch ledger account",
            error: err.message
        });
    }
}


export async function updateLedgerAccount(req, res) {
    const { accountId } = req.params;
    try {
        const updatedAccount = await LedgerAccounts.findOneAndUpdate({ accountId }, req.body, { new: true });
        return res.status(200).json(updatedAccount);
    } catch (err) {
        console.error("Error updating ledger account:", err);
        return res.status(500).json({
            message: "Failed to update ledger account",
            error: err.message
        });
    }
}



export async function addLederAccountBalance(req, res) {
  const { updates } = req.body;
  console.log("Received updates:", updates);

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ message: "updates array is required" });
  }

  try {
    const updatePromises = updates.map(async ({ accountId, amount }) => {

    const amt = Number(amount);
    const account = await LedgerAccounts.findOne({ accountId });
    if (!account) throw new Error(`Ledger account not found: ${accountId}`);
    if (isNaN(account.accountBalance)) account.accountBalance = 0;


      if (!accountId || isNaN(amt)) {
        throw new Error(`Invalid data for accountId: ${accountId}`);
      }

      return LedgerAccounts.updateOne(
        { accountId },
        { $inc: { accountBalance: Math.abs(amt) }, $set: { updatedAt: new Date() } }
      );
    });

    await Promise.all(updatePromises);
    res.json({ message: "Account balances added successfully" });
  } catch (err) {
    console.error("Bulk addition failed:", err);
    res.status(500).json({ message: "Failed to add account balance", error: err.message });
  }
}



export async function subtractLedgerAccountBalance(req, res) {
    // if (!isAdmin(req)) {
    //     return res.status(403).json({ message: "Not authorized" });
    // }

    const { updates } = req.body;

    if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ message: "updates array is required" });
    }

    try {
        const updatePromises = updates.map(({ accountId, amount }) => {
            if (!accountId || typeof amount !== 'number') {
                throw new Error(`Invalid data for accountId: ${accountId}`);
            }

            return LedgerAccounts.updateOne(
                { accountId },
                {
                    $inc: { accountBalance: -Math.abs(amount) }, // subtracting as negative increment
                    $set: { updatedAt: new Date() },
                }
            );
        });

        await Promise.all(updatePromises);

        res.json({ message: "Account balances subtracted successfully" });
    } catch (err) {
        console.error("Balance subtraction failed:", err);
        res.status(500).json({
            message: "Failed to subtract account balance",
            error: err.message || err,
        });
    }
}

 

export async function deleteLedgerAccount(req, res) {
    const { accountId } = req.params;
    try {
        const deletedAccount = await LedgerAccounts.findOneAndDelete({ accountId });
        return res.status(200).json(deletedAccount);
    } catch (err) {
        console.error("Error deleting ledger account:", err);
        return res.status(500).json({
            message: "Failed to delete ledger account",
            error: err.message
        });
    }
}