import BookReferences from "../models/bookReferences.js";

export const createBookReference = async (req, res) => {
  try {
    const { transactionType, trxBookNo, trxReference } = req.body;

    if (!transactionType || !trxBookNo || !trxReference) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const exists = await BookReferences.exists({ transactionType, trxBookNo });
    if (exists) {
      return res.status(409).json({
        message: "Book No already exists for this transaction type",
        exists: true
      });
    }

    const bookReference = new BookReferences(req.body);
    const savedRef = await bookReference.save();
    res.status(201).json({ message: "Book Reference saved successfully", data: savedRef });

  } catch (err) {
    // Handles duplicate index errors automatically
    if (err.code === 11000) {
      return res.status(409).json({
        message: "Duplicate entry! Combination already exists",
        keyValue: err.keyValue
      });
    }

    res.status(500).json({ message: err.message });
  }
};


export async function getBookReferenceByBookNoAndTransactionType(req, res) {
  const { trxBookNo, transactionType } = req.params;

  try {
    const record = await BookReferences.findOne({ transactionType, trxBookNo });

    res.json({
      exists: !!record,
      data: record || null
    });
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching transactions" });
  }
}


