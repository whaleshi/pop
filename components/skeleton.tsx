import React from "react";

// 单个代币项目的骨架屏
const SkeletonItem = () => (
	<div className="bg-[#fff] rounded-[16px] p-[16px] mb-[12px] animate-pulse">
		<div className="flex items-center gap-[12px]">
			<div className="w-[40px] h-[40px] bg-[#F0F0F0] rounded-full flex-shrink-0"></div>
			<div className="flex-1">
				<div className="flex items-center justify-between mb-[8px]">
					<div className="h-[16px] bg-[#F0F0F0] rounded w-[120px]"></div>
					<div className="h-[14px] bg-[#F0F0F0] rounded w-[60px]"></div>
				</div>
				<div className="flex items-center justify-between">
					<div className="h-[12px] bg-[#F0F0F0] rounded w-[80px]"></div>
					<div className="h-[12px] bg-[#F0F0F0] rounded w-[40px]"></div>
				</div>
			</div>
		</div>
	</div>
);

// 通用骨架屏组件
interface SkeletonProps {
	count?: number; // 显示多少个骨架项
	className?: string; // 外层容器样式
}

export const TokenListSkeleton: React.FC<SkeletonProps> = ({ 
	count = 5, 
	className = "" 
}) => (
	<div className={`space-y-[12px] ${className}`}>
		{[...Array(count)].map((_, index) => (
			<SkeletonItem key={index} />
		))}
	</div>
);

// 简单的矩形骨架屏
interface RectSkeletonProps {
	width?: string;
	height?: string;
	className?: string;
	rounded?: boolean;
}

export const RectSkeleton: React.FC<RectSkeletonProps> = ({
	width = "w-full",
	height = "h-4",
	className = "",
	rounded = true
}) => (
	<div 
		className={`bg-[#F0F0F0] animate-pulse ${width} ${height} ${rounded ? 'rounded' : ''} ${className}`}
	></div>
);

// 圆形头像骨架屏
interface AvatarSkeletonProps {
	size?: string;
	className?: string;
}

export const AvatarSkeleton: React.FC<AvatarSkeletonProps> = ({
	size = "w-[40px] h-[40px]",
	className = ""
}) => (
	<div 
		className={`bg-[#F0F0F0] animate-pulse rounded-full ${size} ${className}`}
	></div>
);

// 卡片骨架屏
interface CardSkeletonProps {
	className?: string;
	children?: React.ReactNode;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
	className = "",
	children
}) => (
	<div className={`bg-[#fff] rounded-[16px] p-[16px] animate-pulse ${className}`}>
		{children || (
			<div className="space-y-3">
				<RectSkeleton width="w-3/4" height="h-4" />
				<RectSkeleton width="w-1/2" height="h-3" />
				<RectSkeleton width="w-2/3" height="h-3" />
			</div>
		)}
	</div>
);

export default TokenListSkeleton;