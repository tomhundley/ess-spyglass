interface FileGroupHeaderProps {
  label: string;
  count: number;
}

export function FileGroupHeader({ label, count }: FileGroupHeaderProps) {
  return (
    <div className="file-group-header">
      {label} ({count})
    </div>
  );
}
