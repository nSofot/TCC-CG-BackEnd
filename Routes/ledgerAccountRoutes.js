// routes/ledgerAccountRouter.js
import express from "express";


import {
    createLedgerAccount,
    getLedgerAccounts,
    getLedgerAccountById,
    updateLedgerAccount,
    deleteLedgerAccount,
    addLederAccountBalance,
    subtractLedgerAccountBalance
} from "../controllers/lederAccountsContrller.js";


const ledgerAccountRouter = express.Router();


ledgerAccountRouter.post("/:headerAccountId", createLedgerAccount);
ledgerAccountRouter.get("/", getLedgerAccounts);
ledgerAccountRouter.get("/:accountId", getLedgerAccountById);
ledgerAccountRouter.put("/add-balance", addLederAccountBalance);
ledgerAccountRouter.put("/subtract-balance", subtractLedgerAccountBalance);
ledgerAccountRouter.put("/update/:accountId", updateLedgerAccount);
ledgerAccountRouter.delete("/:accountId", deleteLedgerAccount);


export default ledgerAccountRouter;
