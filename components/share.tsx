import { Navbar as HeroUINavbar, NavbarContent, Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure, Input } from "@heroui/react";
import { CloseIcon } from "@/components/icons";
import MyAvatar from "@/components/avatarImage";
import useClipboard from '@/hooks/useCopyToClipboard';

interface ShareProps {
	isOpen: boolean;
	onClose: () => void;
	info?: any;
}

export default function Share({ isOpen, onClose, info }: ShareProps) {
	const { copy } = useClipboard();
	return (
		<>
			<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} hideCloseButton placement="center" size="sm"
				style={{
					borderRadius: "24px",
					border: "2px solid #333",
					background: "#1A1A1A"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{() => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full text-[#fff]">分享代币</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[16px] items-center gap-0">
								<MyAvatar src={info?.metadata?.image || '/images/default.png'} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
								<div className="text-[17px] text-[#fff] mt-[10px]">{info?.metadata?.symbol?.toUpperCase() || '--'}</div>
								<div className="text-[13px] text-[#AAAAAA] mt-[4px]">{info?.metadata?.name || '--'}</div>
								<Button fullWidth className="h-[44px] bg-[#9AED2D] text-[15px] text-[#000] rounded-[16px] mt-[20px] hover:bg-[#7ED321] transition-colors" onPress={() => {
									const text = `我在 发现了 $${info?.metadata?.symbol?.toUpperCase()} 快来一起交易吧 👉 https://popmefun.com/token/${info?.address}`;
									const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
									window.open(url, "_blank");
								}}>分享到 X</Button>
								<Button fullWidth className="h-[44px] bg-[#333] text-[15px] text-[#fff] rounded-[16px] mt-[12px] hover:bg-[#444] transition-colors" onPress={() => { copy(`https://popmefun.com/token/${info?.address}` || '') }}>复制链接</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
