import React, { forwardRef, useMemo, useState, useCallback, useEffect, type ReactNode } from "react";
import type { AvatarProps as BaseAvatarProps } from "@heroui/react";
import { AvatarIcon, useAvatar } from "@heroui/react";

export interface AvatarProps extends BaseAvatarProps {
	/**
	 * 可选形状：
	 * - circle: 完全圆形（默认）
	 * - rounded: 圆角矩形
	 * - square: 直角方形
	 */
	shape?: "circle" | "rounded" | "square";
	/**
	 * 自定义圆角（优先级高于 shape 映射），如 "12px" 或 12。
	 */
	borderRadius?: string | number;
}

const MyAvatarInner = forwardRef<HTMLSpanElement, AvatarProps>((props, ref) => {
	const { shape, borderRadius, radius: radiusProp, ...rest } = props;
	// 将自定义 shape 映射为 HeroUI 的 radius 取值
	const mappedRadius: BaseAvatarProps["radius"] | undefined = (() => {
		if (radiusProp) return radiusProp;
		if (!shape) return undefined; // 使用库默认（通常是 full）
		const map: Record<string, BaseAvatarProps["radius"]> = {
			circle: "full",
			rounded: "md",
			square: "none",
		} as const;
		return map[shape];
	})();
	const {
		src,
		icon = <DefaultAvatarIcon />,
		alt,
		classNames,
		slots,
		name,
		showFallback,
		fallback: fallbackComponent,
		getInitials,
		getAvatarProps,
		getImageProps,
	} = useAvatar({
		ref,
		...(mappedRadius ? { radius: mappedRadius } : {}),
		...rest,
		classNames: {
			base: "border-0 bg-transparent",
			...rest.classNames,
		},
	});

	// 统一 SSR 与首次客户端渲染：若有 src，初始一律认为 loading，避免水合不匹配
	const [isLoading, setIsLoading] = useState<boolean>(!!src);
	const [isError, setIsError] = useState(false);

	// 处理图片加载、错误状态
	const handleLoad = useCallback(() => {
		setIsLoading(false);
		setIsError(false);
	}, []);

	const handleError = useCallback(() => {
		setIsLoading(false);
		setIsError(true);
	}, []);

	// 仅当 src 变化时重置内部状态，避免无关重渲染引发短暂 fallback
	useEffect(() => {
		let active = true;
		if (!src) {
			setIsLoading(false);
			setIsError(false);
			return;
		}
		const img = new Image();
		img.src = src;
		if (img.complete) {
			active && setIsLoading(false);
			active && setIsError(false);
		} else {
			active && setIsLoading(true);
			active && setIsError(false);
			img.onload = () => { active && setIsLoading(false); };
			img.onerror = () => { active && setIsError(true); };
		}
		return () => { active = false; };
	}, [src]);

	const Wrapper = ({ children }: { children: ReactNode }) => (
		<span
			aria-label={alt || name || "avatar"}
			className={slots.fallback({ class: classNames?.fallback })}
			role="img"
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				width: "100%",
				height: "100%",
				...(borderRadius !== undefined
					? { borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius }
					: {}),
			}}
		>
			{children}
		</span>
	);

	const fallback = useMemo(() => {
		const ariaLabel = alt || name || "avatar";

		if (isError) return <Wrapper><ErrorIcon /></Wrapper>;
		if (isLoading) return <Wrapper><LoadingIcon /></Wrapper>;

		if (!showFallback && src && !isError) return null;

		if (fallbackComponent) {
			return (
				<div
					aria-label={ariaLabel}
					className={slots.fallback({ class: classNames?.fallback })}
					role="img"
				>
					{fallbackComponent}
				</div>
			);
		}

		if (name) {
			return (
				<span
					aria-label={ariaLabel}
					className={slots.name({ class: classNames?.name })}
					role="img"
				>
					{getInitials(name)}
				</span>
			);
		}

		return (
			<span
				aria-label={ariaLabel}
				className={slots.icon({ class: classNames?.icon })}
				role="img"
			>
				{icon}
			</span>
		);
	}, [
		alt,
		name,
		icon,
		src,
		isError,
		isLoading,
		showFallback,
		fallbackComponent,
		classNames,
		slots,
		getInitials,
	]);

	const imageProps = getImageProps();
	const containerProps = getAvatarProps();
	const mergedContainerStyle = {
		...(containerProps as any).style,
		...(borderRadius !== undefined
			? { borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius, overflow: "hidden" as const }
			: { overflow: "hidden" as const }),
		willChange: 'transform',
		contain: 'paint layout style',
	} as React.CSSProperties;
	const mergedImgStyle = {
		...(imageProps as any).style,
		...(borderRadius !== undefined
			? { borderRadius: typeof borderRadius === "number" ? `${borderRadius}px` : borderRadius }
			: {}),
	} as React.CSSProperties;

	return (
		<div {...containerProps} style={mergedContainerStyle} suppressHydrationWarning>
			{src && !isError && (
				<img
					{...imageProps}
					alt={alt}
					style={mergedImgStyle}
					onLoad={(e) => { imageProps.onLoad?.(e); handleLoad(); }}
					onError={(e) => { imageProps.onError?.(e); handleError(); }}
				/>
			)}
			{fallback}
		</div>
	);
});

MyAvatarInner.displayName = "MyAvatar";

// 避免无关状态变更导致头像重渲染
const areEqual = (prev: Omit<AvatarProps, "ref">, next: Omit<AvatarProps, "ref">) => {
	return (
		prev.src === next.src &&
		prev.alt === next.alt &&
		prev.shape === next.shape &&
		prev.borderRadius === next.borderRadius &&
		prev.className === next.className
	);
};

export default React.memo(MyAvatarInner, areEqual);

const LoadingIcon = () => (
	<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
		<rect width="200" height="200" fill="#1E1E1E" />
		<path d="M153 88.7425C153 65.6888 134.377 47 111.403 47H88.7606C84.3424 47 80.7606 50.5817 80.7606 55V68.2985C80.7606 69.0578 80.4767 69.7896 79.9646 70.3502L74.0626 76.8114C73.7444 77.1595 73.2957 77.358 72.825 77.3582H58.042C55.2574 77.3582 53 79.6235 53 82.4179V99.2836C53 102.078 55.2574 104.343 58.042 104.343H74.8487C77.6334 104.343 79.8908 102.078 79.8908 99.2836C79.8908 94.6769 79.8872 86.3087 79.886 83.3505L79.8858 82.9301C79.8857 82.5079 80.043 82.1066 80.3273 81.7953L86.5607 74.9749C87.137 74.3443 87.9519 73.9851 88.8062 73.9851H111.403C119.525 73.9851 126.109 80.5922 126.109 88.7425C126.109 96.8929 119.525 103.5 111.403 103.5H82.8631C81.5002 103.5 80.1951 104.054 79.2457 105.035L54.4246 130.699C53.5114 131.643 53 132.908 53 134.224V160H79.8908V135.545C79.8908 132.75 82.1481 130.485 84.9328 130.485H111.403C134.377 130.485 153 111.796 153 88.7425Z" fill="#535353" />
	</svg>

)

const ErrorIcon = () => (
	<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none" className="w-full h-full">
		<rect width="48" height="48" fill="transparent" />
		<path d="M28.6055 13C30.2428 13 31.6078 13.3979 32.6523 14.1445L33.5439 13.2529C33.8738 12.9232 34.4123 12.9233 34.7422 13.2529C35.0831 13.5828 35.0831 14.1105 34.7422 14.4404L14.4404 34.7422C14.2755 34.9071 14.0666 34.9951 13.8467 34.9951C13.6269 34.995 13.4178 34.9077 13.2529 34.7539C12.923 34.424 12.923 33.8846 13.2529 33.5547L14.1494 32.6562C13.9465 32.3717 13.7676 32.0626 13.6162 31.7295C13.2093 30.8497 13 29.8042 13 28.6055V19.3896C13.0001 15.3866 15.3865 13 19.3896 13H28.6055ZM34.5664 16.7285C34.8523 17.5093 34.9951 18.4 34.9951 19.3896V28.6055C34.9951 28.8555 34.9862 29.0997 34.9678 29.3369C34.6911 32.8979 32.3586 34.9951 28.6055 34.9951H19.3896L19.0234 34.9893C18.1791 34.958 17.4118 34.8166 16.7285 34.5664L22.6562 28.6387L22.8213 28.7383C23.6663 29.1997 24.7944 29.1025 25.5264 28.4736L30.1016 24.5479C30.9594 23.8111 32.3453 23.811 33.2031 24.5479L33.3457 24.6689V19.3896C33.3457 18.9169 33.3125 18.4771 33.2246 18.0703L34.5664 16.7285ZM19.3896 14.6494C16.2884 14.6494 14.6495 16.2884 14.6494 19.3896V28.6055C14.6494 29.4413 14.7922 30.1566 15.0342 30.7725L18.0703 28.7344L31.4668 15.3301C30.7263 14.8777 29.7675 14.6494 28.6055 14.6494H19.3896ZM20.6982 16.9814C22.1438 16.9814 23.3154 18.1531 23.3154 19.5986C23.3154 21.0442 22.1438 22.2158 20.6982 22.2158C19.2527 22.2158 18.0811 21.0442 18.0811 19.5986C18.0811 18.1531 19.2527 16.9815 20.6982 16.9814Z" fill="#535353" />
	</svg>
)

const DefaultAvatarIcon = () => (
	<svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
		<rect width="200" height="200" fill="#1E1E1E" />
		<path d="M153 88.7425C153 65.6888 134.377 47 111.403 47H88.7606C84.3424 47 80.7606 50.5817 80.7606 55V68.2985C80.7606 69.0578 80.4767 69.7896 79.9646 70.3502L74.0626 76.8114C73.7444 77.1595 73.2957 77.358 72.825 77.3582H58.042C55.2574 77.3582 53 79.6235 53 82.4179V99.2836C53 102.078 55.2574 104.343 58.042 104.343H74.8487C77.6334 104.343 79.8908 102.078 79.8908 99.2836C79.8908 94.6769 79.8872 86.3087 79.886 83.3505L79.8858 82.9301C79.8857 82.5079 80.043 82.1066 80.3273 81.7953L86.5607 74.9749C87.137 74.3443 87.9519 73.9851 88.8062 73.9851H111.403C119.525 73.9851 126.109 80.5922 126.109 88.7425C126.109 96.8929 119.525 103.5 111.403 103.5H82.8631C81.5002 103.5 80.1951 104.054 79.2457 105.035L54.4246 130.699C53.5114 131.643 53 132.908 53 134.224V160H79.8908V135.545C79.8908 132.75 82.1481 130.485 84.9328 130.485H111.403C134.377 130.485 153 111.796 153 88.7425Z" fill="#535353" />
	</svg>

)