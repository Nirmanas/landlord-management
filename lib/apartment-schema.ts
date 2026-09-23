import { z } from "zod";

export const apartmentFormSchema = z.object({
  name: z.string().trim().min(1, "Enter an apartment name."),
  address: z.string().trim().min(1, "Enter a street address."),
});

export type ApartmentFormValues = z.infer<typeof apartmentFormSchema>;
