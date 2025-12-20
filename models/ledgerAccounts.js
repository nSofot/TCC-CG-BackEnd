import mongoose from "mongoose";

const ledgerAccountSchema = new mongoose.Schema(
    {
        /* e.g. "1000-0001" */
        accountId: { 
            type: String, 
            required: true, 
            unique: true 
        },

        /* Asset / Liability / Equity / Income / Expense */
        accountType: {
            type: String,
            required: true,
            enum: ["Asset", "Liability", "Equity", "Income", "Expense"],
        },

        /* Parent header (nullable for top‑level accounts) */
        headerAccountId: { 
            type: String, 
            default: null 
        },

        /* Human‑readable name */
        accountName: { 
            type: String, 
            required: true 
        },

        /* Current balance; store as Decimal128 or integer cents */
        accountBalance: {
            type: Number,
            default: 0,
        },

        createdBy: { 
            type: String, 
            required: true 
        },
    },
    { timestamps: true, collection: "ledger_accounts" } // handles createdAt / updatedAt
);

/* optional: speed up “get by header” */
ledgerAccountSchema.index({ headerAccountId: 1, accountName: 1 });

export default mongoose.model("LedgerAccount", ledgerAccountSchema);
