import mongoose, { type Connection, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';
import { ADDRESS_FIELDS, isValidEmail, validationMessages, type Address, type Customer } from '@jarvis/shared';

const addressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postalCode: { type: String, trim: true },
    country: { type: String, trim: true },
  },
  { _id: false },
);

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, validationMessages.nameRequired],
      trim: true,
    },
    company: { type: String, trim: true },
    email: {
      type: String,
      trim: true,
      validate: { validator: isValidEmail, message: validationMessages.emailInvalid },
    },
    phone: { type: String, trim: true },
    address: addressSchema,
    notes: { type: String, trim: true },
  },
  { timestamps: true },
);

export type CustomerModel = Model<InferSchemaType<typeof customerSchema>>;
type CustomerDocument = HydratedDocument<InferSchemaType<typeof customerSchema>>;

function toAddress(stored: Partial<Record<keyof Address, string | null>>): Address | undefined {
  const address: Address = {};
  for (const field of ADDRESS_FIELDS) {
    const value = stored[field];
    if (value) address[field] = value;
  }
  return Object.keys(address).length > 0 ? address : undefined;
}

/** Converts a stored customer into the shape the API returns, leaving out fields that aren't set. */
export function toCustomer(doc: CustomerDocument): Customer {
  const customer: Customer = {
    id: doc.id as string,
    name: doc.name,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
  if (doc.company) customer.company = doc.company;
  if (doc.email) customer.email = doc.email;
  if (doc.phone) customer.phone = doc.phone;
  const address = doc.address ? toAddress(doc.address) : undefined;
  if (address) customer.address = address;
  if (doc.notes) customer.notes = doc.notes;
  return customer;
}

export function customerModel(connection: Connection): CustomerModel {
  return (connection.models.Customer as CustomerModel | undefined) ?? connection.model('Customer', customerSchema);
}
