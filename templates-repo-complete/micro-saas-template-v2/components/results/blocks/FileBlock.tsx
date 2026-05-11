import type { FileBlock as T } from '@/config/result.schema';

export default function FileBlock({ block }: { block: T }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-gray-200 p-4">
      <div>
        <h3 className="font-semibold">{block.title}</h3>
        {block.filename && <p className="text-xs text-gray-500">{block.filename}{block.sizeBytes ? ` · ${Math.round(block.sizeBytes / 1024)} Ko` : ''}</p>}
      </div>
      <a
        href={block.url}
        download={block.filename}
        target="_blank"
        rel="noreferrer"
        className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Télécharger
      </a>
    </div>
  );
}
