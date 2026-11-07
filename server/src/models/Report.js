
import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    datasetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dataset',
      required: true
    },

    datasetName: {
      type: String,
      required: true,
      trim: true
    },

    report: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Efficiently retrieve a user's reports, newest first.
reportSchema.index({ userId: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export default Report;
