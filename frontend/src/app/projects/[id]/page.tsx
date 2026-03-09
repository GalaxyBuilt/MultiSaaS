import { ProjectDetailClient } from './ProjectDetailClient'
import * as mockData from '@/lib/mock-data'

export async function generateStaticParams() {
    return mockData.MOCK_PROJECTS.map((project) => ({
        id: project.id,
    }))
}

export default function Page({ params }: { params: { id: string } }) {
    return <ProjectDetailClient id={params.id} />
}
