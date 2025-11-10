
import { AnimationPlayer } from './AnimationPlayer';

export function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="glass rounded-2xl p-8 max-w-md w-full text-center">
        <AnimationPlayer
          animationPath="/maintance.json"
          className="w-48 h-48 mx-auto"
        />
        <h1 className="text-2xl font-bold mt-6 mb-3 gradient-text">
          Texnik ishlar olib borilmoqda
        </h1>
        <p className="text-muted-foreground mb-4">
          Tizimimizni yaxshilash uchun qisqa vaqt ichida texnik ishlar olib bormoqdamiz.
        </p>
        <p className="text-sm text-muted-foreground">
          Tez orada qaytamiz! 🚀
        </p>
      </div>
    </div>
  );
}
