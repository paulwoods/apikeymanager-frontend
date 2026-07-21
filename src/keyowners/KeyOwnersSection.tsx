import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { createKeyOwner, fetchKeyOwners, withdrawKeyOwner } from './api'
import { keyOwnerFormSchema, type KeyOwnerFormValues } from './schema'

export default function KeyOwnersSection({ applicationId }: { applicationId: string }) {
  const queryClient = useQueryClient()
  const queryKey = ['applications', applicationId, 'key-owners']

  const keyOwners = useQuery({
    queryKey,
    queryFn: () => fetchKeyOwners(applicationId),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<KeyOwnerFormValues>({
    resolver: zodResolver(keyOwnerFormSchema),
    defaultValues: { email: '' },
  })

  const refreshList = () => queryClient.invalidateQueries({ queryKey })

  const add = useMutation({
    mutationFn: (values: KeyOwnerFormValues) => createKeyOwner(applicationId, values.email),
    onSuccess: async () => {
      reset()
      await refreshList()
    },
  })

  const withdraw = useMutation({
    mutationFn: (id: string) => withdrawKeyOwner(applicationId, id),
    onSuccess: refreshList,
  })

  const failure = add.error ?? withdraw.error

  return (
    <section className="space-y-6">
      <div>
        <h3 className="text-base font-medium text-slate-900">Key owners</h3>
        <p className="mt-1 text-sm text-slate-500">
          The subjects keys are issued to. A key owner is a record, not a sign-in.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => add.mutate(values))}
        noValidate
        className="flex items-start gap-3"
      >
        <div className="flex-1">
          <label htmlFor="key-owner-email" className="block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="key-owner-email"
            type="text"
            autoComplete="off"
            {...register('email')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm
              focus:border-slate-500 focus:outline-none"
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={add.isPending}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white
            hover:bg-slate-700 disabled:opacity-50"
        >
          Add key owner
        </button>
      </form>

      {failure && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {failure.message}
        </p>
      )}

      {keyOwners.isPending && <p className="text-sm text-slate-500">Loading key owners…</p>}

      {keyOwners.data?.length === 0 && (
        <p className="text-sm text-slate-500">No key owners yet.</p>
      )}

      {keyOwners.data && keyOwners.data.length > 0 && (
        <ul
          aria-label="Key owners"
          className="divide-y divide-slate-200 rounded-md border border-slate-200"
        >
          {keyOwners.data.map((owner) => (
            <li key={owner.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-900">{owner.email}</span>
              <button
                type="button"
                onClick={() => withdraw.mutate(owner.id)}
                disabled={withdraw.isPending}
                className="text-sm text-slate-500 hover:text-red-700 disabled:opacity-50"
              >
                {`Withdraw ${owner.email}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
