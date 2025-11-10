
import { AnimationPlayer } from './AnimationPlayer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function ErrorModal({ isOpen, onClose, title, description }: ErrorModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass border-red-500/20">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <AnimationPlayer
              animationPath="/error.json"
              className="w-24 h-24"
              loop={false}
            />
          </div>
          <DialogTitle className="text-center text-red-400">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
