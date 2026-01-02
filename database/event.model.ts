import { Schema, model, models, Document, Model } from 'mongoose';

// Strongly-typed shape of an Event document
export interface EventDocument extends Document {
  title: string;
  slug: string;
  description: string;
  overview: string;
  image: string;
  venue: string;
  location: string;
  /** ISO-8601 calendar date string, e.g. 2025-01-31 */
  date: string;
  /** 24-hour time string, e.g. 14:30 */
  time: string;
  /** e.g. "online", "offline", "hybrid" */
  mode: string;
  audience: string;
  agenda: string[];
  organizer: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<EventDocument>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true, trim: true },
    overview: { type: String, required: true, trim: true },
    image: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    date: { type: String, required: true, trim: true },
    time: { type: String, required: true, trim: true },
    mode: { type: String, required: true, trim: true },
    audience: { type: String, required: true, trim: true },
    agenda: { type: [String], required: true, default: [] },
    organizer: { type: String, required: true, trim: true },
    tags: { type: [String], required: true, default: [] },
  },
  {
    // createdAt/updatedAt are managed automatically
    timestamps: true,
    strict: true,
  }
);

// Basic, reusable slug generator to keep URLs stable and predictable
function generateSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove invalid chars
    .replace(/\s+/g, '-') // spaces -> hyphens
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, ''); // trim hyphens
}

// Normalize calendar date to `YYYY-MM-DD` while validating input
function normalizeDateString(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Invalid event date');
  }
  return parsed.toISOString().slice(0, 10); // keep only the calendar date
}

// Normalize time to 24h `HH:MM` format and validate bounds
function normalizeTimeString(value: string): string {
  const trimmed = value.trim();

  // Accept "H:MM" or "HH:MM" and normalize to "HH:MM"
  const match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error('Time must be in HH:MM 24-hour format');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (!Number.isInteger(hours) || !Number.isInteger(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error('Invalid time value');
  }

  const hh = hours.toString().padStart(2, '0');
  const mm = minutes.toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

// Pre-save hook: generate slug, normalize date/time, enforce non-empty required fields
EventSchema.pre<EventDocument>('save', function preSave(next) {
  try {
    // Ensure required string fields are present and non-empty after trimming
    const requiredStrings: (keyof EventDocument)[] = [
      'title',
      'description',
      'overview',
      'image',
      'venue',
      'location',
      'date',
      'time',
      'mode',
      'audience',
      'organizer',
    ];

    for (const key of requiredStrings) {
      const value = (this as EventDocument)[key];
      if (typeof value !== 'string' || value.trim().length === 0) {
        return next(new Error(`Field "${String(key)}" is required`));
      }
      (this as EventDocument)[key] = value.trim() as never;
    }

    // Validate and normalize agenda and tags arrays
    const agenda = this.agenda ?? [];
    const tags = this.tags ?? [];

    if (!Array.isArray(agenda) || agenda.length === 0) {
      return next(new Error('Field "agenda" is required and must be a non-empty array'));
    }
    if (!Array.isArray(tags) || tags.length === 0) {
      return next(new Error('Field "tags" is required and must be a non-empty array'));
    }

    this.agenda = agenda.map((item) => item.trim()).filter((item) => item.length > 0);
    this.tags = tags.map((item) => item.trim()).filter((item) => item.length > 0);

    if (this.agenda.length === 0) {
      return next(new Error('Field "agenda" cannot contain only empty values'));
    }
    if (this.tags.length === 0) {
      return next(new Error('Field "tags" cannot contain only empty values'));
    }

    // Only regenerate slug when title has changed or slug is missing
    if (!this.slug || this.isModified('title')) {
      this.slug = generateSlug(this.title);
    }

    // Normalize and validate date and time formats
    this.date = normalizeDateString(this.date);
    this.time = normalizeTimeString(this.time);

    next();
  } catch (err) {
    next(err as Error);
  }
});

export type EventModel = Model<EventDocument>;

// Reuse existing compiled model in dev (Next.js hot reload) to avoid OverwriteModelError
export const Event: EventModel = (models.Event as EventModel) || model<EventDocument>('Event', EventSchema);
