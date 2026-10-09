import mongoose from "mongoose";

const productCatalogSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    category: {
      type: String,
      enum: ["plants", "fertilizers", "seeds", "tools"],
      required: true,
    },
    unit: {
      type: String,
      enum: ["pieces", "kg", "litre", "bag"],
      required: true,
    },
    description: { type: String, default: "" },
    careNotes: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const ProductCatalog = mongoose.model("ProductCatalog", productCatalogSchema);
