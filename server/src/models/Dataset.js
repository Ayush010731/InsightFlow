
import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    originalName: { type: String, required: true },
    rowCount: { type: Number, default: 0 },
    columnCount: { type: Number, default: 0 },
    
columns: {
  type: [
    new mongoose.Schema(
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        missing: { type: Number, default: 0 },
        unique: { type: Number, default: 0 }
      },
      { _id: false }
    )
  ],
  default: []
},

    rows: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    preview: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    },
    numericSummary: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  { timestamps: true }
);

const Dataset = mongoose.model('Dataset', datasetSchema);

export default Dataset;
