
import { AnimationPlayer } from './AnimationPlayer';

interface ItemsLoadingProps {
  text?: string;
}

export function ItemsLoading({ text = "Yuklanmoqda..." }: ItemsLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <AnimationPlayer
        animationPath="/loadingiteams.json"
        className="w-32 h-32"
      />
      <p className="mt-4 text-muted-foreground">{text}</p>
    </div>
  );
}
