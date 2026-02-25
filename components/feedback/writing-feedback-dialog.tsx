\"use client\"

import { useState } from \"react\"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from \"@/components/ui/dialog\"
import { Button } from \"@/components/ui/button\"
import { Textarea } from \"@/components/ui/textarea\"
import { toast } from \"sonner\"
import { Sparkles, Star } from \"lucide-react\"

type WritingType = \"story\" | \"review\" | \"letter\"

interface WritingFeedbackDialogProps {
  open: boolean
  onClose: () => void
  userId?: string
  writingType: WritingType
}

export default function WritingFeedbackDialog({
  open,
  onClose,
  userId,
  writingType,
}: WritingFeedbackDialogProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>(\"\")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const writingLabel =
    writingType === \"story\" ? \"story writing\"
    : writingType === \"review\" ? \"book review writing\"
    : \"letter writing\"

  const handleSubmit = async () => {
    if (!rating) {
      toast.error(\"Please choose a star rating.\")
      return
    }

    setIsSubmitting(true)
    try {
      // 傳到現有的 interactions API 作為一條反饋記錄
      await fetch(\"/api/interactions\", {
        method: \"POST\",
        headers: {
          \"Content-Type\": \"application/json\",
        },
        body: JSON.stringify({
          user_id: userId || \"anonymous-student\",
          stage: \"writingFeedback\",
          input: {
            writingType,
            rating,
            comment,
          },
          output: {},
          api_calls: [],
        }),
      }).catch((err) => {
        console.error(\"Error sending feedback:\", err)
      })

      toast.success(\"Thank you for your feedback! ✨\")
      onClose()
    } catch (error) {
      console.error(\"Error submitting feedback:\", error)
      toast.error(\"Failed to submit feedback. Please try again.\")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=\"max-w-lg bg-gradient-to-br from-white via-sky-50 to-emerald-50 border-4 border-sky-200 shadow-2xl\">
        <DialogHeader>
          <DialogTitle className=\"flex items-center gap-2 text-2xl font-black bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 bg-clip-text text-transparent\">
            <Sparkles className=\"w-6 h-6 text-sky-500\" />
            How was this writing activity?
          </DialogTitle>
          <DialogDescription className=\"mt-1 text-sm text-slate-600\">
            Please rate your experience with this {writingLabel}. Your feedback helps us make CWrite even better for you and other students.
          </DialogDescription>
        </DialogHeader>

        <div className=\"mt-4 space-y-4\">
          {/* Stars */}
          <div>
            <p className=\"mb-2 text-sm font-semibold text-slate-700\">Overall, how did you feel about this activity?</p>
            <div className=\"flex items-center gap-2\">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1
                const active = (hoverRating || rating) >= value
                return (
                  <button
                    key={value}
                    type=\"button\"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    className=\"p-1.5 rounded-full transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-sky-400\"
                    aria-label={`${value} star${value > 1 ? \"s\" : \"\"}`}
                  >
                    <Star
                      className={active ? \"w-7 h-7 text-yellow-400 fill-yellow-300\" : \"w-7 h-7 text-slate-300\"}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <p className=\"mb-2 text-sm font-semibold text-slate-700\">
              Is there anything you especially liked or want us to improve?
            </p>
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder=\"You can write your thoughts here (optional, in English). For example: I liked the AI help because..., It was hard when..., I wish...\"
              className=\"min-h-[100px] text-sm leading-relaxed border-2 border-sky-200 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 rounded-xl bg-white/90\"
            />
          </div>

          {/* Actions */}
          <div className=\"flex flex-col sm:flex-row sm:justify-end gap-3 pt-2\">
            <Button
              type=\"button\"
              variant=\"outline\"
              onClick={handleSkip}
              className=\"sm:w-auto w-full rounded-xl border-slate-300 text-slate-600 hover:bg-slate-50\"
            >
              Maybe later
            </Button>
            <Button
              type=\"button\"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className=\"sm:w-auto w-full rounded-xl bg-gradient-to-r from-sky-600 via-teal-600 to-emerald-600 hover:from-sky-700 hover:via-teal-700 hover:to-emerald-700 text-white border-0 shadow-lg\"
            >
              {isSubmitting ? \"Sending...\" : \"Submit feedback\"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

