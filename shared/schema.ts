import { z } from "zod";
import mongoose, { Schema, Document } from "mongoose";

// Gift Schema
export interface IGift extends Document {
  name: string;
  description?: string;
  lottieUrl: string;
  price: number;
  status: "available" | "sold";
  soldTo?: string;
  soldAt?: Date;
  telegramGiftUrl?: string;
  createdAt: Date;
}

const giftSchema = new Schema<IGift>({
  name: { type: String, required: true },
  description: { type: String },
  lottieUrl: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ["available", "sold"], default: "available" },
  soldTo: { type: String },
  soldAt: { type: Date },
  telegramGiftUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Gift = mongoose.model<IGift>("Gift", giftSchema);

// Zod schemas for validation
export const insertGiftSchema = z.object({
  name: z.string().min(1, "Nom kiritish majburiy"),
  description: z.string().optional(),
  lottieUrl: z.string().url("To'g'ri URL kiriting"),
  price: z.number().positive("Narx musbat bo'lishi kerak"),
  telegramGiftUrl: z.union([z.string().url("To'g'ri URL kiriting"), z.literal("")]).optional(),
});

export type InsertGift = z.infer<typeof insertGiftSchema>;

// User Schema
export interface IUser extends Document {
  telegramId: number;
  username: string;
  firstName?: string;
  lastName?: string;
  balance: number;
  walletAddress?: string;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  telegramId: { type: Number, required: true, unique: true },
  username: { type: String, required: true },
  firstName: { type: String },
  lastName: { type: String },
  balance: { type: Number, default: 0 },
  walletAddress: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const User = mongoose.model<IUser>("User", userSchema);

export const insertUserSchema = z.object({
  telegramId: z.number(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Purchase Schema
export interface IPurchase extends Document {
  giftId: string;
  userId: string;
  purchaseDate: Date;
  price: number;
  status: "completed" | "pending" | "cancelled";
  transactionHash?: string;
  createdAt: Date;
}

const purchaseSchema = new Schema<IPurchase>({
  giftId: { type: Schema.Types.ObjectId, ref: 'Gift', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  purchaseDate: { type: Date, default: Date.now },
  price: { type: Number, required: true },
  status: { type: String, enum: ["completed", "pending", "cancelled"], default: "completed" },
  transactionHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Purchase = mongoose.model<IPurchase>("Purchase", purchaseSchema);

// Keep old Rental model for backward compatibility during migration
export interface IRental extends Document {
  giftId: string;
  userId?: string;
  startDate?: Date;
  endDate?: Date;
  days: number;
  totalCost?: number;
  status: "active" | "completed" | "cancelled";
  transactionHash?: string;
  createdAt: Date;
}

const rentalSchema = new Schema<IRental>({
  giftId: { type: String, required: true },
  userId: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  days: { type: Number, required: true },
  totalCost: { type: Number },
  status: { type: String, enum: ["active", "completed", "cancelled"], default: "active" },
  transactionHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Rental = mongoose.model<IRental>("Rental", rentalSchema);

// Gift Request Schema
export interface IGiftRequest extends Document {
  userId: string;
  giftName: string;
  giftDescription?: string;
  telegramGiftUrl: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const giftRequestSchema = new Schema<IGiftRequest>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  giftName: { type: String, required: true },
  giftDescription: { type: String },
  telegramGiftUrl: { type: String, required: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  adminNote: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const GiftRequest = mongoose.model<IGiftRequest>("GiftRequest", giftRequestSchema);

// Maintenance Mode Schema
export interface IMaintenanceMode extends Document {
  enabled: boolean;
  updatedAt: Date;
}

const maintenanceModeSchema = new Schema<IMaintenanceMode>({
  enabled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

export const MaintenanceMode = mongoose.model<IMaintenanceMode>("MaintenanceMode", maintenanceModeSchema);

export const insertPurchaseSchema = z.object({
  giftId: z.string().min(1, "Gift ID talab qilinadi"),
  userId: z.string().min(1, "Foydalanuvchi ID talab qilinadi"),
  price: z.number().positive("Narx musbat bo'lishi kerak"),
  transactionHash: z.string().optional(),
});

export type InsertPurchase = z.infer<typeof insertPurchaseSchema>;

// Keep old rental schema for backward compatibility
export const insertRentalSchema = z.object({
  giftId: z.string().min(1, "Gift ID talab qilinadi"),
  userId: z.string().optional(),
  duration: z.number().min(1, "Kamida 1 kun talab qilinadi"),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional(),
  totalCost: z.number().optional(),
  status: z.enum(["active", "completed", "cancelled"]).optional().default("active"),
});

export type InsertRental = z.infer<typeof insertRentalSchema>;

export const insertGiftRequestSchema = z.object({
  giftName: z.string().min(1, "Gift nomi kiritish majburiy"),
  giftDescription: z.string().optional(),
  telegramGiftUrl: z.string().min(1, "Telegram gift URL kiritish majburiy"),
});

export type InsertGiftRequest = z.infer<typeof insertGiftRequestSchema>;