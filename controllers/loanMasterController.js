import e from "cors";
import LoanMaster from "../models/loanMaster.js";
import { isAdmin } from "./userController.js";

// export async function createLoanMaster(req, res) {
//     // if (!isAdmin(req)) return res.status(403).json({ message: "Unauthorized access" });
    
//     try {
//         const lastLoan = await LoanMaster.findOne().sort({ createdAt: -1 });
//         let loanId = "LAPC-000001";
//         if (lastLoan) {
//             const lastId = parseInt(lastLoan.loanId.replace("LAPC-", ""));
//             loanId = "LAPC-" + String(lastId + 1).padStart(6, "0");
//         }
//         req.body.loanId = loanId;

//         const loanMaster = new LoanMaster(req.body);
//         await loanMaster.save();
//         res.json(loanMaster);
//     } catch (err) {
//         res.status(500).json({ message: "Failed to create loan master", error: err.message });
//     }
// }
export async function createLoanMaster(req, res) {
  try {
    const lastLoan = await LoanMaster.findOne().sort({ loanId: -1 });
    let loanId = "LAPC-000001";
    if (lastLoan) {
      const lastId = parseInt(lastLoan.loanId.replace("LAPC-", ""));
      loanId = "LAPC-" + String(lastId + 1).padStart(6, "0");
    }
    req.body.loanId = loanId;
    req.body.amount = Number(req.body.amount);
    req.body.loanDuration = Number(req.body.loanDuration);
    req.body.loanInterestRate = Number(req.body.loanInterestRate);
    req.body.dueAmount = Number(req.body.dueAmount);
    req.body.isGranted = Boolean(req.body.isGranted);
    req.body.applicationDate = new Date(req.body.applicationDate);

    const loanMaster = new LoanMaster(req.body);
    await loanMaster.save();
    res.json(loanMaster);

  } catch (err) {
    console.error("🔥 LoanMaster creation error:", err);
    res.status(500).json({ 
      message: "Failed to create loan master", 
      error: err.message, 
      stack: err.stack 
    });
  }
}


export async function getLoanMasterByLoanId(req, res) {
    const { loanId } = req.params;
    try {
        const loanMaster = await LoanMaster.findOne({ loanId });
        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }
}

export async function getLoansMasterByCustomerId(req, res) {   
    const { customerId } = req.params;
    try {
        const loanMaster = await LoanMaster.find({ customerId });
        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }   
}

export async function getAllPendingLoans(req, res) {
    try {
        const loanMaster = await LoanMaster.find(
            { 
                isGranted: true,
                dueAmount: { $gt: 0 }
            });
        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }
}

export async function getPendingLoansByCustomerId(req, res) {   
    const { customerId } = req.params;  
    try {
        const loanMaster = await LoanMaster.find({
            customerId,
            isGranted: true,
            dueAmount: { $gt: 0 }
        });
        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }   
}   

export async function getPendingLoansByGuarantorId(req, res) {
    const { customerId } = req.params;
    try {
        const loanMaster = await LoanMaster.find({
            $or: [
                { firstGaranterId: customerId },
                { secondGaranterId: customerId }
            ],
            isGranted: true,
            loanDueAmount: { $gt: 0 }
        });

        if (!loanMaster || loanMaster.length === 0) {
            return res.status(404).json({ message: "No pending loans found for this guarantor" });
        }

        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loans by guarantor", error: err.message });
    }
}


export async function getLoanPendingApprovalBycustomerId(req, res) {
    const { customerId } = req.params;
    try {
        const loanMaster = await LoanMaster.findOne(
            { 
                customerId, 
                isRejected: false,
                isApproved: false, 
                isGranted: false 
            });
        if (!loanMaster) {
            return res.status(404).json({ message: "Applicant has no pending loan application" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }
    
}


export async function getLoanPendingApplicationBycustomerId(req, res) {
    const { customerId } = req.params;  
    try {
        const loanMaster = await LoanMaster.findOne({
            customerId,
            isGranted: false
        });

        if (!loanMaster) {
            return res.status(404).json({
                message: "Applicant has no pending loan application"
            });
        }

        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({
            message: "Failed to fetch loan master",
            error: err.message
        });
    }
}


export async function getLoanPendingGrantBycustomerId(req, res) {
    const { customerId } = req.params;
    try {
        const loanMaster = await LoanMaster.findOne(
            { 
                customerId, 
                isRejected: false,
                isApproved: true, 
                isGranted: false 
            });
        if (!loanMaster) {
            return res.status(404).json({ message: "Applicant has no pending loan application" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }
}

export async function getPendingLoansForApprovals(req, res) {
    try {
        const loanMaster = await LoanMaster.find({
            isApproved: false,
            isRejected: false,
            isGranted: false
        });

        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }
}


export async function getPendingLoansForGrant(req, res) {
    try {
        const loanMaster = await LoanMaster.find(
            { 
                isApproved: true,  
                isGranted: false 
            });
        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch loan master", error: err.message });
    }
}

  
export async function updateLoanMaster(req, res) {
  const { loanId } = req.params;
  try {
    const loanMaster = await LoanMaster.findOneAndUpdate(
      { loanId },   // <-- search by loanId field
      req.body,
      { new: true }
    );

    if (!loanMaster) {
      return res.status(404).json({ message: "Loan master not found" });
    }
    res.json(loanMaster);
  } catch (err) {
    res.status(500).json({ message: "Failed to update loan master", error: err.message });
  }
}


export async function deleteLoanMaster(req, res) {
    const { loanId } = req.params;  
    try {
        const loanMaster = await LoanMaster.findOneAndDelete({ 
            loanId, isGranted: false 
        });
        if (!loanMaster) {
            return res.status(404).json({ message: "Loan master not found" });
        }
        res.json(loanMaster);
    } catch (err) {
        res.status(500).json({ message: "Failed to delete loan master", error: err.message });
    }
}
