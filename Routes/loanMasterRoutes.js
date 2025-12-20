import express from "express";

import { 
    createLoanMaster,
    getLoanMasterByLoanId,
    getLoansMasterByCustomerId,
    getAllPendingLoans,
    getPendingLoansByCustomerId,
    getPendingLoansByGuarantorId,
    getLoanPendingApprovalBycustomerId,
    getLoanPendingApplicationBycustomerId,
    getLoanPendingGrantBycustomerId,
    getPendingLoansForApprovals,
    getPendingLoansForGrant,
    updateLoanMaster,
    deleteLoanMaster
 } 
from "../controllers/loanMasterController.js";

const loanMasterRouter = express.Router();

    loanMasterRouter.post("/", createLoanMaster);
    loanMasterRouter.get("/loan/:loanId", getLoanMasterByLoanId);
    loanMasterRouter.get("/customer/:customerId", getLoansMasterByCustomerId);
    loanMasterRouter.get("/pending-all", getAllPendingLoans);   
    loanMasterRouter.get("/application/:customerId", getLoanPendingApplicationBycustomerId);
    loanMasterRouter.get("/pending-customer/:customerId", getPendingLoansByCustomerId);
    loanMasterRouter.get("/pending-guarantor/:customerId", getPendingLoansByGuarantorId);
    loanMasterRouter.get("/pending-approval/:customerId", getLoanPendingApprovalBycustomerId);
    loanMasterRouter.get("/pending-grant/:customerId", getLoanPendingGrantBycustomerId);
    loanMasterRouter.get("/approval", getPendingLoansForApprovals);
    loanMasterRouter.get("/grant", getPendingLoansForGrant);
    loanMasterRouter.put("/update/:loanId", updateLoanMaster);
    loanMasterRouter.delete("/delete/:loanId", deleteLoanMaster);

export default loanMasterRouter;