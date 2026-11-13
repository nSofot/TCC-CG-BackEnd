import TicketOrder from "../models/ticketOrder.js";
import TicketCounter from "../models/ticketCounter.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { createETicketPdf } from "../utils/eTicket.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const slipDirectory = path.resolve(__dirname, "../uploads/ticket-slips");
dotenv.config();

const ticketReviewRoles = ["admin", "president", "secretary", "treasurer", "assistant-treasurer"];
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.VITE_EMAILL,
    pass: process.env.EMAIL_PASS,
  },
});

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);
}

function canReviewTickets(req, res) {
  if (!req.user || !ticketReviewRoles.includes(req.user.memberRole)) {
    res.status(req.user ? 403 : 401).json({ message: "You are not authorized to review ticket orders." });
    return false;
  }
  return true;
}

export async function createTicketOrder(req, res) {
  const { eventName, firstName, lastName, mobileNumber, emailAddress, nicNumber, address, paidAmount } = req.body;
  const required = { eventName, firstName, lastName, mobileNumber, nicNumber, address, paidAmount };
  if (Object.values(required).some((value) => value === undefined || String(value).trim() === "") || !req.file) {
    return res.status(400).json({ message: "Complete all fields and attach a payment slip." });
  }
  const amount = Number(paidAmount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ message: "Paid amount must be greater than zero." });
  }
  const recipientEmail = typeof emailAddress === "string" ? emailAddress.trim() : "";
  if (recipientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
    return res.status(400).json({ message: "Enter a valid email address." });
  }

  try {
    const year = new Date().getFullYear();
    const counter = await TicketCounter.findOneAndUpdate(
      { year },
      { $inc: { sequence: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const referenceNumber = `TCC-${year}-${String(counter.sequence).padStart(6, "0")}`;
    const order = await TicketOrder.create({
      referenceNumber, eventName, firstName, lastName, mobileNumber, emailAddress: recipientEmail, nicNumber, address,
      paidAmount: amount,
      // Keep the uploaded file private; it is not exposed through a public static route.
      paymentSlip: req.file.filename,
    });
    let confirmationEmailSent = false;
    let message = "Ticket request submitted for payment review.";
    if (recipientEmail) {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const safe = {
        name: escapeHtml(fullName),
        reference: escapeHtml(order.referenceNumber),
        event: escapeHtml(eventName.trim()),
        mobile: escapeHtml(mobileNumber.trim()),
        amount: escapeHtml(new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR" }).format(amount)),
      };
      try {
        await mailTransport.sendMail({
          from: `"TCC Colombo Group" <${process.env.VITE_EMAILL}>`,
          to: recipientEmail,
          subject: `Ticket request received · ${order.referenceNumber}`,
          text: `Hello ${fullName},\n\nWe received your ticket request.\nReference number: ${order.referenceNumber}\nEvent: ${eventName.trim()}\nAmount paid: ${safe.amount}\nStatus: Pending payment review\nMobile: ${mobileNumber.trim()}\n\nPlease keep your reference number for follow-up. Your ticket will be confirmed after payment review.\n\nTCC Colombo Group`,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b"><h2 style="color:#3730a3">Ticket request received</h2><p>Hello ${safe.name},</p><p>We received your ticket request. Keep this reference number for follow-up:</p><p style="font-size:24px;font-weight:bold;letter-spacing:1px;color:#3730a3">${safe.reference}</p><table style="border-collapse:collapse;width:100%"><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">Event</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${safe.event}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">Amount paid</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">${safe.amount}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e2e8f0">Status</td><td style="padding:8px;border-bottom:1px solid #e2e8f0">Pending payment review</td></tr><tr><td style="padding:8px">Mobile</td><td style="padding:8px">${safe.mobile}</td></tr></table><p>Your ticket will be confirmed after the payment slip is reviewed.</p><p>TCC Colombo Group</p></div>`,
        });
        confirmationEmailSent = true;
      } catch (emailError) {
        console.error("Ticket confirmation email failed:", emailError.message);
        message = "Ticket request was submitted, but the confirmation email could not be sent. Please keep your reference number.";
      }
    }
    return res.status(201).json({ message, referenceNumber: order.referenceNumber, confirmationEmailSent });
  } catch (error) {
    console.error("Ticket order submission failed:", error);
    return res.status(500).json({ message: "Could not submit the ticket request." });
  }
}

export async function getTicketOrders(req, res) {
  if (!canReviewTickets(req, res)) return;
  try {
    const filter = req.query.status && ["pending", "approved", "rejected"].includes(req.query.status)
      ? { status: req.query.status }
      : {};
    const orders = await TicketOrder.find(filter).sort({ createdAt: -1 }).lean();
    return res.json(orders);
  } catch (error) {
    console.error("Ticket order lookup failed:", error);
    return res.status(500).json({ message: "Could not load ticket orders." });
  }
}

export async function getPaymentSlip(req, res) {
  if (!canReviewTickets(req, res)) return;
  try {
    const order = await TicketOrder.findById(req.params.orderId).lean();
    if (!order) return res.status(404).json({ message: "Ticket order not found." });
    return res.sendFile(path.resolve(slipDirectory, path.basename(order.paymentSlip)));
  } catch (error) {
    console.error("Payment slip lookup failed:", error);
    return res.status(500).json({ message: "Could not load payment slip." });
  }
}

export async function updateTicketOrderStatus(req, res) {
  if (!canReviewTickets(req, res)) return;
  const { status } = req.body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ message: "Status must be approved or rejected." });
  }
  try {
    const order = await TicketOrder.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true, runValidators: true }
    ).lean();
    if (!order) return res.status(404).json({ message: "Ticket order not found." });
    let notificationSent = false;
    let message = `Ticket order ${status}.`;
    if (!order.emailAddress) {
      message += " No email was provided, so the buyer could not be notified.";
    } else {
      try {
        const name = `${order.firstName} ${order.lastName}`;
        const safeName = escapeHtml(name);
        const safeEvent = escapeHtml(order.eventName);
        const safeReference = escapeHtml(order.referenceNumber || "Ticket order");
        if (status === "approved") {
          const ticketPdf = createETicketPdf(order);
          await mailTransport.sendMail({
            from: `"TCC Colombo Group" <${process.env.VITE_EMAILL}>`,
            to: order.emailAddress,
            subject: `Your e-ticket · ${order.referenceNumber}`,
            text: `Hello ${name},\n\nYour ticket request for ${order.eventName} has been approved. Your e-ticket is attached to this email.\nReference number: ${order.referenceNumber}\nAmount paid: LKR ${order.paidAmount}\n\nPlease bring the attached ticket and reference number to the event.\n\nTCC Colombo Group`,
            html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b"><h2 style="color:#3730a3">Your ticket is approved</h2><p>Hello ${safeName},</p><p>Your request for <strong>${safeEvent}</strong> has been approved. Your e-ticket PDF is attached.</p><div style="padding:18px;background:#101a40;color:white;border-left:6px solid #fac033"><p style="margin:0;color:#fac033;font-size:12px">REFERENCE NUMBER</p><p style="margin:8px 0 0;font-size:22px;font-weight:bold">${safeReference}</p></div><p>Bring the attached ticket and reference number to the event.</p><p>TCC Colombo Group</p></div>`,
            attachments: [{ filename: `e-ticket-${order.referenceNumber || order._id}.pdf`, content: ticketPdf, contentType: "application/pdf" }],
          });
        } else {
          await mailTransport.sendMail({
            from: `"TCC Colombo Group" <${process.env.VITE_EMAILL}>`,
            to: order.emailAddress,
            subject: `Ticket request update · ${order.referenceNumber || "TCC Colombo Group"}`,
            text: `Hello ${name},\n\nWe are sorry, but we could not approve your ticket request for ${order.eventName}. The submitted payment could not be confirmed. If you believe this is an error, please contact the TCC Colombo Group and quote reference ${order.referenceNumber || order._id}.\n\nTCC Colombo Group`,
            html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;color:#1e293b"><h2 style="color:#9f1239">Ticket request update</h2><p>Hello ${safeName},</p><p>We are sorry, but we could not approve your ticket request for <strong>${safeEvent}</strong>. The submitted payment could not be confirmed.</p><p>Contact the TCC Colombo Group if you believe this is an error, and quote reference <strong>${safeReference}</strong>.</p><p>TCC Colombo Group</p></div>`,
          });
        }
        notificationSent = true;
        message += status === "approved" ? " E-ticket emailed to the buyer." : " Rejection email sent to the buyer.";
      } catch (emailError) {
        console.error(`Ticket ${status} notification failed:`, emailError.message);
        message += " The order status was saved, but the email could not be sent.";
      }
    }
    return res.json({ message, notificationSent, order });
  } catch (error) {
    console.error("Ticket order review failed:", error);
    return res.status(500).json({ message: "Could not update ticket order." });
  }
}
