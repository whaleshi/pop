import CreateForm from "@/components/form";
import { BackIcon } from "@/components/icons";
import DefaultLayout from "@/layouts/default";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function CreatePage() {
	const router = useRouter();

	const [isMdOrLarger, setIsMdOrLarger] = useState(true);

	// 检测屏幕尺寸是否为 md 或更大
	useEffect(() => {
		const checkScreenSize = () => {
			const isMd = window.matchMedia('(min-width: 768px)').matches;
			setIsMdOrLarger(isMd);

			if (isMd) {
				router.replace('/');
			}
		};

		// 初始检查
		checkScreenSize();

		// 监听屏幕尺寸变化
		const mediaQuery = window.matchMedia('(min-width: 768px)');
		mediaQuery.addEventListener('change', checkScreenSize);

		return () => {
			mediaQuery.removeEventListener('change', checkScreenSize);
		};
	}, [router]);

	// 如果屏幕尺寸小于 md，不渲染页面内容
	if (isMdOrLarger) {
		return null;
	}

	return (
		<DefaultLayout>
			<section className="flex flex-col items-center justify-center w-full px-[16px]">
				<div className="h-[48px] w-full flex items-center md:hidden relative">
					<BackIcon className="cursor-pointer relative z-1" onClick={() => router.push('/')} />
					<div className="w-full h-full absolute top-0 left-0 flex items-center justify-center text-[17px] text-[#24232A]">立即创建</div>
				</div>
			</section>
			<CreateForm />
		</DefaultLayout>
	);
}
