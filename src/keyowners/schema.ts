import { z } from 'zod'

/**
 * Mirrors the backend's @NotBlank @Email @Size(max = 320). The server still enforces it —
 * this is courtesy to the operator, not a security boundary.
 */
export const keyOwnerFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .max(320, 'Email must be 320 characters or fewer')
    .pipe(z.email('Enter a valid email address')),
})

export type KeyOwnerFormValues = z.infer<typeof keyOwnerFormSchema>
