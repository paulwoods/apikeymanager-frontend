import { useQuery } from '@tanstack/react-query'
import { Link, useParams } from 'react-router'
import KeyOwnersSection from '../keyowners/KeyOwnersSection'
import { fetchApplication } from './api'

export default function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>()

  const application = useQuery({
    queryKey: ['applications', applicationId],
    queryFn: () => fetchApplication(applicationId!),
    enabled: Boolean(applicationId),
  })

  return (
    <div className="space-y-8">
      <div>
        <Link to="/applications" className="text-sm text-slate-500 hover:text-slate-900">
          ← Applications
        </Link>

        {application.isPending && <p className="mt-2 text-sm text-slate-500">Loading…</p>}

        {application.isError && (
          <p role="alert" className="mt-2 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            {application.error.message}
          </p>
        )}

        {application.data && (
          <h2 className="mt-2 text-lg font-medium text-slate-900">{application.data.name}</h2>
        )}
      </div>

      {applicationId && <KeyOwnersSection applicationId={applicationId} />}
    </div>
  )
}
