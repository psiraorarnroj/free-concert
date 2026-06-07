export function BrandLogo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-3 w-3 rounded-full ${light ? 'bg-white' : 'bg-blue-700'}`} />
      <span className={`text-sm font-bold tracking-wide ${light ? 'text-white' : 'text-blue-700'}`}>
        BRAND
      </span>
    </div>
  );
}
