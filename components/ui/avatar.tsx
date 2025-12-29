import * as React from 'react'

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
	src?: string | null
	alt?: string
	fallback?: string
	size?: number
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, size = 40, className, ...rest }) => {
	const style = { width: size, height: size }
	return (
		<div
			className={['inline-flex items-center justify-center rounded-full bg-muted text-sm', className]
				.filter(Boolean)
				.join(' ')}
			style={style}
			{...rest}
		>
			{src ? (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					src={src}
					alt={alt ?? 'avatar'}
					width={size}
					height={size}
					className="h-full w-full rounded-full object-cover"
				/>
			) : (
				<span className="select-none text-foreground/70">{fallback ?? '👤'}</span>
			)}
		</div>
	)
}

