import { Dialog, DialogTitle, DialogHeader, DialogTrigger, DialogContent } from "./ui/dialog";

type ViewCapsuleModalProps = {
  title: string,
  date: string,
  message: string,
  children: React.ReactNode
}

function ViewCapsuleModal({title,message,date, children}: ViewCapsuleModalProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
               {children}
          </DialogTrigger>
      <DialogContent className="p-6 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-md flex gap-7 items-center">
            <span>{title}</span>
            <time>{date}</time>
          </DialogTitle>
        </DialogHeader>
        <div className="m-2">
          <p className="text-sm whitespace-pre-wrap">
               {message}
          </p>
          </div>
      </DialogContent>
      </Dialog>

  )
}

export default ViewCapsuleModal