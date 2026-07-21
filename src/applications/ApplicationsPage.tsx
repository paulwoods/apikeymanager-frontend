import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { createApplication, fetchApplications, withdrawApplication } from './api'
import { applicationFormSchema, type ApplicationFormValues } from './schema'

const applicationsKey = ['applications'] as const

export default function ApplicationsPage() {
  const queryClient = useQueryClient()

  const applications = useQuery({
    queryKey: applicationsKey,
    queryFn: fetchApplications,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: { name: '' },
  })

  const refreshList = () => queryClient.invalidateQueries({ queryKey: applicationsKey })

  const create = useMutation({
    mutationFn: (values: ApplicationFormValues) => createApplication(values.name),
    onSuccess: async () => {
      reset()
      await refreshList()
    },
  })

  const withdraw = useMutation({
    mutationFn: withdrawApplication,
    onSuccess: refreshList,
  })

  const failure = create.error ?? withdraw.error

  return (
    <section className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-slate-900">Applications</h2>
        <p className="mt-1 text-sm text-slate-500">
          Each application is a tenant. Keys and their owners belong to exactly one.
        </p>
      </div>

      <form
        onSubmit={handleSubmit((values) => create.mutate(values))}
        noValidate
        className="flex items-start gap-3"
      >
        <div className="flex-1">
          <label htmlFor="application-name" className="block text-sm font-medium text-slate-700">
            Name
          </label>
          <input
            id="application-name"
            type="text"
            autoComplete="off"
            {...register('name')}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm
              focus:border-slate-500 focus:outline-none"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={create.isPending}
          className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white
            hover:bg-slate-700 disabled:opacity-50"
        >
          Create application
        </button>
      </form>

      {failure && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {failure.message}
        </p>
      )}

      {applications.isPending && <p className="text-sm text-slate-500">Loading applications…</p>}

      {applications.isError && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {applications.error.message}
        </p>
      )}

      {applications.data?.length === 0 && (
        <p className="text-sm text-slate-500">No applications yet.</p>
      )}

      {applications.data && applications.data.length > 0 && (
        <ul aria-label="Applications" className="divide-y divide-slate-200 rounded-md border border-slate-200">
          {applications.data.map((application) => (
            <li key={application.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm text-slate-900">{application.name}</span>
              <button
                type="button"
                onClick={() => withdraw.mutate(application.id)}
                disabled={withdraw.isPending}
                className="text-sm text-slate-500 hover:text-red-700 disabled:opacity-50"
              >
                {`Withdraw ${application.name}`}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
