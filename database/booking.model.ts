import { Schema, model, models, Document, Model, Types } from 'mongoose';
import { Event } from './event.model';

// Strongly-typed shape of a Booking document
export interface BookingDocument extends Document {
  eventId: Types.ObjectId;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookingSchema = new Schema<BookingDocument>(
  {
    eventId: {
      type: Schema.Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true, // speeds up queries filtering by event
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
  },
  {
    // createdAt/updatedAt are managed automatically
    timestamps: true,
    strict: true,
  }
);

// Simple, conservative email validator used in the pre-save hook
function isValidEmail(email: string): boolean {
  // Intentionally simple RFC-compliant-enough regex for most cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Pre-save hook: validate email and ensure the referenced event exists
BookingSchema.pre<BookingDocument>('save', async function preSave(next) {
  try {
    const email = this.email?.trim();

    if (!email || !isValidEmail(email)) {
      return next(new Error('A valid email address is required'));
    }

    this.email = email.toLowerCase();

    // Verify the referenced event exists before creating the booking
    const eventExists = await Event.exists({ _id: this.eventId });
    if (!eventExists) {
      return next(new Error('Cannot create booking: referenced event does not exist'));
    }

    next();
  } catch (err) {
    next(err as Error);
  }
});

export type BookingModel = Model<BookingDocument>;

// Reuse existing compiled model in dev (Next.js hot reload) to avoid OverwriteModelError
export const Booking: BookingModel =
  (models.Booking as BookingModel) || model<BookingDocument>('Booking', BookingSchema);
