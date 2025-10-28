import { Link } from "@heroui/link";

import { Head } from "./head";

import { Navbar } from "@/components/navbar";

export default function DefaultLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex flex-col h-screen bg-[#000000]">
			<Head />
			<Navbar />
			<main className="mx-auto w-full flex-grow pt-[56px] md:pt-[64px] bg-[#000000]">
				{children}
			</main>
			<footer className="py-4 text-center text-[#AAAAAA] text-[12px] relative z-10 bg-[#000000]">
				© Popme.fun 2025
			</footer>
		</div>
	);
}
