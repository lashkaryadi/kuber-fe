type Props = {
  page: number;
  pages: number;
  onChange: (page: number) => void;
};

export function Pagination({ page, pages, onChange }: Props) {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Prev
      </button>

      {Array.from({ length: pages }).map((_, i) => {
        const p = i + 1;
        return (
          <button
            key={p}
            onClick={() => onChange(p)}
            className={`px-3 py-1 border rounded ${
              p === page ? "bg-black text-white" : ""
            }`}
          >
            {p}
          </button>
        );
      })}

      <button
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}