import { z } from "zod";

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Minimum 6 characters"),
  name: z.string().min(1),
  phone: z.string().optional().default(""),
  role: z.enum(["buyer", "nursery_seller"]).default("buyer"),
  nursery: z
    .object({
      name: z.string().min(1),
      address: z.string().optional().default(""),
      phone: z.string().optional().default(""),
      serviceAreas: z.array(z.string()).optional().default([]),
    })
    .optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const inventorySchema = z.object({
  product: objectId,
  quantityAvailable: z.coerce.number().min(0),
  pricePerUnit: z.coerce.number().min(0),
  minOrderQty: z.coerce.number().min(1).optional(),
  lowStockThreshold: z.coerce.number().min(0).optional(),
  isListed: z.boolean().optional(),
});

export const inventoryUpdateSchema = inventorySchema.partial().omit({ product: true });

export const checkoutSchema = z.object({
  product: objectId,
  quantity: z.coerce.number().int().min(1),
});

export const confirmSchema = z.object({
  checkoutId: z.string().min(1),
  deliveryAddress: z.string().min(1),
  notes: z.string().optional().default(""),
});

export const requestSchema = z.object({
  product: objectId,
  quantityRequested: z.coerce.number().int().min(1),
});

export const productSchema = z.object({
  name: z.string().min(1),
  category: z.enum(["plants", "fertilizers", "seeds", "tools"]),
  unit: z.enum(["pieces", "kg", "litre", "bag"]),
  description: z.string().optional().default(""),
  careNotes: z.string().optional().default(""),
  imageUrl: z.string().optional().default(""),
});

export const productUpdateSchema = productSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const sellerStatusSchema = z.object({
  status: z.enum(["accepted", "rejected", "dispatched", "delivered"]),
  rejectionReason: z.string().optional().default(""),
});

export const approveSchema = z.object({
  approve: z.boolean(),
});

export const profileSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  serviceAreas: z.array(z.string()).optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
});
