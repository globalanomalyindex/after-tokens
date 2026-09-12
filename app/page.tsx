import { CaseStudyExperience } from '@/components/presentation/case-study-experience'
import { ReadingStudy } from '@/components/presentation/reading-study'

export default function HomePage() {
  return <CaseStudyExperience reading={<ReadingStudy />} />
}
