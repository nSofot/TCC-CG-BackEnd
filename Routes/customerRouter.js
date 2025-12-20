import express from "express";
import { CreateCustomer } from "../controllers/customerController.js";
import { getCustomer } from "../controllers/customerController.js";
import { getCustomerById } from "../controllers/customerController.js";
import { deleteCustomer } from "../controllers/customerController.js";
import { updateCustomer } from "../controllers/customerController.js";
import { searchCustomers } from "../controllers/customerController.js";
import { addCustomerShares } from "../controllers/customerController.js";
import { subtractCustomerShares } from "../controllers/customerController.js";
import { addCustomerMembershipFee } from "../controllers/customerController.js";
import { subtractCustomerMembershipFee } from "../controllers/customerController.js";


const customerRouter = express.Router();


customerRouter.put("/membershipFee-add", addCustomerMembershipFee);
customerRouter.put("/membershipFee-subtract", subtractCustomerMembershipFee);
customerRouter.post("/", CreateCustomer);
customerRouter.get("/search", searchCustomers);
customerRouter.get("/", getCustomer)

export default customerRouter;;
customerRouter.get("/:customerId", getCustomerById);
customerRouter.delete("/:customerId", deleteCustomer);
customerRouter.put("/shares-add", addCustomerShares);
customerRouter.put("/shares-subtract", subtractCustomerShares);
customerRouter.put("/update/:customerId", updateCustomer);
