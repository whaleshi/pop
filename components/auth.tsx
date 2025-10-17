import { Navbar as HeroUINavbar, NavbarContent, Modal, ModalContent, ModalHeader, ModalBody, Button, useDisclosure, Input } from "@heroui/react";
import { CloseIcon, Gold1Icon } from "@/components/icons";
import MyAvatar from "@/components/avatarImage";
import { toast } from "sonner";

interface AuthProps {
	isOpen: boolean;
	onClose: () => void;
	info?: any;
}

export default function Auth({ isOpen, onClose, info }: AuthProps) {
	return (
		<>
			<Modal isOpen={isOpen} onOpenChange={(open) => !open && onClose()} hideCloseButton placement="center" size="sm"
				style={{
					borderRadius: "24px",
					border: "2px solid #FFF",
					background: "linear-gradient(180deg, #FFFDEB 0%, #FFF 70%)"
				}}
			>
				<ModalContent className="max-h-[80vh] overflow-y-auto">
					{() => (
						<>
							<ModalHeader className="text-center relative p-0 pt-[0px]">
								<CloseIcon className="absolute right-[16px] top-[20px] cursor-pointer" onClick={onClose} />
							</ModalHeader>
							<ModalBody className="px-[16px] pb-[16px] pt-[40px] items-center gap-0">
								<div className="w-[80px] h-[80px] relative">
									<MyAvatar src={info?.image_url || '/images/default.png'} alt="icon" className="w-[80px] h-[80px] rounded-[16px]" />
									<Gold1Icon className="absolute -right-[4px] -bottom-[4px]" />
								</div>
								<div className="text-[15px] text-center mt-[16px]">如果您是该中文 Meme 的同名品牌方或 IP 所有者，请完成认领</div>
								<Button fullWidth className="h-[44px] bg-[#24232A] text-[15px] text-[#FFF] rounded-[16px] mt-[20px]" onPress={() => { toast.info('即将上线') }}>立即认领</Button>
							</ModalBody>
						</>
					)}
				</ModalContent>
			</Modal>
		</>
	);
}
