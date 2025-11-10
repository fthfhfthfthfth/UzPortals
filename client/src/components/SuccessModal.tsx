
import { AnimationPlayer } from './AnimationPlayer';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
}

export function SuccessModal({ isOpen, onClose, title, description }: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md glass border-green-500/20">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <AnimationPlayer
              animationPath="/done.json"
              className="w-24 h-24"
              loop={false}
            />
          </div>
          <DialogTitle className="text-center text-green-400">{title}</DialogTitle>
          <DialogDescription className="text-center">
            {description}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
