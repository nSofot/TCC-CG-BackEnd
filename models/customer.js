import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true,
        unique: true
    },
    customerType: {
        type: String,
        required: true,
        default: 'shareholder',
        enum: ['shareholder', 'funds', 'external']
    },
    title: {
        type: String,
        enum: ['Mr.', 'Mrs.', 'Miss.']
    },
    name: {
        type: String,
        required: true
    },
    nameSinhala: {
        type: String
    },
    familyMembers: [
        {
            name: {
                type: String
            },
            relationship: {
                type: String,
                enum: ['mother', 'father', 'son', 'daughter', 'wife', 'husband', 'other']
            }
        }
    ],
    address: {
        type: [String]
    },
    mobile: {
        type: String,
    },
    phone: {
        type: String,
    },
    email: {
        type: String, 
    },
    image: [
        {type: String}
    ],
    joinDate: {
        type: Date
    },
    shares: {
        type: Number,
        default: 0
    },
    profits: {
        type: Number,
        default: 0
    },
    membership: {
        type: Number,
        default: 0
    },
    holdAmount: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    },
    memberRole: {
        type: String,
        enum: ['member', 'manager', 'chairman', 'secretary', 'treasurer', 'executive', 'admin'],
        default: 'member'
    },
    password: {
        type: String
    },
    isDeleted: {
        type: Boolean,
        required: true,
        default: false
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true
    },
    createdAt: {
        type: Date,
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;