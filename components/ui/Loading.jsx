export default function Loading({ label = "Loading..." }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900" />
      <span>{label}</span>
    </div>
  );
}