import { z } from 'zod'

/**
 * Mirrors the backend's @NotBlank @Size(max = 200) so an obviously invalid name is
 * caught before a request is made. The server still enforces it — this is courtesy to
 * the operator, not a security boundary.
 */
export const applicationFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(200, 'Name must be 200 characters or fewer'),
})

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>
