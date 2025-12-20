import { Button } from '@/components/ui/button'
import React from 'react'

interface CourseFooterProps {
	onClose: () => void
	handleSubmit: () => void
	isSubmitting: boolean
	formState: {
		course: {
			courseId?: string | number
		}
	}
}

export const CourseFooter: React.FC<CourseFooterProps> = ({
	onClose,
	handleSubmit,
	isSubmitting,
	formState,
}) => {
	return (
		<div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
			<Button variant="outline" onClick={onClose} disabled={isSubmitting}>
				Cancel
			</Button>
			<Button
				onClick={handleSubmit}
				disabled={isSubmitting}
				className="min-w-32"
			>
				{isSubmitting
					? "Saving..."
					: formState.course.courseId
						? "Update Course"
						: "Create Course"}
			</Button>
		</div>
	)
}

export default CourseFooter
