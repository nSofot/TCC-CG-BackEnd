import BookReferences from "../models/bookReferences.js";

export const createBookReference = async (req, res) => {
  try {

    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Request body is empty" });
    }

    const bookReference = new BookReferences(req.body);
    const savedRef = await bookReference.save();

    res.status(201).json(savedRef);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



export async function getBookReferenceByBookNoAndTransactionType(req, res) {
  const { trxBookNo, transactionType } = req.params;
  try {
    const exists = await BookReferences.exists({ transactionType, trxBookNo });
    res.json({ exists: !!exists }); // ✅ return boolean
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching transactions" });
  }
}
