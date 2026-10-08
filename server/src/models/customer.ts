import mongoose, { type Connection, type HydratedDocument, type InferSchemaType, type Model } from 'mongoose';
import type { Customer } from '@jarvis/shared';

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
  },
  { timestamps: true },
);

export type CustomerModel = Model<InferSchemaType<typeof customerSchema>>;
type CustomerDocument = HydratedDocument<InferSchemaType<typeof customerSchema>>;

/** Converts a stored customer into the shape the API returns. */
export function toCustomer(doc: CustomerDocument): Customer {
  return {
    id: doc.id as string,
    name: doc.name,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

export function customerModel(connection: Connection): CustomerModel {
  return (connection.models.Customer as CustomerModel | undefined) ?? connection.model('Customer', customerSchema);
}
