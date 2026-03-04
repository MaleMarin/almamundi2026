import { z } from "zod";

export const StoryMood = z.enum(["mar", "ciudad", "bosque", "animales", "universo", "personas"]);
export type StoryMood = z.infer<typeof StoryMood>;

export const StoryFormat = z.enum(["text", "audio", "video"]);
export type StoryFormat = z.infer<typeof StoryFormat>;

export const SubmissionSchema = z.object({
  title: z.string().min(3).max(120),
  placeName: z.string().min(2).max(120),
  country: z.string().min(2).max(2).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  format: StoryFormat,
  text: z.string().max(12000).optional(),
  mediaUrl: z.string().url().optional(),
  moods: z.array(StoryMood).min(1).max(3),
  tags: z.array(z.string().min(2).max(30)).max(12).optional(),
  authorName: z.string().min(2).max(80).optional(),
  authorEmail: z.string().email().optional(),
  consent: z.boolean(),
});

export type SubmissionInput = z.infer<typeof SubmissionSchema>;
