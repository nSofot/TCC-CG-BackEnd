import Customer from "../models/customer.js";
import { isAdmin } from "./userController.js";


export async function CreateCustomer(req, res) {

    let customerId = "001";

    try {
        const lastCustomer = await Customer.find().sort({ createdAt: -1 }).limit(1);
        if (lastCustomer.length > 0) {
            const lastId = parseInt(lastCustomer[0].customerId.replace("",""));
            customerId = String(lastId + 1).padStart(3, "0");
        }
    } catch (err) {
        return res.status(500).json({ message: "Failed to fetch last customer", error: err.message });
    }

    req.body.customerId = customerId;
    req.body.createdAt = new Date(); 

    const customer = new Customer(req.body);

    try {
        await customer.save();
        res.json({ message: "Customer added" });
    } catch (error) {
        console.error("Error saving customer:", error);
        res.status(500).json({
            message: "Customer not added",
            error: error.message,
        });
    }
}


export async function getCustomer(req,res) {

    try {
        const customers = await Customer.find()
        res.json(customers)

        // const customers = await Customer.find({isActive : true})
        // res.json(customers)

    }
    catch(err){
        res.status(500).json({
            message : "Error getting customers",
            error: err
        })
    }
}


export async function getCustomerById(req, res) {
    const customerId = req.params.customerId

    try{
        const customer = await Customer.findOne({customerId : customerId})
        if (customer == null) {
            res.status(404).json({
                message : "Member not found"
            })
            return
        }
        if(customer.isActive == true){
            res.json(customer)
        }
    }

    catch(err){
        res.status(500).json({
            message : "Error getting member",
            error: err
        })
    }
}



export async function deleteCustomer(req, res) {
    if (!isAdmin(req)) {
        res.status(403).json({
            message: "You are not authorized to delete member"
        });
        return;
    }

    try {
        const result = await Customer.deleteOne({ customerId: req.params.customerId });

        if (result.deletedCount === 0) {
            // No customer found with that ID
            res.status(404).json({
                message: "Customer not found"
            });
            return;
        }

        res.json({
            message: "Customer deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete customer",
            error: err.message || err
        });
    }
}



export async function updateCustomer(req, res) {

    const customerId = req.params.customerId;
    const updatingData = req.body;

    try {
        // const result = await Customer.updateOne({ customerId: customerId }, updatingData);
        const result = await Customer.updateOne(
            { customerId: customerId },
            { ...updatingData, updatedAt: new Date() }
        );

        if (result.matchedCount === 0) {
            // No customer found with that ID
            res.status(404).json({
                message: "Member not found"
            });
            return;
        }

        res.json({
            message: "Member updated successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to update member",
            error: err.message || err
        });
    }
}


export async function searchCustomers(req, res) {
	const searchQuery = req.query.query || "";

	try {
		const regex = { $regex: searchQuery, $options: "i" };

		const filter = {
			isActive: true,
			...(searchQuery.trim() !== "" && {
				$or: [
					{ name: regex },
                    { address: regex },
                    { mobile: regex },
					{ vehicleNumbers: { $elemMatch: regex } }
				]
			})
		};

		const customers = await Customer.find(filter);
		res.json(customers);
	} catch (err) {
		res.status(500).json({
			message: "Error searching customers",
			error: err
		});
	}
}


export async function addCustomerShares(req, res) {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Invalid data format: updates array required" });
  }

  try {
    const results = [];

    for (const item of updates) {
      const { customerId, amount } = item;

      if (!customerId || isNaN(amount)) {
        results.push({ customerId, status: "failed", message: "Invalid customerId or amount" });
        continue;
      }

      const numericAmount = Number(amount);

      const updated = await Customer.updateOne(
        { customerId },
        {
          $inc: { shares: Math.abs(numericAmount) }, // positive increment
          $set: { updatedAt: new Date() },
        }
      );

      if (updated.matchedCount === 0) {
        results.push({ customerId, status: "failed", message: "Customer not found" });
      } else {
        results.push({ customerId, status: "success" });
      }
    }

    res.json({ message: "Processed shares addition", results });
  } catch (err) {
    console.error("Bulk addition failed:", err);
    res.status(500).json({
      message: "Failed to add customer shares",
      error: err.message || err,
    });
  }
}


export async function subtractCustomerShares(req, res) {

  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Invalid data format: updates array required" });
  }

  try {
    const results = [];

    for (const item of updates) {
      const { customerId, amount } = item;

      if (!customerId || isNaN(amount)) {
        results.push({ customerId, status: "failed", message: "Invalid customerId or amount" });
        continue;
      }

      const numericAmount = Number(amount);

      const updated = await Customer.updateOne(
        { customerId },
        {
          $inc: { shares: -Math.abs(numericAmount) }, // subtracting as negative increment
          $set: { updatedAt: new Date() },
        }
      );

      if (updated.matchedCount === 0) {
        results.push({ customerId, status: "failed", message: "Customer not found" });
      } else {
        results.push({ customerId, status: "success" });
      }
    }

    res.json({ message: "Processed shares subtraction", results });
  } catch (err) {
    console.error("Bulk subtraction failed:", err);
    res.status(500).json({
      message: "Failed to subtract customer shares",
      error: err.message || err,
    });
  }
}


export async function addCustomerMembershipFee(req, res) {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ message: "Invalid data format: updates array required" });
  }

  try {
    const results = [];

    for (const item of updates) {
      const { customerId, amount } = item;

      if (!customerId || isNaN(amount)) {
        results.push({ customerId, status: "failed", message: "Invalid customerId or amount" });
        continue;
      }

      const numericAmount = Number(amount);

      const updated = await Customer.updateOne(
        { customerId },
        {
          $inc: { membership: Math.abs(numericAmount) },
          $set: { updatedAt: new Date() },
        }
      );

      if (updated.matchedCount === 0) {
        results.push({ customerId, status: "failed", message: "Customer not found" });
      } else {
        results.push({ customerId, status: "success" });
      }
    }

    res.json({ message: "Processed membership fee addition", results });
  } catch (err) {
    console.error("Membership fee addition failed:", err);
    res.status(500).json({
      message: "Failed to add customer membership fee",
      error: err.message || err,
    });
  }
}

// controllers/customer.js
export async function subtractCustomerMembershipFee(req, res) {
  const { updates } = req.body;

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({ message: "updates array is required" });
  }

  try {
    const results = await Promise.all(
      updates.map(async ({ customerId, amount }) => {
        if (!customerId || isNaN(amount)) {
          return { customerId, status: "failed", message: "Invalid data" };
        }

        const numericAmount = Number(amount);

        const updated = await Customer.updateOne(
          { customerId },
          {
            $inc: { membership: -Math.abs(numericAmount) },
            $set: { updatedAt: new Date() },
          }
        );

        if (updated.matchedCount === 0) {
          return { customerId, status: "failed", message: "Customer not found" };
        }

        return { customerId, status: "success" };
      })
    );

    res.json({ message: "Processed membership fee subtraction", results });
  } catch (err) {
    console.error("Bulk subtraction failed:", err);
    res.status(500).json({ message: "Failed to subtract membership", error: err.message });
  }
}
