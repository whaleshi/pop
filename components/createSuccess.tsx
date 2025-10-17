import { Navbar as HeroUINavbar, NavbarContent, Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure, Input } from "@heroui/react";
import { CloseIcon } from "@/components/icons";
import MyAvatar from "@/components/avatarImage";
import { useRouter } from "next/router";

interface ShareProps {
	isOpen: boolean;
	onClose: () => void;
	info?: any;
}

export default function CreateSuccess({ isOpen, onClose, info }: ShareProps) {
	const router = useRouter();
	return (
		<>
			<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} hideCloseButton placement="center" size="sm"
				style={{
					borderRadius: "24px",
					border: "2px solid #FFF",
					background: "linear-gradient(180deg, #DDFFE5 0%, #FFF 70%)"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{() => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[8px]">
								<div className="h-[48px] flex items-center justify-center w-full">创建成功</div>
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[16px] items-center gap-0">
								<MyAvatar src={info?.image || '/images/default.png'} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
								<div className="text-[17px] text-[#24232A] mt-[10px]">{info?.symbol}</div>
								<div className="text-[13px] text-[#94989F] mt-[4px]">{info?.name}</div>
								<Button fullWidth className="h-[44px] bg-[#24232A] text-[15px] text-[#FFF] rounded-[16px] mt-[20px]" onPress={() => {
									const text = `我在 @nihaocrypto 发现了 $${info?.symbol?.toUpperCase()} 快来一起交易吧 👉 https://nihao.com/token/${info?.addr}`;
									const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
									window.open(url, "_blank");
								}}>分享到 X</Button>
								<Button fullWidth className="h-[44px] bg-[#EBEBEF] text-[15px] text-[#24232A] rounded-[16px] mt-[12px]" onPress={() => {
									onClose();
									router.push(`/token/${info?.addr}`);
								}}>查看详情</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
