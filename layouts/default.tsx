import { Link } from "@heroui/link";

import { Head } from "./head";

import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex flex-col h-screen">
			<Head />
			<Navbar />
			<main className="mx-auto w-full flex-grow pt-[56px] md:pt-[64px]">
				{children}
			</main>
			<div className="fixed bottom-0 left-0 right-0 w-full pointer-events-none z-0">
				<img src="/images/h5.png" alt="" className="w-full h-auto block md:hidden" />
				<img src="/images/pc.png" alt="" className="max-w-[100vw] h-auto hidden md:block" />
			</div>
			<footer className="py-4 text-center text-[#AAAAAA] text-[12px] relative z-10">
				© Popme.fun 2025
			</footer>
		</div>
	);
}
