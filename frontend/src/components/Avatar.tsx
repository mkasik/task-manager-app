interface AvatarProps {
    name: string;
    color?: string;
    size?: number;
}

export default function Avatar({ name, color = '#7c3aed', size = 32 }: AvatarProps) {
    const initial = (name || '?').charAt(0).toUpperCase();
    return (
        <div
            className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
        >
            {initial}
        </div>
    );
}
