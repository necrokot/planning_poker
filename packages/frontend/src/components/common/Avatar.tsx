interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  color?: string | null;
  size?: 'sm' | 'md';
}

export function Avatar({ name, avatarUrl, color, size = 'sm' }: AvatarProps) {
  const sizeClass = size === 'md' ? 'w-10 h-10' : 'w-8 h-8';
  const textClass = size === 'md' ? 'text-base' : 'text-sm';
  const initial = name.charAt(0).toUpperCase();

  if (avatarUrl) {
    return <img src={avatarUrl} alt={name} className={`${sizeClass} rounded-full object-cover`} />;
  }

  if (color) {
    return (
      <div
        className={`${sizeClass} rounded-full flex items-center justify-center`}
        style={{ backgroundColor: color }}
      >
        <span className={`text-white font-medium ${textClass}`}>{initial}</span>
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full bg-primary-200 flex items-center justify-center`}>
      <span className={`text-primary-700 font-medium ${textClass}`}>{initial}</span>
    </div>
  );
}
